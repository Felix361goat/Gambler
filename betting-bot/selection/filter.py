import logging
from datetime import datetime, timezone
from typing import Optional
import pytz

logger = logging.getLogger(__name__)

AUSTRIAN_TZ = pytz.timezone("Europe/Vienna")


def select_daily_bets(all_predictions: list, config: dict, week_watchable_count: int) -> list:
    """
    LAYER 1: Hard filter — EV >= min_ev_threshold (3%)
    LAYER 2: Sort by EV descending, take top 10
    LAYER 3: Tiebreaker by league priority (only within 0.5% EV)
    LAYER 4: Watchable flag for preferred leagues
    LAYER 5: Favorite club override (80% threshold)
    """
    betting_cfg = config.get("betting", {})
    leagues_cfg = config.get("leagues", {})
    clubs_cfg = config.get("favorite_clubs", [])

    min_ev = betting_cfg.get("min_ev_threshold", 0.03)
    watchable_ev = betting_cfg.get("watchable_ev_threshold", 0.024)
    max_bets = betting_cfg.get("max_daily_bets", 10)
    ev_override = betting_cfg.get("ev_override_factor", 0.80) if isinstance(clubs_cfg, dict) else 0.80

    # Handle favorite_clubs being list vs dict (as in config.yaml)
    if isinstance(clubs_cfg, dict):
        favorite_clubs = clubs_cfg.get("clubs", [])
        ev_override = clubs_cfg.get("ev_override_factor", 0.80)
    elif isinstance(clubs_cfg, list):
        favorite_clubs = clubs_cfg
        ev_override = config.get("favorite_clubs_ev_override", 0.80)
    else:
        favorite_clubs = []

    priority_leagues = leagues_cfg.get("priority", [])
    watchable_preferred = leagues_cfg.get("watchable_preferred", [])
    watchable_max = leagues_cfg.get("watchable_max_per_week", 3)
    kickoff_window = leagues_cfg.get("watchable_kickoff_window", {"earliest_hour": 17, "latest_hour": 23})

    # LAYER 1: Hard EV filter
    qualified = []
    for pred in all_predictions:
        ev = pred.get("ev_score", 0.0)
        home = pred.get("home_team", "")
        away = pred.get("away_team", "")
        is_fav = any(club in [home, away] for club in favorite_clubs)
        threshold = min_ev * ev_override if is_fav else min_ev
        if ev >= threshold:
            pred["is_favorite_club"] = is_fav
            qualified.append(pred)

    if not qualified:
        return []

    # LAYER 2: Sort by EV descending
    qualified.sort(key=lambda x: x.get("ev_score", 0.0), reverse=True)

    # LAYER 3: Stable tiebreaker within 0.5% EV groups
    def priority_score(pred):
        league = pred.get("league", "")
        try:
            return priority_leagues.index(league)
        except ValueError:
            return len(priority_leagues)

    def sort_key(pred):
        ev = pred.get("ev_score", 0.0)
        ev_bucket = round(ev / 0.005) * 0.005  # bucket by 0.5%
        return (-ev_bucket, priority_score(pred))

    qualified.sort(key=sort_key)

    # Take top max_bets
    selected = qualified[:max_bets]

    # LAYER 4: Watchable flag
    current_week_watchable = week_watchable_count
    for pred in selected:
        league = pred.get("league", "")
        ev = pred.get("ev_score", 0.0)
        kickoff = pred.get("kickoff_time")

        pred["is_watchable"] = False
        pred["watchable_reason"] = None

        if (
            league in watchable_preferred
            and ev >= watchable_ev
            and current_week_watchable < watchable_max
        ):
            kickoff_ok = _check_kickoff_window(kickoff, kickoff_window)
            if kickoff_ok:
                pred["is_watchable"] = True
                pred["watchable_reason"] = f"Preferred league ({league}) in watchable window"
                current_week_watchable += 1

    # LAYER 5: Tag favorite clubs
    for pred in selected:
        home = pred.get("home_team", "")
        away = pred.get("away_team", "")
        if any(club in [home, away] for club in favorite_clubs):
            pred["is_favorite_club"] = True

    return selected


def _check_kickoff_window(kickoff, window: dict) -> bool:
    """Check if kickoff is within the Austrian time window."""
    if not kickoff:
        return True  # Unknown kickoff — don't block

    if isinstance(kickoff, str):
        try:
            kickoff = datetime.fromisoformat(kickoff)
        except Exception:
            return True

    if kickoff.tzinfo is None:
        kickoff = kickoff.replace(tzinfo=timezone.utc)

    try:
        kickoff_at = kickoff.astimezone(AUSTRIAN_TZ)
        hour = kickoff_at.hour
        earliest = window.get("earliest_hour", 17)
        latest = window.get("latest_hour", 23)
        return earliest <= hour <= latest
    except Exception:
        return True
