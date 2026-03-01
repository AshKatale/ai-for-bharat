
import json
import boto3
import logging
from botocore.exceptions import ClientError

# ─── Logging Setup ────────────────────────────────────────────────────────────
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# ─── Configuration — Override via Lambda Environment Variables ────────────────
DYNAMODB_TABLE_NAME  = "Products"
DYNAMODB_PK_NAME     = "productId"
KNOWLEDGE_BASE_ID    = "BFEH9LCGD0"
MODEL_ARN            = "arn:aws:bedrock:ap-south-1:058264258533:inference-profile/apac.amazon.nova-pro-v1:0"
KB_RETRIEVAL_RESULTS = 10
AWS_REGION           = "ap-south-1"


# ─── AWS Clients ──────────────────────────────────────────────────────────────
dynamodb_resource = boto3.resource("dynamodb", region_name=AWS_REGION)
bedrock_agent_rt  = boto3.client("bedrock-agent-runtime", region_name=AWS_REGION)


# ══════════════════════════════════════════════════════════════════════════════
# 1. DynamoDB — Fetch product by product_id
# ══════════════════════════════════════════════════════════════════════════════
def fetch_product_from_dynamodb(product_id: str) -> dict:
    """
    Fetches a product item from DynamoDB using its product_id.
    Supports any number of additional attributes on the item.
    """
    try:
        table = dynamodb_resource.Table(DYNAMODB_TABLE_NAME)
        response = table.get_item(Key={DYNAMODB_PK_NAME: product_id})
        item = response.get("Item")

        if not item:
            raise ValueError(f"Product '{product_id}' not found in DynamoDB.")

        logger.info(f"DynamoDB item fetched for product_id={product_id}: {list(item.keys())}")
        return item

    except ClientError as e:
        logger.error(f"DynamoDB ClientError: {e.response['Error']['Message']}")
        raise


# ══════════════════════════════════════════════════════════════════════════════
# 2. retrieve_and_generate — KB retrieval + Nova Pro generation in one call
# ══════════════════════════════════════════════════════════════════════════════
def retrieve_and_generate_questions(product_data: dict, model_arn: str, knowledge_base_id: str) -> dict:
    try:
        product_json = json.dumps(product_data, indent=2, default=str)

        # ── Input text: product data that drives the KB search query ──────────
        # retrieve_and_generate uses input.text to perform semantic search on the KB
        input_text = (
            f"Generate 10 evaluation questions for the following product:\n\n"
            f"{product_json}"
        )

        # ── Custom prompt template ────────────────────────────────────────────
        # $search_results$ is mandatory — retrieve_and_generate injects KB passages here
        # The rest is our question generation instruction
        prompt_template = """You are an expert product analyst and AI evaluation specialist.
You have been provided with product database information and additional context retrieved from the knowledge base.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KNOWLEDGE BASE CONTEXT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
$search_results$

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Using the product data provided in the query AND the knowledge base context above, generate exactly 10 high-quality questions about this product.

The questions should:
- Cover different aspects: features, pricing, use cases, comparisons, limitations, and benefits
- Range from factual recall to analytical reasoning
- Be clear, specific, and unambiguous
- Be suitable for testing an AI model's knowledge about this product

Return ONLY a valid JSON object. No explanation, no markdown fences.
Use this exact schema:

{
  "product_id": "<product_id from the product data>",
  "product_name": "<product_name if available>",
  "total_questions": 10,
  "questions": [
    {
      "question_number": 1,
      "category": "<one of: Features | Pricing | Use Cases | Comparisons | Limitations | Benefits | Technical | General>",
      "difficulty": "<Easy | Medium | Hard>",
      "question": "<the question text>",
      "expected_answer_hint": "<brief hint about what a correct answer should contain>"
    }
  ]
}"""

        response = bedrock_agent_rt.retrieve_and_generate(
            input={"text": input_text},
            retrieveAndGenerateConfiguration={
                "type": "KNOWLEDGE_BASE",
                "knowledgeBaseConfiguration": {
                    "knowledgeBaseId": knowledge_base_id,
                    "modelArn": model_arn,

                    # ── KB vector search settings ─────────────────────────────
                    "retrievalConfiguration": {
                        "vectorSearchConfiguration": {
                            "numberOfResults": KB_RETRIEVAL_RESULTS,
                            "overrideSearchType": "HYBRID"  # HYBRID = keyword + semantic
                        }
                    },

                    # ── Generation settings ───────────────────────────────────
                    "generationConfiguration": {
                        "promptTemplate": {
                            "textPromptTemplate": prompt_template
                        },
                        "inferenceConfig": {
                            "textInferenceConfig": {
                                "maxTokens": 4096,
                                "temperature": 0.3,
                                "topP": 0.9
                            }
                        }
                    }
                }
            }
        )

        # ── Extract generated text ────────────────────────────────────────────
        output_text = response["output"]["text"].strip()
        session_id  = response.get("sessionId", "N/A")
        citations   = response.get("citations", [])

        logger.info(
            f"retrieve_and_generate success | sessionId={session_id} | "
            f"citations={len(citations)} | outputLength={len(output_text)}"
        )

        # ── Strip markdown code fences if the model added them ────────────────
        if output_text.startswith("```"):
            parts = output_text.split("```")
            output_text = parts[1]
            if output_text.startswith("json"):
                output_text = output_text[4:]
            output_text = output_text.strip()

        parsed = json.loads(output_text)

        # Attach citation metadata to the result for traceability
        parsed["_kb_citations_count"] = len(citations)
        parsed["_session_id"]         = session_id

        return parsed

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Nova Pro JSON response: {e}")
        raise ValueError(f"Nova Pro returned non-JSON output: {e}")
    except ClientError as e:
        logger.error(f"retrieve_and_generate error: {e.response['Error']['Message']}")
        raise


