import sys
import os

# Add root and backend to python path for Vercel serverless environment
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(root_dir, "backend")

if root_dir not in sys.path:
    sys.path.insert(0, root_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
from mangum import Mangum

# Wrap FastAPI app with Mangum adapter for Vercel Serverless execution
handler = Mangum(app, lifespan="off")
