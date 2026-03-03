
import json
import logging
import boto3
import base64
import time
import uuid
import os
from botocore.config import Config
from botocore.exceptions import ClientError
from urllib.parse import urlparse

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# ─── Configuration ────────────────────────────────────────────────────────────
AWS_REGION            = os.environ.get("AWS_REGION", "ap-south-1")
KNOWLEDGE_BASE_ID     = os.environ.get("KNOWLEDGE_BASE_ID", "BFEH9LCGD0")
KB_RETRIEVAL_RESULTS  = int(os.environ.get("KB_RETRIEVAL_RESULTS", "5"))

NOVA_CANVAS_MODEL_ID  = os.environ.get("NOVA_CANVAS_MODEL_ID", "amazon.nova-canvas-v1:0")

# S3: default bucket and prefix (change via env vars if needed)
S3_BUCKET             = os.environ.get("S3_BUCKET", "reels-database")
S3_OUTPUT_PREFIX      = os.environ.get("S3_OUTPUT_PREFIX", "canvas-outputs/")  # different path from reels
PRESIGNED_URL_EXPIRY  = int(os.environ.get("PRESIGNED_URL_EXPIRY", "3600"))    # seconds

# Bedrock clients
bedrock = boto3.client("bedrock-runtime", config=Config(read_timeout=300), region_name="us-east-1")
bedrock_agent_rt = boto3.client("bedrock-agent-runtime", region_name=AWS_REGION)
s3_client = boto3.client(
    "s3",
    region_name="ap-south-1",  # MUST match bucket region
    config=Config(signature_version="s3v4")
)

# Max prompt length enforced by Nova Canvas
MAX_PROMPT_LEN = 1024


# ────────────────────────────────────────────────────────────────────────────────
# Helper: fetch KB context (RAG)
# ────────────────────────────────────────────────────────────────────────────────
def fetch_kb_context(user_text: str) -> str:
    try:
        resp = bedrock_agent_rt.retrieve(
            knowledgeBaseId=KNOWLEDGE_BASE_ID,
            retrievalQuery={"text": user_text},
            retrievalConfiguration={
                "vectorSearchConfiguration": {
                    "numberOfResults": KB_RETRIEVAL_RESULTS,
                    "overrideSearchType": "HYBRID"
                }
            }
        )
        passages = []
        for r in resp.get("retrievalResults", []):
            text = r.get("content", {}).get("text", "").strip()
            score = r.get("score", 0)
            if text:
                passages.append(f"[Score: {score:.3f}] {text}")
        if not passages:
            logger.info("KB returned no passages.")
            return ""
        logger.info("KB returned %d passages", len(passages))
        return "\n\n".join(passages)
    except ClientError as e:
        logger.warning("KB retrieve error: %s", e.response.get("Error", {}).get("Message"))
        return ""


# ────────────────────────────────────────────────────────────────────────────────
# Helper: build canvas request body
# ────────────────────────────────────────────────────────────────────────────────
def build_canvas_body(
    text: str,
    negative_text: str = None,
    style: str = None,
    width: int = 1024,
    height: int = 1024,
    quality: str = "standard",
    cfgScale: float = 7.0,
    seed: int = 0,
    numberOfImages: int = 1
) -> dict:
    textToImageParams = {"text": text}
    if negative_text:
        textToImageParams["negativeText"] = negative_text
    if style:
        textToImageParams["style"] = style

    imageGenerationConfig = {
        "width": int(width),
        "height": int(height),
        "quality": quality,
        "cfgScale": float(cfgScale),
        "seed": int(seed),
        "numberOfImages": int(numberOfImages)
    }

    return {
        "taskType": "TEXT_IMAGE",
        "textToImageParams": textToImageParams,
        "imageGenerationConfig": imageGenerationConfig
    }


# ────────────────────────────────────────────────────────────────────────────────
# Helper: upload image bytes to S3 and return key + presigned URL
# ────────────────────────────────────────────────────────────────────────────────
def upload_image_and_get_url(image_bytes: bytes, index: int) -> (str, str):
    """
    Upload image_bytes to S3 using a unique key and return (s3_key, presigned_url).
    Assumes PNG output; adjust content-type if needed.
    """
    ts = int(time.time())
    uid = uuid.uuid4().hex
    filename = f"{ts}_{uid}_{index}.png"
    key = f"{S3_OUTPUT_PREFIX.rstrip('/')}/{filename}" if S3_OUTPUT_PREFIX else filename

    try:
        s3_client.put_object(Bucket=S3_BUCKET, Key=key, Body=image_bytes, ContentType="image/png")
    except ClientError as e:
        logger.exception("Failed to upload image to S3")
        raise RuntimeError(f"S3 put_object error: {e.response.get('Error', {}).get('Message')}")

    try:
        presigned = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": S3_BUCKET, "Key": key},
            ExpiresIn=PRESIGNED_URL_EXPIRY
        )
    except ClientError as e:
        logger.exception("Failed to generate presigned URL")
        raise RuntimeError(f"S3 presigned URL error: {e.response.get('Error', {}).get('Message')}")

    return key, presigned


