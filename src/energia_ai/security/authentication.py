import structlog
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from supabase import create_client, Client

from energia_ai.config.settings import get_settings

logger = structlog.get_logger(__name__)
settings = get_settings()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

supabase: Client = create_client(settings.supabase_url, settings.supabase_anon_key)


class AuthenticationService:
    """Handles user authentication by verifying JWTs with Supabase."""

    async def get_current_user(self, token: str = Depends(oauth2_scheme)):
        """
        Verifies the JWT token and retrieves the user from Supabase.
        This function can be used as a dependency in FastAPI endpoints.
        """
        try:
            user = supabase.auth.get_user(token)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid user token",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            logger.info("User authenticated successfully.", user_id=user.user.id)
            return user.user
        except Exception as e:
            logger.error("Token verification failed.", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

# Singleton instance
auth_service = AuthenticationService() 