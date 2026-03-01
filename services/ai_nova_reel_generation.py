import json
import boto3
import logging
from botocore.exceptions import ClientError

# ─── Logging ──────────────────────────────────────────────────────────────────
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# ─── Configuration ────────────────────────────────────────────────────────────
AWS_REGION         = "ap-south-1"
KNOWLEDGE_BASE_ID  = "BFEH9LCGD0"
NOVA_PRO_ARN       = "arn:aws:bedrock:ap-south-1:058264258533:inference-profile/apac.amazon.nova-pro-v1:0"
NOVA_REEL_MODEL_ID = "amazon.nova-reel-v1:1"
S3_OUTPUT_URI      = "s3://reels-database/reels/"
KB_RETRIEVAL_RESULTS = 5

# Valid durations: multiples of 6 between 12 and 120
VALID_DURATIONS    = list(range(12, 121, 6))
DEFAULT_DURATION   = 12

# ─── AWS Clients ──────────────────────────────────────────────────────────────
bedrock_rt       = boto3.client("bedrock-runtime",       region_name="us-east-1")  # Nova Reel only in us-east-1
bedrock_rt_apac  = boto3.client("bedrock-runtime",       region_name=AWS_REGION)   # Nova Pro in ap-south-1
bedrock_agent_rt = boto3.client("bedrock-agent-runtime", region_name=AWS_REGION)   # KB in ap-south-1


