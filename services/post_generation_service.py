
import json
import time
import logging
import concurrent.futures
import subprocess
import sys

subprocess.call('pip install tavily-python -t /tmp/ --no-cache-dir'.split(), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
sys.path.insert(1, '/tmp/')

import boto3
from botocore.exceptions import ClientError
from tavily import TavilyClient

# ─── Logging ──────────────────────────────────────────────────────────────────
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# ─── Configuration ────────────────────────────────────────────────────────────
AWS_REGION           = "ap-south-1"
KNOWLEDGE_BASE_ID    = "BFEH9LCGD0"
NOVA_PRO_ARN         = "arn:aws:bedrock:ap-south-1:058264258533:inference-profile/apac.amazon.nova-pro-v1:0"
KB_RETRIEVAL_RESULTS = 5
TAVILY_API_KEY       = os.getenv("TAVILY_API_KEY")

MAX_POST_CHARS = 2500

SUPPORTED_LANGUAGES = {
    "english":          "Write entirely in English.",
    "hindi-in-english": (
        "Write in Hindi language typed using English (Roman) script only — NO Devanagari. "
        "Example: 'Yaar, ye headphones sunke dil khush ho gaya! Bass itna gehri hai ki poori duniya bhool jaao.' "
        "Use colloquial Hinglish expressions naturally."
    ),
    "hinglish": (
        "Write in Hinglish — natural mix of Hindi and English words, typed in English (Roman) script only — NO Devanagari. "
        "Example: 'Bro, honestly yeh product ne toh game change kar diya! Sound quality is next level aur price bhi reasonable hai.'"
    )
}

SUPPORTED_TONES = {
    "energetic":    "high-energy, exciting, uses exclamations, feels like a hype post",
    "professional": "polished, authoritative, data-driven, trustworthy brand voice",
    "casual":       "friendly, conversational, relatable, like talking to a friend",
    "witty":        "clever wordplay, light humor, sharp observations, memorable lines"
}

# ─── AWS Clients ──────────────────────────────────────────────────────────────
bedrock_rt_apac  = boto3.client("bedrock-runtime",       region_name=AWS_REGION)
bedrock_agent_rt = boto3.client("bedrock-agent-runtime", region_name=AWS_REGION)


# ══════════════════════════════════════════════════════════════════════════════
# Step 1 — Enrich search query via Nova Pro
# ══════════════════════════════════════════════════════════════════════════════
def enrich_search_query(product_name: str, product_category: str,
                        brand_name: str, tone: str) -> str:
    """
    Uses Nova Pro to produce an optimised Tavily search query from raw inputs.
    Better query → richer Tavily results.
    """
    system_prompt = (
        "You are an expert market research query engineer. "
        "Generate a single optimised search query string that retrieves current market trends, "
        "competitor activity, consumer sentiment, viral moments, and social buzz for a product. "
        "Return ONLY the query string. No explanation, no preamble, no quotes."
    )
    user_message = (
        f"Product: {product_name}\nCategory: {product_category}\nBrand: {brand_name}\nTone: {tone}\n\n"
        "Generate a specific market research query for 2025 India market covering: "
        "current trends, competitor launches, consumer sentiment, pricing trends, social media buzz. "
        "Make it research-grade and specific."
    )
    try:
        response = bedrock_rt_apac.converse(
            modelId=NOVA_PRO_ARN,
            system=[{"text": system_prompt}],
            messages=[{"role": "user", "content": [{"text": user_message}]}],
            inferenceConfig={"maxTokens": 200, "temperature": 0.4, "topP": 0.9}
        )
        enriched = response["output"]["message"]["content"][0]["text"].strip()
        # Strip surrounding quotes the model may add — they degrade Tavily search quality
        enriched = enriched.strip('"').strip("'")
        logger.info(f"Enriched Tavily query: {enriched}")
        return enriched
    except ClientError as e:
        logger.error(f"Query enrichment error: {e.response['Error']['Message']}")
        return f"{product_category} {brand_name} India market trends 2025"


# ══════════════════════════════════════════════════════════════════════════════
# Step 2a — Tavily market research (two parallel searches)
# ══════════════════════════════════════════════════════════════════════════════
def fetch_market_trends(enriched_query: str) -> dict:
    """
    Runs TWO parallel Tavily search() calls for maximum market intelligence:

    Search 1 — News search:
        topic="news", time_range="month"
        → Surfaces recent launches, press coverage, brand announcements
        → Each result includes published_date for recency context

    Search 2 — Advanced general search:
        search_depth="advanced", include_answer="advanced"
        → Deep web retrieval with LLM-synthesised answer
        → Better for trends, reviews, consumer sentiment

    Both use search() which is synchronous, well-supported, and stable.
    The get_research_result() method does NOT exist in the SDK —
    the correct pattern is search() with appropriate parameters.

    search() response shape:
        {
            "query":         str,
            "answer":        str,   ← only when include_answer=True
            "results":       [{"title", "url", "content", "score", "published_date"}, ...],
            "response_time": float
        }
    """
    try:
        tavily = TavilyClient(api_key=TAVILY_API_KEY)
        sources = []
        combined_content = []

        # ── Search 1: Recent news (last month) ────────────────────────────────
        logger.info(f"Tavily news search | query: {enriched_query[:80]}")
        news_response = tavily.search(
            query=enriched_query,
            search_depth="advanced",   # Advanced retrieves most relevant content per source
            topic="news",
            time_range="month",        # Last month news only for recency
            max_results=7,
            chunks_per_source=3,       # Up to 3 x 500-char chunks per URL = ~1500 chars per source
            include_answer="advanced", # LLM-synthesised answer across all news results
        )
        if news_response.get("answer"):
            combined_content.append(f"[RECENT NEWS SUMMARY]\n{news_response['answer']}")
        for r in news_response.get("results", []):
            date_str = f" ({r.get('published_date', '')})" if r.get("published_date") else ""
            # Use full content field — chunks_per_source makes this much richer (~1500 chars)
            combined_content.append(f"• {r.get('title','')}{date_str}:\n{r.get('content','')}")
            if r.get("url"):
                sources.append({"title": r.get("title", ""), "url": r["url"]})

        logger.info(f"Tavily news search done | results={len(news_response.get('results', []))}")

        # ── Search 2: Deep general market trends ─────────────────────────────
        general_query = f"{enriched_query} consumer reviews market analysis India"
        logger.info(f"Tavily advanced search | query: {general_query[:80]}")
        general_response = tavily.search(
            query=general_query,
            search_depth="advanced",   # Deep retrieval — costs 2 credits but returns richer content
            topic="general",
            time_range="year",         # Last year for broader trend context
            max_results=7,
            chunks_per_source=3,       # Up to 3 x 500-char chunks per URL
            include_answer="advanced", # Detailed LLM-synthesised answer across all results
        )
        if general_response.get("answer"):
            combined_content.append(f"[MARKET TRENDS & ANALYSIS]\n{general_response['answer']}")
        for r in general_response.get("results", []):
            # Full content with chunks — much richer than [:300] slice
            combined_content.append(f"• {r.get('title','')}: {r.get('content','')}")
            if r.get("url") and r["url"] not in [s["url"] for s in sources]:
                sources.append({"title": r.get("title", ""), "url": r["url"]})

        logger.info(f"Tavily advanced search done | results={len(general_response.get('results', []))}")

        final_content = "\n\n".join(combined_content)
        logger.info(f"Tavily total content length={len(final_content)} | sources={len(sources)}")
        return {"content": final_content, "sources": sources}

    except Exception as e:
        logger.error(f"Tavily error: {e}")
        return {"content": "", "sources": []}


# ══════════════════════════════════════════════════════════════════════════════
# Step 2b — KB RAG (product-specific knowledge)
# ══════════════════════════════════════════════════════════════════════════════
def fetch_kb_context(product_name: str, product_category: str, brand_name: str) -> str:
    """
    Retrieves product facts, specs, and USPs from the Bedrock Knowledge Base
    using HYBRID search (keyword + semantic).
    """
    query = f"{brand_name} {product_name} {product_category} features specifications USP benefits"
    try:
        response = bedrock_agent_rt.retrieve(
            knowledgeBaseId=KNOWLEDGE_BASE_ID,
            retrievalQuery={"text": query},
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
                passages.append(f"[Relevance: {score:.3f}]\n{text}")
        if not passages:
            logger.warning("KB returned no results.")
            return ""
        logger.info(f"KB retrieved {len(passages)} passage(s)")
        return "\n\n---\n\n".join(passages)
    except ClientError as e:
        logger.error(f"KB error: {e.response['Error']['Message']}")
        return ""


# ══════════════════════════════════════════════════════════════════════════════
# Step 3 — Generate structured post via Nova Pro
# ══════════════════════════════════════════════════════════════════════════════
def generate_post(product_name: str, product_category: str, brand_name: str,
                  language: str, tone: str,
                  market_trends: dict, kb_context: str) -> dict:
    """
    Assembles all context and calls Nova Pro to generate a fully structured
    social media post with modern content marketing fields.

    Returns a JSON dict with:
        title         — Hook headline (6-10 words, attention-grabbing)
        subtitle      — Supporting line expanding on the title (1 sentence)
        content       — Main post body (bulk of the 2500 chars)
        cta           — Call-to-action line (1 punchy sentence)
        hashtags      — List of 5-8 relevant hashtags
        emojis        — 3-5 key emojis that fit the post theme
        content_type  — Marketing content type tag
        hook_style    — The opening hook technique used

    converse() inferenceConfig:
        temperature=0.7  — Higher for creative, engaging copy
        maxTokens=1500   — Enough for full structured JSON response
    """
    language_instruction = SUPPORTED_LANGUAGES.get(language, SUPPORTED_LANGUAGES["english"])
    tone_description     = SUPPORTED_TONES.get(tone, SUPPORTED_TONES["energetic"])

    trends_section = (
        f"\n\n━━━ CURRENT MARKET TRENDS (live web research) ━━━\n{market_trends['content'][:4000]}"
        if market_trends.get("content")
        else "\n\n━━━ MARKET TRENDS ━━━\nNo live trend data available."
    )
    kb_section = (
        f"\n\n━━━ PRODUCT KNOWLEDGE BASE ━━━\n{kb_context[:2000]}"
        if kb_context
        else "\n\n━━━ PRODUCT KNOWLEDGE ━━━\nNo product-specific data available."
    )

    system_prompt = (
        "You are an expert social media content strategist and copywriter specializing in "
        "consumer electronics and lifestyle brand content for Indian audiences. "
        "You create authentic, on-trend posts that drive real engagement on Instagram, LinkedIn, and Twitter/X."
    )

    user_message = f"""Create a structured social media post for the product below using all provided context.

━━━ PRODUCT ━━━
Name: {product_name}
Category: {product_category}
Brand: {brand_name}
{trends_section}
{kb_section}

━━━ REQUIREMENTS ━━━
Language: {language_instruction}
Tone: {tone_description}
Total content length: Between 2000 and {MAX_POST_CHARS} characters across title + subtitle + content + cta combined.
IMPORTANT: The 'content' field alone must be at least 1500 characters. Do NOT produce a short post.
Use the Tavily market insights and KB product facts to write a DETAILED, RICH post — not a summary.

━━━ CONTENT STRATEGY ━━━
- Lead with the most compelling current trend or insight that makes this product relevant NOW
- Weave in 2-3 specific product facts from the knowledge base naturally
- Make it culturally relevant to India 2025
- Do NOT use placeholder text — use actual product/brand details from the context

━━━ OUTPUT FORMAT ━━━
Return ONLY a valid JSON object, no markdown, no extra text:
{{
  "title": "<Hook headline — 6-10 words, attention-grabbing opener>",
  "subtitle": "<1 sentence expanding on the title, builds curiosity or context>",
  "content": "<Main post body — the bulk of the post, most engaging part, includes product insights and trend tie-in>",
  "cta": "<1 punchy call-to-action sentence — drives comment, share, or click>",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "emojis": ["🎧", "🔥"],
  "content_type": "<one of: product_showcase | trend_jacking | educational | storytelling | social_proof | FOMO | comparison>",
  "hook_style": "<one of: question | bold_statement | shocking_stat | relatable_pain | trend_reference | controversy>"
}}"""

    try:
        response = bedrock_rt_apac.converse(
            modelId=NOVA_PRO_ARN,
            system=[{"text": system_prompt}],
            messages=[{"role": "user", "content": [{"text": user_message}]}],
            inferenceConfig={"maxTokens": 1500, "temperature": 0.7, "topP": 0.95}
        )
        content_blocks = response["output"]["message"]["content"]
        raw_text = " ".join(
            b["text"] for b in content_blocks if "text" in b
        ).strip()

        usage = response.get("usage", {})
        logger.info(
            f"Post generated | inputTokens={usage.get('inputTokens')} | "
            f"outputTokens={usage.get('outputTokens')}"
        )

        # Strip markdown fences if present
        if raw_text.startswith("```"):
            parts    = raw_text.split("```")
            raw_text = parts[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
            raw_text = raw_text.strip()

        post_data = json.loads(raw_text)

        # Compute total character count across all text fields
        total_chars = sum(
            len(str(post_data.get(f, "")))
            for f in ["title", "subtitle", "content", "cta"]
        )
        post_data["total_characters"] = total_chars
        logger.info(f"Post total_chars={total_chars}")
        return post_data

    except json.JSONDecodeError as e:
        logger.error(f"Post JSON parse error: {e} | raw: {raw_text[:300]}")
        # Graceful fallback — return raw text wrapped in structure
        return {
            "title":           f"{brand_name} {product_name}",
            "subtitle":        "",
            "content":         raw_text[:MAX_POST_CHARS],
            "cta":             "",
            "hashtags":        [],
            "emojis":          [],
            "content_type":    "product_showcase",
            "hook_style":      "bold_statement",
            "total_characters": len(raw_text)
        }
    except ClientError as e:
        logger.error(f"Post generation error: {e.response['Error']['Message']}")
        raise


# ══════════════════════════════════════════════════════════════════════════════
# Lambda Handler
# ══════════════════════════════════════════════════════════════════════════════
def lambda_handler(event, context):
    """
    Expected event:
    {
        "product_name":      "Rockerz 550",
        "product_category":  "wireless headphones",
        "brand_name":        "boAt",
        "post_language":     "hindi-in-english",
        "tone":              "energetic"
    }

    Success response body:
    {
        "status":           "success",
        "post": {
            "title":          "...",
            "subtitle":       "...",
            "content":        "...",
            "cta":            "...",
            "hashtags":       ["#...", ...],
            "emojis":         ["🎧", ...],
            "content_type":   "trend_jacking",
            "hook_style":     "bold_statement",
            "total_characters": 2134
        },
        "language":           "hindi-in-english",
        "tone":               "energetic",
        "kb_passages_used":   4,
        "market_sources":     [{"title": "...", "url": "..."}, ...],
        "enriched_query":     "..."
    }
    """
    logger.info(f"Event keys: {list(event.keys())}")

    if "body" in event:
        body = json.loads(event["body"]) if isinstance(event["body"], str) else event["body"]
    else:
        body = event

    # ── Validate ──────────────────────────────────────────────────────────────
    for field in ["product_name", "product_category", "brand_name", "post_language", "tone"]:
        if not body.get(field, "").strip():
            return _error_response(400, f"Missing required field: '{field}'")

    product_name     = body["product_name"].strip()
    product_category = body["product_category"].strip()
    brand_name       = body["brand_name"].strip()
    post_language    = body["post_language"].strip().lower()
    tone             = body["tone"].strip().lower()

    if post_language not in SUPPORTED_LANGUAGES:
        return _error_response(400, f"Invalid 'post_language'. Supported: {list(SUPPORTED_LANGUAGES.keys())}")
    if tone not in SUPPORTED_TONES:
        return _error_response(400, f"Invalid 'tone'. Supported: {list(SUPPORTED_TONES.keys())}")

    try:
        # Step 1: Enrich query via Nova Pro
        logger.info("Step 1: Enriching search query")
        enriched_query = enrich_search_query(product_name, product_category, brand_name, tone)

        # Step 2: Parallel — Tavily + KB
        logger.info("Step 2: Parallel Tavily search + KB RAG")
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            future_tavily = executor.submit(fetch_market_trends, enriched_query)
            future_kb     = executor.submit(fetch_kb_context, product_name, product_category, brand_name)
            market_trends = future_tavily.result()
            kb_context    = future_kb.result()

        logger.info(
            f"Fetch done | tavily_len={len(market_trends.get('content',''))} | "
            f"kb_len={len(kb_context)}"
        )

        # Step 3: Generate structured post
        logger.info("Step 3: Generating structured post")
        post_data = generate_post(
            product_name, product_category, brand_name,
            post_language, tone, market_trends, kb_context
        )

        kb_passages_used = len([p for p in kb_context.split("---") if p.strip()]) if kb_context else 0

        return {
            "statusCode": 200,
            "body": json.dumps({
                "status":           "success",
                "post":             post_data,
                "language":         post_language,
                "tone":             tone,
                "kb_passages_used": kb_passages_used,
                "market_sources":   market_trends.get("sources", []),
                "product_name":     product_name,
                "brand_name":       brand_name,
                "enriched_query":   enriched_query
            }, ensure_ascii=False)
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