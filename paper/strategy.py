"""
Core + Satellite strategy — the agent-validated design.

  CORE      a broad buy-and-hold sleeve (e.g. world ETF), fixed weight. Tax-
            efficient, the compounding base for monthly contributions.
  SATELLITE the vol-targeted TREND engine across a few broad assets, scaled to
            a smaller weight. Adds drawdown protection + a modest return edge.

Returns a single combined target-weight dict over the asset universe, which the
portfolio then rebalances toward. Strategy is pure: prices in -> weights out.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import engine  # noqa: E402


def combined_weights(price_hist, cfg):
    """
    price_hist: {symbol: [prices oldest->newest]}
    cfg: the loaded config dict (see config.yaml)
    """
    weights = {}

    # --- core: fixed buy & hold ---
    core = cfg["core"]
    weights[core["symbol"]] = core["weight"]

    # --- satellite: trend engine, scaled ---
    sat = cfg["satellite"]
    sat_hist = {a: price_hist[a] for a in sat["assets"] if a in price_hist}
    eng_cfg = {
        "sma_window": sat["sma_window"],
        "vol_window": sat["vol_window"],
        "target_vol": sat["target_vol"],
        "weight_cap": sat["weight_cap"],
        "portfolio_leverage_cap": sat["portfolio_leverage_cap"],
        "periods_per_year": sat["periods_per_year"],
    }
    eng_w = engine.target_weights(sat_hist, eng_cfg)
    for a, w in eng_w.items():
        weights[a] = weights.get(a, 0.0) + w * sat["weight"]

    return weights
