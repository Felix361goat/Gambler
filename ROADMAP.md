# Master Plan — From €0 to Serious Capital (Austria)

An honest, staged plan. Each phase has a **gate** that must be passed before the
next. Money is never risked until the edge before it is proven. Everything is
backed by the simulations in `sim/` and the tools in `matched-betting/`.

> Honest framing throughout: **high returns and high certainty are opposites.**
> The early phases are near-certain but small. The wealth phase is genuinely
> rewarding but lumpy and uncertain. No phase is a get-rich-quick promise.

---

## Phase 0 — Confirm the exchange (the gate for everything)  ⛔
Matched betting needs a working **lay** exchange in Austria (Betfair is
restricted → use **Smarkets**/Matchbook).
- [ ] Open + fund a Smarkets account.
- [ ] Place a small test lay on a Bundesliga market; confirm it matches.
- **Gate:** if you can't lay, skip to Phase 2 and bootstrap from own savings instead.

## Phase 1 — Matched-betting bootstrap (near risk-free seed)  ✅ tools built
Harvest bookmaker welcome bonuses, hedged on the exchange. **Tools done & tested**
in `matched-betting/`.
- [ ] `pip install pyyaml`; `python3 workflow.py seed`
- [ ] Work each offer with `python3 workflow.py run` (start with Betano's €20
      no-deposit free bet — pure profit).
- **Target:** €1–2k locked profit (tracked in the ledger + progress bar).
- **Reality:** one-off harvest, manual labour, accounts get limited eventually.
  It's the *seed*, not the engine.
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
- [ ] Add crypto + more markets, subtract realistic costs, then
      paper-trade it live for **60–90 days** via free broker APIs
      (Alpaca for stocks/ETFs, a crypto exchange for the arb base) on a cheap VPS.
- **Gate to Phase 3:** paper results show **net CAGR clearly > ETF**, **max
  drawdown < ~35%**, and clean execution. If it fails, we do NOT deploy — we
  fall back to low-cost ETF investing (still beats most active retail).

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
- ✅ Phase 1 tooling built, tested (5/5), pushed: `matched-betting/`
- ✅ Simulations: `sim/funding_arb_sim.py`, `sim/trend_backtest.py`,
  `sim/aggressive_sim.py`, `sim/capital_journey.py`
- ⛔ **You:** do Phase 0 (confirm Smarkets) and start Phase 1 offers.
- 🔜 **Next build:** Phase 2 diversified multi-asset trend backtest, then the
  paper-trading harness.
