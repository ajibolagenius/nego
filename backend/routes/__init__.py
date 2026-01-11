# Routes package
from .talent import router as talent_router
from .auth import router as auth_router
from .content import router as content_router

__all__ = ["talent_router", "auth_router", "content_router"]