# ══════════════════════════════════════════════════════════════════════════════
# 3. Lambda Handler — Entry Point
# ══════════════════════════════════════════════════════════════════════════════
def lambda_handler(event, context):
    logger.info(f"Event received: {json.dumps(event)}")

    # ── Extract & validate input ──────────────────────────────────────────────
    product_id = event.get("product_id")
    if not product_id:
        return _error_response(400, "Missing required field: 'product_id'")

    # Allow per-invocation overrides
    table_name        = event.get("table_name",        DYNAMODB_TABLE_NAME)
    knowledge_base_id = event.get("knowledge_base_id", KNOWLEDGE_BASE_ID)
    model_arn         = event.get("model_arn",          MODEL_ARN)

    try:
        # ── Step 1: Fetch product data from DynamoDB ──────────────────────────
        logger.info(f"Step 1: Fetching DynamoDB data for product_id={product_id}")
        product_data = fetch_product_from_dynamodb(product_id)

        # ── Step 2: retrieve_and_generate (KB search + question generation) ───
        logger.info(
            f"Step 2: retrieve_and_generate | KB={knowledge_base_id} | model={model_arn}"
        )
        questions_json = retrieve_and_generate_questions(
            product_data=product_data,
            model_arn=model_arn,
            knowledge_base_id=knowledge_base_id
        )

        # ── Step 3: Return result ─────────────────────────────────────────────
        logger.info("Step 3: Returning successful response")
        return {
            "statusCode": 200,
            "body": json.dumps({
                "status":     "success",
                "product_id": product_id,
                "data":       questions_json
            }, default=str)
        }

    except ValueError as e:
        logger.warning(f"Validation/parse error: {e}")
        return _error_response(422, str(e))

    except ClientError as e:
        logger.error(f"AWS service error: {e}")
        return _error_response(500, f"AWS service error: {e.response['Error']['Message']}")

    except Exception as e:
        logger.exception(f"Unexpected error: {e}")
        return _error_response(500, f"Internal server error: {str(e)}")


def _error_response(status_code: int, message: str) -> dict:
    return {
        "statusCode": status_code,
        "body": json.dumps({"status": "error", "message": message})
    }