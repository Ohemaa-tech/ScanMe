import os
import uuid
import requests
import logging
from PIL import Image, ImageDraw, ImageFont
import io
import random

logger = logging.getLogger("image_generator")

OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public", "uploads", "products"))

def ensure_output_dir():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

def generate_studio_image(product_name: str, brand: str = "") -> str:
    """Generates a clean studio product photograph using FLUX/Pollinations AI models.
    Returns relative URL path (e.g. '/uploads/products/prod_12345.png')
    """
    ensure_output_dir()
    filename = f"prod_{uuid.uuid4().hex[:10]}.png"
    filepath = os.path.join(OUTPUT_DIR, filename)

    clean_brand = brand.strip() if brand else ""
    full_name = f"{clean_brand} {product_name}".strip() if clean_brand else product_name.strip()
    
    # Enhanced photorealistic studio product prompt
    prompt = f"Professional e-commerce product photograph of {full_name}, clean retail packaging, studio lighting, crisp focus, soft natural shadow, isolated on solid white background, high quality commercial product shot, 4k"

    # 1. Try FLUX model on Pollinations API
    models_to_try = ["flux", "turbo"]
    encoded_prompt = requests.utils.quote(prompt)

    for model_name in models_to_try:
        try:
            seed = random.randint(100, 99999)
            url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?model={model_name}&width=512&height=512&nologo=true&seed={seed}"
            logger.info(f"Generating studio product image via Pollinations ({model_name})...")
            
            response = requests.get(url, timeout=15)
            if response.status_code == 200 and len(response.content) > 8000:
                with open(filepath, "wb") as f:
                    f.write(response.content)
                logger.info(f"Successfully generated studio product photo: {filepath}")
                return f"/uploads/products/{filename}"
        except Exception as e:
            logger.warning(f"Pollinations model {model_name} failed: {e}")

    # 2. Fallback: Generate a clean studio mockup locally using PIL
    try:
        img = Image.new("RGB", (512, 512), color=(250, 250, 250))
        draw = ImageDraw.Draw(img)
        
        # Soft outer card container
        draw.rounded_rectangle([32, 32, 480, 480], radius=28, fill=(255, 255, 255), outline=(226, 232, 240), width=2)
        
        # Simulated bottle/package silhouette shape
        draw.rounded_rectangle([186, 110, 326, 330], radius=20, fill=(241, 245, 249), outline=(203, 213, 225), width=3)
        draw.rounded_rectangle([226, 80, 286, 110], radius=8, fill=(226, 232, 240), outline=(203, 213, 225), width=2)
        
        # Accent label band
        draw.rounded_rectangle([196, 180, 316, 260], radius=10, fill=(15, 23, 42))
        
        # Brand text
        b_text = (clean_brand or "SWIFTSCAN").upper()[:16]
        draw.text((256, 205), b_text, fill=(255, 255, 255), anchor="mm")
        
        # Product name text
        short_name = product_name[:24] if product_name else "Product"
        draw.text((256, 235), short_name, fill=(148, 163, 184), anchor="mm")
        
        # Footer label
        draw.text((256, 390), full_name[:32], fill=(30, 41, 59), anchor="mm")
        
        img.save(filepath, "PNG")
        logger.info(f"Generated fallback studio mockup image: {filepath}")
        return f"/uploads/products/{filename}"
    except Exception as e:
        logger.error(f"Failed to generate fallback image: {e}")
        return ""
