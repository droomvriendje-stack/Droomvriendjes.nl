"""
AI Marketing Campaign Creator
Generates content via Emergent LLM Key (OpenAI GPT)
Supports posting to TikTok, Facebook, Instagram (copy-friendly)
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import logging
import os
import json
import httpx
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter(tags=["ai-campaigns"])

# Supabase client
supabase = None


def set_supabase_client(client):
    global supabase
    supabase = client


# TikTok config
TIKTOK_CLIENT_KEY = os.environ.get("TIKTOK_CLIENT_KEY", "")
TIKTOK_CLIENT_SECRET = os.environ.get("TIKTOK_CLIENT_SECRET", "")


class CampaignRequest(BaseModel):
    product_name: str
    product_description: str
    target_audience: str = "Ouders met baby's en peuters"
    platforms: List[str] = ["facebook", "instagram", "tiktok"]
    campaign_goal: str = "sales"
    tone: str = "warm"
    language: str = "nl"
    image_url: Optional[str] = None


class CampaignResponse(BaseModel):
    campaign_id: str
    status: str
    generated_content: dict
    post_results: List[dict]


async def generate_ai_content(product_name: str, product_description: str, platform: str, tone: str, goal: str, audience: str) -> dict:
    """Generate marketing content using Emergent LLM Key (OpenAI GPT)"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage

        api_key = os.environ.get("EMERGENT_LLM_KEY", "")
        if not api_key:
            logger.warning("EMERGENT_LLM_KEY not set, using fallback")
            return _fallback_content(product_name, product_description, platform)

        session_id = f"campaign_{platform}_{uuid.uuid4().hex[:8]}"

        system_msg = (
            "Je bent een creatieve social media marketing expert gespecialiseerd in "
            "baby- en kinderproducten in Nederland en Belgie. Je schrijft altijd in het Nederlands. "
            "Je content is warm, betrouwbaar en moedervriendelijk. "
            "Je weet hoe je ouders emotioneel raakt en tot actie aanzet."
        )

        chat = LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message=system_msg
        )
        chat.with_model("openai", "gpt-4o")

        platform_instructions = {
            "facebook": f"""Schrijf een Facebook advertentie/post voor "{product_name}".

Product: {product_description}
Toon: {tone} en betrouwbaar
Doel: {goal}
Doelgroep: {audience}

Geef het resultaat in EXACT dit JSON format (geen extra tekst):
{{
  "headline": "Korte pakkende headline (max 40 tekens)",
  "caption": "De volledige post tekst met emoji's (max 250 woorden)",
  "hashtags": "#relevante #hashtags #gescheiden #door #spaties",
  "cta": "Call-to-action tekst"
}}""",
            "instagram": f"""Schrijf een Instagram post/reel caption voor "{product_name}".

Product: {product_description}
Toon: {tone} en visueel aantrekkelijk
Doel: {goal}
Doelgroep: {audience}

Geef het resultaat in EXACT dit JSON format (geen extra tekst):
{{
  "headline": "Eerste regel die opvalt (max 50 tekens)",
  "caption": "Instagram caption met emoji's, line breaks en storytelling (max 200 woorden)",
  "hashtags": "#30 #relevante #hashtags #voor #bereik",
  "cta": "Call-to-action tekst"
}}""",
            "tiktok": f"""Schrijf een TikTok video beschrijving voor "{product_name}".

Product: {product_description}
Toon: {tone}, trending en jong
Doel: {goal}
Doelgroep: {audience}

Geef het resultaat in EXACT dit JSON format (geen extra tekst):
{{
  "headline": "Hook voor de eerste 3 seconden (max 30 tekens)",
  "caption": "Korte pakkende TikTok beschrijving (max 80 woorden)",
  "hashtags": "#trending #tiktok #hashtags",
  "cta": "Call-to-action"
}}"""
        }

        prompt = platform_instructions.get(platform, platform_instructions["facebook"])
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)

        try:
            clean = response.strip()
            if clean.startswith("```"):
                clean = clean.split("\n", 1)[1] if "\n" in clean else clean[3:]
                if clean.endswith("```"):
                    clean = clean[:-3]
                clean = clean.strip()
            if clean.startswith("json"):
                clean = clean[4:].strip()
            parsed = json.loads(clean)
            return parsed
        except (json.JSONDecodeError, Exception) as e:
            logger.warning(f"Could not parse AI response as JSON: {e}")
            return {
                "headline": product_name,
                "caption": response[:500],
                "hashtags": "#droomvriendjes #slaapknuffel #baby",
                "cta": "Shop nu op droomvriendjes.nl"
            }

    except Exception as e:
        logger.error(f"AI content generation error: {e}")
        return _fallback_content(product_name, product_description, platform)


