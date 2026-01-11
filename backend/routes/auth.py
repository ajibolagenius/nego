from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone, timedelta
import hashlib
import jwt
import os

from models.user import User, UserCreate, UserLogin, UserResponse, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()

JWT_SECRET = os.environ.get("JWT_SECRET", "nego-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24


def get_db():
    from server import db
    return db


def hash_password(password: str) -> str:
    """Simple password hashing using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return hash_password(password) == hashed


def create_access_token(user_id: str) -> str:
    """Create JWT access token"""
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "sub": user_id,
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> User:
    """Get current authenticated user from token"""
    payload = decode_token(credentials.credentials)
    user_id = payload.get("sub")
    
    user_data = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user_data:
        raise HTTPException(status_code=401, detail="User not found")
    
    if isinstance(user_data.get('created_at'), str):
        user_data['created_at'] = datetime.fromisoformat(user_data['created_at'])
    if isinstance(user_data.get('updated_at'), str):
        user_data['updated_at'] = datetime.fromisoformat(user_data['updated_at'])
    
    return User(**user_data)


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(user_in: UserCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Register a new user"""
    # Check if email already exists
    existing = await db.users.find_one({"email": user_in.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user with hashed password
    user = User(
        email=user_in.email,
        name=user_in.name,
        hashed_password=hash_password(user_in.password)
    )
    
    # Store in database
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.users.insert_one(doc)
    
    # Generate token
    token = create_access_token(user.id)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            is_premium=user.is_premium,
            coins=user.coins,
            created_at=user.created_at
        )
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Login with email and password"""
    user_data = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(credentials.password, user_data['hashed_password']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if isinstance(user_data.get('created_at'), str):
        user_data['created_at'] = datetime.fromisoformat(user_data['created_at'])
    if isinstance(user_data.get('updated_at'), str):
        user_data['updated_at'] = datetime.fromisoformat(user_data['updated_at'])
    
    user = User(**user_data)
    token = create_access_token(user.id)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            is_premium=user.is_premium,
            coins=user.coins,
            created_at=user.created_at
        )
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        is_premium=current_user.is_premium,
        coins=current_user.coins,
        created_at=current_user.created_at
    )
