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
- [ ] Build the diversified multi-asset trend backtest (equities/bonds/gold/
      crypto), volatility-targeted, modest leverage — extend `sim/trend_backtest.py`.
- [ ] Paper-trade it live for **60–90 days** via free broker APIs
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

## Current status
- ✅ Phase 1 tooling built, tested (5/5), pushed: `matched-betting/`
- ✅ Simulations: `sim/funding_arb_sim.py`, `sim/trend_backtest.py`,
  `sim/aggressive_sim.py`, `sim/capital_journey.py`
- ⛔ **You:** do Phase 0 (confirm Smarkets) and start Phase 1 offers.
- 🔜 **Next build:** Phase 2 diversified multi-asset trend backtest, then the
  paper-trading harness.
