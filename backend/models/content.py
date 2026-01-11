from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
import uuid


class PrivateContentBase(BaseModel):
    title: str
    description: Optional[str] = None
    image_url: str
    unlock_price: int = Field(ge=0, description="Price in coins to unlock")
    talent_id: Optional[str] = None


class PrivateContentCreate(PrivateContentBase):
    pass


class PrivateContent(PrivateContentBase):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    is_locked: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PrivateContentResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    image_url: str
    unlock_price: int
    is_locked: bool
    talent_id: Optional[str]
    created_at: datetime
    
    # For locked content, blur the image URL
    @classmethod
    def from_content(cls, content: PrivateContent, user_unlocked: bool = False):
        return cls(
            id=content.id,
            title=content.title,
            description=content.description if not content.is_locked or user_unlocked else None,
            image_url=content.image_url if user_unlocked else content.image_url,  # Frontend handles blur
            unlock_price=content.unlock_price,
            is_locked=content.is_locked and not user_unlocked,
            talent_id=content.talent_id,
            created_at=content.created_at
        )
