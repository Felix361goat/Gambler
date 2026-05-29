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


def _demo():
    print("=== Worked example: 'Bet EUR 50, get EUR 50 free bet' ===\n")

    print("STEP 1 - Qualifying bet (unlock the bonus):")
    q = calc(back_stake=50, back_odds=3.0, lay_odds=3.05, commission=0.02,
             bet_type="qualifying")
    print(f"  Back EUR 50 @ 3.0 at the bookie")
    print(f"  -> LAY EUR {q.lay_stake} @ 3.05 on Betfair (liability EUR {q.liability})")
    print(f"  If back wins: {q.profit_if_back_wins:+.2f} | if back loses: {q.profit_if_back_loses:+.2f}")
    print(f"  Qualifying loss (cost to unlock bonus): EUR {q.locked_profit:+.2f}\n")

    print("STEP 2 - Free bet (lock in the profit):")
    f = calc(back_stake=50, back_odds=6.0, lay_odds=6.1, commission=0.02,
             bet_type="freebet")
    print(f"  Back EUR 50 FREE BET @ 6.0 at the bookie")
    print(f"  -> LAY EUR {f.lay_stake} @ 6.1 on Betfair (liability EUR {f.liability})")
    print(f"  If back wins: {f.profit_if_back_wins:+.2f} | if back loses: {f.profit_if_back_loses:+.2f}")
    print(f"  Locked profit: EUR {f.locked_profit:+.2f}  ({f.retention_pct}% of free bet)\n")

    total = q.locked_profit + f.locked_profit
    print(f"=== NET on this offer: EUR {total:+.2f} (guaranteed, any result) ===")


if __name__ == "__main__":
    _demo()
