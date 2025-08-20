from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import os
import uuid
import asyncio
from typing import List, Optional
import fal_client
from pymongo import MongoClient
from datetime import datetime
import base64
from io import BytesIO
from PIL import Image
import httpx

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

app = FastAPI(title="Advanced Face Swap API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# MongoDB setup
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URL)
db = client["faceswap_db"]
history_collection = db["swap_history"]
batch_collection = db["batch_jobs"]

# Configure fal.ai
os.environ["FAL_KEY"] = os.environ.get('FAL_KEY', '')

# Create upload directory
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Pydantic models
class FaceSwapRequest(BaseModel):
    source_image_url: str
    target_image_url: str
    face_index_source: Optional[int] = 0
    face_index_target: Optional[int] = 0

class BatchFaceSwapRequest(BaseModel):
    source_image_url: str
    target_image_urls: List[str]
    face_index_source: Optional[int] = 0

class SwapHistoryResponse(BaseModel):
    id: str
    source_image: str
    target_image: str
    result_image: str
    created_at: datetime
    processing_time: float

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Face Swap API"}

@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):
    """Upload and save image file"""
    try:
        # Generate unique filename
        file_extension = file.filename.split('.')[-1]
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = f"uploads/{unique_filename}"
        
        # Save file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Return file URL
        return {
            "success": True,
            "filename": unique_filename,
            "url": f"/uploads/{unique_filename}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")

@app.post("/api/detect-faces")
async def detect_faces(file: UploadFile = File(...)):
    """Detect faces in uploaded image"""
    try:
        # Save uploaded file temporarily
        content = await file.read()
        temp_filename = f"temp_{uuid.uuid4()}.jpg"
        temp_path = f"uploads/{temp_filename}"
        
        with open(temp_path, "wb") as buffer:
            buffer.write(content)
        
        # Use fal.ai face detection
        handler = await fal_client.submit_async(
            "fal-ai/face-swap",
            arguments={
                "image_url": f"http://localhost:8001/uploads/{temp_filename}",
                "detect_only": True
            }
        )
        
        result = await handler.get()
        
        # Clean up temp file
        os.remove(temp_path)
        
        return {
            "success": True,
            "faces_detected": result.get("faces_detected", 0),
            "face_locations": result.get("face_locations", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Face detection failed: {str(e)}")

@app.post("/api/face-swap")
async def face_swap(request: FaceSwapRequest):
    """Perform single face swap"""
    try:
        start_time = datetime.now()
        
        # Use fal.ai face swap
        handler = await fal_client.submit_async(
            "fal-ai/face-swap",
            arguments={
                "base_image_url": request.target_image_url,
                "swap_image_url": request.source_image_url,
                "face_index_base": request.face_index_target,
                "face_index_swap": request.face_index_source
            }
        )
        
        result = await handler.get()
        processing_time = (datetime.now() - start_time).total_seconds()
        
        # Save to history
        history_record = {
            "id": str(uuid.uuid4()),
            "source_image": request.source_image_url,
            "target_image": request.target_image_url,
            "result_image": result["image"]["url"],
            "created_at": start_time,
            "processing_time": processing_time,
            "face_index_source": request.face_index_source,
            "face_index_target": request.face_index_target
        }
        
        history_collection.insert_one(history_record)
        
        return {
            "success": True,
            "result_image": result["image"]["url"],
            "processing_time": processing_time,
            "history_id": history_record["id"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Face swap failed: {str(e)}")

@app.post("/api/batch-face-swap")
async def batch_face_swap(request: BatchFaceSwapRequest, background_tasks: BackgroundTasks):
    """Start batch face swap processing"""
    try:
        batch_id = str(uuid.uuid4())
        
        # Create batch job record
        batch_job = {
            "id": batch_id,
            "source_image": request.source_image_url,
            "target_images": request.target_image_urls,
            "total_images": len(request.target_image_urls),
            "completed_images": 0,
            "status": "processing",
            "created_at": datetime.now(),
            "results": []
        }
        
        batch_collection.insert_one(batch_job)
        
        # Add background task for processing
        background_tasks.add_task(process_batch_swap, batch_id, request)
        
        return {
            "success": True,
            "batch_id": batch_id,
            "total_images": len(request.target_image_urls),
            "status": "processing"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch processing failed: {str(e)}")

async def process_batch_swap(batch_id: str, request: BatchFaceSwapRequest):
    """Background task to process batch face swaps"""
    try:
        results = []
        
        for i, target_url in enumerate(request.target_image_urls):
            try:
                # Process individual face swap
                handler = await fal_client.submit_async(
                    "fal-ai/face-swap",
                    arguments={
                        "base_image_url": target_url,
                        "swap_image_url": request.source_image_url,
                        "face_index_base": 0,
                        "face_index_swap": request.face_index_source
                    }
                )
                
                result = await handler.get()
                
                results.append({
                    "target_image": target_url,
                    "result_image": result["image"]["url"],
                    "success": True
                })
                
                # Update progress
                batch_collection.update_one(
                    {"id": batch_id},
                    {
                        "$set": {
                            "completed_images": i + 1,
                            "results": results
                        }
                    }
                )
                
            except Exception as e:
                results.append({
                    "target_image": target_url,
                    "error": str(e),
                    "success": False
                })
        
        # Mark batch as completed
        batch_collection.update_one(
            {"id": batch_id},
            {
                "$set": {
                    "status": "completed",
                    "completed_at": datetime.now(),
                    "results": results
                }
            }
        )
        
    except Exception as e:
        # Mark batch as failed
        batch_collection.update_one(
            {"id": batch_id},
            {"$set": {"status": "failed", "error": str(e)}}
        )

@app.get("/api/batch-status/{batch_id}")
async def get_batch_status(batch_id: str):
    """Get batch processing status"""
    try:
        batch_job = batch_collection.find_one({"id": batch_id})
        if not batch_job:
            raise HTTPException(status_code=404, detail="Batch job not found")
        
        return {
            "batch_id": batch_id,
            "status": batch_job["status"],
            "total_images": batch_job["total_images"],
            "completed_images": batch_job["completed_images"],
            "results": batch_job.get("results", []),
            "created_at": batch_job["created_at"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get batch status: {str(e)}")

@app.get("/api/history")
async def get_swap_history(limit: int = 20, skip: int = 0):
    """Get face swap history"""
    try:
        history = list(
            history_collection.find()
            .sort("created_at", -1)
            .skip(skip)
            .limit(limit)
        )
        
        # Convert ObjectId to string and format response
        for record in history:
            record["_id"] = str(record["_id"])
        
        return {
            "success": True,
            "history": history,
            "total": history_collection.count_documents({})
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get history: {str(e)}")

@app.delete("/api/history/{history_id}")
async def delete_history_item(history_id: str):
    """Delete a history item"""
    try:
        result = history_collection.delete_one({"id": history_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="History item not found")
        
        return {"success": True, "message": "History item deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete history item: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)