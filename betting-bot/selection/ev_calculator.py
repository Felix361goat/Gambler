import logging
from typing import Optional

logger = logging.getLogger(__name__)


def calculate_ev(our_probability: float, decimal_odds: float) -> float:
    """
    EV = (our_probability * decimal_odds) - 1
    Example: P=0.55, Odds=2.10 → (0.55 * 2.10) - 1 = +0.155 = +15.5%
    """
    if our_probability <= 0 or our_probability >= 1:
        return 0.0
    if decimal_odds <= 1.0:
        return 0.0
    return round((our_probability * decimal_odds) - 1.0, 6)


def find_best_odds(match_id: str, market: str, odds_api_data: list) -> tuple[float, str]:
    """
    Line shopping: scan all bookmakers, return best odds.
    Improves ROI by 1-2% over using single bookmaker.
    Returns (best_odds, bookmaker_name).
    """
    best_odds = 0.0
    best_bookmaker = "unknown"

    if not odds_api_data:
        return best_odds, best_bookmaker

    for entry in odds_api_data:
        if entry.get("match_id") != match_id:
            continue
        if entry.get("market") != market:
            continue
        odds = entry.get("odds")
        bookmaker = entry.get("bookmaker", "unknown")
        if odds and odds > best_odds:
            best_odds = odds
            best_bookmaker = bookmaker

    return best_odds, best_bookmaker


def calculate_clv(bet_odds: float, closing_odds: float) -> float:
    """
    Closing Line Value: were our odds better than closing line?
    Positive CLV = we found value. Best model health metric.
    CLV = (bet_odds / closing_odds) - 1
    """
    if not closing_odds or closing_odds <= 1.0:
        return 0.0
    if not bet_odds or bet_odds <= 1.0:
        return 0.0
    return round((bet_odds / closing_odds) - 1.0, 6)


def implied_probability(decimal_odds: float) -> float:
    """Convert decimal odds to implied probability (no vig removed)."""
    if decimal_odds <= 1.0:
        return 1.0
    return round(1.0 / decimal_odds, 6)


def remove_vig(odds_list: list[float]) -> list[float]:
    """Remove bookmaker's margin from a set of odds for a market."""
    if not odds_list:
        return odds_list
    implied = [1.0 / o for o in odds_list if o > 1.0]
    overround = sum(implied)
    if overround <= 0:
        return odds_list
    return [round(p / overround, 6) for p in implied]
