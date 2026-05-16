import math
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Default K-factor per sport.  ELO ratings change faster in sports where
# individual performance swings are large (tennis surface changes, small
# basketball rosters) and slower in deep-squad sports (top soccer).
# These are overridden by config.yaml model.elo_k_factors when available.
DEFAULT_K_FACTORS = {
    "tennis":          48,   # High — surface changes + form swings are large
    "hockey":          28,   # Moderate — team sport, goalie variance is high
    "basketball":      40,   # Higher — small rosters, one player = big impact
    "soccer":          32,   # Standard Elo K for association football
    "soccer_lower":    36,   # Slightly higher — more volatility, thinner data
}

# Home advantage in ELO rating points per sport.
# Tennis WTA/ITF: essentially zero (neutral venues, no crowd effect at ITF M15)
# All others retain a home advantage.
DEFAULT_HOME_ADVANTAGE = {
    "tennis":          0,
    "hockey":          80,
    "basketball":      70,
    "soccer":          100,
    "soccer_lower":    90,
}


class EloModel:
    """ELO rating model with sport-specific K-factors and home advantage.

    Ratings are stored in a flat dict keyed by team/player name.  A new
    entity starts at DEFAULT_RATING (1500).

    For sports where Poisson is disabled (tennis, basketball) the ELO model
    carries a larger share of the ensemble weight, so surface-correct ratings
    are essential for tennis.
    """

    def __init__(self, config: Optional[dict] = None):
        self.ratings: dict[str, float] = {}
        self.DEFAULT_RATING = 1500.0

        # Load sport-specific parameters from config if provided
        cfg_k      = (config or {}).get("model", {}).get("elo_k_factors", {})
        cfg_ha     = (config or {}).get("model", {}).get("elo_home_advantage", {})

        self._k_factors = {**DEFAULT_K_FACTORS, **cfg_k}
        self._home_advantages = {**DEFAULT_HOME_ADVANTAGE, **cfg_ha}

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _k(self, sport: str) -> float:
        """Return K-factor for the given sport."""
        return self._k_factors.get(sport, DEFAULT_K_FACTORS["soccer"])

    def _ha(self, sport: str) -> float:
        """Return home-advantage ELO points for the given sport."""
        return self._home_advantages.get(sport, DEFAULT_HOME_ADVANTAGE["soccer"])

    def get_rating(self, team: str) -> float:
        return self.ratings.get(team, self.DEFAULT_RATING)

    def _expected_score(self, rating_a: float, rating_b: float) -> float:
        return 1.0 / (1.0 + 10 ** ((rating_b - rating_a) / 400.0))

    # ------------------------------------------------------------------
    # Rating updates
    # ------------------------------------------------------------------

    def update_ratings(self, match_result: dict, sport: str = "soccer"):
        """Update ELO ratings after a completed match.

        For tennis the 'home_team' / 'away_team' keys map to player1/player2.
        Goals/sets are used only to determine the winner (not their magnitude).
        """
        home = match_result.get("home_team", "")
        away = match_result.get("away_team", "")

        # Determine winner.  Tennis results arrive as sets won, which live in
        # the same home_goals/away_goals keys after normalization.
        home_score = match_result.get("home_goals", 0)
        away_score = match_result.get("away_goals", 0)

        k = self._k(sport)
        ha = self._ha(sport)

        r_home_eff = self.get_rating(home) + ha   # effective rating with HA
        r_away_eff = self.get_rating(away)

        e_home = self._expected_score(r_home_eff, r_away_eff)
        e_away = 1.0 - e_home

        if home_score > away_score:
            s_home, s_away = 1.0, 0.0
        elif home_score < away_score:
            s_home, s_away = 0.0, 1.0
        else:
            s_home, s_away = 0.5, 0.5

        self.ratings[home] = self.get_rating(home) + k * (s_home - e_home)
        self.ratings[away] = self.get_rating(away) + k * (s_away - e_away)

    # ------------------------------------------------------------------
    # Prediction
    # ------------------------------------------------------------------

    def predict_match(self, home_team: str, away_team: str, sport: str = "soccer") -> dict:
        """Return 1x2 win probabilities for the given match.

        Tennis has no draw (matches are played to a winner), so draw_prob is
        forced to 0 for tennis and the probability is split between the two
        players only.
        """
        ha = self._ha(sport)
        r_home = self.get_rating(home_team) + ha
        r_away = self.get_rating(away_team)

        e_home = self._expected_score(r_home, r_away)

        if sport == "tennis":
            # No draws in tennis — straight win/loss split
            draw_prob = 0.0
            home_win_prob = e_home
            away_win_prob = 1.0 - e_home
        else:
            # Approximate draw probability using Bradley-Terry model extension.
            # Draw probability is highest when teams are evenly matched.
            draw_prob = 0.30 * (1 - abs(e_home - 0.5) * 2)
            remaining = 1.0 - draw_prob
            home_win_prob = e_home * remaining / (e_home + (1 - e_home))
            away_win_prob = remaining - home_win_prob

        # Normalize to ensure sum == 1.0 despite float arithmetic
        total = home_win_prob + draw_prob + away_win_prob
        return {
            "home_win_prob": round(home_win_prob / total, 4),
            "draw_prob":     round(draw_prob / total, 4),
            "away_win_prob": round(away_win_prob / total, 4),
            "home_elo":      round(self.get_rating(home_team), 1),
            "away_elo":      round(self.get_rating(away_team), 1),
        }

    # ------------------------------------------------------------------
    # Fitting from historical data
    # ------------------------------------------------------------------

    def fit(self, historical_matches, sport: str = "soccer"):
        """Replay historical matches in chronological order to build ratings."""
        import pandas as pd
        if not isinstance(historical_matches, pd.DataFrame) or historical_matches.empty:
            logger.warning("EloModel.fit(): no historical data provided")
            return

        if "date" in historical_matches.columns:
            historical_matches = historical_matches.sort_values("date")

        n_processed = 0
        for _, row in historical_matches.iterrows():
            status = row.get("status", "")
            if status in ("FINISHED", "FT", "finished", "complete", ""):
                self.update_ratings(dict(row), sport=sport)
                n_processed += 1

        logger.info(
            f"ELO fitted [{sport}] on {n_processed} matches, "
            f"{len(self.ratings)} entities rated"
        )