def _fallback_content(product_name, product_description, platform):
    """Fallback content when AI is unavailable"""
    return {
        "headline": f"Ontdek {product_name}!",
        "caption": f"Maak kennis met {product_name} van Droomvriendjes!\n\n{product_description}\n\nPerfect voor een rustgevende nacht voor jouw kleintje.",
        "hashtags": "#droomvriendjes #slaapknuffel #baby #nachtlampje #kraamcadeau",
        "cta": "Bestel nu op droomvriendjes.nl"
    }


@router.post("/api/ai-campaigns/generate")
async def generate_campaign(request: CampaignRequest):
    """Generate AI marketing campaign content for multiple platforms"""
    try:
        campaign_id = f"camp_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"
        generated_content = {}
        post_results = []

        for platform in request.platforms:
            logger.info(f"Generating {platform} content for: {request.product_name}")
            content = await generate_ai_content(
                request.product_name,
                request.product_description,
                platform,
                request.tone,
                request.campaign_goal,
                request.target_audience
            )
            generated_content[platform] = content

            post_results.append({
                "platform": platform,
                "status": "generated",
                "content": content
            })

        # Save campaign to Supabase if available
        if supabase:
            try:
                supabase.table("marketing_campaigns").insert({
                    "campaign_id": campaign_id,
                    "product_name": request.product_name,
                    "platforms": request.platforms,
                    "content": json.dumps(generated_content),
                    "status": "generated",
                    "created_at": datetime.now(timezone.utc).isoformat()
                }).execute()
            except Exception as e:
                logger.warning(f"Could not save campaign to DB: {e}")

        return {
            "campaign_id": campaign_id,
            "status": "generated",
            "generated_content": generated_content,
            "post_results": post_results
        }

    except Exception as e:
        logger.error(f"Campaign generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/ai-campaigns/history")
async def get_campaign_history():
    """Get previous campaigns"""
    if not supabase:
        return {"campaigns": []}

    try:
        result = supabase.table("marketing_campaigns")\
            .select("*")\
            .order("created_at", desc=True)\
            .limit(20)\
            .execute()
        campaigns = result.data or []
        for c in campaigns:
            if isinstance(c.get("content"), str):
                try:
                    c["content"] = json.loads(c["content"])
                except:
                    pass
        return {"campaigns": campaigns}
    except Exception as e:
        logger.warning(f"Could not fetch campaigns: {e}")
        return {"campaigns": []}


@router.get("/api/ai-campaigns/products")
async def get_products_for_campaigns():
    """Get available products for campaign generation"""
    if not supabase:
        return {"products": []}

    try:
        result = supabase.table("products")\
            .select("id, name, description, price, image")\
            .execute()
        return {"products": result.data or []}
    except Exception as e:
        logger.warning(f"Could not fetch products: {e}")
        return {"products": []}


@router.get("/api/ai-campaigns/config-status")
async def get_config_status():
    """Check which integrations are configured"""
    return {
        "ai_ready": bool(os.environ.get("EMERGENT_LLM_KEY")),
        "tiktok_configured": bool(TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET),
        "facebook_configured": False,
        "instagram_configured": False,
        "supabase_connected": supabase is not None
    }
