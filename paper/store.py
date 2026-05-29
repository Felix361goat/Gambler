"""
SQLite state store for the paper-trading harness.

Holds everything that must survive VPS reboots: cash, share positions, the
daily equity curve, a cached price history, and an append-only `runs` table that
gives idempotency (a given trade_date is processed at most once). Pure stdlib.
"""
import os
import sqlite3
from datetime import datetime, timezone

SCHEMA = """
CREATE TABLE IF NOT EXISTS runs (
    trade_date   TEXT PRIMARY KEY,         -- 'YYYY-MM-DD' / 'YYYY-MM' (exchange date)
    status       TEXT NOT NULL,            -- started / completed / skipped_no_data
    started_at   TEXT,
    completed_at TEXT
);
CREATE TABLE IF NOT EXISTS positions (
    symbol     TEXT PRIMARY KEY,
    shares     REAL NOT NULL DEFAULT 0,
    updated_at TEXT
);
CREATE TABLE IF NOT EXISTS cash (
    id      INTEGER PRIMARY KEY CHECK (id = 1),
    balance REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS equity_curve (
    trade_date     TEXT PRIMARY KEY,
    equity         REAL NOT NULL,
    cash           REAL NOT NULL,
    gross_exposure REAL,
    weights_json   TEXT
);
CREATE TABLE IF NOT EXISTS fills (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    trade_date TEXT, symbol TEXT, shares REAL, price REAL, cost REAL, ts TEXT
);
"""


def _now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class Store:
    def __init__(self, db_path, start_cash=0.0):
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
        self.conn.executescript(SCHEMA)
        if self.conn.execute("SELECT COUNT(*) c FROM cash").fetchone()["c"] == 0:
            self.conn.execute("INSERT INTO cash (id, balance) VALUES (1, ?)",
                              (start_cash,))
        self.conn.commit()

    # ---- cash / positions ----
    def cash(self):
        return self.conn.execute("SELECT balance FROM cash WHERE id=1").fetchone()["balance"]

    def set_cash(self, v):
        self.conn.execute("UPDATE cash SET balance=? WHERE id=1", (v,)); self.conn.commit()

    def positions(self):
        return {r["symbol"]: r["shares"]
                for r in self.conn.execute("SELECT symbol, shares FROM positions")}

    def set_shares(self, symbol, shares):
        self.conn.execute(
            "INSERT INTO positions (symbol, shares, updated_at) VALUES (?,?,?) "
            "ON CONFLICT(symbol) DO UPDATE SET shares=excluded.shares, "
            "updated_at=excluded.updated_at", (symbol, shares, _now()))
        self.conn.commit()

    # ---- runs (idempotency) ----
    def begin_run(self, trade_date):
        """Returns True if this run is new (caller should proceed), else False."""
        try:
            self.conn.execute(
                "INSERT INTO runs (trade_date, status, started_at) VALUES (?,?,?)",
                (trade_date, "started", _now()))
            self.conn.commit()
            return True
        except sqlite3.IntegrityError:
            row = self.conn.execute(
                "SELECT status FROM runs WHERE trade_date=?", (trade_date,)).fetchone()
            return row["status"] == "started"  # retry only if a prior run crashed

    def finish_run(self, trade_date, status="completed"):
        self.conn.execute("UPDATE runs SET status=?, completed_at=? WHERE trade_date=?",
                          (status, _now(), trade_date))
        self.conn.commit()

    # ---- logging ----
    def record_fill(self, trade_date, symbol, shares, price, cost):
        self.conn.execute(
            "INSERT INTO fills (trade_date, symbol, shares, price, cost, ts) "
            "VALUES (?,?,?,?,?,?)", (trade_date, symbol, shares, price, cost, _now()))
        self.conn.commit()

    def record_equity(self, trade_date, equity, cash, gross, weights_json):
        self.conn.execute(
            "INSERT INTO equity_curve (trade_date, equity, cash, gross_exposure, "
            "weights_json) VALUES (?,?,?,?,?) ON CONFLICT(trade_date) DO UPDATE SET "
            "equity=excluded.equity, cash=excluded.cash, "
            "gross_exposure=excluded.gross_exposure, weights_json=excluded.weights_json",
            (trade_date, equity, cash, gross, weights_json))
        self.conn.commit()

    def equity_curve(self):
        return [(r["trade_date"], r["equity"]) for r in
                self.conn.execute("SELECT trade_date, equity FROM equity_curve "
                                  "ORDER BY trade_date")]
