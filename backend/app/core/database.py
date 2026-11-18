"""
KisanAI Database Configuration - Async SQLAlchemy
Supports both SQLite (development, default) and PostgreSQL (production)
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

# Detect DB type for engine kwargs
_is_sqlite = settings.ASYNC_DATABASE_URL.startswith("sqlite")

engine = create_async_engine(
    settings.ASYNC_DATABASE_URL,
    echo=settings.DEBUG,
    # SQLite-specific: allow use across threads
    connect_args={"check_same_thread": False} if _is_sqlite else {},
    # PostgreSQL-specific: pool settings (not valid for SQLite)
    **({} if _is_sqlite else {"pool_pre_ping": True, "pool_recycle": 300}),
)

# Session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    """Dependency to get database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
