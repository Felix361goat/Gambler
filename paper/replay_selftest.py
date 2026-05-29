#!/usr/bin/env python3
"""
Replay self-test — drives the FULL harness (strategy + portfolio + store +
broker) forward month-by-month over real historical data, exactly as it would
run live, and reports the resulting equity curve.

This validates the plumbing end-to-end in the sandbox (no live data needed) and
confirms the Core+Satellite portfolio behaves sensibly: it should track equities
but with a clearly smaller drawdown.
"""
import math
import os
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import yaml                       # noqa: E402
import strategy                   # noqa: E402
from providers import CSVProvider  # noqa: E402
from store import Store           # noqa: E402
from broker import PaperBroker    # noqa: E402
from portfolio import Portfolio   # noqa: E402


def stats(curve):
    vals = [e for _, e in curve]
    rs = [vals[i]/vals[i-1]-1 for i in range(1, len(vals))]
    yrs = len(rs)/12
    cagr = (vals[-1]/vals[0])**(1/yrs)-1
    peak, mdd = vals[0], 0.0
    for v in vals:
        peak = max(peak, v); mdd = max(mdd, (peak-v)/peak)
    return cagr, mdd, vals[-1]/vals[0]


def run():
    cfg = yaml.safe_load(open(os.path.join(HERE, "config.yaml")))
    prov = CSVProvider()
    syms = sorted({cfg["core"]["symbol"], *cfg["satellite"]["assets"]})
    dates = prov.all_dates(syms)
    warmup = max(cfg["satellite"]["sma_window"], cfg["satellite"]["vol_window"]) + 2
    dates = dates[warmup:]

    with tempfile.TemporaryDirectory() as d:
        store = Store(os.path.join(d, "replay.db"), start_cash=cfg["start_equity"])
        pf = Portfolio(store, PaperBroker(store, cfg["cost_bps"]))
        for dt in dates:
            hist = prov.history(syms, upto=dt)
            price_hist = {s: [p for _, p in hist[s]] for s in syms}
            prices = {s: hist[s][-1][1] for s in syms}
            weights = strategy.combined_weights(price_hist, cfg)
            pf.rebalance(dt, weights, prices)
        curve = store.equity_curve()

    # benchmark: 100% equities buy & hold over the same window
    eq_series = dict(prov.history(["equities"])["equities"])
    bench = [(dt, eq_series[dt]) for dt in dates]
    bench = [(d, cfg["start_equity"] * p / bench[0][1]) for d, p in bench]

    c1, dd1, m1 = stats(curve)
    c2, dd2, m2 = stats(bench)
    print(f"Replay window: {dates[0]} .. {dates[-1]}  ({len(dates)} months)\n")
    print(f"{'strategy':<26}{'CAGR':>8}{'maxDD':>8}{'x money':>9}")
    print("-" * 51)
    print(f"{'Core+Satellite (harness)':<26}{c1*100:7.2f}%{dd1*100:7.1f}%{m1:8.1f}x")
    print(f"{'100% equities buy&hold':<26}{c2*100:7.2f}%{dd2*100:7.1f}%{m2:8.1f}x")
    print(f"\nFinal equity: €{curve[-1][1]:,.0f}  (started €{cfg['start_equity']:,.0f})")
    print("\nValidation: harness ran end-to-end forward (strategy->portfolio->"
          "store->broker).\nExpect lower drawdown than 100% equities — that's the "
          "satellite working.")


if __name__ == "__main__":
    run()
