from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Nego API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Import and include route modules
from routes import talent_router, auth_router, content_router

api_router.include_router(talent_router)
api_router.include_router(auth_router)
api_router.include_router(content_router)


@api_router.get("/")
async def root():
    return {"message": "Welcome to Nego API", "version": "1.0.0"}


@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}


# Seed endpoint for initial data
@api_router.post("/seed")
async def seed_database():
    """Seed database with initial talent and content data"""
    
    # Check if already seeded
    existing_talents = await db.talents.count_documents({})
    if existing_talents > 0:
        return {"message": "Database already seeded", "talents": existing_talents}
    
    # Seed talents
    talents = [
        {
            "id": "talent-1",
            "name": "Adaeze Nwosu",
            "age": 24,
            "image": "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80",
            "location": "Lagos",
            "starting_price": 120000,
            "tagline": "Elite Companion",
            "description": "Sophisticated and charming presence for any occasion.",
            "rating": 4.8,
            "verified": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "talent-2",
            "name": "Chidinma Eze",
            "age": 27,
            "image": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
            "location": "Abuja",
            "starting_price": 180000,
            "tagline": "Premium Partner",
            "description": "Elegant and cultured companion for high-profile events.",
            "rating": 4.9,
            "verified": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "talent-3",
            "name": "Folake Adeyemi",
            "age": 25,
            "image": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80",
            "location": "Port Harcourt",
            "starting_price": 150000,
            "tagline": "Exclusive Escort",
            "description": "Refined and flirtatious, perfect for dinner dates.",
            "rating": 4.7,
            "verified": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "talent-4",
            "name": "Grace Okoro",
            "age": 23,
            "image": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80",
            "location": "Lagos",
            "starting_price": 100000,
            "tagline": "Social Butterfly",
            "description": "Charismatic and engaging for social gatherings.",
            "rating": 4.6,
            "verified": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "talent-5",
            "name": "Halima Ibrahim",
            "age": 26,
            "image": "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&q=80",
            "location": "Kano",
            "starting_price": 130000,
            "tagline": "Northern Gem",
            "description": "Graceful and discreet for exclusive encounters.",
            "rating": 4.8,
            "verified": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "talent-6",
            "name": "Ify Okafor",
            "age": 28,
            "image": "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=80",
            "location": "Enugu",
            "starting_price": 160000,
            "tagline": "Eastern Belle",
            "description": "Sophisticated presence for corporate and social events.",
            "rating": 4.9,
            "verified": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "talent-7",
            "name": "Jessica Adekunle",
            "age": 24,
            "image": "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&q=80",
            "location": "Lagos",
            "starting_price": 140000,
            "tagline": "Lagos Star",
            "description": "Vibrant and engaging for unforgettable experiences.",
            "rating": 4.7,
            "verified": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "talent-8",
            "name": "Kemi Ogundimu",
            "age": 25,
            "image": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80",
            "location": "Ibadan",
            "starting_price": 110000,
            "tagline": "Ibadan Queen",
            "description": "Charming and witty companion for any occasion.",
            "rating": 4.6,
            "verified": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.talents.insert_many(talents)
    
    # Seed private content
    private_contents = [
        {
            "id": "content-1",
            "title": "Exclusive Photoshoot",
            "description": "Behind the scenes from an exclusive editorial.",
            "image_url": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80",
            "unlock_price": 50,
            "talent_id": "talent-3",
            "is_locked": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "content-2",
            "title": "Private Gallery",
            "description": "An intimate collection of premium photos.",
            "image_url": "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80",
            "unlock_price": 75,
            "talent_id": "talent-1",
            "is_locked": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "content-3",
            "title": "VIP Access",
            "description": "Exclusive content for premium members only.",
            "image_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80",
            "unlock_price": 100,
            "talent_id": "talent-2",
            "is_locked": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.private_content.insert_many(private_contents)
    
    return {
        "message": "Database seeded successfully",
        "talents_created": len(talents),
        "content_created": len(private_contents)
    }


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
