#!/usr/bin/env python3
"""
Matched-betting DYNAMIC WORKFLOW — the thing you drive day to day.

It is a per-offer state machine: for each bookmaker offer it knows which step
you are on (qualifying bet -> wait for bonus -> free bet -> done) and tells you
EXACTLY what to back, what to lay, and your locked profit. Nothing touches a
bookmaker account — the tool computes, you click.

Usage (run from inside the matched-betting/ folder):

  python3 workflow.py seed                 # load offers.yaml into the ledger
  python3 workflow.py status               # all offers + running total
  python3 workflow.py next                 # what to do next
  python3 workflow.py calc --type qualifying --back-stake 50 --back-odds 3.0 --lay-odds 3.05
  python3 workflow.py start 1
  python3 workflow.py log-qualifying 1 --event "Bayern v Koeln" --back-odds 3.0 --back-stake 50 --lay-odds 3.05
  python3 workflow.py log-freebet  1 --event "Real v Sevilla" --back-odds 6.0 --lay-odds 6.1
  python3 workflow.py export               # CSV (+ Google Sheet if configured)
"""
import argparse
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import yaml                       # noqa: E402
import calculator                 # noqa: E402  (same directory)
import notify                     # noqa: E402
from ledger import Ledger         # noqa: E402


# --------------------------------------------------------------------------
# config
# --------------------------------------------------------------------------
def load_config():
    with open(os.path.join(HERE, "config.yaml")) as f:
        raw = f.read()
    cfg = yaml.safe_load(os.path.expandvars(raw))  # ${ENV} substitution
    return cfg


def _db_path(cfg):
    p = cfg["paths"]["db"]
    return p if os.path.isabs(p) else os.path.join(HERE, p)


# --------------------------------------------------------------------------
# dynamic per-offer state machine
# --------------------------------------------------------------------------
def offer_state(ledger, offer):
    """Return (state, human instruction) for an offer based on its bets."""
    bets = ledger.offer_bets(offer["id"])
    legs = {b["leg"] for b in bets}
    if offer["status"] == "skipped":
        return "skipped", "Skipped."
    if offer["status"] == "done" or "freebet" in legs:
        return "done", "Completed — profit locked in the ledger."
    if "qualifying" in legs:
        return ("await_freebet",
                f"STEP 2 — bonus should now be credited at {offer['bookmaker']}. "
                f"Place the €{offer['bonus_eur']:.0f} FREE BET, then run:\n"
                f"   workflow.py log-freebet {offer['id']} "
                f"--event \"<match>\" --back-odds <O> --lay-odds <L>")
    return ("need_qualifying",
            f"STEP 1 — place the qualifying bet for {offer['bookmaker']} "
            f"(min odds {offer['min_odds']}). First size it with:\n"
            f"   workflow.py calc --type qualifying --back-stake <S> "
            f"--back-odds <O> --lay-odds <L>\n"
            f"   then: workflow.py log-qualifying {offer['id']} "
            f"--event \"<match>\" --back-odds <O> --back-stake <S> --lay-odds <L>")


# --------------------------------------------------------------------------
# commands
# --------------------------------------------------------------------------
def cmd_seed(args, cfg, ledger):
    with open(os.path.join(HERE, "offers.yaml")) as f:
        data = yaml.safe_load(f)
    added = ledger.seed_offers(data["offers"])
    print(f"Seeded {added} new offer(s). Total offers now: "
          f"{len(ledger.list_offers())}")


