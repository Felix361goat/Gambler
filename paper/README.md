# Paper-Trading Harness (Investing Engine — Phase 2)

Runs the **Core + Satellite** strategy forward in time, marks a simulated
portfolio to market, and logs a daily equity curve — the 60–90 day paper proof
before any real money. Designed to flip to **live** by changing one config line.

## Strategy
- **Core (75%)** — broad buy & hold (tax-efficient compounding base).
- **Satellite (25%)** — vol-targeted **trend** engine across broad assets
  (equities/gold/bonds), for drawdown protection + a modest edge.

(Decision + evidence: see `../ROADMAP.md` "Strategy decision".)

## Modules
| File | Responsibility |
|------|----------------|
| `engine.py` | pure strategy: `target_weights(history, cfg)` (vol-targeted trend) |
| `strategy.py` | combines Core + Satellite into one target-weight vector |
| `providers.py` | data layer: `CSVProvider` (test) / `LiveProvider` (yfinance, VPS) |
| `broker.py` | `PaperBroker` (sim fills) — single paper→live boundary |
| `portfolio.py` | marks to market, rebalances toward target weights |
| `store.py` | SQLite state (cash, positions, equity curve, idempotent `runs`) |
| `run_daily.py` | the cron/systemd entrypoint (one run per session) |
| `replay_selftest.py` | drives the whole stack over history (offline validation) |
| `config.yaml` | universe, weights, provider/broker switch, telegram |

## Validate offline (no data feed needed)
```bash
pip install pyyaml
python3 replay_selftest.py     # Core+Satellite ~10.5% CAGR / -36% DD vs equities 7.9% / -51%
python3 tests/test_paper.py    # 7/7
```

## Run one session (paper)
```bash
python3 run_daily.py           # rebalances for the latest available date; idempotent
```

## Deploy on the Hetzner VPS
1. `provider: live` in `config.yaml` (uses yfinance; `pip install yfinance`),
   and map the asset keys to real tickers (e.g. core `VWCE`, satellite
   `SPY/GLD/TLT`); set `periods_per_year: 252` if you switch to daily bars.
2. Add a **systemd timer** (preferred over cron — `Persistent=true` re-runs a
   missed session after a reboot):
   ```ini
   # /etc/systemd/system/paper.service
   [Service]
   Type=oneshot
   WorkingDirectory=/opt/Gambler/paper
   ExecStart=/usr/bin/python3 run_daily.py
   # /etc/systemd/system/paper.timer
   [Timer]
   OnCalendar=*-*-* 23:30:00      # after market close, your tz
   Persistent=true
   [Install]
   WantedBy=timers.target
   ```
   `systemctl enable --now paper.timer`
3. Set `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` env vars for daily summaries.

## Paper → Live (the only change)
Flip `broker: paper` → `broker: ibkr` once an `IBKRBroker` (same `Broker`
interface) is added. Strategy, portfolio, store, scheduling stay identical.
**Go-live gates first** (tracking error, cost realism, uptime — see ROADMAP).

## Honest note
The replay numbers are in-sample/backtest. The paper phase validates *plumbing
and costs*, not edge. Start **unlevered** live, with hard caps + a drawdown
circuit-breaker. Realistic net returns after costs + 27.5% KESt are well below
the headline backtest.
