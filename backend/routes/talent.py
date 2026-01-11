from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone

from models.talent import Talent, TalentCreate, TalentUpdate, TalentList

router = APIRouter(prefix="/talents", tags=["talents"])


def get_db():
    from server import db
    return db


@router.get("", response_model=TalentList)
async def get_talents(
    skip: int = 0,
    limit: int = 20,
    location: Optional[str] = None,
    verified: Optional[bool] = None,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get all talents with optional filtering"""
    query = {}
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    if verified is not None:
        query["verified"] = verified
    
    total = await db.talents.count_documents(query)
    cursor = db.talents.find(query, {"_id": 0}).skip(skip).limit(limit)
    talents_data = await cursor.to_list(length=limit)
    
    # Convert datetime strings back to datetime objects
    talents = []
    for t in talents_data:
        if isinstance(t.get('created_at'), str):
            t['created_at'] = datetime.fromisoformat(t['created_at'])
        if isinstance(t.get('updated_at'), str):
            t['updated_at'] = datetime.fromisoformat(t['updated_at'])
        talents.append(Talent(**t))
    
    return TalentList(talents=talents, total=total)


@router.get("/{talent_id}", response_model=Talent)
async def get_talent(talent_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get a single talent by ID"""
    talent = await db.talents.find_one({"id": talent_id}, {"_id": 0})
    if not talent:
        raise HTTPException(status_code=404, detail="Talent not found")
    
    if isinstance(talent.get('created_at'), str):
        talent['created_at'] = datetime.fromisoformat(talent['created_at'])
    if isinstance(talent.get('updated_at'), str):
        talent['updated_at'] = datetime.fromisoformat(talent['updated_at'])
    
    return Talent(**talent)


@router.post("", response_model=Talent, status_code=201)
async def create_talent(talent_in: TalentCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Create a new talent profile"""
    talent = Talent(**talent_in.model_dump())
    
    # Convert to dict and serialize datetimes
    doc = talent.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.talents.insert_one(doc)
    return talent


@router.patch("/{talent_id}", response_model=Talent)
async def update_talent(
    talent_id: str,
    talent_update: TalentUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update a talent profile"""
    existing = await db.talents.find_one({"id": talent_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Talent not found")
    
    update_data = talent_update.model_dump(exclude_unset=True)
    if update_data:
        update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
        await db.talents.update_one({"id": talent_id}, {"$set": update_data})
    
    updated = await db.talents.find_one({"id": talent_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    
    return Talent(**updated)


@router.delete("/{talent_id}", status_code=204)
async def delete_talent(talent_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Delete a talent profile"""
    result = await db.talents.delete_one({"id": talent_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Talent not found")
    return None
