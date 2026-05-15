import math
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class EloModel:
    K_FACTOR = 32
    HOME_ADVANTAGE = 100  # ELO points bonus for home team

    def __init__(self):
        self.ratings: dict[str, float] = {}
        self.DEFAULT_RATING = 1500.0

    def get_rating(self, team: str) -> float:
        return self.ratings.get(team, self.DEFAULT_RATING)

    def _expected_score(self, rating_a: float, rating_b: float) -> float:
        return 1.0 / (1.0 + 10 ** ((rating_b - rating_a) / 400.0))

    def update_ratings(self, match_result: dict):
        home = match_result.get("home_team", "")
        away = match_result.get("away_team", "")
        home_goals = match_result.get("home_goals", 0)
        away_goals = match_result.get("away_goals", 0)

        r_home = self.get_rating(home) + self.HOME_ADVANTAGE
        r_away = self.get_rating(away)

        e_home = self._expected_score(r_home, r_away)
        e_away = 1.0 - e_home

        if home_goals > away_goals:
            s_home, s_away = 1.0, 0.0
        elif home_goals < away_goals:
            s_home, s_away = 0.0, 1.0
        else:
            s_home, s_away = 0.5, 0.5

        self.ratings[home] = self.get_rating(home) + self.K_FACTOR * (s_home - e_home)
        self.ratings[away] = self.get_rating(away) + self.K_FACTOR * (s_away - e_away)

    def predict_match(self, home_team: str, away_team: str) -> dict:
        r_home = self.get_rating(home_team) + self.HOME_ADVANTAGE
        r_away = self.get_rating(away_team)

        e_home = self._expected_score(r_home, r_away)

        # Approximate draw probability using Bradley-Terry model extension
        draw_prob = 0.30 * (1 - abs(e_home - 0.5) * 2)
        remaining = 1.0 - draw_prob
        home_win_prob = e_home * remaining / (e_home + (1 - e_home))
        away_win_prob = remaining - home_win_prob

        # Normalize
        total = home_win_prob + draw_prob + away_win_prob
        return {
            "home_win_prob": round(home_win_prob / total, 4),
            "draw_prob": round(draw_prob / total, 4),
            "away_win_prob": round(away_win_prob / total, 4),
            "home_elo": round(self.get_rating(home_team), 1),
            "away_elo": round(self.get_rating(away_team), 1),
        }

    def fit(self, historical_matches):
        import pandas as pd
        if isinstance(historical_matches, pd.DataFrame):
            if "date" in historical_matches.columns:
                historical_matches = historical_matches.sort_values("date")
            for _, row in historical_matches.iterrows():
                if row.get("status") in ("FINISHED", "FT", "finished"):
                    self.update_ratings(dict(row))
        logger.info(f"ELO fitted on {len(historical_matches)} matches, {len(self.ratings)} teams")
