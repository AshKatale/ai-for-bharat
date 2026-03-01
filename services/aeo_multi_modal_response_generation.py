import json
import os
import logging
import concurrent.futures
from botocore.exceptions import ClientError
import subprocess
import sys
subprocess.call('pip install google-generativeai -t /tmp/ --no-cache-dir'.split(), stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
sys.path.insert(1, '/tmp/')
subprocess.call('pip install json-repair -t /tmp/ --no-cache-dir'.split(), stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
sys.path.insert(1, '/tmp/')
import boto3
import google.generativeai as genai
from json_repair import repair_json

# ─── Logging Setup ────────────────────────────────────────────────────────────
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# ─── Configuration ────────────────────────────────────────────────────────────
AWS_REGION      = "ap-south-1"
NOVA_PRO_ARN    = "arn:aws:bedrock:ap-south-1:058264258533:inference-profile/apac.amazon.nova-pro-v1:0"
GPT_MODEL_ID    = "openai.gpt-oss-safeguard-120b"   # OpenAI GPT via Bedrock
GEMINI_MODEL    = "gemini-2.5-flash"

# API keys from Lambda environment variables
GEMINI_API_KEY  = os.getenv("GEMINI_API_KEY", "")

# ─── AWS Clients ──────────────────────────────────────────────────────────────
bedrock_rt = boto3.client("bedrock-runtime", region_name=AWS_REGION)


# ══════════════════════════════════════════════════════════════════════════════
# Helpers
# ══════════════════════════════════════════════════════════════════════════════

def build_questions_input(questions: list[dict]) -> str:
    """
    Formats the questions into a numbered list.
    No additional context or instructions — just the questions.
    """
    lines = []
    for q in questions:
        lines.append(f"Q{q['question_number']}: {q['question']}")
    return "\n".join(lines)


def parse_model_response(raw_text: str, questions: list[dict]) -> list[dict]:
    """
    Parses the model's JSON response back into a structured list.
    Falls back to returning raw text per question slot if JSON parsing fails.
    """
    raw_text = raw_text.strip()

    # Strip markdown fences if present
    if raw_text.startswith("```"):
        parts = raw_text.split("```")
        raw_text = parts[1]
        if raw_text.startswith("json"):
            raw_text = raw_text[4:]
        raw_text = raw_text.strip()

    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        logger.warning("JSON parse failed, falling back to raw text.")
        return [
            {
                "question_number": q["question_number"],
                "question": q["question"],
                "answer": raw_text
            }
            for q in questions
        ]


# ══════════════════════════════════════════════════════════════════════════════
# System prompt
# ══════════════════════════════════════════════════════════════════════════════
SYSTEM_PROMPT = """For each question provided, think through it carefully and reason step by step internally before forming your answer.
Your internal reasoning must NOT appear in the output.
Return ONLY a valid JSON array. No markdown, no extra text. Each element must strictly follow this schema with no additional fields:
[
  {
    "question_number": <int>,
    "question": "<question text>",
    "answer": "<well-reasoned final answer>"
  }
]"""


# ══════════════════════════════════════════════════════════════════════════════
# Content block text extractor — handles all Bedrock model response formats
# ══════════════════════════════════════════════════════════════════════════════
def _extract_text_from_blocks(content_blocks: list) -> str:
    """
    Safely extracts text from Bedrock converse content blocks.

    Different models return content in slightly different shapes:
      Standard Nova/Claude:  [{"text": "..."}]
      Typed block:           [{"type": "text", "text": "..."}]
      OpenAI on Bedrock:     [{"type": "output_text", "text": "..."}]
                          or [{"type": "text", "text": "..."}]

    Iterates all blocks and concatenates any text found.
    Raises ValueError with full block dump if no text is found at all.
    """
    texts = []
    for block in content_blocks:
        if isinstance(block, dict):
            # Direct "text" key (standard format)
            if "text" in block:
                texts.append(block["text"])
            # Nested under "content" (rare edge case)
            elif "content" in block and isinstance(block["content"], str):
                texts.append(block["content"])

    if not texts:
        raise ValueError(
            f"No text found in content blocks. Full blocks: {json.dumps(content_blocks, default=str)}"
        )

    return "\n".join(texts)


# ══════════════════════════════════════════════════════════════════════════════
# 1. OpenAI GPT via AWS Bedrock converse API
# ══════════════════════════════════════════════════════════════════════════════
def call_gpt_bedrock(questions: list[dict]) -> list[dict]:
    """
    Calls OpenAI GPT (openai.gpt-oss-safeguard-120b) hosted on AWS Bedrock
    using the standard converse API — no OpenAI SDK required.

    converse() request:
        modelId         → "openai.gpt-oss-safeguard-120b"
        system          → [{"text": "..."}]
        messages        → [{"role": "user", "content": [{"text": "..."}]}]
        inferenceConfig → {temperature, maxTokens, topP}

    converse() response:
        response["output"]["message"]["content"][0]["text"]  ← assistant reply
        response["stopReason"]
        response["usage"] → {inputTokens, outputTokens}
    """
    try:
        questions_text = build_questions_input(questions)

        response = bedrock_rt.converse(
            modelId=GPT_MODEL_ID,
            system=[{"text": SYSTEM_PROMPT}],
            messages=[
                {
                    "role": "user",
                    "content": [{"text": questions_text}]
                }
            ],
            inferenceConfig={
                "maxTokens":   4096,
                "temperature": 0.1,
                "topP":        0.9
            }
        )

        stop_reason = response.get("stopReason")
        usage       = response.get("usage", {})

        # Log full raw response to CloudWatch so structure is visible if parsing fails
        logger.info(f"GPT (Bedrock) raw response: {json.dumps(response, default=str)}")
        logger.info(
            f"GPT (Bedrock) response received | stopReason={stop_reason} | "
            f"inputTokens={usage.get('inputTokens')} | outputTokens={usage.get('outputTokens')}"
        )

        # ── Robustly extract text from content blocks ─────────────────────────
        # GPT on Bedrock may return content blocks with varying structures:
        #   {"text": "..."}                        ← standard converse format
        #   {"type": "text",       "text": "..."}  ← typed block
        #   {"type": "output_text","text": "..."}  ← OpenAI-style typed block
        content_blocks = response["output"]["message"]["content"]
        raw_text = _extract_text_from_blocks(content_blocks).strip()

        return parse_model_response(raw_text, questions)

    except ClientError as e:
        logger.error(f"GPT Bedrock converse error: {e.response['Error']['Message']}")
        return [{"question_number": q["question_number"], "question": q["question"],
                 "answer": f"GPT Bedrock error: {e.response['Error']['Message']}"}
                for q in questions]
    except Exception as e:
        logger.error(f"GPT Bedrock unexpected error: {e}")
        return [{"question_number": q["question_number"], "question": q["question"],
                 "answer": f"GPT Bedrock error: {str(e)}"} for q in questions]


# ══════════════════════════════════════════════════════════════════════════════
# 2. Gemini — Google Generative AI SDK
# ══════════════════════════════════════════════════════════════════════════════
def call_gemini(questions: list[dict]) -> list[dict]:
    """
    Calls Gemini using the google-generativeai SDK.

    SDK shape:
        genai.configure(api_key="...")
        model = genai.GenerativeModel(
            model_name         = "gemini-2.5-flash",
            system_instruction = "..."
        )
        response = model.generate_content(
            contents,
            generation_config=GenerationConfig(...)
        )
        response.text   ← generated text

    Notes:
      - gemini-2.5-flash enables 'thinking' by default, which prepends internal
        reasoning to the output before the actual JSON. We must slice it out.
      - Gemini aggressively wraps output in markdown fences even when told not to.
      - Strategy: find the first '[' and last ']' in the response and extract
        only that substring — the most reliable way to isolate the JSON array.
    """
    try:
        genai.configure(api_key=GEMINI_API_KEY)

        generation_config = genai.GenerationConfig(
            temperature=0.1,
            max_output_tokens=8192,   # 4096 was too small for 10 detailed answers
        )

        model = genai.GenerativeModel(
            model_name=GEMINI_MODEL,
            system_instruction=SYSTEM_PROMPT,
            generation_config=generation_config
        )

        questions_text = build_questions_input(questions)
        response = model.generate_content(questions_text)

        raw_text = response.text
        logger.info(f"Gemini raw response | length={len(raw_text)}")
        logger.info(f"Gemini raw response preview: {raw_text[:300]}")

        # ── Locate the JSON array start ───────────────────────────────────────
        # Gemini 2.5-flash (thinking mode) may prepend reasoning text before JSON
        start = raw_text.find("[")
        if start == -1:
            logger.error(f"Gemini: No opening '[' found. Raw: {raw_text[:500]}")
            raise ValueError("Gemini response did not contain a JSON array")

        candidate = raw_text[start:]

        # ── Repair and parse ──────────────────────────────────────────────────
        # json_repair handles all of:
        #   - Truncated responses (missing closing brackets)
        #   - Unescaped double quotes inside string values e.g. "a "quoted" word"
        #   - Trailing commas, missing commas between objects
        #   - Any other minor JSON malformations Gemini introduces
        repaired  = repair_json(candidate)
        parsed    = json.loads(repaired)

        if not isinstance(parsed, list):
            parsed = [parsed]  # wrap object in list if repair returned a dict

        logger.info(f"Gemini parsed successfully | questions returned={len(parsed)}")
        return parsed

    except json.JSONDecodeError as e:
        logger.error(f"Gemini JSON parse error after repair: {e}")
        return [{"question_number": q["question_number"], "question": q["question"],
                 "answer": f"Gemini parse error: {str(e)}"} for q in questions]
    except Exception as e:
        logger.error(f"Gemini error: {e}")
        return [{"question_number": q["question_number"], "question": q["question"],
                 "answer": f"Gemini error: {str(e)}"} for q in questions]


# ══════════════════════════════════════════════════════════════════════════════
# 3. Amazon Nova Pro — Bedrock converse API
# ══════════════════════════════════════════════════════════════════════════════
def call_nova_pro(questions: list[dict]) -> list[dict]:
    """
    Calls Amazon Nova Pro via the Bedrock converse API.

    converse() request:
        modelId         → inference profile ARN
        system          → [{"text": "..."}]
        messages        → [{"role": "user", "content": [{"text": "..."}]}]
        inferenceConfig → {maxTokens, temperature, topP}

    converse() response:
        response["output"]["message"]["content"][0]["text"]  ← assistant reply
        response["stopReason"]
        response["usage"] → {inputTokens, outputTokens}
    """
    try:
        questions_text = build_questions_input(questions)

        response = bedrock_rt.converse(
            modelId=NOVA_PRO_ARN,
            system=[{"text": SYSTEM_PROMPT}],
            messages=[
                {
                    "role": "user",
                    "content": [{"text": questions_text}]
                }
            ],
            inferenceConfig={
                "maxTokens":   4096,
                "temperature": 0.1,
                "topP":        0.9
            }
        )

        content_blocks = response["output"]["message"]["content"]
        raw_text       = _extract_text_from_blocks(content_blocks).strip()
        stop_reason = response.get("stopReason")
        usage       = response.get("usage", {})

        logger.info(
            f"Nova Pro response received | stopReason={stop_reason} | "
            f"inputTokens={usage.get('inputTokens')} | outputTokens={usage.get('outputTokens')}"
        )
        return parse_model_response(raw_text, questions)

    except ClientError as e:
        logger.error(f"Nova Pro converse error: {e.response['Error']['Message']}")
        return [{"question_number": q["question_number"], "question": q["question"],
                 "answer": f"Nova Pro error: {e.response['Error']['Message']}"}
                for q in questions]
    except Exception as e:
        logger.error(f"Nova Pro unexpected error: {e}")
        return [{"question_number": q["question_number"], "question": q["question"],
                 "answer": f"Nova Pro error: {str(e)}"} for q in questions]


# ══════════════════════════════════════════════════════════════════════════════
# 4. Merge responses from all 3 models into unified structure
# ══════════════════════════════════════════════════════════════════════════════
def merge_responses(
    questions:   list[dict],
    gpt_resp:    list[dict],
    gemini_resp: list[dict],
    nova_resp:   list[dict]
) -> list[dict]:
    """
    Merges per-question answers from all three models into a single list.

    Output per question:
    {
        "question_number": 1,
        "question":  "...",
        "gpt":       "<answer string>",
        "gemini":    "<answer string>",
        "nova_pro":  "<answer string>"
    }
    """
    def index_by_qnum(resp: list[dict]) -> dict:
        return {item.get("question_number", i + 1): item for i, item in enumerate(resp)}

    gpt_idx    = index_by_qnum(gpt_resp)
    gemini_idx = index_by_qnum(gemini_resp)
    nova_idx   = index_by_qnum(nova_resp)

    merged = []
    for q in questions:
        qnum = q["question_number"]

        def extract(idx, qnum):
            return idx.get(qnum, {}).get("answer", "")

        merged.append({
            "question_number": qnum,
            "question":        q["question"],
            "gpt":             extract(gpt_idx,    qnum),
            "gemini":          extract(gemini_idx, qnum),
            "nova_pro":        extract(nova_idx,   qnum)
        })

    return merged


# ══════════════════════════════════════════════════════════════════════════════
# 5. Lambda Handler — Entry Point
# ══════════════════════════════════════════════════════════════════════════════
def lambda_handler(event, context):
    """
    Lambda entry point. All 3 models are called in parallel via ThreadPoolExecutor.

    Expected event payload:
    {
        "body": "{\"questions\": [{\"question_number\": 1, \"question\": \"...\", ...}, ...]}"
    }

    Success response:
    {
        "statusCode": 200,
        "body": {
            "status": "success",
            "total_questions": 10,
            "models_used": ["gpt", "gemini", "nova_pro"],
            "results": [
                {
                    "question_number": 1,
                    "question":  "...",
                    "gpt":       "<answer>",
                    "gemini":    "<answer>",
                    "nova_pro":  "<answer>"
                },
                ...
            ]
        }
    }
    """
    logger.info(f"Event received: {json.dumps(event)}")

    body = json.loads(event.get("body", "{}"))

    # ── Extract questions ─────────────────────────────────────────────────────
    questions = body.get("questions", [])

    # Also accept the full output envelope from the question-generator lambda
    if not questions and "data" in body:
        questions = body["data"].get("questions", [])

    if not questions:
        return _error_response(400, "Missing required field: 'questions' (list of question objects)")

    if len(questions) != 10:
        logger.warning(f"Expected 10 questions, got {len(questions)}. Proceeding anyway.")

    try:
        # ── Call all 3 models in parallel ─────────────────────────────────────
        logger.info("Dispatching all 3 model calls in parallel via ThreadPoolExecutor")

        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            future_gpt    = executor.submit(call_gpt_bedrock, questions)
            future_gemini = executor.submit(call_gemini,      questions)
            future_nova   = executor.submit(call_nova_pro,    questions)

            gpt_results    = future_gpt.result()
            gemini_results = future_gemini.result()
            nova_results   = future_nova.result()

        logger.info("All 3 model calls completed")

        merged = merge_responses(questions, gpt_results, gemini_results, nova_results)

        return {
            "statusCode": 200,
            "body": json.dumps({
                "status":          "success",
                "total_questions": len(merged),
                "models_used":     ["gpt", "gemini", "nova_pro"],
                "results":         merged
            }, default=str)
        }

    except Exception as e:
        logger.exception(f"Unexpected error: {e}")
        return _error_response(500, f"Internal server error: {str(e)}")


def _error_response(status_code: int, message: str) -> dict:
    return {
        "statusCode": status_code,
        "body": json.dumps({"status": "error", "message": message})
    }