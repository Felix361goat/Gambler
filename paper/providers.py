"""
Price providers — the swappable data layer.

PriceProvider is the interface the harness depends on. Two implementations:
  - CSVProvider:  reads the historical monthly series in ../sim (equities/gold/
    bonds) — used for the replay self-test and offline development.
  - LiveProvider: a stub that fetches real daily closes on the VPS (yfinance /
    Tiingo). Lazy-imports so the sandbox never needs the dependency.

Strategy code only ever sees {symbol: [prices oldest->newest]}, so swapping the
provider never touches the strategy.
"""
import csv
import os
from abc import ABC, abstractmethod

SIM = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sim")


class PriceProvider(ABC):
    @abstractmethod
    def history(self, symbols, upto=None):
        """Return {symbol: [(date, price), ...]} oldest->newest, dates <= upto."""


def _load_csv(path, dcol, vcol, ymlen=7):
    out = {}
    for r in csv.DictReader(open(path)):
        try:
            out[r[dcol][:ymlen]] = float(r[vcol])
        except (ValueError, KeyError):
            pass
    return out


class CSVProvider(PriceProvider):
    """Monthly index levels from the sim CSVs. Bonds = total-return proxy."""
    DURATION = 7.0

    def __init__(self):
        spx = _load_csv(os.path.join(SIM, "sp500_monthly.csv"), "Date", "SP500")
        gold = _load_csv(os.path.join(SIM, "gold_monthly.csv"), "Date", "Price")
        yld = _load_csv(os.path.join(SIM, "bonds10y_monthly.csv"), "Date", "Rate")
        months = sorted(set(spx) & set(gold) & set(yld))
        months = [m for m in months if m >= "1970-01"]
        # build a bond total-return index from yields
        bond_idx, lvl = {}, 1.0
        for i, m in enumerate(months):
            if i > 0:
                p, c = months[i-1], m
                r = yld[p]/100/12 - self.DURATION*(yld[c]/100 - yld[p]/100)
                lvl *= (1 + r)
            bond_idx[m] = lvl
        self.series = {
            "equities": [(m, spx[m]) for m in months],
            "gold": [(m, gold[m]) for m in months],
            "bonds": [(m, bond_idx[m]) for m in months],
        }

    def history(self, symbols, upto=None):
        out = {}
        for s in symbols:
            data = self.series[s]
            if upto is not None:
                data = [(d, p) for (d, p) in data if d <= upto]
            out[s] = data
        return out

    def all_dates(self, symbols):
        common = None
        for s in symbols:
            ds = {d for d, _ in self.series[s]}
            common = ds if common is None else (common & ds)
        return sorted(common)


class LiveProvider(PriceProvider):
    """VPS-only: real daily closes via yfinance. Lazy import; not used in tests."""
    def __init__(self, lookback_days=420):
        self.lookback_days = lookback_days

    def history(self, symbols, upto=None):
        import yfinance as yf            # noqa: PLC0415  (deferred, VPS-only)
        out = {}
        for s in symbols:
            df = yf.download(s, period=f"{self.lookback_days}d",
                             interval="1d", progress=False, auto_adjust=True)
            rows = [(idx.strftime("%Y-%m-%d"), float(row["Close"]))
                    for idx, row in df.iterrows()]
            if upto is not None:
                rows = [(d, p) for (d, p) in rows if d <= upto]
            out[s] = rows
        return out


def make_provider(name):
    return {"csv": CSVProvider, "live": LiveProvider}[name]()
