#!/usr/bin/env python
"""Quick manual test of the rent_vs_buy model."""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.model import compare_buy_vs_rent_with_investment
import json
import time

# Simple test case: $300k house, 20% down, 4% mortgage, 30yr, $1800/month rent, 7-year hold
test_inputs = {
    'purchase_price': 300000.0,
    'down_payment_pct': 0.2,
    'mortgage_rate': 0.04,
    'mortgage_term_years': 30,
    'monthly_rent': 1800.0,
    'holding_years': 7.0,
    'property_tax_rate': 0.012,
    'insurance_annual': 1200.0,
    'maintenance_pct': 0.01,
    'hoa_monthly': 0.0,
    'closing_cost_pct': 0.03,
    'selling_cost_pct': 0.06,
    'annual_appreciation': 0.03,
    'income_tax_rate': 0.22,
}

assumptions = {'benchmark_return': 0.055}

print("Running rent_vs_buy comparison...")
print(f"Inputs: {json.dumps(test_inputs, indent=2)}")
print()

start = time.time()
result = compare_buy_vs_rent_with_investment(test_inputs, assumptions)
elapsed = time.time() - start

print(f"Computed in {elapsed:.3f} seconds")
print()
print("Result:")
print(json.dumps(result, indent=2, default=str))
print()
print("Summary:")
print(f"  Buyer net proceeds at sale: ${result['buyer']['buyer_net_proceeds']:,.2f}")
print(f"  Renter portfolio value:     ${result['renter']['fv_total']:,.2f}")
print(f"  Difference (renter - buyer): ${result['summary']['delta_renter_minus_buyer']:,.2f}")
if result['summary']['delta_renter_minus_buyer'] > 0:
    print(f"  → Renting + investing is ahead by ${result['summary']['delta_renter_minus_buyer']:,.2f}")
else:
    print(f"  → Buying is ahead by ${-result['summary']['delta_renter_minus_buyer']:,.2f}")
