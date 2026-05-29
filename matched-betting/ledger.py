"""
SQLite ledger for the matched-betting workflow.

Stores the offer checklist and every bet leg (qualifying + free bet) with the
computed lay stake and locked profit, so the running total toward the target
is always accurate. Pure stdlib (sqlite3) — no external deps.
"""
import os
import sqlite3
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))

SCHEMA = """
CREATE TABLE IF NOT EXISTS offers (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    bookmaker   TEXT NOT NULL,
    offer_type  TEXT NOT NULL,
    bonus_eur   REAL NOT NULL,
    min_odds    REAL,
    wagering    TEXT,
    verify_url  TEXT,
    status      TEXT NOT NULL DEFAULT 'todo',   -- todo/in_progress/done/skipped
    notes       TEXT,
    created_at  TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(bookmaker, offer_type)
);

CREATE TABLE IF NOT EXISTS bets (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    offer_id      INTEGER REFERENCES offers(id),
    leg           TEXT NOT NULL,                -- qualifying / freebet
    event         TEXT,
    selection     TEXT,
    back_odds     REAL NOT NULL,
    back_stake    REAL NOT NULL,
    lay_odds      REAL NOT NULL,
    lay_stake     REAL NOT NULL,
    liability     REAL NOT NULL,
    commission    REAL NOT NULL,
    locked_profit REAL NOT NULL,
    result        TEXT,                         -- back_won / back_lost / pending
    created_at    TEXT DEFAULT CURRENT_TIMESTAMP
);
"""


def _now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class Ledger:
    def __init__(self, db_path):
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
        self.conn.executescript(SCHEMA)
        self.conn.commit()

    # ---- offers -----------------------------------------------------------
    def seed_offers(self, offers):
        """Insert offers if absent (idempotent on bookmaker+offer_type)."""
        added = 0
        for o in offers:
            try:
                self.conn.execute(
                    """INSERT INTO offers
                       (bookmaker, offer_type, bonus_eur, min_odds, wagering,
                        verify_url, status)
                       VALUES (?,?,?,?,?,?,?)""",
                    (o["bookmaker"], o["offer_type"], float(o["bonus_eur"]),
                     o.get("min_odds"), o.get("wagering"), o.get("verify_url"),
                     o.get("status", "todo")),
                )
                added += 1
            except sqlite3.IntegrityError:
                pass  # already present
        self.conn.commit()
        return added

    def list_offers(self, status=None):
        q = "SELECT * FROM offers"
        args = ()
        if status:
            q += " WHERE status = ?"
            args = (status,)
        q += " ORDER BY (status='done'), (status='skipped'), bonus_eur DESC"
        return self.conn.execute(q, args).fetchall()

    def get_offer(self, offer_id):
        return self.conn.execute(
            "SELECT * FROM offers WHERE id = ?", (offer_id,)).fetchone()

    def set_status(self, offer_id, status):
        self.conn.execute(
            "UPDATE offers SET status = ? WHERE id = ?", (status, offer_id))
        self.conn.commit()

    def next_todo(self):
        return self.conn.execute(
            "SELECT * FROM offers WHERE status='todo' ORDER BY bonus_eur DESC "
            "LIMIT 1").fetchone()

    # ---- bets -------------------------------------------------------------
    def add_bet(self, offer_id, leg, result_obj, event="", selection="",
                back_odds=0.0, back_stake=0.0, commission=0.0):
        self.conn.execute(
            """INSERT INTO bets
               (offer_id, leg, event, selection, back_odds, back_stake,
                lay_odds, lay_stake, liability, commission, locked_profit,
                result, created_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (offer_id, leg, event, selection, back_odds, back_stake,
             result_obj.lay_odds if hasattr(result_obj, "lay_odds") else 0.0,
             result_obj.lay_stake, result_obj.liability, commission,
             result_obj.locked_profit, "pending", _now()),
        )
        self.conn.commit()

    def offer_bets(self, offer_id):
        return self.conn.execute(
            "SELECT * FROM bets WHERE offer_id = ? ORDER BY id", (offer_id,)
        ).fetchall()

    def all_bets(self):
        return self.conn.execute("SELECT * FROM bets ORDER BY id").fetchall()

    # ---- summary ----------------------------------------------------------
    def summary(self, target=0.0):
        row = self.conn.execute(
            "SELECT COALESCE(SUM(locked_profit),0) AS profit, COUNT(*) AS n "
            "FROM bets").fetchone()
        done = self.conn.execute(
            "SELECT COUNT(*) AS c FROM offers WHERE status='done'").fetchone()["c"]
        todo = self.conn.execute(
            "SELECT COUNT(*) AS c FROM offers WHERE status='todo'").fetchone()["c"]
        profit = round(row["profit"], 2)
        return {
            "locked_profit": profit,
            "bets_logged": row["n"],
            "offers_done": done,
            "offers_todo": todo,
            "target": target,
            "pct_to_target": round(profit / target * 100, 1) if target else 0.0,
        }
