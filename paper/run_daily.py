#!/usr/bin/env python3
"""
Daily entrypoint — run once per session by a systemd timer / cron on the VPS.

Flow: fetch prices -> resolve trade_date -> idempotency guard -> compute Core+
Satellite target weights -> rebalance -> log equity -> Telegram summary.

Idempotent & restart-safe: the Store `runs` table ensures a given trade_date is
processed at most once, so a reboot/re-fire is a no-op.
"""
import json
import os
import sys
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import yaml                       # noqa: E402
import strategy                   # noqa: E402
from providers import make_provider  # noqa: E402
from store import Store           # noqa: E402
from broker import make_broker    # noqa: E402
from portfolio import Portfolio   # noqa: E402


def load_config():
    with open(os.path.join(HERE, "config.yaml")) as f:
        return yaml.safe_load(os.path.expandvars(f.read()))


def _notify(cfg, text):
    tg = cfg.get("telegram", {}) or {}
    tok, chat = (tg.get("bot_token") or "").strip(), (tg.get("chat_id") or "").strip()
    if not tok or not chat or tok.startswith("${"):
        return
    try:
        data = urllib.parse.urlencode({"chat_id": chat, "text": text}).encode()
        urllib.request.urlopen(
            urllib.request.Request(f"https://api.telegram.org/bot{tok}/sendMessage",
                                   data=data), timeout=10)
    except Exception as e:  # noqa: BLE001
        print(f"(telegram failed: {e})")


def symbols_of(cfg):
    syms = {cfg["core"]["symbol"]}
    syms.update(cfg["satellite"]["assets"])
    return sorted(syms)


def run_once(cfg=None):
    cfg = cfg or load_config()
    syms = symbols_of(cfg)
    provider = make_provider(cfg["provider"])
    hist = provider.history(syms)

    # resolve trade_date = latest date present for ALL symbols
    common = None
    for s in syms:
        ds = {d for d, _ in hist[s]}
        common = ds if common is None else (common & ds)
    if not common:
        print("No common price date across symbols — aborting."); return
    trade_date = max(common)

    db = cfg["paths"]["db"]
    db = db if os.path.isabs(db) else os.path.join(HERE, db)
    store = Store(db, start_cash=cfg["start_equity"])

    if not store.begin_run(trade_date):
        print(f"{trade_date}: already processed — nothing to do."); return

    try:
        price_hist = {s: [p for d, p in hist[s] if d <= trade_date] for s in syms}
        prices = {s: price_hist[s][-1] for s in syms}
        weights = strategy.combined_weights(price_hist, cfg)
        broker = make_broker(cfg["broker"], store, cfg["cost_bps"])
        pf = Portfolio(store, broker)
        eq, gross = pf.rebalance(trade_date, weights, prices)
        store.finish_run(trade_date, "completed")
        wtxt = ", ".join(f"{k} {v:.0%}" for k, v in sorted(weights.items()) if v)
        msg = (f"📈 Paper {trade_date}: equity €{eq:,.0f} | exposure {gross:.0%}\n"
               f"targets: {wtxt}")
        print(msg)
        _notify(cfg, msg)
    except Exception as e:  # noqa: BLE001
        store.finish_run(trade_date, "started")  # leave reentrant for retry
        print(f"Run failed, left retryable: {e}")
        raise


if __name__ == "__main__":
    run_once()
