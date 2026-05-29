"""Run the funding-arb sim across conservative / base / aggressive regimes."""
import numpy as np
import funding_arb_sim as S

def run(label, **overrides):
    for k, v in overrides.items():
        setattr(S, k, v)
    S.PERIODS = S.DAYS * S.PERIODS_PER_DAY
    res = [S.simulate_one_year() for _ in range(S.N_PATHS)]
    profit = np.array([r["net_profit"] for r in res])
    apr = np.array([r["apr"] for r in res])
    dd = np.array([r["max_dd"] for r in res])
    print(f"\n=== {label} ===")
    print(f"  median profit: EUR {np.percentile(profit,50):7.2f}  "
          f"(p5 {np.percentile(profit,5):6.2f} / p95 {np.percentile(profit,95):6.2f})")
    print(f"  median APR   : {np.percentile(apr,50)*100:6.2f}%   mean {apr.mean()*100:.2f}%")
    print(f"  P(lose money): {(profit<0).mean()*100:4.1f}%   median maxDD {np.percentile(dd,50)*100:.2f}%")

# Conservative: BTC/ETH only, isolated margin (0.5x notional), lower mean funding
run("CONSERVATIVE  (BTC/ETH, 0.5x notional, low funding)",
    NOTIONAL_FRACTION=0.50, FUND_MEAN_8H=0.00008, FUND_VOL_8H=0.00010,
    TAIL_PROB_PER_DAY=0.001)

# Base: portfolio margin 0.8x (re-assert defaults)
run("BASE          (portfolio margin 0.8x, baseline funding)",
    NOTIONAL_FRACTION=0.80, FUND_MEAN_8H=0.0001, FUND_VOL_8H=0.00012,
    TAIL_PROB_PER_DAY=0.002)

# Aggressive: rotate into high-funding alts. Higher mean yield BUT higher vol,
# more negative excursions, and fatter tails (de-pegs, liquidations).
run("AGGRESSIVE     (alt rotation, high funding, fat tails)",
    NOTIONAL_FRACTION=0.85, FUND_MEAN_8H=0.00022, FUND_VOL_8H=0.00035,
    TAIL_PROB_PER_DAY=0.010, TAIL_LOSS_MEAN=0.010, TAIL_LOSS_STD=0.008)
