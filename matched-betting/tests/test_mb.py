"""Tests for the matched-betting calculator and ledger."""
import os
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
PKG = os.path.dirname(HERE)
sys.path.insert(0, PKG)

import calculator                # noqa: E402
from ledger import Ledger        # noqa: E402


def approx(a, b, tol=0.05):
    return abs(a - b) <= tol


def test_qualifying_is_balanced():
    """A qualifying bet must lock the SAME outcome whichever side wins."""
    r = calculator.calc(50, 3.0, 3.05, commission=0.02, bet_type="qualifying")
    assert approx(r.profit_if_back_wins, r.profit_if_back_loses)
    # small expected qualifying loss, not a profit
    assert -3 < r.locked_profit < 0


def test_freebet_retention_in_band():
    """A free bet (stake not returned) should retain ~70-85% of its value."""
    r = calculator.calc(50, 6.0, 6.1, commission=0.02, bet_type="freebet")
    assert approx(r.profit_if_back_wins, r.profit_if_back_loses)
    assert 70 <= r.retention_pct <= 85
    assert r.locked_profit > 30


def test_zero_commission_better():
    """0% commission promos must retain more than 2% commission."""
    a = calculator.calc(50, 6.0, 6.1, commission=0.00, bet_type="freebet")
    b = calculator.calc(50, 6.0, 6.1, commission=0.02, bet_type="freebet")
    assert a.locked_profit > b.locked_profit


def test_lay_stake_positive():
    r = calculator.calc(20, 2.5, 2.6, commission=0.05, bet_type="qualifying")
    assert r.lay_stake > 0 and r.liability > 0


def test_dutch_freebet_balanced():
    """Dutching a free bet at a 2nd bookmaker equalises both outcomes."""
    r = calculator.dutch(50, 4.0, 1.36, bet_type="freebet")
    assert approx(r.profit_if_back_wins, r.profit_if_hedge_wins)
    assert 70 <= r.retention_pct <= 85
    assert r.hedge_stake > 0


def test_dutch_qualifying_small_cost():
    """A dutched qualifying bet on tight 2-way odds is near break-even."""
    r = calculator.dutch(25, 2.05, 1.98, bet_type="qualifying")
    assert approx(r.profit_if_back_wins, r.profit_if_hedge_wins)
    assert r.total_outlay > 0


def test_ledger_seed_and_summary():
    with tempfile.TemporaryDirectory() as d:
        lg = Ledger(os.path.join(d, "t.db"))
        n = lg.seed_offers([
            {"bookmaker": "X", "offer_type": "free_bet", "bonus_eur": 50,
             "min_odds": 2.0, "status": "todo"},
            {"bookmaker": "Y", "offer_type": "bet_get", "bonus_eur": 100,
             "min_odds": 2.0, "status": "todo"},
        ])
        assert n == 2
        # idempotent: seeding again adds nothing
        assert lg.seed_offers([
            {"bookmaker": "X", "offer_type": "free_bet", "bonus_eur": 50}]) == 0

        offer = lg.next_todo()
        assert offer["bookmaker"] == "Y"  # higher bonus first

        q = calculator.calc(50, 3.0, 3.05, bet_type="qualifying")
        q.lay_odds = 3.05
        lg.add_bet(offer["id"], "qualifying", q, back_odds=3.0, back_stake=50)
        fb = calculator.calc(100, 6.0, 6.1, bet_type="freebet")
        fb.lay_odds = 6.1
        lg.add_bet(offer["id"], "freebet", fb, back_odds=6.0, back_stake=100)
        lg.set_status(offer["id"], "done")

        s = lg.summary(target=1500)
        assert s["offers_done"] == 1
        assert s["bets_logged"] == 2
        # net should be qualifying loss + freebet profit, clearly positive
        assert s["locked_profit"] > 50


if __name__ == "__main__":
    import traceback
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    passed = 0
    for fn in fns:
        try:
            fn(); print(f"PASS {fn.__name__}"); passed += 1
        except Exception:  # noqa: BLE001
            print(f"FAIL {fn.__name__}"); traceback.print_exc()
    print(f"\n{passed}/{len(fns)} passed")
    sys.exit(0 if passed == len(fns) else 1)
