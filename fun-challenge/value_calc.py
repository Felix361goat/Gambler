#!/usr/bin/env python3
"""
VALUE-BET finder  —  the systematic way to pick bets (not predictions).

Idea: a bet is only worth it when your bookmaker's odds are HIGHER than the
"true" odds. The truest estimate is the sharp market (Pinnacle / market avg).
We de-margin the sharp odds to get fair probabilities, then check if your
bookie's odds beat them (= positive expected value), and size with 1/4-Kelly.

You FEED it the odds (read Admiral's odds + look up Pinnacle / oddschecker /
oddsportal for the same match). No predictions, no live data needed.

Usage (inside fun-challenge/):
  # market with N outcomes: give YOUR odds for the outcome you'd bet,
  # and the SHARP odds for ALL outcomes of that market.
  python3 value_calc.py --your 2.20 --sharp 2.00 3.60 4.10 --pick 0 --bankroll 20

  --your     your bookmaker's decimal odds for the outcome you'd back
  --sharp    sharp/market decimal odds for ALL outcomes (space separated)
  --pick     index (0-based) of the outcome you'd back within --sharp
  --bankroll current balance (default 20)
  --kelly    Kelly fraction (default 0.25)
"""
import argparse


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--your", type=float, required=True)
    p.add_argument("--sharp", type=float, nargs="+", required=True)
    p.add_argument("--pick", type=int, required=True)
    p.add_argument("--bankroll", type=float, default=20.0)
    p.add_argument("--kelly", type=float, default=0.25)
    p.add_argument("--max-stake-pct", type=float, default=0.25)
    a = p.parse_args()

    # de-margin sharp odds -> fair probabilities
    inv = [1.0 / o for o in a.sharp]
    overround = sum(inv)
    fair_probs = [x / overround for x in inv]
    fair_p = fair_probs[a.pick]
    fair_odds = 1.0 / fair_p

    ev = fair_p * a.your - 1.0           # expected value per €1 staked
    b = a.your - 1.0
    kelly_full = (fair_p * a.your - 1) / b if b > 0 else 0
    kelly = max(0.0, kelly_full * a.kelly)
    stake = min(kelly, a.max_stake_pct) * a.bankroll

    print(f"\nSharp market overround: {(overround-1)*100:.1f}%  "
          f"-> fair prob of your pick: {fair_p*100:.1f}%  (fair odds {fair_odds:.2f})")
    print(f"Your odds: {a.your:.2f}   Edge (EV): {ev*100:+.1f}%")
    if ev > 0:
        print(f"✅ VALUE BET. Suggested stake: €{stake:.2f} "
              f"(1/{1/a.kelly:.0f}-Kelly, capped {a.max_stake_pct:.0%})")
    else:
        print("❌ NO value — your odds are too low vs the sharp market. Skip it.")
    print()


if __name__ == "__main__":
    main()
