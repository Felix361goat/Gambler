"""
THE FULL JOURNEY: from EUR 0 to serious capital — honestly.

Phase 1  Matched betting harvests a one-off seed (near risk-free bonus money).
Phase 2  That seed (+ your own capital + optional monthly savings) is invested
         in the systematic wealth engine (diversified trend-following with a
         funding-arb yield base) and COMPOUNDS for years.

We Monte-Carlo the investing phase with random ANNUAL returns (not a smooth
line — real investing is lumpy) and compare against just buying an ETF. Returns
are net of Austrian 27.5% capital-gains tax applied to gains at the horizon.

Assumptions are grounded in the backtests in this folder:
  - ETF (S&P-like):      ~8% mean,  ~15% vol
  - Wealth engine:       ~15% mean, ~18% vol   (trend ~17% lev. + arb base,
                                                haircut for costs/slippage)
All editable below.
"""
import numpy as np

RNG = np.random.default_rng(11)
N_PATHS = 50000
TAX = 0.275                       # Austrian KESt on capital gains

# Phase 1 — matched betting seed (net of qualifying losses & commission)
MB_SEED = 1200.0                  # realistic harvest from AT welcome offers
OWN_CAPITAL = 800.0               # what you said you'd add (500-1000)
MONTHLY_SAVE = 150.0              # optional ongoing contribution (set 0 for none)

# Phase 2 — annual return profiles (mean, stdev)
ENGINE = (0.15, 0.18)
ETF    = (0.08, 0.15)

HORIZONS = [5, 10, 20]


def project(mean, vol, years, start, monthly):
    """One Monte-Carlo path: annual random returns, monthly contributions."""
    bal = start
    contributed = start
    for _ in range(years):
        # add the year's contributions, then apply that year's market return
        bal += monthly * 12
        contributed += monthly * 12
        r = RNG.normal(mean, vol)
        bal *= (1 + r)
        bal = max(bal, 0.0)        # can't go below zero
    gain = max(bal - contributed, 0.0)
    after_tax = bal - gain * TAX
    return after_tax, contributed


def run(label, profile):
    start = MB_SEED + OWN_CAPITAL
    print(f"\n=== {label} ===  (seed €{start:.0f} = €{MB_SEED:.0f} matched-bet "
          f"+ €{OWN_CAPITAL:.0f} own, +€{MONTHLY_SAVE:.0f}/mo)")
    for y in HORIZONS:
        ends = np.array([project(*profile, y, start, MONTHLY_SAVE)[0]
                         for _ in range(N_PATHS)])
        contributed = start + MONTHLY_SAVE * 12 * y
        p5, p50, p95 = np.percentile(ends, [5, 50, 95])
        print(f"  {y:>2}y | total paid in €{contributed:>7.0f} | "
              f"after-tax  p5 €{p5:>8.0f}  median €{p50:>8.0f}  p95 €{p95:>9.0f}")


def main():
    print("Phase 1 (matched betting) seeds the account, Phase 2 compounds it.\n"
          "Figures are AFTER 27.5% Austrian capital-gains tax on profits.")
    run("WEALTH ENGINE (trend + arb)", ENGINE)
    run("Just an ETF (benchmark)", ETF)
    print("\nReality notes:")
    print("  - These are RANGES, not promises. The p5 column is the bad-luck case.")
    print("  - The engine path includes 20-35% drawdowns along the way.")
    print("  - The gap vs ETF is the reward for tolerating that bumpier ride +")
    print("    the leverage/edge — and only materialises IF the edge holds.")


if __name__ == "__main__":
    main()