def cmd_status(args, cfg, ledger):
    target = cfg["bankroll"]["target_profit_eur"]
    s = ledger.summary(target)
    print(f"\n{'ID':>3}  {'BOOKMAKER':<14}{'TYPE':<14}{'BONUS':>7}  {'STATUS':<12}STEP")
    print("-" * 78)
    for o in ledger.list_offers():
        state, _ = offer_state(ledger, o)
        print(f"{o['id']:>3}  {o['bookmaker']:<14}{o['offer_type']:<14}"
              f"€{o['bonus_eur']:>5.0f}  {o['status']:<12}{state}")
    bar_len = 24
    filled = int(min(s["pct_to_target"], 100) / 100 * bar_len)
    bar = "█" * filled + "░" * (bar_len - filled)
    print("-" * 78)
    print(f"Locked profit: €{s['locked_profit']:.2f}  |  target €{target:.0f}  "
          f"[{bar}] {s['pct_to_target']:.1f}%")
    print(f"Offers: {s['offers_done']} done / {s['offers_todo']} to do  |  "
          f"{s['bets_logged']} bets logged\n")
    if getattr(args, "telegram", False):
        msg = (f"<b>Matched betting</b>\nLocked: €{s['locked_profit']:.2f} / "
               f"€{target:.0f} ({s['pct_to_target']:.1f}%)\n"
               f"{s['offers_done']} done, {s['offers_todo']} to go")
        print("Telegram:", "sent ✅" if notify.send(cfg, msg) else "not configured")


def cmd_next(args, cfg, ledger):
    # first finish anything in progress, else start the biggest todo
    for o in ledger.list_offers():
        state, msg = offer_state(ledger, o)
        if state == "await_freebet":
            print(f"\n>>> Finish offer #{o['id']} ({o['bookmaker']}):\n{msg}\n")
            return
    o = ledger.next_todo()
    if not o:
        print("\nNo offers left to do. 🎉 Run `status` to see your total.\n")
        return
    state, msg = offer_state(ledger, o)
    print(f"\n>>> Next offer #{o['id']} — {o['bookmaker']} "
          f"(€{o['bonus_eur']:.0f}, min odds {o['min_odds']}):\n{msg}")
    print(f"   T&Cs: {o['verify_url']}  —  VERIFY current terms first!\n")
    if getattr(args, "telegram", False):
        tmsg = (f"<b>Next offer:</b> {o['bookmaker']} €{o['bonus_eur']:.0f} "
                f"(min odds {o['min_odds']})\n{o['verify_url']}")
        print("Telegram:", "sent ✅" if notify.send(cfg, tmsg) else "not configured")


def cmd_calc(args, cfg, ledger):
    comm = args.commission if args.commission is not None else cfg["exchange"]["commission"]
    r = calculator.calc(args.back_stake, args.back_odds, args.lay_odds,
                        commission=comm, bet_type=args.type)
    kind = "FREE BET" if args.type == "freebet" else "qualifying"
    print(f"\n[{kind}] back €{args.back_stake:.2f} @ {args.back_odds} | "
          f"exchange commission {comm:.0%}")
    print(f"  -> LAY €{r.lay_stake:.2f} @ {args.lay_odds} on "
          f"{cfg['exchange']['name']} (liability €{r.liability:.2f})")
    print(f"  back wins: {r.profit_if_back_wins:+.2f}  |  "
          f"back loses: {r.profit_if_back_loses:+.2f}")
    tag = f"  ({r.retention_pct}% of free bet)" if args.type == "freebet" else ""
    print(f"  LOCKED: €{r.locked_profit:+.2f}{tag}\n")
    return r


def cmd_start(args, cfg, ledger):
    o = ledger.get_offer(args.offer_id)
    if not o:
        print(f"No offer #{args.offer_id}"); return
    ledger.set_status(args.offer_id, "in_progress")
    print(f"Offer #{args.offer_id} ({o['bookmaker']}) marked in_progress.")


def cmd_log_qualifying(args, cfg, ledger):
    o = ledger.get_offer(args.offer_id)
    if not o:
        print(f"No offer #{args.offer_id}"); return
    comm = cfg["exchange"]["commission"]
    r = calculator.calc(args.back_stake, args.back_odds, args.lay_odds,
                        commission=comm, bet_type="qualifying")
    r.lay_odds = args.lay_odds
    ledger.add_bet(args.offer_id, "qualifying", r, event=args.event,
                   back_odds=args.back_odds, back_stake=args.back_stake,
                   commission=comm)
    ledger.set_status(args.offer_id, "in_progress")
    print(f"Logged qualifying bet for #{args.offer_id}: LAY €{r.lay_stake:.2f} "
          f"@ {args.lay_odds} (qualifying loss €{r.locked_profit:+.2f}).")
    _, msg = offer_state(ledger, ledger.get_offer(args.offer_id))
    print(msg)


