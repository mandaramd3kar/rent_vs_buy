/**
 * rent_vs_buy Frontend App
 * Handles UI interactions, API calls, and result visualization
 */

// Configuration
const API_URL = 'http://localhost:8000';
let debounceTimer = null;
let chart = null;

// DOM Elements
const controls = {
  location: document.getElementById('location'),
  purchasePrice: document.getElementById('purchasePrice'),
  downPaymentPct: document.getElementById('downPaymentPct'),
  mortgageRate: document.getElementById('mortgageRate'),
  mortgageTerm: document.getElementById('mortgageTerm'),
  monthlyRent: document.getElementById('monthlyRent'),
  holdingYears: document.getElementById('holdingYears'),
  propertyTaxRate: document.getElementById('propertyTaxRate'),
  insuranceAnnual: document.getElementById('insuranceAnnual'),
  maintenancePct: document.getElementById('maintenancePct'),
  annualAppreciation: document.getElementById('annualAppreciation'),
  benchmarkReturn: document.getElementById('benchmarkReturn'),
  emotionalValue: document.getElementById('emotionalValue'),
};

const displays = {
  purchasePriceValue: document.getElementById('purchasePriceValue'),
  downPaymentPctValue: document.getElementById('downPaymentPctValue'),
  mortgageRateValue: document.getElementById('mortgageRateValue'),
  monthlyRentValue: document.getElementById('monthlyRentValue'),
  holdingYearsValue: document.getElementById('holdingYearsValue'),
  propertyTaxRateValue: document.getElementById('propertyTaxRateValue'),
  insuranceAnnualValue: document.getElementById('insuranceAnnualValue'),
  maintenancePctValue: document.getElementById('maintenancePctValue'),
  annualAppreciationValue: document.getElementById('annualAppreciationValue'),
  benchmarkReturnValue: document.getElementById('benchmarkReturnValue'),
  emotionalValueValue: document.getElementById('emotionalValueValue'),
};

const ui = {
  loadingIndicator: document.getElementById('loadingIndicator'),
  resultsPanel: document.getElementById('resultsPanel'),
  emptyState: document.getElementById('emptyState'),
  errorMessage: document.getElementById('errorMessage'),
  mortgageTermButtons: document.querySelectorAll('.btn-toggle'),
  btnAdvanced: document.getElementById('btnAdvanced'),
  advancedOptions: document.getElementById('advancedOptions'),
  btnDetailsModal: document.getElementById('btnDetailsModal'),
  amsModal: document.getElementById('assumptionsModal'),
  btnCloseModal: document.getElementById('btnCloseModal'),
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  updateAllDisplays();
  // Initial compute on load
  debounceCompute();
});

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  // Sliders
  Object.values(controls).forEach(ctrl => {
    if (ctrl && ctrl.type === 'range') {
      ctrl.addEventListener('input', (e) => {
        updateDisplay(e.target);
        debounceCompute();
      });
    }
  });

  // Text inputs
  controls.location && controls.location.addEventListener('change', debounceCompute);

  // Mortgage term buttons
  ui.mortgageTermButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      ui.mortgageTermButtons.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      controls.mortgageTerm.value = e.target.dataset.term;
      debounceCompute();
    });
  });

  // Advanced toggle
  ui.btnAdvanced.addEventListener('click', () => {
    const isHidden = ui.advancedOptions.style.display === 'none';
    ui.advancedOptions.style.display = isHidden ? 'block' : 'none';
    ui.btnAdvanced.classList.toggle('open');
  });

  // Modal
  ui.btnDetailsModal.addEventListener('click', () => {
    ui.amsModal.style.display = 'flex';
  });

  ui.btnCloseModal.addEventListener('click', () => {
    ui.amsModal.style.display = 'none';
  });

  ui.amsModal.addEventListener('click', (e) => {
    if (e.target === ui.amsModal) {
      ui.amsModal.style.display = 'none';
    }
  });
}

/**
 * Update a single value display
 */
function updateDisplay(element) {
  const displayId = element.id + 'Value';
  const displayEl = displays[displayId];
  if (!displayEl) return;

  if (element.type === 'range') {
    displayEl.textContent = element.value;
  }
}

/**
 * Update all value displays
 */
function updateAllDisplays() {
  Object.entries(controls).forEach(([key, ctrl]) => {
    if (ctrl && ctrl.type === 'range') {
      const displayKey = key + 'Value';
      if (displays[displayKey]) {
        displays[displayKey].textContent = ctrl.value;
      }
    }
  });
}

/**
 * Debounced compute to avoid excessive API calls
 */
function debounceCompute() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    computeComparison();
  }, 300); // 300ms delay
}

/**
 * Call API and render results
 */
