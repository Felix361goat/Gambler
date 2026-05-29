"""
Matched-betting back/lay calculator.

You read the odds off the bookmaker and off Betfair Exchange, give them here,
and this tells you the EXACT lay stake to place and your locked-in profit
BEFORE you risk anything. No live odds API, nothing to rate-limit.

Two bet types:
  qualifying : a normal cash bet (your stake is returned if it wins). Used to
               trigger a bonus. Goal = lose as little as possible (~EUR 1-2).
  freebet    : a free bet where the STAKE IS NOT RETURNED ("SNR"). This is the
               bonus itself. Goal = lock in ~70-80% of the free-bet value.
"""
from dataclasses import dataclass


@dataclass
class Result:
    lay_stake: float          # how much to LAY on Betfair
    liability: float          # money Betfair ringfences for the lay
    profit_if_back_wins: float
    profit_if_back_loses: float
    locked_profit: float      # the (roughly equal) guaranteed outcome
    retention_pct: float      # for free bets: profit as % of free-bet value


def calc(back_stake, back_odds, lay_odds, commission=0.02, bet_type="qualifying"):
    """commission = exchange commission on net winnings (Betfair ~0.02-0.05)."""
    if bet_type == "freebet":
        # stake not returned: only the winnings count on the back side
        lay_stake = ((back_odds - 1) * back_stake) / (lay_odds - commission)
        back_win_profit = back_stake * (back_odds - 1)          # free stake not returned
        back_lose_loss = 0.0                                    # free bet cost nothing
    else:  # qualifying / normal cash bet
        lay_stake = (back_odds * back_stake) / (lay_odds - commission)
        back_win_profit = back_stake * (back_odds - 1)
        back_lose_loss = back_stake                             # you lose your cash stake

    liability = lay_stake * (lay_odds - 1)

    # If the backed selection WINS: bookie pays out, exchange loses (we pay liability)
    p_back_wins = back_win_profit - liability
    # If the backed selection LOSES: bookie keeps stake, exchange pays us lay winnings
    p_back_loses = lay_stake * (1 - commission) - back_lose_loss

    locked = min(p_back_wins, p_back_loses)
    fb_value = back_stake if bet_type == "freebet" else 0.0
    retention = (locked / fb_value * 100) if fb_value else 0.0

    return Result(
        lay_stake=round(lay_stake, 2),
        liability=round(liability, 2),
        profit_if_back_wins=round(p_back_wins, 2),
        profit_if_back_loses=round(p_back_loses, 2),
        locked_profit=round(locked, 2),
        retention_pct=round(retention, 1),
    )


# --------------------------------------------------------------------------
# AUSTRIA MODE: no betting exchange available -> hedge at a SECOND bookmaker.
# Instead of laying, you BACK the opposite outcome at another bookie. Works on
# 2-outcome markets (tennis, over/under 2.5, both-teams-to-score yes/no).
# --------------------------------------------------------------------------
@dataclass
class DutchResult:
    hedge_stake: float           # cash to back the OPPOSITE outcome at bookie B
    profit_if_back_wins: float   # your selection at bookie A wins
    profit_if_hedge_wins: float  # the opposite outcome at bookie B wins
    locked_profit: float         # the (roughly equal) guaranteed outcome
    retention_pct: float         # for free bets: profit as % of free-bet value
    total_outlay: float          # cash you must put down (excl. the free bet)


def dutch(back_stake, back_odds, hedge_odds, bet_type="qualifying"):
    """
    back_odds  = odds of YOUR selection at bookie A.
    hedge_odds = odds of the OPPOSITE outcome at bookie B (best you can find).
    """
    if bet_type == "freebet":
        # free bet on A (stake not returned); hedge with cash at B
        hedge_stake = back_stake * (back_odds - 1) / hedge_odds
        p_back_wins = back_stake * (back_odds - 1) - hedge_stake
        p_hedge_wins = hedge_stake * (hedge_odds - 1)
        outlay = hedge_stake
    else:  # qualifying: cash on A, cash hedge on B
        hedge_stake = back_stake * back_odds / hedge_odds
        p_back_wins = back_stake * (back_odds - 1) - hedge_stake
        p_hedge_wins = hedge_stake * (hedge_odds - 1) - back_stake
        outlay = back_stake + hedge_stake

    locked = min(p_back_wins, p_hedge_wins)
    fb = back_stake if bet_type == "freebet" else 0.0
    return DutchResult(
        hedge_stake=round(hedge_stake, 2),
        profit_if_back_wins=round(p_back_wins, 2),
        profit_if_hedge_wins=round(p_hedge_wins, 2),
        locked_profit=round(locked, 2),
        retention_pct=round(locked / fb * 100, 1) if fb else 0.0,
        total_outlay=round(outlay, 2),
    )


def rollover_retention(bonus, rollover, loss_rate=0.02, wager_deposit_too=False,
                       deposit=0.0):
    """
    Deposit-match bonus with a WAGERING requirement ("wager Nx before withdrawal").
    Models the multi-turnover reality the single-bet calc ignores.

    bonus        bonus amount granted
    rollover     turnover multiple (e.g. 5 = wager 5x)
    loss_rate    cost per €1 of turnover when each bet is hedged (~0.015-0.03
                 dutching at sensible odds; higher if min-odds are high)
    wager_deposit_too  some books require (deposit+bonus) x rollover
    Returns dict with total turnover, expected cost, retained profit, retention%.
    """
    base = bonus + (deposit if wager_deposit_too else 0.0)
    turnover = rollover * base
    expected_cost = turnover * loss_rate
    retained = bonus - expected_cost
    return {
        "turnover": round(turnover, 2),
        "expected_cost": round(expected_cost, 2),
        "retained_profit": round(retained, 2),
        "retention_pct": round(retained / bonus * 100, 1) if bonus else 0.0,
        "worth_it": retained > 0,
    }


def _demo():
    print("=== AUSTRIA MODE — hedge at a 2nd bookmaker (no exchange) ===\n")
    print("Use a 2-OUTCOME market (tennis / over-under 2.5 / BTTS yes-no).\n")

    print("FREE BET conversion: €50 free bet @ 4.0 (bookie A),")
    print("hedge the opposite outcome @ 1.36 (bookie B):")
    f = dutch(back_stake=50, back_odds=4.0, hedge_odds=1.36, bet_type="freebet")
    print(f"  -> BACK €{f.hedge_stake} on the opposite outcome at bookie B")
    print(f"  A wins: {f.profit_if_back_wins:+.2f} | B wins: {f.profit_if_hedge_wins:+.2f}")
    print(f"  LOCKED: €{f.locked_profit:+.2f}  ({f.retention_pct}% of the free bet)")
    print(f"  Cash you put down: €{f.total_outlay}\n")

    print("QUALIFYING bet: €25 @ 2.10 (bookie A), hedge @ 2.05 (bookie B):")
    q = dutch(back_stake=25, back_odds=2.10, hedge_odds=2.05, bet_type="qualifying")
    print(f"  -> BACK €{q.hedge_stake} on the opposite outcome at bookie B")
    print(f"  A wins: {q.profit_if_back_wins:+.2f} | B wins: {q.profit_if_hedge_wins:+.2f}")
    print(f"  Qualifying cost: €{q.locked_profit:+.2f} (small, due to bookie margins)")


if __name__ == "__main__":
    _demo()
