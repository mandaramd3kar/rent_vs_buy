# rent_vs_buy

Simple Rent vs Buy comparison prototype.

## Features

- **Mortgage Terms**: Compare scenarios with 10, 15, or 30-year mortgages
- **Investment Return Assumption**: Adjust the expected annual return (CAGR) for invested funds (2%-10% range)
- **Emotional Value Factor**: Include personal preference for homeownership on a 1-5 scale to influence the final recommendation
- **Comprehensive Analysis**: 
  - Opportunity cost: down payment + monthly savings are assumed invested in a fixed 60/40 portfolio
  - Backend: FastAPI endpoint at `/compare` (see [backend/api.py](backend/api.py))
  - Core math: [backend/model.py](backend/model.py) (amortization, future value, deterministic comparison)

## Run locally (requires Python 3.8+)

1. Create a venv and install dependencies:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

2. Run API server:

**Option A (Recommended):** Use the wrapper script from anywhere:
```bash
python run_backend.py
```

**Option B:** Run uvicorn from the parent directory:
```bash
cd ..
uvicorn rent_vs_buy.backend.api:app --reload --port 8000
```

3. Open `frontend/index.html` in a browser and use the `/compare` endpoint for results.
