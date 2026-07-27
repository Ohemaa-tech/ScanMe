import os
import json
import base64
import logging
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from PIL import Image
import io

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("vision_extractor")

SYSTEM_PROMPT = """You are an expert OCR and retail product visual data extractor.
Carefully examine the uploaded product photos (front label, back package, volume/net weight text, and barcode sticker).

Your goal is to extract the EXACT printed product details into a clean JSON object:
{
  "productName": "Full descriptive product name with brand & size (e.g. 'Slemfit Natural Mineral Water 500ml')",
  "brand": "Manufacturer or brand name printed on package (e.g. 'Slemfit')",
  "category": "Retail category e.g., Beverages, Snacks, Personal Care, Dairy, Pantry, Bakery, Water",
  "baseUnitName": "Base unit e.g. Bottle, Piece, Can, Pack, Box, Bag",
  "barcode": "Numeric barcode digits if visible on packaging/sticker, otherwise null",
  "lowStockThreshold": 10
}

Strict Rules:
1. READ THE EXACT PRINTED TEXT ON THE LABEL. Do not guess or hallucinate. Look closely at logos, primary title text, and net volume/weight (e.g., 500ml, 1L, 250g).
2. Output MUST be valid, raw JSON only without markdown code fences or conversational text.
3. If barcode is visible in any photo (even partially or on a barcode sticker), transcribe the numeric digits precisely.
"""

def normalize_image_bytes(img_bytes: bytes) -> bytes:
    """Converts any uploaded mobile photo (HEIC/PNG/WEBP/large JPEG) into standard RGB JPEG bytes."""
    try:
        image = Image.open(io.BytesIO(img_bytes))
        if image.mode in ("RGBA", "P", "LA"):
            image = image.convert("RGB")
        max_dim = 1600
        if max(image.width, image.height) > max_dim:
            image.thumbnail((max_dim, max_dim))
        out = io.BytesIO()
        image.save(out, format="JPEG", quality=85)
        return out.getvalue()
    except Exception as e:
        logger.warning(f"Could not re-encode image: {e}")
        return img_bytes

def image_to_base64(image_bytes: bytes) -> str:
    return base64.b64encode(image_bytes).decode('utf-8')

def extract_with_gemini(image_bytes_list: List[bytes]) -> Optional[Dict[str, Any]]:
    """Attempts extraction via Google Gemini Vision API (Top Precision for OCR)."""
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key or not gemini_key.strip():
        logger.info("GEMINI_API_KEY not set.")
        return None

    try:
        # Try google-genai SDK first
        try:
            from google import genai
            client = genai.Client(api_key=gemini_key.strip())
            
            contents = [SYSTEM_PROMPT]
            for raw_bytes in image_bytes_list:
                norm_bytes = normalize_image_bytes(raw_bytes)
                contents.append(Image.open(io.BytesIO(norm_bytes)))

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=contents
            )
            raw_text = response.text.strip()
        except Exception as sdk_err:
            logger.info(f"Gemini SDK fallback to REST: {sdk_err}")
            import requests
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key.strip()}"
            parts = [{"text": SYSTEM_PROMPT}]
            for raw_bytes in image_bytes_list:
                norm_bytes = normalize_image_bytes(raw_bytes)
                parts.append({
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": image_to_base64(norm_bytes)
                    }
                })
            res = requests.post(url, json={"contents": [{"parts": parts}]}, timeout=18)
            res_json = res.json()
            raw_text = res_json['candidates'][0]['content']['parts'][0]['text'].strip()

        if raw_text.startswith("```"):
            raw_text = raw_text.split("\n", 1)[-1].rsplit("\n", 1)[0].replace("json", "").strip()
            
        data = json.loads(raw_text)
        logger.info("Successfully extracted product info via Gemini Vision API.")
        return data
    except Exception as e:
        logger.warning(f"Gemini Vision API error: {e}")
        return None

def extract_with_groq_or_grok(image_bytes_list: List[bytes]) -> Optional[Dict[str, Any]]:
    """Attempts extraction via Groq (gsk_) or Grok Vision API."""
    grok_key = os.getenv("GROK_API_KEY")
    if not grok_key or not grok_key.strip():
        logger.info("GROK_API_KEY / Groq key not set.")
        return None

    try:
        from openai import OpenAI
        
        if grok_key.strip().startswith("gsk_"):
            base_url = "https://api.groq.com/openai/v1"
            model_name = "llama-3.2-11b-vision-preview"
            logger.info("Using Groq Vision API.")
        else:
            base_url = "https://api.x.ai/v1"
            model_name = "grok-2-vision-1212"
            logger.info("Using xAI Grok Vision API.")

        client = OpenAI(
            api_key=grok_key.strip(),
            base_url=base_url
        )
        
        content = [{"type": "text", "text": SYSTEM_PROMPT}]
        for raw_bytes in image_bytes_list:
            norm_bytes = normalize_image_bytes(raw_bytes)
            b64_str = image_to_base64(norm_bytes)
            content.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{b64_str}"
                }
            })

        response = client.chat.completions.create(
            model=model_name,
            messages=[{"role": "user", "content": content}],
            temperature=0.1
        )
        
        raw_text = response.choices[0].message.content.strip()
        if raw_text.startswith("```"):
            raw_text = raw_text.split("\n", 1)[-1].rsplit("\n", 1)[0].replace("json", "").strip()
        
        data = json.loads(raw_text)
        logger.info("Successfully extracted product info via Groq/Grok Vision API.")
        return data
    except Exception as e:
        logger.warning(f"Groq/Grok Vision API error: {e}")
        return None

def extract_product_info(image_bytes_list: List[bytes]) -> Dict[str, Any]:
    """Primary: Gemini Vision (Superior OCR) -> Secondary: Groq/Grok -> Fallback baseline."""
    if not image_bytes_list:
        raise ValueError("No images provided for extraction.")

    # 1. Try Gemini Vision (Highest OCR accuracy for labels & text)
    result = extract_with_gemini(image_bytes_list)
    if result:
        return result

    # 2. Try Groq / Grok
    result = extract_with_groq_or_grok(image_bytes_list)
    if result:
        return result

    # 3. Baseline fallback
    logger.info("APIs unavailable. Returning sample structure.")
    return {
        "productName": "Scanned Product",
        "brand": "Sample Brand",
        "category": "General",
        "baseUnitName": "Bottle",
        "barcode": "123456789012",
        "lowStockThreshold": 10
    }
