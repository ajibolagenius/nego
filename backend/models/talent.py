from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
import uuid


class TalentBase(BaseModel):
    name: str
    location: str
    image: str
    starting_price: int = Field(ge=0)
    age: Optional[int] = Field(None, ge=18, le=100)
    tagline: Optional[str] = None
    description: Optional[str] = None
    rating: Optional[float] = Field(None, ge=0, le=5)
    verified: bool = False


class TalentCreate(TalentBase):
    pass


class TalentUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    image: Optional[str] = None
    starting_price: Optional[int] = Field(None, ge=0)
    age: Optional[int] = Field(None, ge=18, le=100)
    tagline: Optional[str] = None
    description: Optional[str] = None
    rating: Optional[float] = Field(None, ge=0, le=5)
    verified: Optional[bool] = None


class Talent(TalentBase):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TalentList(BaseModel):
    talents: List[Talent]
    total: int