# ══════════════════════════════════════════════════════════════════════════════
# Step 1 — Retrieve relevant context from Knowledge Base
# ══════════════════════════════════════════════════════════════════════════════
def fetch_kb_context(user_text: str) -> str:
    """
    Queries the Bedrock Knowledge Base with the user's input text
    and returns the top-N retrieved passages as a single string.

    retrieve() response:
        response["retrievalResults"] → list of:
            {"content": {"text": "..."}, "score": float, "location": {...}}
    """
    try:
        response = bedrock_agent_rt.retrieve(
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
        for result in response.get("retrievalResults", []):
            text  = result.get("content", {}).get("text", "").strip()
            score = result.get("score", 0)
            if text:
                passages.append(f"[Score: {score:.3f}] {text}")

        if not passages:
            logger.warning("Knowledge Base returned no results.")
            return ""

        kb_context = "\n\n".join(passages)
        logger.info(f"KB retrieved {len(passages)} passage(s)")
        return kb_context

    except ClientError as e:
        logger.error(f"KB retrieve error: {e.response['Error']['Message']}")
        return ""


# ══════════════════════════════════════════════════════════════════════════════
# Step 2 — Enhance the prompt using Nova Pro + KB context
# ══════════════════════════════════════════════════════════════════════════════
def enhance_prompt(user_text: str, kb_context: str, duration: int) -> str:
    """
    Sends the user's raw text + KB context to Amazon Nova Pro via converse().
    Nova Pro rewrites it into a rich, cinematic video generation prompt
    optimised for Nova Reel's MULTI_SHOT_AUTOMATED task.

    converse() request:
        modelId         → Nova Pro inference profile ARN
        system          → prompt engineer persona
        messages        → user text + KB context + enhancement instructions
        inferenceConfig → temperature 0.3 for creative but consistent output

    converse() response:
        response["output"]["message"]["content"][0]["text"]  ← enhanced prompt
    """
    system_prompt = """You are an expert video prompt engineer specializing in cinematic AI video generation.
Your task is to transform a basic user description into a rich, detailed, and visually compelling prompt
for an AI video generation model (Amazon Nova Reel).

An excellent Nova Reel prompt includes:
- Cinematic style and mood (e.g. documentary, dramatic, ethereal, high-energy)
- Camera movements and angles (e.g. slow drone pullback, low-angle tracking shot, aerial zoom)
- Lighting and color palette descriptions (e.g. golden hour, cool tones, vivid saturation)
- Scene composition and subject details (textures, scale, atmosphere)
- Temporal flow that suits a multi-shot automated sequence

Keep the enhanced prompt exactly 512 characters as Nova Reel has a prompt length limit.
Return ONLY the enhanced prompt text. No explanation, no preamble, no quotes."""

    kb_section = f"\n\nRELEVANT PRODUCT/CONTEXT INFORMATION FROM KNOWLEDGE BASE:\n{kb_context}" if kb_context else ""

    user_message = f"""Original user description: "{user_text}"
Video duration: {duration} seconds{kb_section}

Using the original description and any relevant context above, create a single enhanced cinematic video prompt for Nova Reel.
The prompt must reflect the product/context details from the knowledge base where relevant.
Return only the enhanced prompt, nothing else."""

    try:
        response = bedrock_rt_apac.converse(
            modelId=NOVA_PRO_ARN,
            system=[{"text": system_prompt}],
            messages=[
                {
                    "role": "user",
                    "content": [{"text": user_message}]
                }
            ],
            inferenceConfig={
                "maxTokens": 512,
                "temperature": 0.3,
                "topP": 0.9
            }
        )

        content_blocks = response["output"]["message"]["content"]
        enhanced = " ".join(
            block["text"] for block in content_blocks if "text" in block
        ).strip()

        stop_reason = response.get("stopReason")
        usage       = response.get("usage", {})
        logger.info(
            f"Nova Pro prompt enhancement done | stopReason={stop_reason} | "
            f"inputTokens={usage.get('inputTokens')} | outputTokens={usage.get('outputTokens')}"
        )
        logger.info(f"Enhanced prompt: {enhanced}")
        return enhanced

    except ClientError as e:
        logger.error(f"Nova Pro converse error: {e.response['Error']['Message']}")
        # Fall back to original user text if enhancement fails
        logger.warning("Falling back to original user text as prompt.")
        return user_text


# ══════════════════════════════════════════════════════════════════════════════
# Step 3 — Start Nova Reel async video generation job
# ══════════════════════════════════════════════════════════════════════════════
def start_video_generation(enhanced_prompt: str, duration: int, seed: int) -> dict:
    """
    Submits an asynchronous video generation job to Amazon Nova Reel.

    start_async_invoke() request:
        modelId         → "amazon.nova-reel-v1:1"
        modelInput:
            taskType    → "MULTI_SHOT_AUTOMATED" (Nova Reel auto-plans scenes)
            multiShotAutomatedParams.text → the enhanced prompt (max 512 chars)
            videoGenerationConfig:
                seed            → reproducibility seed
                durationSeconds → must be multiple of 6, range [12, 120]
                fps             → must be 24
                dimension       → must be "1280x720"
        outputDataConfig → S3 URI where the video file will be saved

    start_async_invoke() response:
        {"invocationArn": "arn:aws:bedrock:us-east-1:...:async-invoke/..."}
        The ARN is used to poll job status via get_async_invoke().
    """
    model_input = {
        "taskType": "MULTI_SHOT_AUTOMATED",
        "multiShotAutomatedParams": {
            "text": enhanced_prompt[:512]  # Hard cap at 512 chars
        },
        "videoGenerationConfig": {
            "seed":            seed,
            "durationSeconds": duration,
            "fps":             24,       # Nova Reel only supports 24 fps
            "dimension":       "1280x720"  # Nova Reel only supports 1280x720
        }
    }

    logger.info(f"Submitting Nova Reel job | duration={duration}s | seed={seed}")
    logger.info(f"Final prompt sent to Nova Reel: {enhanced_prompt[:512]}")

    invocation = bedrock_rt.start_async_invoke(
        modelId=NOVA_REEL_MODEL_ID,
        modelInput=model_input,
        outputDataConfig={
            "s3OutputDataConfig": {"s3Uri": S3_OUTPUT_URI}
        }
    )

    return invocation


# ══════════════════════════════════════════════════════════════════════════════
# Lambda Handler — Entry Point
# ══════════════════════════════════════════════════════════════════════════════
def lambda_handler(event, context):
    """
    Entry point. Orchestrates:
        1. Parse & validate inputs
        2. Retrieve KB context (RAG)
        3. Enhance prompt via Nova Pro
        4. Submit Nova Reel async video generation job
        5. Return invocation ARN for status polling

    Expected event payload:
    {
        "text":     "A product showcase video of premium wireless headphones",
        "duration": 18,       // seconds — must be multiple of 6, range [12, 120]
        "seed":     1234      // optional, default 0
    }

    Success response:
    {
        "statusCode": 200,
        "body": {
            "status":           "submitted",
            "invocation_arn":   "arn:aws:bedrock:us-east-1:...:async-invoke/...",
            "original_prompt":  "...",
            "enhanced_prompt":  "...",
            "kb_passages_used": 5,
            "duration":         18,
            "s3_output_uri":    "s3://..."
        }
    }
    """
    logger.info(f"Event: {json.dumps(event)}")

    # ── Parse body (API Gateway wraps payload in "body") ──────────────────────
    if "body" in event:
        body = json.loads(event["body"]) if isinstance(event["body"], str) else event["body"]
    else:
        body = event

    # ── Validate required fields ───────────────────────────────────────────────
    user_text = body.get("input_text", "").strip()
    if not user_text:
        return _error_response(400, "Missing required field: 'text'")

    # ── Validate and sanitize duration ────────────────────────────────────────
    raw_duration = body.get("duration", DEFAULT_DURATION)
    try:
        duration = int(raw_duration)
    except (ValueError, TypeError):
        return _error_response(400, f"'duration' must be an integer. Got: {raw_duration}")

    if duration not in VALID_DURATIONS:
        # Snap to nearest valid value
        nearest = min(VALID_DURATIONS, key=lambda v: abs(v - duration))
        logger.warning(f"Duration {duration} is not a valid multiple of 6 in [12,120]. Snapping to {nearest}.")
        duration = nearest

    seed = int(body.get("seed", 0))

    logger.info(f"Input | text='{user_text}' | duration={duration}s | seed={seed}")

    try:
        # ── Step 1: RAG — fetch KB context ────────────────────────────────────
        logger.info("Step 1: Fetching Knowledge Base context")
        kb_context    = fetch_kb_context(user_text)
        kb_used_count = len([p for p in kb_context.split("\n\n") if p]) if kb_context else 0

        # ── Step 2: Prompt enhancement via Nova Pro ───────────────────────────
        logger.info("Step 2: Enhancing prompt with Nova Pro")
        enhanced_prompt = enhance_prompt(user_text, kb_context, duration)

        # ── Step 3: Submit Nova Reel video generation job ─────────────────────
        logger.info("Step 3: Submitting Nova Reel async job")
        invocation = start_video_generation(enhanced_prompt, duration, seed)

        invocation_arn = invocation.get("invocationArn", "")
        logger.info(f"Nova Reel job submitted | invocationArn={invocation_arn}")

        return {
            "statusCode": 200,
            "body": json.dumps({
                "status":           "submitted",
                "invocation_arn":   invocation_arn,
                "original_prompt":  user_text,
                "enhanced_prompt":  enhanced_prompt,
                "kb_passages_used": kb_used_count,
                "duration":         duration,
                "seed":             seed,
                "s3_output_uri":    S3_OUTPUT_URI,
                "note":             "Poll invocation_arn with bedrock:GetAsyncInvoke to check job status"
            }, default=str)
        }

    except ClientError as e:
        logger.error(f"AWS error: {e.response['Error']['Message']}")
        return _error_response(500, f"AWS error: {e.response['Error']['Message']}")

    except Exception as e:
        logger.exception(f"Unexpected error: {e}")
        return _error_response(500, f"Internal error: {str(e)}")


def _error_response(status_code: int, message: str) -> dict:
    return {
        "statusCode": status_code,
        "body": json.dumps({"status": "error", "message": message})
    }