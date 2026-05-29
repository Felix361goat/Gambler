# Matched-Betting Workflow (Austria)

Harvest bookmaker welcome bonuses at near-zero risk by **backing** at the
bookie and **laying** the same selection on an exchange. The result doesn't
matter — you keep the bonus. Target: **€1–2k** from sign-up offers.

> ⚠️ The software **computes** what to do. **You place every bet manually**
> (bookies ban automation). Nothing here ever logs into a bookmaker account.

## ⚠️ Austria: no betting exchange → use DUTCHING
Betfair, Smarkets **and** Matchbook are all **restricted in Austria** (verified
2026). So you can't "lay" on an exchange. Instead you **dutch**: hedge by
**backing the opposite outcome at a second bookmaker** on a 2-outcome market
(tennis, over/under, both-teams-to-score). Retention is ~75–80% — almost as good
as an exchange. Use the `dcalc` / `dlog-*` commands below.

(The exchange commands `calc` / `log-*` remain for users in countries that
do have an exchange.)

## Install
```bash
pip install pyyaml          # only hard dependency; gspread optional for Sheets
```

## The loop — AUSTRIA / dutching (run from inside this folder)
```bash
python3 workflow.py seed        # load offers.yaml into the ledger (once)
python3 workflow.py next        # what to do next
# size the qualifying bet (back at bookie A, back the OPPOSITE at bookie B):
python3 workflow.py dcalc --type qualifying --back-stake 25 --back-odds 2.10 --hedge-odds 2.05
# place both, then record:
python3 workflow.py dlog-qualifying 1 --event "Tennis A v B" --back-odds 2.10 --back-stake 25 --hedge-odds 2.05
# after the bonus lands, dutch the free bet (high odds at A, hedge opposite at B):
python3 workflow.py dlog-freebet 1 --event "Over/Under X" --back-odds 4.0 --hedge-odds 1.36
python3 workflow.py status      # running total + progress bar to €1,500
python3 workflow.py export      # CSV (+ Google Sheet if configured)
```
*(Have an exchange? Use `calc` / `log-qualifying` / `log-freebet` with `--lay-odds` instead.)*

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
