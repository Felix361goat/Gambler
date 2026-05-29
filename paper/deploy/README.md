# Deploy the paper harness on the Hetzner VPS

```bash
# 1. clone + install
sudo git clone <repo> /opt/Gambler
cd /opt/Gambler/paper
pip3 install pyyaml yfinance        # yfinance only needed for provider: live

# 2. switch config to live data
#    in config.yaml: provider: live ; map asset keys to tickers (e.g. SPY/GLD/TLT)
#    set periods_per_year: 252 if you move to daily bars

# 3. install the timer (edit paths/user/tz/token in the unit files first)
sudo cp deploy/paper.service deploy/paper.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now paper.timer

# 4. check
systemctl list-timers paper.timer
journalctl -u paper.service -n 50          # logs of the last run
python3 run_daily.py                       # run once manually
```

The harness is idempotent: a given trade_date is processed once, so reboots /
double-fires are safe. State lives in `data/paper.db` (SQLite) — back it up.

**Go-live (real money) is a separate step:** add an `IBKRBroker` (same `Broker`
interface), flip `broker: ibkr`, and only after the go-live gates in
`../../ROADMAP.md` pass. Start unlevered.
