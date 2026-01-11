from fastapi import APIRouter, HTTPException, Depends
from typing import List
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone

from models.content import PrivateContent, PrivateContentCreate, PrivateContentResponse
from models.user import User
from routes.auth import get_current_user

router = APIRouter(prefix="/content", tags=["content"])


def get_db():
    from server import db
    return db


@router.get("", response_model=List[PrivateContentResponse])
async def get_private_content(
    skip: int = 0,
    limit: int = 20,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get all private content (locked preview for unauthenticated users)"""
    cursor = db.private_content.find({}, {"_id": 0}).skip(skip).limit(limit)
    content_data = await cursor.to_list(length=limit)
    
    result = []
    for c in content_data:
        if isinstance(c.get('created_at'), str):
            c['created_at'] = datetime.fromisoformat(c['created_at'])
        content = PrivateContent(**c)
        result.append(PrivateContentResponse.from_content(content, user_unlocked=False))
    
    return result


@router.get("/unlocked", response_model=List[PrivateContentResponse])
async def get_unlocked_content(
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get content unlocked by the current user"""
    # Get user's unlocked content IDs
    user_unlocks = await db.user_unlocks.find(
        {"user_id": current_user.id},
        {"_id": 0, "content_id": 1}
    ).to_list(1000)
    
    unlocked_ids = [u['content_id'] for u in user_unlocks]
    
    if not unlocked_ids:
        return []
    
    cursor = db.private_content.find({"id": {"$in": unlocked_ids}}, {"_id": 0})
    content_data = await cursor.to_list(length=100)
    
    result = []
    for c in content_data:
        if isinstance(c.get('created_at'), str):
            c['created_at'] = datetime.fromisoformat(c['created_at'])
        content = PrivateContent(**c)
        result.append(PrivateContentResponse.from_content(content, user_unlocked=True))
    
    return result


@router.post("/{content_id}/unlock", response_model=PrivateContentResponse)
async def unlock_content(
    content_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Unlock private content with coins"""
    # Check if content exists
    content_data = await db.private_content.find_one({"id": content_id}, {"_id": 0})
    if not content_data:
        raise HTTPException(status_code=404, detail="Content not found")
    
    if isinstance(content_data.get('created_at'), str):
        content_data['created_at'] = datetime.fromisoformat(content_data['created_at'])
    
    content = PrivateContent(**content_data)
    
    # Check if already unlocked
    existing_unlock = await db.user_unlocks.find_one({
        "user_id": current_user.id,
        "content_id": content_id
    })
    if existing_unlock:
        return PrivateContentResponse.from_content(content, user_unlocked=True)
    
    # Check if user has enough coins
    if current_user.coins < content.unlock_price:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient coins. Need {content.unlock_price}, have {current_user.coins}"
        )
    
    # Deduct coins and create unlock record
    new_coins = current_user.coins - content.unlock_price
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"coins": new_coins, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    await db.user_unlocks.insert_one({
        "user_id": current_user.id,
        "content_id": content_id,
        "unlocked_at": datetime.now(timezone.utc).isoformat()
    })
    
    return PrivateContentResponse.from_content(content, user_unlocked=True)


@router.post("", response_model=PrivateContentResponse, status_code=201)
async def create_private_content(
    content_in: PrivateContentCreate,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create new private content (admin only in production)"""
    content = PrivateContent(**content_in.model_dump())
    
    doc = content.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.private_content.insert_one(doc)
    
    return PrivateContentResponse.from_content(content)
