import os
import uvicorn
from typing import List
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

from vision_extractor import extract_product_info
from image_generator import generate_studio_image

load_dotenv()

app = FastAPI(
    title="SwiftScan AI Vision & Product Generation Service",
    version="1.0.0"
)

# Enable CORS for Vite frontend and mobile network connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded static images
public_uploads_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public", "uploads"))
os.makedirs(public_uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=public_uploads_dir), name="uploads")
app.mount("/api/uploads", StaticFiles(directory=public_uploads_dir), name="api_uploads")

@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": "SwiftScan AI Vision Pipeline",
        "grok_configured": bool(os.getenv("GROK_API_KEY")),
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY"))
    }

@app.post("/api/analyze-product")
async def analyze_product(images: List[UploadFile] = File(...)):
    """Receives 1 or more product photos, extracts structured product details,
    generates a clean studio product image, and returns the response for form pre-filling.
    """
    if not images:
        raise HTTPException(status_code=400, detail="At least one image must be uploaded.")

    try:
        # Read file bytes
        image_bytes_list = []
        for img in images:
            content = await img.read()
            if content:
                image_bytes_list.append(content)

        if not image_bytes_list:
            raise HTTPException(status_code=400, detail="Uploaded images were empty.")

        # 1. Vision Extraction (Grok Primary -> Gemini Fallback)
        product_data = extract_product_info(image_bytes_list)

        # 2. Studio Image Generation
        product_name = product_data.get("productName") or "Product"
        brand = product_data.get("brand") or ""
        generated_image_url = generate_studio_image(product_name=product_name, brand=brand)
        
        product_data["imageUrl"] = generated_image_url

        return {
            "success": True,
            "data": product_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Processing failed: {str(e)}")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
