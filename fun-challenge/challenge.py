#!/usr/bin/env python3
"""
€20 FUN CHALLENGE tracker  —  "how far can we get?"

This is NOT the real system. It tracks a for-fun, pure-LUCK gambling experiment
with money you've already written off. Betting unhedged is negative expectation:
the most likely outcome is the balance goes to 0. Treat it as entertainment.

Usage (run inside fun-challenge/):
  python3 challenge.py start 20
  python3 challenge.py bet "Bayern win @1.8" 20 1.8     # desc, stake, odds
  python3 challenge.py win 1                              # settle bet #1 as WON
  python3 challenge.py lose 1                             # settle bet #1 as LOST
  python3 challenge.py status
"""
import json
import os
import sys
from datetime import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(HERE, "challenge.json")


def load():
    if not os.path.exists(DB):
        return {"start": 0.0, "balance": 0.0, "bets": []}
    return json.load(open(DB))


def save(s):
    json.dump(s, open(DB, "w"), indent=2)


def status(s):
    bal, start = s["balance"], s["start"]
    mult = (bal / start) if start else 0
    print(f"\n=== €20 FUN CHALLENGE ===")
    print(f"Start: €{start:.2f}  |  Balance: €{bal:.2f}  |  {mult:.2f}x")
    if s["bets"]:
        print("-" * 48)
        for b in s["bets"]:
            mark = {"pending": "⏳", "won": "✅", "lost": "❌"}[b["status"]]
            print(f"  #{b['id']} {mark} {b['desc']}  (€{b['stake']} @ {b['odds']})")
    if bal <= 0 and start > 0:
        print("\n💀 Bust. That's gambling — the house edge wins on average.")
    print()


def main():
    a = sys.argv[1:]
    if not a:
        print(__doc__); return
    s = load()
    cmd = a[0]

    if cmd == "start":
        amt = float(a[1])
        s = {"start": amt, "balance": amt, "bets": []}
        save(s); print(f"Challenge started with €{amt:.2f}.")
    elif cmd == "bet":
        desc, stake, odds = a[1], float(a[2]), float(a[3])
        if stake > s["balance"]:
            print(f"Not enough balance (€{s['balance']:.2f})."); return
        bid = len(s["bets"]) + 1
        s["balance"] -= stake
        s["bets"].append({"id": bid, "desc": desc, "stake": stake,
                          "odds": odds, "status": "pending",
                          "ts": datetime.now().isoformat(timespec="minutes")})
        save(s)
        print(f"Bet #{bid} placed: {desc}. If it wins -> +€{stake*odds:.2f}.")
    elif cmd in ("win", "lose"):
        bid = int(a[1])
        b = next((x for x in s["bets"] if x["id"] == bid), None)
        if not b or b["status"] != "pending":
            print("No such pending bet."); return
        if cmd == "win":
            payout = b["stake"] * b["odds"]
            s["balance"] += payout
            b["status"] = "won"
            print(f"✅ Bet #{bid} WON. +€{payout:.2f}")
        else:
            b["status"] = "lost"
            print(f"❌ Bet #{bid} LOST. -€{b['stake']:.2f}")
        save(s); status(s)
    elif cmd == "status":
        status(s)
    else:
        print(__doc__)


if __name__ == "__main__":
    main()
