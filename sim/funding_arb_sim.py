"""
Delta-neutral funding-rate arbitrage — Monte Carlo profitability simulation.

Strategy under test
-------------------
Hold LONG spot + SHORT perpetual of the same asset (e.g. BTC). Position is
market-neutral: PnL from price moves cancels. Profit = funding collected by the
short leg, minus trading fees and minus losses during funding-negative periods
(when we either pay funding or rotate out).

Goal: estimate, for a EUR 500-1,000 account, the *net* annual profit, the spread
of outcomes (variance), max drawdown, and probability of losing money.

All assumptions are documented inline and grounded in published 2023-2026
funding-rate statistics (TheBlock / CoinGlass / Buildix / ArbitrageGhost):
  - BTC/ETH baseline funding ~0.01%/8h (~11% APR), range 0.01-0.05%/8h in
    bull regimes, negative in selloffs.
  - Realistic delta-neutral realized yield 10-30% APR before the EUR-account
    capital-efficiency haircut.
"""

import numpy as np

# ----------------------------------------------------------------------------
# ASSUMPTIONS (edit these to stress-test)
# ----------------------------------------------------------------------------
CAPITAL_EUR        = 1000.0     # total account size
N_PATHS            = 6000      # Monte Carlo simulations (one simulated year each)
PERIODS_PER_DAY    = 3          # funding settled every 8h
DAYS               = 365
PERIODS            = DAYS * PERIODS_PER_DAY

# Capital efficiency: with EUR 1k you can't run EUR 1k of *hedged notional*.
# Spot leg ties up cash; perp short needs margin. With portfolio/cross margin
# where spot counts as collateral you get ~0.85x; naive isolated setup ~0.50x.
NOTIONAL_FRACTION  = 0.80       # effective hedged notional / capital

# Funding process: mean-reverting (Ornstein-Uhlenbeck) per-8h rate.
# Mean 0.01% per 8h, reverting, with vol that produces realistic excursions
# (both the 0.05% bull spikes and negative selloff periods).
FUND_MEAN_8H       = 0.0001     # 0.01% per 8h  -> ~10.95% APR long-run mean
FUND_REVERSION     = 0.04       # per-period pull back toward mean
FUND_VOL_8H        = 0.00012    # per-period shock stdev (calibrated to range)
FUND_START_8H      = 0.0001

# Trading costs. Round-trip = open+close, BOTH legs (spot + perp).
# Spot taker ~0.10%, perp taker ~0.05% per side -> ~0.30% round trip on notional.
ROUND_TRIP_FEE     = 0.0030

# Rotation / risk rule: if the *recent* funding turns persistently negative,
# we exit the position (avoid paying funding) and sit in cash until it recovers.
# This costs a round trip each time we flip in/out. We model a rolling estimate.
NEG_EXIT_LOOKBACK  = 6          # ~2 days of 8h periods
NEG_EXIT_THRESHOLD = -0.00002   # exit if avg recent funding below this
REENTRY_THRESHOLD  =  0.00004   # re-enter once funding recovers above this

# Tail risk: rare adverse events that aren't pure funding — exchange
# de-pegs, liquidation slippage on the short during a violent spike,
# stablecoin wobble. Modeled as occasional small negative shocks.
TAIL_PROB_PER_DAY  = 0.002      # ~0.7 events/yr on average
TAIL_LOSS_MEAN     = 0.004      # 0.4% of notional when it happens
TAIL_LOSS_STD      = 0.003

RNG = np.random.default_rng(42)


def simulate_one_year():
    notional = CAPITAL_EUR * NOTIONAL_FRACTION
    f = FUND_START_8H
    in_position = True
    equity = CAPITAL_EUR
    peak = equity
    max_dd = 0.0
    fees_paid = 0.0
    funding_collected = 0.0
    tail_losses = 0.0
    recent = [f]
    # pay an initial entry round trip
    entry_cost = notional * ROUND_TRIP_FEE
    equity -= entry_cost
    fees_paid += entry_cost

    for t in range(PERIODS):
        # evolve funding (OU process)
        shock = RNG.normal(0.0, FUND_VOL_8H)
        f = f + FUND_REVERSION * (FUND_MEAN_8H - f) + shock
        recent.append(f)
        if len(recent) > NEG_EXIT_LOOKBACK:
            recent.pop(0)
        avg_recent = np.mean(recent)

        # risk rule: flip in/out of position
        if in_position and avg_recent < NEG_EXIT_THRESHOLD:
            in_position = False
            c = notional * ROUND_TRIP_FEE
            equity -= c
            fees_paid += c
        elif (not in_position) and avg_recent > REENTRY_THRESHOLD:
            in_position = True
            c = notional * ROUND_TRIP_FEE
            equity -= c
            fees_paid += c

        # collect (or pay) funding when in position
        if in_position:
            pnl = notional * f          # short receives positive funding
            equity += pnl
            funding_collected += pnl

        # tail event
        if RNG.random() < TAIL_PROB_PER_DAY / PERIODS_PER_DAY:
            loss = notional * abs(RNG.normal(TAIL_LOSS_MEAN, TAIL_LOSS_STD))
            equity -= loss
            tail_losses += loss

        # drawdown tracking
        peak = max(peak, equity)
        dd = (peak - equity) / peak
        max_dd = max(max_dd, dd)

    net_profit = equity - CAPITAL_EUR
    return {
        "net_profit": net_profit,
        "apr": net_profit / CAPITAL_EUR,
        "max_dd": max_dd,
        "fees": fees_paid,
        "funding": funding_collected,
        "tail": tail_losses,
    }


def main():
    results = [simulate_one_year() for _ in range(N_PATHS)]
    apr = np.array([r["apr"] for r in results])
    profit = np.array([r["net_profit"] for r in results])
    dd = np.array([r["max_dd"] for r in results])
    fees = np.array([r["fees"] for r in results])
    funding = np.array([r["funding"] for r in results])

    def pct(a, p): return np.percentile(a, p)

    print(f"=== Delta-neutral funding arb — {N_PATHS} simulated years ===")
    print(f"Account: EUR {CAPITAL_EUR:.0f} | hedged notional: EUR {CAPITAL_EUR*NOTIONAL_FRACTION:.0f} "
          f"({NOTIONAL_FRACTION:.0%} of capital)\n")
    print(f"Net annual profit (EUR):")
    print(f"   p5  : {pct(profit,5):8.2f}")
    print(f"   p25 : {pct(profit,25):8.2f}")
    print(f"   p50 : {pct(profit,50):8.2f}   <- median")
    print(f"   p75 : {pct(profit,75):8.2f}")
    print(f"   p95 : {pct(profit,95):8.2f}")
    print(f"\nNet APR on capital:")
    print(f"   p5  : {pct(apr,5)*100:6.2f}%")
    print(f"   p50 : {pct(apr,50)*100:6.2f}%   <- median")
    print(f"   p95 : {pct(apr,95)*100:6.2f}%")
    print(f"   mean: {apr.mean()*100:6.2f}%")
    print(f"\nProbability of LOSING money over the year: {(profit<0).mean()*100:.1f}%")
    print(f"Worst-case (p1) loss: EUR {pct(profit,1):.2f}")
    print(f"Max drawdown (median): {pct(dd,50)*100:.2f}%   (p95: {pct(dd,95)*100:.2f}%)")
    print(f"\nMechanics (median path):")
    print(f"   gross funding collected: EUR {pct(funding,50):.2f}")
    print(f"   fees paid              : EUR {pct(fees,50):.2f}")


if __name__ == "__main__":
    main()