def cmd_log_freebet(args, cfg, ledger):
    o = ledger.get_offer(args.offer_id)
    if not o:
        print(f"No offer #{args.offer_id}"); return
    comm = cfg["exchange"]["commission"]
    stake = args.back_stake if args.back_stake else o["bonus_eur"]
    r = calculator.calc(stake, args.back_odds, args.lay_odds,
                        commission=comm, bet_type="freebet")
    r.lay_odds = args.lay_odds
    ledger.add_bet(args.offer_id, "freebet", r, event=args.event,
                   back_odds=args.back_odds, back_stake=stake, commission=comm)
    ledger.set_status(args.offer_id, "done")
    print(f"Logged free bet for #{args.offer_id}: LAY €{r.lay_stake:.2f} "
          f"@ {args.lay_odds} -> LOCKED €{r.locked_profit:+.2f}. Offer DONE ✅")


def _ask(prompt, cast=str, default=None):
    raw = input(prompt).strip()
    if not raw and default is not None:
        return default
    return cast(raw)


def cmd_run(args, cfg, ledger):
    """Interactive guided mode — prompts you through the current offer."""
    # finish an in-progress offer first, else start the biggest todo
    target_offer = None
    for o in ledger.list_offers():
        state, _ = offer_state(ledger, o)
        if state == "await_freebet":
            target_offer = o
            break
    if not target_offer:
        target_offer = ledger.next_todo()
    if not target_offer:
        print("\nNo offers left to do. 🎉\n")
        return

    o = target_offer
    state, _ = offer_state(ledger, o)
    comm = cfg["exchange"]["commission"]
    ex = cfg["exchange"]["name"]
    print(f"\n=== Offer #{o['id']} — {o['bookmaker']} "
          f"(€{o['bonus_eur']:.0f}, min odds {o['min_odds']}) ===")
    print(f"Verify current T&Cs: {o['verify_url']}")

    if state == "need_qualifying":
        print("\n-- STEP 1: QUALIFYING BET --")
        print("Find a match, note the BACK odds at the bookie and the LAY odds "
              f"on {ex} (as close as possible).")
        bs = _ask("Back stake € (e.g. 50): ", float)
        bo = _ask("Back odds at bookie (e.g. 3.0): ", float)
        lo = _ask(f"Lay odds on {ex} (e.g. 3.05): ", float)
        ev = _ask("Match (optional): ", str, default="")
        r = calculator.calc(bs, bo, lo, commission=comm, bet_type="qualifying")
        print(f"\n  >> LAY €{r.lay_stake:.2f} @ {lo} on {ex} "
              f"(liability €{r.liability:.2f})")
        print(f"  >> Qualifying loss either way: €{r.locked_profit:+.2f}")
        if _ask("\nPlaced both bets? Log it? [y/N]: ", str, "n").lower() == "y":
            r.lay_odds = lo
            ledger.add_bet(o["id"], "qualifying", r, event=ev,
                           back_odds=bo, back_stake=bs, commission=comm)
            ledger.set_status(o["id"], "in_progress")
            print("Logged. Once the bonus lands, run `run` again for the free bet.")
    elif state == "await_freebet":
        print("\n-- STEP 2: FREE BET --")
        print(f"Confirm the €{o['bonus_eur']:.0f} free bet is credited. Pick a "
              "higher-odds selection (more retention).")
        bs = _ask(f"Free bet value € [{o['bonus_eur']:.0f}]: ",
                  float, default=o["bonus_eur"])
        bo = _ask("Back odds at bookie (e.g. 6.0): ", float)
        lo = _ask(f"Lay odds on {ex} (e.g. 6.1): ", float)
        ev = _ask("Match (optional): ", str, default="")
        r = calculator.calc(bs, bo, lo, commission=comm, bet_type="freebet")
        print(f"\n  >> LAY €{r.lay_stake:.2f} @ {lo} on {ex} "
              f"(liability €{r.liability:.2f})")
        print(f"  >> LOCKED PROFIT either way: €{r.locked_profit:+.2f} "
              f"({r.retention_pct}% of free bet)")
        if _ask("\nPlaced both bets? Log it? [y/N]: ", str, "n").lower() == "y":
            r.lay_odds = lo
            ledger.add_bet(o["id"], "freebet", r, event=ev,
                           back_odds=bo, back_stake=bs, commission=comm)
            ledger.set_status(o["id"], "done")
            print("Offer DONE ✅  Run `status` to see your total.")


