"""Core model functions for Rent vs Buy comparisons.

This module implements deterministic future-value math, mortgage amortization,
and a comparison function that factors opportunity cost (down payment + monthly
surplus invested into a fixed benchmark).
"""
from typing import Dict, List
import math


def compute_future_value(principal: float, monthly_contrib: float, annual_return: float, years: float) -> Dict[str, float]:
    """Compute future value of an initial principal and level monthly contributions.

    Monthly compounding is assumed. Returns fv_principal, fv_contrib, fv_total.
    """
    n = int(round(max(0.0, years) * 12))
    r = float(annual_return)
    if n == 0:
        return {"fv_principal": float(principal), "fv_contrib": 0.0, "fv_total": float(principal)}
    monthly_r = r / 12.0
    if abs(monthly_r) < 1e-12:
        fv_principal = float(principal)
        fv_contrib = float(monthly_contrib) * n
    else:
        fv_principal = float(principal) * ((1 + monthly_r) ** n)
        fv_contrib = float(monthly_contrib) * (((1 + monthly_r) ** n - 1) / monthly_r)
    return {"fv_principal": fv_principal, "fv_contrib": fv_contrib, "fv_total": fv_principal + fv_contrib}


def amortization_schedule(principal: float, annual_rate: float, term_years: int) -> List[Dict[str, float]]:
    """Return amortization schedule as list of monthly rows.

    Each row: {month, payment, interest, principal, balance}.
    """
    months = int(term_years * 12)
    schedule: List[Dict[str, float]] = []
    if months <= 0:
        return schedule
    monthly_r = float(annual_rate) / 12.0
    if abs(monthly_r) < 1e-12:
        payment = float(principal) / months
    else:
        payment = float(principal) * (monthly_r) / (1 - (1 + monthly_r) ** (-months))
    balance = float(principal)
    for m in range(1, months + 1):
        interest = balance * monthly_r
        principal_paid = payment - interest
        balance = max(0.0, balance - principal_paid)
        schedule.append({
            "month": m,
            "payment": payment,
            "interest": interest,
            "principal": principal_paid,
            "balance": balance,
        })
    return schedule


