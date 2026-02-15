import math
from rent_vs_buy.backend.model import compute_future_value, amortization_schedule, compare_buy_vs_rent_with_investment


def test_compute_future_value_zero_return():
    r = compute_future_value(1000.0, 100.0, 0.0, 1.0)
    assert math.isclose(r['fv_principal'], 1000.0, rel_tol=1e-9)
    assert math.isclose(r['fv_contrib'], 1200.0, rel_tol=1e-9)


def test_amortization_schedule_zero_rate():
    sched = amortization_schedule(1200.0, 0.0, 1)
    # 12 months, payment 100
    assert len(sched) == 12
    assert math.isclose(sched[0]['payment'], 100.0, rel_tol=1e-9)


def test_compare_basic_case():
    inputs = {
        'purchase_price': 300000.0,
        'down_payment_pct': 0.2,
        'mortgage_rate': 0.04,
        'mortgage_term_years': 30,
        'monthly_rent': 1800.0,
        'holding_years': 7.0,
    }
    result = compare_buy_vs_rent_with_investment(inputs, {'benchmark_return': 0.055})
    assert 'buyer' in result and 'renter' in result and 'summary' in result
