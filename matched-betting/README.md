# Matched-Betting Workflow (Austria)

Harvest bookmaker welcome bonuses at near-zero risk by **backing** at the
bookie and **laying** the same selection on an exchange. The result doesn't
matter — you keep the bonus. Target: **€1–2k** from sign-up offers.

> ⚠️ The software **computes** what to do. **You place every bet manually**
> (bookies ban automation). Nothing here ever logs into a bookmaker account.

## The one dependency
You must be able to **lay** on a betting exchange from Austria. Betfair is
restricted in AT → use **Smarkets** (or Matchbook). Confirm you can fund it and
place a small lay with liquidity before working real offers.

## Install
```bash
pip install pyyaml          # only hard dependency; gspread optional for Sheets
```

## The loop (run from inside this folder)
```bash
python3 workflow.py seed       # load offers.yaml into the ledger (once)
python3 workflow.py next       # what to do next
# size the bet the tool tells you to place:
python3 workflow.py calc --type qualifying --back-stake 50 --back-odds 3.0 --lay-odds 3.05
# place it at the bookie + lay on Smarkets, then record it:
python3 workflow.py log-qualifying 1 --event "Bayern v Koeln" --back-odds 3.0 --back-stake 50 --lay-odds 3.05
# after the bonus lands, place + lay the free bet, then:
python3 workflow.py log-freebet 1 --event "Real v Sevilla" --back-odds 6.0 --lay-odds 6.1
python3 workflow.py status      # running total + progress bar to €1,500
python3 workflow.py export      # CSV (+ Google Sheet if configured)
```

## How it works
- **`calculator.py`** — back/lay math. Equalises both outcomes so profit is the
  same whoever wins. Handles qualifying bets and free bets (stake-not-returned)
  plus exchange commission.
- **`workflow.py`** — a per-offer **state machine**: it knows whether you still
  need the qualifying bet, are waiting for the bonus, or need the free bet, and
  tells you the exact next step.
- **`ledger.py`** — SQLite store of offers + every bet leg + locked profit.
- **`offers.yaml`** — your editable checklist of Austrian-facing offers.
  **Verify each offer's live T&Cs before working it** (amounts change).
- **`config.yaml`** — exchange/commission, float, target, optional Telegram &
  Google Sheets.

## Rules that keep it legal & profitable
- One account per person (multi-accounting is fraud).
- Meet each offer's min-odds / wagering terms or the bonus voids.
- Bookies will eventually limit ("gub") winning accounts — that's expected; you
  take the welcome bonus before that happens.
- Betting winnings are generally tax-free for private individuals in Austria
  (not tax advice — verify your situation).

## Tests
```bash
python3 tests/test_mb.py
```