async function computeComparison() {
  showLoading();

  try {
    const inputs = {
      purchase_price: parseFloat(controls.purchasePrice.value),
      down_payment_pct: parseFloat(controls.downPaymentPct.value) / 100,
      mortgage_rate: parseFloat(controls.mortgageRate.value) / 100,
      mortgage_term_years: parseInt(controls.mortgageTerm.value),
      monthly_rent: parseFloat(controls.monthlyRent.value),
      holding_years: parseFloat(controls.holdingYears.value),
      property_tax_rate: parseFloat(controls.propertyTaxRate.value) / 100,
      insurance_annual: parseFloat(controls.insuranceAnnual.value),
      maintenance_pct: parseFloat(controls.maintenancePct.value) / 100,
      annual_appreciation: parseFloat(controls.annualAppreciation.value) / 100,
    };

    const assumptions = {
      benchmark_return: parseFloat(controls.benchmarkReturn.value) / 100,
    };

    const response = await fetch(`${API_URL}/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs, assumptions }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    renderResults(result);
  } catch (error) {
    showError(error.message);
  }
}

/**
 * Render results into the UI
 */
function renderResults(result) {
  const buyer = result.buyer;
  const renter = result.renter;
  const summary = result.summary;
  const years = parseFloat(controls.holdingYears.value);
  const emotionalValue = parseInt(controls.emotionalValue.value);

  // Update placeholder text
  document.getElementById('buyerYearsLabel').textContent = `(After ${years} year${years !== 1 ? 's' : ''})`;
  document.getElementById('renterYearsLabel').textContent = `(After ${years} year${years !== 1 ? 's' : ''})`;

  // Summary cards
  document.getElementById('buyerEquity').textContent = formatCurrency(buyer.buyer_net_proceeds);
  document.getElementById('renterPortfolio').textContent = formatCurrency(renter.fv_total);

  // Verdict - factoring in emotional value
  const delta = summary.delta_renter_minus_buyer;
  const verdict = document.getElementById('verdict');
  const verdictDetail = document.getElementById('verdictDetail');

  // Emotional value adjustment: higher emotional value slightly favors buying
  const emotionalAdjustment = (emotionalValue - 3) * 5000; // Each point adjusts by $5K
  const adjustedDelta = delta - emotionalAdjustment;

  if (Math.abs(adjustedDelta) < 1000) {
    verdict.textContent = 'About Even';
    let detail = 'Both strategies result in similar wealth outcomes.';
    if (emotionalValue >= 4) {
      detail += ' Your preference for homeownership slightly favors buying.';
    } else if (emotionalValue <= 2) {
      detail += ' Your preference for flexibility favors renting & investing.';
    }
    verdictDetail.textContent = detail;
  } else if (adjustedDelta < 0) {
    // Negative delta means buyer is ahead (renter has less)
    verdict.textContent = 'Buying Wins';
    const advantage = formatCurrency(-delta);
    let detail = `Buying is ahead by ${advantage}`;
    if (emotionalValue >= 4) {
      detail += ' + you value homeownership.';
    }
    verdictDetail.textContent = detail;
  } else {
    // Positive delta means renter is ahead (renter has more)
    verdict.textContent = 'Renting + Investing Wins';
    const advantage = formatCurrency(delta);
    let detail = `Renting & investing is ahead by ${advantage}`;
    if (emotionalValue >= 4) {
      detail += ', but you value homeownership.';
    }
    verdictDetail.textContent = detail;
  }

  // Breakdown
  document.getElementById('buyerBreakdown').innerHTML = `
    <li><span>Purchase Price:</span> <strong>${formatCurrency(buyer.purchase_price)}</strong></li>
    <li><span>Down Payment:</span> <strong>${formatCurrency(buyer.down_payment)}</strong></li>
    <li><span>Sale Price (after ${years}y):</span> <strong>${formatCurrency(buyer.sale_price)}</strong></li>
    <li><span>Selling Costs:</span> <strong>${formatCurrency(buyer.selling_costs)}</strong></li>
    <li><span>Remaining Mortgage:</span> <strong>${formatCurrency(buyer.remaining_mortgage_balance_at_sale)}</strong></li>
    <li style="border-top: 1px solid #e5e7eb; margin-top: 8px; padding-top: 8px;"><span>Net Equity:</span> <strong style="color: #667eea;">${formatCurrency(buyer.buyer_net_proceeds)}</strong></li>
  `;

  document.getElementById('renterBreakdown').innerHTML = `
    <li><span>Initial Investment (Down Payment):</span> <strong>${formatCurrency(renter.down_payment_invested)}</strong></li>
    <li><span>Monthly Contribution (Avg):</span> <strong>${formatCurrency(summary.monthly_avg_owning_cost > summary.monthly_rent ? renter.monthly_contrib : 0)}/mo</strong></li>
    <li><span>FV of Principal:</span> <strong>${formatCurrency(renter.fv_principal)}</strong></li>
    <li><span>FV of Monthly Contributions:</span> <strong>${formatCurrency(renter.fv_contrib)}</strong></li>
    <li style="border-top: 1px solid #e5e7eb; margin-top: 8px; padding-top: 8px;"><span>Total Portfolio Value:</span> <strong style="color: #667eea;">${formatCurrency(renter.fv_total)}</strong></li>
  `;

  // Monthly comparison
  document.getElementById('compRent').textContent = formatCurrency(summary.monthly_rent) + '/mo';
  document.getElementById('compOwning').textContent = formatCurrency(summary.monthly_avg_owning_cost) + '/mo';
  const diff = summary.monthly_avg_owning_cost - summary.monthly_rent;
  const diffText = diff > 0 ? `${formatCurrency(diff)} more` : `${formatCurrency(-diff)} less`;
  document.getElementById('compDifference').textContent = diffText;

  // Render chart
  renderCashflowChart(buyer, renter, years);

  // Show results
  ui.emptyState.style.display = 'none';
  ui.resultsPanel.style.display = 'block';
  ui.errorMessage.style.display = 'none';
  ui.loadingIndicator.style.display = 'none';
}

/**
 * Render cashflow comparison chart
 */
function renderCashflowChart(buyer, renter, holdingYears) {
  const ctx = document.getElementById('cashflowChart').getContext('2d');
  
  // Generate data points for each year
  const years = [];
  const buyerValues = [];
  const renterValues = [];

  for (let y = 0; y <= holdingYears; y += holdingYears / 10) {
    const yr = Math.floor(y);
    years.push(yr);

    // Estimate buyer equity progression
    // Equity = Sale Price - Selling Costs - Remaining Mortgage Balance
    const homeAppreciation = buyer.annual_appreciation || 0.03; // Default to 3% if not provided
    const estSalePrice = buyer.purchase_price * Math.pow(1 + homeAppreciation, yr);
    const estSellingCosts = estSalePrice * 0.06;
    
    // Estimate remaining mortgage balance (simplified: linear paydown if not at sale month)
    const totalMonthsForMortgage = Math.abs(buyer.mortgage_principal) < 0.01 ? 0 : 360; // Assume 30-year default
    const monthsElapsed = yr * 12;
    const principalPaydownPct = Math.min(1, monthsElapsed / totalMonthsForMortgage);
    const estRemainingBalance = buyer.mortgage_principal * (1 - principalPaydownPct);
    
    const estBuyerEquity = estSalePrice - estSellingCosts - estRemainingBalance;
    buyerValues.push(Math.max(0, estBuyerEquity)); // Allow equity to go negative conceptually, but show 0 minimum

    // Estimate renter portfolio (using the benchmark return from controls)
    const benchmarkReturn = parseFloat(controls.benchmarkReturn.value) / 100;
    const monthlyReturn = benchmarkReturn / 12;
    const months = yr * 12;
    const principalFv = renter.down_payment_invested * Math.pow(1 + monthlyReturn, months);
    const monthlyContrib = renter.monthly_contrib;
    let contribFv = 0;
    if (monthlyContrib !== 0 && monthlyReturn !== 0) {
      contribFv = monthlyContrib * (Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn;
    }
    renterValues.push(principalFv + contribFv);
  }

  // Destroy existing chart if it exists
  if (chart) {
    chart.destroy();
  }

  // Create new chart
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: years.map(y => `Year ${y}`),
      datasets: [
        {
          label: 'Buyer Equity',
          data: buyerValues,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.05)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: '#667eea',
          pointBorderColor: 'white',
          pointBorderWidth: 2,
        },
        {
          label: 'Renter Portfolio',
          data: renterValues,
          borderColor: '#764ba2',
          backgroundColor: 'rgba(118, 75, 162, 0.05)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: '#764ba2',
          pointBorderColor: 'white',
          pointBorderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: {
            font: { size: 12, weight: 600 },
            color: '#333',
            padding: 15,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '$' + (value / 1000).toFixed(0) + 'K';
            },
          },
        },
      },
    },
  });
}

/**
 * Format currency
 */
function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Show loading state
 */
function showLoading() {
  ui.loadingIndicator.style.display = 'flex';
  ui.resultsPanel.style.display = 'none';
  ui.emptyState.style.display = 'none';
  ui.errorMessage.style.display = 'none';
}

/**
 * Show error message
 */
function showError(message) {
  ui.errorMessage.textContent = `Error: ${message}`;
  ui.errorMessage.style.display = 'block';
  ui.resultsPanel.style.display = 'none';
  ui.loadingIndicator.style.display = 'none';
}
