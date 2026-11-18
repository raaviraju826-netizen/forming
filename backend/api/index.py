# Vercel FastAPI entry point
# Vercel looks for api/index.py relative to the backend root
from main import app

# Vercel needs the app object exposed at module level
__all__ = ["app"]