def cmd_export(args, cfg, ledger):
    import csv
    out = cfg["paths"]["csv_export"]
    out = out if os.path.isabs(out) else os.path.join(HERE, out)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    rows = ledger.all_bets()
    cols = ["id", "offer_id", "leg", "event", "selection", "back_odds",
            "back_stake", "lay_odds", "lay_stake", "liability", "commission",
            "locked_profit", "result", "created_at"]
    with open(out, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(cols)
        for r in rows:
            w.writerow([r[c] for c in cols])
    print(f"Exported {len(rows)} bets to {out}")
    if cfg.get("google_sheets", {}).get("enabled"):
        _export_gsheet(cfg, cols, rows)


def _export_gsheet(cfg, cols, rows):
    try:
        import gspread
        gc = gspread.service_account(
            filename=os.path.join(HERE, cfg["google_sheets"]["credentials_file"]))
        sh = gc.open_by_key(cfg["google_sheets"]["spreadsheet_id"])
        ws = sh.worksheet(cfg["google_sheets"]["worksheet"])
        ws.clear()
        ws.append_row(cols)
        for r in rows:
            ws.append_row([r[c] for c in cols])
        print("Also pushed to Google Sheet.")
    except Exception as e:  # noqa: BLE001
        print(f"(Google Sheet export skipped: {e})")


# --------------------------------------------------------------------------
def build_parser():
    p = argparse.ArgumentParser(description="Matched-betting dynamic workflow")
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("seed")
    sub.add_parser("run")
    st = sub.add_parser("status"); st.add_argument("--telegram", action="store_true")
    nx = sub.add_parser("next"); nx.add_argument("--telegram", action="store_true")
    sub.add_parser("export")

    c = sub.add_parser("calc")
    c.add_argument("--type", choices=["qualifying", "freebet"], required=True)
    c.add_argument("--back-stake", type=float, required=True)
    c.add_argument("--back-odds", type=float, required=True)
    c.add_argument("--lay-odds", type=float, required=True)
    c.add_argument("--commission", type=float, default=None)

    s = sub.add_parser("start"); s.add_argument("offer_id", type=int)

    q = sub.add_parser("log-qualifying")
    q.add_argument("offer_id", type=int)
    q.add_argument("--event", default="")
    q.add_argument("--back-odds", type=float, required=True)
    q.add_argument("--back-stake", type=float, required=True)
    q.add_argument("--lay-odds", type=float, required=True)

    fb = sub.add_parser("log-freebet")
    fb.add_argument("offer_id", type=int)
    fb.add_argument("--event", default="")
    fb.add_argument("--back-odds", type=float, required=True)
    fb.add_argument("--back-stake", type=float, default=0.0,
                    help="defaults to the offer's bonus amount")
    fb.add_argument("--lay-odds", type=float, required=True)
    return p


DISPATCH = {
    "seed": cmd_seed, "run": cmd_run, "status": cmd_status, "next": cmd_next,
    "calc": cmd_calc, "start": cmd_start, "log-qualifying": cmd_log_qualifying,
    "log-freebet": cmd_log_freebet, "export": cmd_export,
}


def main(argv=None):
    args = build_parser().parse_args(argv)
    cfg = load_config()
    ledger = Ledger(_db_path(cfg))
    DISPATCH[args.cmd](args, cfg, ledger)


if __name__ == "__main__":
    main()
