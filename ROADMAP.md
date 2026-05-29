# Master Plan — From €0 to Serious Capital (Austria)

An honest, staged plan. Each phase has a **gate** that must be passed before the
next. Money is never risked until the edge before it is proven. Everything is
backed by the simulations in `sim/` and the tools in `matched-betting/`.

> Honest framing throughout: **high returns and high certainty are opposites.**
> The early phases are near-certain but small. The wealth phase is genuinely
> rewarding but lumpy and uncertain. No phase is a get-rich-quick promise.

---

## Phase 0 — Hedge venue  ✅ resolved: DUTCHING (no exchange in AT)
Betfair, Smarkets AND Matchbook are all **restricted in Austria** (verified
2026). So matched betting hedges via **dutching** — backing the opposite outcome
at a **second bookmaker** on a 2-outcome market. Retention ~75–80%.
- **Gate cleared:** the tool now uses dutching by default; no exchange needed.

## Phase 1 — Matched-betting bootstrap (near risk-free seed)  ✅ tools built & tested
Harvest bookmaker welcome bonuses, hedged by dutching. **Done & tested** in
`matched-betting/` (calculator, dynamic workflow, dutching commands, SQLite
ledger, Telegram, 7/7 tests).
- [ ] `pip install pyyaml`; `python3 workflow.py seed`
- [ ] Work each offer (start with Betano's €20 no-deposit free bet) using
      `dcalc` → `dlog-qualifying` / `dlog-freebet`.
- **Realistic target (Tipico/Admiral already used):** ~€450–800 across ~10–14
  reputable AT bookmakers (tier list in chat). Doubling possible via a 2nd
  person's own accounts (their identity/device/money — legit, mind household/IP).
- **Reality:** one-off harvest, manual labour, accounts get limited. It's the
  *seed*, not the engine.
- **Gate to Phase 3:** seed banked **and** Phase 2 validated.

## Phase 2 — Build & PROVE the wealth engine on paper (no money)
The engine = **diversified systematic trend-following + a funding-arb yield
base** (a "barbell": safe core + trend sleeve). Documented edge, but unproven
until tested on *our* data.
- [x] Diversified multi-asset trend backtest built (`sim/diversified_trend.py`),
      equities + gold + bonds, vol-targeted, 1970–2026. **Result (in-sample):**

      | portfolio              | CAGR  | maxDD |
      |------------------------|------:|------:|
      | 60/40 buy & hold       | 7.6%  | −29%  |
      | diversified trend 1×   | 9.9%  | −14%  |
      | diversified trend lev. | 18.2% | −18%  |

      Higher return at *lower* drawdown than 60/40 → the edge is real here.
      **Caveats:** in-sample, no fees/slippage/taxes modelled, bond return is a
      duration proxy, and the leveraged "x-money" assumes the edge persists for
      decades. Real-world costs + edge decay are why `capital_journey.py` uses a
      conservative 15% mean, not 18%.
- [x] **Out-of-sample test** (`sim/oos_validation.py`): trend beats equities
      buy&hold OOS (1998–2026) on a risk-adjusted basis (9.0% CAGR / −7% DD vs
      7.1% / −51%); stable across 8/10/12-mo lookbacks → not overfit.
- [x] **Paper-trading harness built & tested** (`paper/`): Core+Satellite,
      SQLite state, idempotent `run_daily.py`, `replay_selftest.py` (10.5% CAGR
      / −36% DD vs equities 7.9% / −51% over 1971–2026), 7/7 tests. Flips to live
      with one config line.
- [ ] Deploy on the Hetzner VPS (systemd timer + yfinance/Tiingo) and paper-run
      **60–90 days** to validate plumbing + measure real costs.
- **Note — funding-arb sleeve dropped for EU retail:** ESMA (Feb 2026) treats
  crypto perps as CFDs → retail max 2:1 leverage, so the live engine is
  **trend-following only**; arb stays paper-only.
- **Gate to Phase 3 (operational, not "did it profit"):** near-zero tracking
  error vs the parallel backtest, realized costs ≤ modeled, ≥98% cron uptime.
  Expect realistic net returns *low single digits unlevered* after costs + 27.5%
  KESt — the paper test proves plumbing, not edge.

## Phase 3 — Deploy capital (the barbell goes live)
Combine the matched-betting seed + your own €500–1k + ongoing monthly savings.
- **Allocation:** ~30% funding-arb / cash ballast (the floor), ~70% trend engine.
- **Risk rules in code:** fixed-fractional sizing, vol targeting, hard
  per-position stops, a portfolio drawdown circuit-breaker that de-risks
  automatically. (Recall the `sim/aggressive_sim.py` lesson: *sizing*, not the
  signal, decides survival.)
- **Start conservative** (lower leverage, majors only); scale only as the live
  track record confirms the paper results.

## Phase 4 — Compound & multiply (the long game)  ← the real wealth
This is where "serious capital for the future" actually happens — through
**time + consistent contributions + compounding**, not a lucky trade.

Projection (`sim/capital_journey.py`, after 27.5% Austrian capital-gains tax,
seed €2,000 + €150/mo):

| Horizon | Paid in | ETF median | **Engine median** | Engine p5 (bad luck) |
|--------:|--------:|-----------:|------------------:|---------------------:|
|  5y     | €11,000 |   €13,222  |    **€15,669**    |        €10,928       |
| 10y     | €20,000 |   €27,989  |    **€39,593**    |        €23,729       |
| 20y     | €38,000 |   €74,660  |   **€161,909**    |        €70,517       |

**How we keep multiplying:**
- **Reinvest everything** — the matched-betting/reload profits and all gains
  feed back into the engine. Compounding is the whole point.
- **Add monthly** — contributions dwarf the seed over time; automate them.
- **Tax efficiency** — harvest losses, use any tax-advantaged wrappers Austria
  allows. A few % less drag per year is enormous over 20 years.
- **Scale with size** — the funding-arb sleeve becomes meaningful in absolute €
  as capital grows; trend diversification can widen.
- **Rebalance the barbell** on a schedule; never let one sleeve dominate.

**The honest caveats (read every time you're tempted to over-risk):**
- The engine numbers assume the edge holds. It might decay; that's why Phase 2's
  proof and Phase 3's circuit-breakers exist.
- The median hides 20–35% drawdowns and losing years. Surviving them — by *not*
  oversizing — is what captures the long-run return.
- A smooth "X% every month" is a fraud signal, not a target.

---

## Strategy decision — validated by 3-agent analysis + OOS test

**Question asked:** an "active mini-ETF" (few individual stocks, actively
timed/rotated) — better than a broad ETF? **Answer (unanimous across 3 agents
+ evidence): No.** The single-stock version is more expensive, riskier, and
more tax-inefficient than BOTH a broad ETF and the already-validated trend
engine. Evidence:
- Concentration does NOT raise expected return, only variance (Bessembinder:
  ~4% of stocks created all net market wealth; 57% underperformed T-bills).
- Timing mainly reduces drawdown, not raw return (Faber).
- 84–90% of professionals fail to beat the index over 10–15y (SPIVA); the
  average investor trailed by ~8.5%/yr (DALBAR).
- Austrian tax: 27.5% on every realized gain, NO loss carry-forward → ~2–4%/yr
  drag that can consume the whole timing edge.

**Decided architecture — Core + Satellite:**
- **Core (70–85%):** a broad, ACCUMULATING world ETF (e.g. FTSE All-World).
  Buy & hold, tax-efficient (deferred), the compounding motor for the monthly
  contributions.
- **Satellite (15–30%):** the validated vol-targeted TREND engine on BROAD
  ETFs (equities/gold/bonds + optionally 2–3 sector/region ETFs rotated by the
  same signal). Low turnover. Purpose: drawdown protection + a modest return
  edge. Optional moderate leverage on this sleeve ONLY, after a clean live run.
- **Tax trick:** direct new contributions into the underweight sleeve instead
  of selling winners, to defer KESt.

**Honest expectation:** main benefit = a smoother ride (−7% to −18% drawdown
vs −51%) plus a modest return edge. The €50k target comes mainly from the
~€400–600/mo contributions, not from magic returns.

## Current status
- ✅ **Phase 0 resolved** — Austria has no exchange → dutching (2nd bookmaker).
- ✅ **Phase 1 tool complete** (`matched-betting/`, 7/7 tests): calculator,
  dynamic workflow, dutching commands (`dcalc`/`dlog-*`), SQLite ledger,
  Telegram, refreshed AT offer list + tier list.
- ✅ **Simulations** (`sim/`): funding_arb, trend_backtest, aggressive,
  capital_journey, diversified_trend, **oos_validation**.
- ✅ **Phase 2 harness built** (`paper/`, 7/7 tests): Core+Satellite, SQLite,
  idempotent `run_daily.py`, `replay_selftest.py`, paper→live in one config line.
- ✅ Side experiment: `fun-challenge/` (€20 tracker + value-bet finder).
- ⛔ **You (when ready):** start Phase 1 offers (Betano €20 first); withdraw the
  Admiral €20 (or use it as a dutch hedge).
- 🔜 **Next build:** deploy `paper/` on the Hetzner VPS (systemd + live data)
  and start the 60–90 day paper run; later, the live `IBKRBroker` adapter.
