# Gambler — honest wealth-building toolkit (Austria)

A staged, evidence-driven plan to turn a small seed into long-term capital —
with **honest** expectations at every step (no get-rich-quick promises). The
full plan and its gates live in **[`ROADMAP.md`](ROADMAP.md)**.

## The two-track plan
1. **Bootstrap a seed** (near risk-free) by harvesting bookmaker welcome bonuses
   → `matched-betting/`.
2. **Compound it** in a validated systematic strategy that beats ETFs
   risk-adjusted → `paper/` (prove on paper first), backed by `sim/`.

## What's in here
| Folder | What it is | Status |
|--------|-----------|--------|
| **`matched-betting/`** | Bonus-harvesting tool: back/lay + **dutching** calculator (Austria has no exchange), dynamic per-offer workflow, SQLite ledger, Telegram, AT offer + tier list. | ✅ built, 7/7 tests |
| **`paper/`** | Paper-trading harness for the **Core + Satellite** investing engine. SQLite state, idempotent daily runner, replay self-test, systemd deploy files. Flips to live with one config line. | ✅ built, 7/7 tests |
| **`sim/`** | The research that justifies the engine: trend backtest, **out-of-sample** validation, diversified multi-asset, funding-arb, aggressive-account Monte Carlo, full capital-journey projection. | ✅ |
| **`fun-challenge/`** | A clearly-separate €20 for-fun tracker + a value-bet finder. **Not** the real strategy. | ✅ |
| **`betting-bot/`** | Earlier sports-prediction bot (separate, pre-existing). | — |

## Key honest findings (from the work in `sim/`)
- A diversified vol-targeted **trend** strategy beats buy-and-hold **out-of-sample**
  on a risk-adjusted basis (≈9% CAGR / −7% DD vs 7% / −51%); ~16–18% only with
  leverage, and the past may not repeat.
- The **€50k** goal comes mainly from **monthly contributions + compounding**,
  not from returns on the seed.
- Realistic **net** returns after costs + 27.5% Austrian KESt are **modest** —
  the paper phase proves *plumbing*, not edge.
- A concentrated "active mini-ETF" of single stocks is worse than both a broad
  ETF and the trend engine (cost, tax, concentration) — 3-agent + evidence verdict.

## Quick start
```bash
pip install pyyaml
# bootstrap (Austria / dutching):
cd matched-betting && python3 workflow.py seed && python3 workflow.py next
# validate the engine offline:
cd paper && python3 replay_selftest.py && python3 tests/test_paper.py
```

> Not financial/tax advice. Bet/invest only what you can afford to lose, follow
> bookmaker terms (one account per person), and confirm Austrian tax specifics
> with a professional.
