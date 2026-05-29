"""
Broker abstraction — the single paper->live boundary.

PaperBroker fills synthetically at the provided close minus a cost/slippage in
bps, mutating the Store (cash + shares). The live broker (IBKR) implements the
same three methods, so run_daily.py never changes when you flip `broker: paper`
-> `broker: ibkr` in config.
"""
from abc import ABC, abstractmethod


class Broker(ABC):
    @abstractmethod
    def positions(self): ...
    @abstractmethod
    def cash(self): ...
    @abstractmethod
    def execute(self, trade_date, symbol, delta_shares, price): ...


class PaperBroker(Broker):
    def __init__(self, store, cost_bps=0.0010):
        self.store = store
        self.cost_bps = cost_bps

    def positions(self):
        return self.store.positions()

    def cash(self):
        return self.store.cash()

    def execute(self, trade_date, symbol, delta_shares, price):
        if abs(delta_shares) < 1e-9:
            return 0.0
        notional = delta_shares * price
        cost = abs(notional) * self.cost_bps
        cur = self.store.positions().get(symbol, 0.0)
        self.store.set_shares(symbol, cur + delta_shares)
        self.store.set_cash(self.store.cash() - notional - cost)  # buy: cash down
        self.store.record_fill(trade_date, symbol, delta_shares, price, cost)
        return cost


def make_broker(name, store, cost_bps):
    if name == "paper":
        return PaperBroker(store, cost_bps)
    raise NotImplementedError(
        f"Broker '{name}' not implemented yet — IBKRBroker is the live adapter "
        f"to add when deploying (same Broker interface).")