# ────────────────────────────────────────────────────────────────────────────────
# Handler: generate images with Nova Canvas (RAG-enhanced prompt) + S3 upload
# ────────────────────────────────────────────────────────────────────────────────
def lambda_handler(event, context):
    logger.info("Event received keys: %s", list(event.keys()))

    # parse body (support API Gateway proxy)
    if "body" in event and isinstance(event["body"], str):
        try:
            body = json.loads(event["body"])
        except Exception:
            return {"statusCode": 400, "body": json.dumps({"status": "error", "message": "Invalid JSON in 'body'."})}
    else:
        body = event if isinstance(event, dict) else {}

    # support both 'prompt' and legacy 'input_text'
    input_text = str(body.get("prompt") or body.get("input_text") or "").strip()
    if not input_text:
        return {"statusCode": 400, "body": json.dumps({"status": "error", "message": "Missing required field: 'prompt' or 'input_text'"})}

    # optional params
    negative_text   = body.get("negative_text") or body.get("negativeText")
    style           = body.get("style")
    width           = body.get("width", 1024)
    height          = body.get("height", 1024)
    quality         = body.get("quality", "standard")
    cfgScale        = body.get("cfgScale", 7.0)
    seed            = body.get("seed", 0)
    numberOfImages  = body.get("numberOfImages", 1)

    # validate numeric params
    try:
        width = int(width)
        height = int(height)
        numberOfImages = max(1, min(int(numberOfImages), 8))
        cfgScale = float(cfgScale)
        seed = int(seed)
    except Exception:
        return {"statusCode": 400, "body": json.dumps({"status": "error", "message": "Invalid numeric parameter(s)."})}

    # Step 1: fetch RAG context
    logger.info("Fetching KB context for RAG...")
    kb_context = fetch_kb_context(input_text)
    original_kb_passages = len([p for p in (kb_context or "").split("\n\n") if p])
    used_kb_count = 0

    # Build final prompt and ensure it respects MAX_PROMPT_LEN
    prompt = input_text
    if kb_context:
        combined = f"{input_text}\n\nRELEVANT CONTEXT:\n{kb_context}"
        prompt = combined[:MAX_PROMPT_LEN]  # simple truncation as requested
        if len(prompt) > len(input_text):
            used_kb_count = 1

    logger.info("Final prompt length: %d chars", len(prompt))

    # Step 2: build canvas request and call Bedrock
    canvas_body_dict = build_canvas_body(
        text=prompt,
        negative_text=negative_text,
        style=style,
        width=width,
        height=height,
        quality=quality,
        cfgScale=cfgScale,
        seed=seed,
        numberOfImages=numberOfImages
    )
    canvas_body_json = json.dumps(canvas_body_dict)

    logger.info("Invoking Nova Canvas model %s with %d image(s) %dx%d", NOVA_CANVAS_MODEL_ID, numberOfImages, width, height)
    try:
        response = bedrock.invoke_model(
            body=canvas_body_json,
            modelId=NOVA_CANVAS_MODEL_ID,
            accept="application/json",
            contentType="application/json"
        )
    except ClientError as e:
        logger.exception("Bedrock invoke_model ClientError")
        return {"statusCode": 500, "body": json.dumps({"status": "error", "message": f"Bedrock invoke_model error: {e.response.get('Error', {}).get('Message')}"} )}

    # parse streaming response
    try:
        raw = response.get("body").read()
        response_body = json.loads(raw)
    except Exception as e:
        logger.exception("Failed to parse model response")
        return {"statusCode": 500, "body": json.dumps({"status": "error", "message": f"Failed to parse model response: {str(e)}"})}

    # check model errors
    err_field = response_body.get("error") or response_body.get("finishReason")
    if err_field:
        logger.error("Model returned error/finishReason: %s", err_field)
        return {"statusCode": 500, "body": json.dumps({"status": "error", "message": f"Model error: {err_field}", "raw": response_body})}

    images_b64 = response_body.get("images")
    if not images_b64:
        logger.error("No images returned by the model. Response: %s", response_body)
        return {"statusCode": 500, "body": json.dumps({"status": "error", "message": "Model returned no images", "raw": response_body})}

    # Step 3: upload each image to S3 and generate presigned URLs
    presigned_urls = []
    s3_keys = []
    for idx, img_b64 in enumerate(images_b64, start=1):
        try:
            img_bytes = base64.b64decode(img_b64)
        except Exception as e:
            logger.exception("Failed to decode base64 for image %d", idx)
            return {"statusCode": 500, "body": json.dumps({"status": "error", "message": f"Failed to decode base64 image {idx}: {str(e)}"})}

        try:
            key, presigned = upload_image_and_get_url(img_bytes, idx)
            s3_keys.append(key)
            presigned_urls.append(presigned)
        except Exception as e:
            logger.exception("Failed to upload image or generate presigned URL")
            return {"statusCode": 500, "body": json.dumps({"status": "error", "message": str(e)})}

    # Build response
    result = {
        "status": "success",
        "presigned_urls": presigned_urls,
        "s3_keys": s3_keys,
        "model_id": NOVA_CANVAS_MODEL_ID,
        "used_kb_passages_count": used_kb_count,
        "canvas_request": canvas_body_dict
    }

    return {"statusCode": 200, "body": json.dumps(result)}