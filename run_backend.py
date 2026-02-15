#!/usr/bin/env python3
"""Wrapper script to run the RentVsBuy backend server with correct Python path."""

import sys
import os
from pathlib import Path

# Add parent directory to Python path so RentVsBuy module can be found
parent_dir = str(Path(__file__).parent.parent)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# Now run uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "RentVsBuy.backend.api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
