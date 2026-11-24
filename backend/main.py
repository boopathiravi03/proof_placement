"""
ProofHire 2.0 FastAPI Application Entrypoint.
Delegates to the modular application structure in `backend.app.main:app`.
"""
import sys
import os

# Ensure current and parent directories are in pythonpath
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from backend.app.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
