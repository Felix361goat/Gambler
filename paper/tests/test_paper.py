"""Tests for the paper-trading harness."""
import os
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
PKG = os.path.dirname(HERE)
sys.path.insert(0, PKG)

import engine                     # noqa: E402
import strategy                   # noqa: E402
from store import Store           # noqa: E402
from broker import PaperBroker    # noqa: E402
from portfolio import Portfolio   # noqa: E402

ENG_CFG = {"sma_window": 5, "vol_window": 5, "target_vol": 0.10,
           "weight_cap": 1.5, "portfolio_leverage_cap": 2.0, "periods_per_year": 12}


def test_engine_zero_in_downtrend():
    prices = [100, 98, 96, 94, 92, 90, 88, 86]      # below its SMA -> no position
    w = engine.target_weights({"x": prices}, ENG_CFG)
    assert w["x"] == 0.0


def test_engine_positive_in_uptrend():
    prices = [100, 101, 102, 103, 104, 105, 106, 107]  # above SMA -> hold
    w = engine.target_weights({"x": prices}, ENG_CFG)
    assert w["x"] > 0.0


def test_engine_leverage_cap():
    # three calm uptrends -> each wants high weight, but total capped
    up = [100 + i for i in range(12)]
    w = engine.target_weights({"a": up, "b": up, "c": up}, ENG_CFG)
    assert sum(w.values()) <= ENG_CFG["portfolio_leverage_cap"] + 1e-9


def test_strategy_includes_core():
    up = [100 + i for i in range(12)]
    cfg = {"core": {"symbol": "equities", "weight": 0.75},
           "satellite": {"assets": ["equities", "gold"], "weight": 0.25,
                         **ENG_CFG}}
    w = strategy.combined_weights({"equities": up, "gold": up}, cfg)
    assert w["equities"] >= 0.75          # core always present


def test_portfolio_rebalance_hits_target():
    with tempfile.TemporaryDirectory() as d:
        store = Store(os.path.join(d, "p.db"), start_cash=10000.0)
        pf = Portfolio(store, PaperBroker(store, cost_bps=0.0))  # no cost for exactness
        pf.rebalance("2020-01", {"A": 0.5, "B": 0.25}, {"A": 100.0, "B": 50.0})
        pos = store.positions()
        # 50% of 10000 in A @100 = 50 shares; 25% in B @50 = 50 shares
        assert abs(pos["A"] - 50.0) < 1e-6
        assert abs(pos["B"] - 50.0) < 1e-6
        assert abs(store.cash() - 2500.0) < 1e-6   # 25% left uninvested


def test_idempotency_guard():
    with tempfile.TemporaryDirectory() as d:
        store = Store(os.path.join(d, "p.db"), start_cash=100.0)
        assert store.begin_run("2020-01") is True
        assert store.begin_run("2020-01") is True   # prior left 'started' -> retryable
        store.finish_run("2020-01", "completed")
        assert store.begin_run("2020-01") is False  # completed -> no-op


def test_paperbroker_cash_conservation():
    with tempfile.TemporaryDirectory() as d:
        store = Store(os.path.join(d, "p.db"), start_cash=1000.0)
        b = PaperBroker(store, cost_bps=0.001)
        b.execute("2020-01", "A", 5, 100.0)        # buy 5 @100 = 500 + 0.5 cost
        assert abs(store.cash() - (1000 - 500 - 0.5)) < 1e-6
        assert abs(store.positions()["A"] - 5) < 1e-9


if __name__ == "__main__":
    import traceback
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    passed = 0
    for fn in fns:
        try:
            fn(); print(f"PASS {fn.__name__}"); passed += 1
        except Exception:  # noqa: BLE001
            print(f"FAIL {fn.__name__}"); traceback.print_exc()
    print(f"\n{passed}/{len(fns)} passed")
    sys.exit(0 if passed == len(fns) else 1)
