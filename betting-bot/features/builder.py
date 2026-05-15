import logging
from typing import Optional
import pandas as pd

from features.form import calculate_team_form
from features.xg_features import calculate_xg_features
from features.context import calculate_context_features
from features.squad import calculate_squad_features
from features.referee import get_referee_modifier
from features.h2h import calculate_h2h_features
from features.odds_movement import calculate_movement_features

logger = logging.getLogger(__name__)


class FeatureBuilder:
    def __init__(self, db, config: dict):
        self.db = db
        self.config = config
        self.form_weights = config.get("model", {}).get("form_weights", {})

    def build_match_features(
        self,
        match: dict,
        historical_matches: Optional[pd.DataFrame] = None,
        xg_data: Optional[pd.DataFrame] = None,
        injury_data: Optional[list] = None,
        market_values: Optional[dict] = None,
        team_schedule: Optional[dict] = None,
        news_sentiment: Optional[dict] = None,
    ) -> dict:
        home = match.get("home_team", "")
        away = match.get("away_team", "")
        match_id = match.get("match_id", "")
        available_features = []
        imputed_features = []

        features = {}

        # Form features
        try:
            if historical_matches is not None and not historical_matches.empty:
                home_form = calculate_team_form(home, historical_matches, self.form_weights)
                away_form = calculate_team_form(away, historical_matches, self.form_weights)
                available_features.append("form")
            else:
                from features.form import _empty_form
                home_form = _empty_form()
                away_form = _empty_form()
                imputed_features.append("form")
            for k, v in home_form.items():
                features[f"home_{k}"] = v
            for k, v in away_form.items():
                features[f"away_{k}"] = v
        except Exception as e:
            logger.warning(f"Form features failed: {e}")
            imputed_features.append("form")

        # xG features
        try:
            if xg_data is not None and not xg_data.empty:
                home_xg = calculate_xg_features(home, xg_data)
                away_xg = calculate_xg_features(away, xg_data)
                available_features.append("xg")
            else:
                from features.xg_features import _empty_xg
                home_xg = _empty_xg()
                away_xg = _empty_xg()
                imputed_features.append("xg")
            for k, v in home_xg.items():
                features[f"home_{k}"] = v
            for k, v in away_xg.items():
                features[f"away_{k}"] = v
        except Exception as e:
            logger.warning(f"xG features failed: {e}")
            imputed_features.append("xg")

        # Context features
        try:
            schedule = team_schedule or {}
            ctx = calculate_context_features(match, schedule)
            features.update(ctx)
            available_features.append("context")
        except Exception as e:
            logger.warning(f"Context features failed: {e}")
            imputed_features.append("context")

        # Squad features
        try:
            home_squad = calculate_squad_features(home, injury_data, market_values)
            away_squad = calculate_squad_features(away, injury_data, market_values)
            for k, v in home_squad.items():
                features[f"home_{k}"] = v
            for k, v in away_squad.items():
                features[f"away_{k}"] = v
            available_features.append("squad")
        except Exception as e:
            logger.warning(f"Squad features failed: {e}")
            imputed_features.append("squad")

        # Referee features
        try:
            referee = match.get("referee", "")
            league = match.get("league", "")
            ref_mod = get_referee_modifier(referee, league, self.db)
            for k, v in ref_mod.items():
                features[f"referee_{k}"] = v
            available_features.append("referee")
        except Exception as e:
            logger.warning(f"Referee features failed: {e}")
            imputed_features.append("referee")

        # H2H features
        try:
            if historical_matches is not None and not historical_matches.empty:
                h2h = calculate_h2h_features(home, away, historical_matches)
                available_features.append("h2h")
            else:
                from features.h2h import _empty_h2h
                h2h = _empty_h2h()
                imputed_features.append("h2h")
            features.update(h2h)
        except Exception as e:
            logger.warning(f"H2H features failed: {e}")
            imputed_features.append("h2h")

        # Odds movement
        try:
            movement = calculate_movement_features(match_id, self.db)
            features.update(movement)
            available_features.append("odds_movement")
        except Exception as e:
            logger.warning(f"Odds movement features failed: {e}")
            imputed_features.append("odds_movement")

        # News sentiment
        try:
            if news_sentiment:
                features["news_sentiment_modifier"] = max(-0.10, min(0.05, news_sentiment.get("net_sentiment_modifier", 0.0)))
                available_features.append("news")
            else:
                features["news_sentiment_modifier"] = 0.0
                imputed_features.append("news")
        except Exception:
            features["news_sentiment_modifier"] = 0.0

        # Replace None values with 0
        features = {k: (v if v is not None else 0) for k, v in features.items()}

        logger.debug(
            f"Features built for {home} vs {away}: "
            f"available={available_features}, imputed={imputed_features}"
        )

        return features
