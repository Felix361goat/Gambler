"""
Portfolio — marks to market and rebalances toward target weights.

Share-based (so it mirrors a real broker): target value per asset = weight x
equity; target shares = value / price; the delta is sent to the broker. Targeting
WEIGHTS (not deltas) makes re-runs idempotent — recomputing from current state
lands on the same place.
"""
import json


class Portfolio:
    def __init__(self, store, broker):
        self.store = store
        self.broker = broker

    def equity(self, prices):
        eq = self.store.cash()
        for sym, sh in self.store.positions().items():
            if sym in prices:
                eq += sh * prices[sym]
        return eq

    def rebalance(self, trade_date, target_weights, prices):
        eq = self.equity(prices)
        symbols = set(target_weights) | set(self.store.positions())
        gross = 0.0
        for sym in symbols:
            price = prices.get(sym)
            if not price or price <= 0:
                continue
            w = target_weights.get(sym, 0.0)
            target_shares = (w * eq) / price
            cur = self.store.positions().get(sym, 0.0)
            self.broker.execute(trade_date, sym, target_shares - cur, price)
            gross += abs(w)
        new_eq = self.equity(prices)
        self.store.record_equity(trade_date, new_eq, self.store.cash(), gross,
                                 json.dumps({k: round(v, 4)
                                             for k, v in target_weights.items()}))
        return new_eq, gross