def compare_buy_vs_rent_with_investment(inputs: Dict, assumptions: Dict = None) -> Dict:
    """Compare buy vs rent factoring opportunity cost.

    Inputs (expected keys):
      - purchase_price
      - down_payment_pct (0..1) OR down_payment (absolute)
      - mortgage_rate (annual decimal)
      - mortgage_term_years (int)
      - monthly_rent
      - holding_years
      - property_tax_rate (annual decimal of purchase price)
      - insurance_annual (absolute) OR insurance_monthly
      - maintenance_pct (annual decimal of purchase price)
      - hoa_monthly
      - closing_cost_pct (purchase-time)
      - selling_cost_pct (sale-time)
      - annual_appreciation (decimal)
      - income_tax_rate (decimal)
      - mortgage_interest_tax_deductible (bool)

    Assumptions (optional):
      - benchmark_return (annual decimal). Default: 0.055 (60/40).

    Returns a dict with buyer and renter result summary and assumptions echoed.
    """
    inputs = dict(inputs or {})
    assumptions = dict(assumptions or {})
    benchmark_return = float(assumptions.get("benchmark_return", 0.055))

    purchase_price = float(inputs.get("purchase_price", 0.0))
    down_payment_pct = inputs.get("down_payment_pct")
    down_payment = float(inputs.get("down_payment")) if inputs.get("down_payment") is not None else None
    if down_payment is None:
        down_payment = float(purchase_price * float(down_payment_pct or 0.2))
    mortgage_rate = float(inputs.get("mortgage_rate", 0.04))
    mortgage_term_years = int(inputs.get("mortgage_term_years", 30))
    monthly_rent = float(inputs.get("monthly_rent", 0.0))
    holding_years = float(inputs.get("holding_years", 7.0))
    property_tax_rate = float(inputs.get("property_tax_rate", 0.012))
    insurance_annual = float(inputs.get("insurance_annual", 1200.0))
    maintenance_pct = float(inputs.get("maintenance_pct", 0.01))
    hoa_monthly = float(inputs.get("hoa_monthly", 0.0))
    closing_cost_pct = float(inputs.get("closing_cost_pct", 0.03))
    selling_cost_pct = float(inputs.get("selling_cost_pct", 0.06))
    annual_appreciation = float(inputs.get("annual_appreciation", 0.03))
    income_tax_rate = float(inputs.get("income_tax_rate", 0.22))
    mortgage_interest_tax_deductible = bool(inputs.get("mortgage_interest_tax_deductible", True))

    down_payment_investable = down_payment
    principal = max(0.0, purchase_price - down_payment)

    # Amortization schedule and values at sale
    schedule = amortization_schedule(principal, mortgage_rate, mortgage_term_years)
    total_months = int(mortgage_term_years * 12)
    sale_month = int(round(max(0.0, holding_years) * 12))
    sale_month = min(sale_month, total_months)

    remaining_balance = schedule[sale_month - 1]["balance"] if sale_month > 0 and len(schedule) >= sale_month else 0.0

    # compute aggregated monthly owning outflows over holding period
    monthly_property_tax = (property_tax_rate * purchase_price) / 12.0
    monthly_insurance = insurance_annual / 12.0
    monthly_maintenance = (maintenance_pct * purchase_price) / 12.0
    monthly_hoa = hoa_monthly

    # Sum owning outflows for each month in holding period
    owning_outflow_total = 0.0
    interest_paid_total = 0.0
    for m in range(1, sale_month + 1):
        row = schedule[m - 1]
        monthly_payment = row["payment"]
        interest_paid = row["interest"]
        interest_paid_total += interest_paid
        tax_benefit = (interest_paid * income_tax_rate) if mortgage_interest_tax_deductible else 0.0
        monthly_net_out = monthly_payment + monthly_property_tax + monthly_insurance + monthly_maintenance + monthly_hoa - tax_benefit
        owning_outflow_total += monthly_net_out

    avg_monthly_owning = owning_outflow_total / sale_month if sale_month > 0 else 0.0

    # monthly contribution a renter could invest (positive => renter saves and invests)
    monthly_contrib = avg_monthly_owning - monthly_rent

    # Future value of investable funds for renter
    fv = compute_future_value(down_payment_investable, monthly_contrib, benchmark_return, holding_years)

    # Sale price and buyer net proceeds
    sale_price = purchase_price * ((1 + annual_appreciation) ** holding_years)
    selling_costs = sale_price * selling_cost_pct
    buyer_net_proceeds = sale_price - selling_costs - remaining_balance

    result = {
        "assumptions": {
            "benchmark_return": benchmark_return,
            "annual_appreciation": annual_appreciation,
            "mortgage_rate": mortgage_rate,
            "mortgage_term_years": mortgage_term_years,
        },
        "buyer": {
            "purchase_price": purchase_price,
            "down_payment": down_payment,
            "mortgage_principal": principal,
            "remaining_mortgage_balance_at_sale": remaining_balance,
            "sale_price": sale_price,
            "selling_costs": selling_costs,
            "buyer_net_proceeds": buyer_net_proceeds,
        },
        "renter": {
            "down_payment_invested": down_payment_investable,
            "monthly_contrib": monthly_contrib,
            "fv_principal": fv["fv_principal"],
            "fv_contrib": fv["fv_contrib"],
            "fv_total": fv["fv_total"],
        },
        "summary": {
            "delta_renter_minus_buyer": fv["fv_total"] - buyer_net_proceeds,
            "monthly_avg_owning_cost": avg_monthly_owning,
            "monthly_rent": monthly_rent,
        },
    }
    return result
