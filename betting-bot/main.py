#!/usr/bin/env python3
"""
Autonomous Sports Betting Prediction Bot — Main Entry Point

Usage:
  python main.py --setup          First-time setup
  python main.py --collect        Fetch all data sources
  python main.py --predict        Run prediction engine
  python main.py --brief          Send morning briefing via Telegram
  python main.py --odds_snapshot  Save current odds snapshot to DB
  python main.py --summarize      Send evening summary via Telegram
  python main.py --retrain        Retrain all models
  python main.py --weekly_report  Send weekly report
  python main.py --test           Run all tests
  python main.py --paper_status   Print current paper mode statistics
"""
import argparse
import logging
import os
import sys
from datetime import date
from pathlib import Path

# Add project root to path
ROOT = Path(__file__).parent
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv
import yaml

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(ROOT / "data" / "betting.log", mode="a"),
    ],
)
logger = logging.getLogger("main")


def load_config() -> dict:
    config_path = ROOT / "config.yaml"
    if not config_path.exists():
        logger.error("config.yaml not found")
        sys.exit(1)
    with open(config_path) as f:
        raw = yaml.safe_load(f)
    # Resolve env vars in string values
    import re
    def resolve(obj):
        if isinstance(obj, str):
            return re.sub(r"\$\{(\w+)\}", lambda m: os.environ.get(m.group(1), m.group(1)), obj)
        if isinstance(obj, dict):
            return {k: resolve(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [resolve(i) for i in obj]
        return obj
    return resolve(raw)


def cmd_setup(config: dict):
    """First-time setup: DB, verify API keys, install cron jobs."""
    print("🔧 Running first-time setup...")

    # Create directories
    for d in ["data", "data/sources"]:
        (ROOT / d).mkdir(parents=True, exist_ok=True)

    # Init DB
    from tracking.database import DatabaseHandler
    db = DatabaseHandler()
    print("✅ Database initialized")

    # Verify API keys
    required_env = ["FOOTBALL_API_KEY", "ODDS_API_KEY", "TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"]
    missing = [k for k in required_env if not os.environ.get(k) or os.environ.get(k, "").startswith("your_")]
    if missing:
        print(f"⚠️  Missing environment variables: {', '.join(missing)}")
        print("   Fill in your .env file and run --setup again")
    else:
        print("✅ All API keys found")

    # Sheets setup (optional)
    sheets_id = os.environ.get("GOOGLE_SHEET_ID", "")
    creds_file = ROOT / config.get("google_sheets", {}).get("credentials_file", "google_credentials.json")
    if sheets_id and creds_file.exists():
        from tracking.sheets import SheetsHandler
        sheets = SheetsHandler(config)
        if sheets.connect():
            print("✅ Google Sheets connected")
        else:
            print("⚠️  Google Sheets connection failed (optional — continuing)")
    else:
        print("⚠️  Google Sheets skipped (no credentials or sheet ID)")

    # Install cron jobs
    from scheduler.cron_setup import install_cron_jobs
    install_cron_jobs(ROOT / "main.py")

    print("\n✅ Setup complete! Paper mode starts tomorrow at 08:30.")


def cmd_collect(config: dict):
    """Fetch all data sources."""
    from data.collector import DataCollector
    from tracking.database import DatabaseHandler

    db = DatabaseHandler()
    collector = DataCollector(config, db)
    result = collector.collect_all()
    print(result.summary())
    return result


def cmd_predict(config: dict):
    """Run prediction engine and store daily bets."""
    from tracking.database import DatabaseHandler
    from data.collector import DataCollector
    from features.builder import FeatureBuilder
    from models.poisson_model import PoissonModel
    from models.elo_model import EloModel
    from models.xgboost_model import XGBoostModel
    from models.ensemble import EnsembleModel
    from selection.ev_calculator import calculate_ev, find_best_odds
    from selection.kelly import kelly_stake
    from selection.filter import select_daily_bets
    from tracking.performance import PerformanceTracker

    db = DatabaseHandler()
    collector = DataCollector(config, db)

    # Load historical data for models
    logger.info("Loading training data...")
    training_data = db.get_bets_for_retraining()

    # Initialize models
    poisson = PoissonModel()
    elo = EloModel()
    xgboost = XGBoostModel()

    # Try to load pre-trained XGBoost
    if not xgboost.load():
        logger.info("No pre-trained XGBoost found — using Poisson + ELO only")

    # Fit on historical match data if available
    collection = collector.collect_all()
    matches_df = getattr(collection, "matches", None)

    if matches_df is not None and not matches_df.empty:
        logger.info("Fitting Poisson and ELO models...")
        poisson.fit(matches_df)
        elo.fit(matches_df)

    ensemble = EnsembleModel(poisson, xgboost, elo, config)
    feature_builder = FeatureBuilder(db, config)
    tracker = PerformanceTracker(db, config)
    bankroll = tracker.get_current_bankroll()

    # Get upcoming matches
    upcoming = getattr(collection, "upcoming", None)
    if upcoming is None or (hasattr(upcoming, "empty") and upcoming.empty):
        logger.warning("No upcoming matches found")
        print("No upcoming matches to predict")
        return []

    # Generate predictions
    predictions = []
    odds_data = getattr(collection, "odds", []) or []

    for _, match in (upcoming.iterrows() if hasattr(upcoming, "iterrows") else []):
        match_dict = dict(match)
        match_id = match_dict.get("match_id", "")
        home = match_dict.get("home_team", "")
        away = match_dict.get("away_team", "")

        if not home or not away:
            continue

        try:
            features = feature_builder.build_match_features(
                match_dict,
                historical_matches=matches_df,
                xg_data=getattr(collection, "xg", None),
                injury_data=getattr(collection, "injuries", None),
                market_values=getattr(collection, "squad_values", None),
                team_schedule=getattr(collection, "schedules", None),
                news_sentiment=getattr(collection, "news", {}).get(f"{home}_{away}"),
            )

            prediction = ensemble.predict(home, away, features)
            if prediction is None:
                continue

            # Check all markets
            markets = {
                "1x2_home": prediction.get("home_win_prob", 0),
                "1x2_draw": prediction.get("draw_prob", 0),
                "1x2_away": prediction.get("away_win_prob", 0),
                "over_2.5": prediction.get("over_25_prob", 0),
                "under_2.5": prediction.get("under_25_prob", 0),
                "btts": prediction.get("btts_prob", 0),
            }

            for market, our_prob in markets.items():
                best_odds, bookmaker = find_best_odds(match_id, market, odds_data)
                if best_odds <= 1.0:
                    continue

                ev = calculate_ev(our_prob, best_odds)
                if ev <= 0:
                    continue

                stake = kelly_stake(our_prob, best_odds, bankroll, config)
                kelly_frac = (best_odds - 1) * our_prob - (1 - our_prob)
                kelly_frac = kelly_frac / (best_odds - 1) if best_odds > 1 else 0

                bet_dict = {
                    "match_date": match_dict.get("date", str(date.today())),
                    "match_id": match_id,
                    "league": match_dict.get("league", ""),
                    "home_team": home,
                    "away_team": away,
                    "market": market,
                    "our_probability": our_prob,
                    "bookmaker_odds": best_odds,
                    "bookmaker_name": bookmaker,
                    "ev_score": ev,
                    "confidence_score": prediction.get("confidence_score", 50),
                    "stake_recommended": stake,
                    "kelly_fraction": kelly_frac,
                    "kickoff_time": match_dict.get("kickoff_time"),
                }
                predictions.append(bet_dict)

        except Exception as e:
            logger.error(f"Prediction failed for {home} vs {away}: {e}")
            continue

    # Apply selection filter
    week_watchable = _get_week_watchable_count(db)
    selected = select_daily_bets(predictions, config, week_watchable)

    # Store in DB
    for bet in selected:
        bet_copy = {k: v for k, v in bet.items() if k not in ("kickoff_time",)}
        db.insert_bet(bet_copy)

    logger.info(f"Generated {len(selected)} bets from {len(predictions)} candidates")
    print(f"✅ {len(selected)} bets generated (from {len(predictions)} candidates with positive EV)")
    return selected


def _get_week_watchable_count(db) -> int:
    """Count watchable bets placed this week."""
    try:
        with db._get_conn() as conn:
            count = conn.execute(
                """SELECT COUNT(*) FROM bets
                   WHERE is_watchable = 1
                   AND match_date >= date('now', 'weekday 0', '-7 days')"""
            ).fetchone()[0]
            return count or 0
    except Exception:
        return 0


def cmd_brief(config: dict):
    """Send morning briefing via Telegram."""
    from tracking.database import DatabaseHandler
    from tracking.performance import PerformanceTracker
    from notifications.morning_briefing import format_morning_briefing
    from notifications.telegram_bot import TelegramBotHandler

    db = DatabaseHandler()
    tracker = PerformanceTracker(db, config)
    bets = db.get_pending_bets(date.today())
    perf = tracker.get_full_summary()
    perf["starting_bankroll"] = config.get("betting", {}).get("bankroll_paper", 1000.0)

    message = format_morning_briefing(bets, perf)
    bot = TelegramBotHandler(config, db)
    success = bot.send_message_sync(message)

    if success:
        print("✅ Morning briefing sent")
    else:
        print("❌ Failed to send morning briefing")
    return success


def cmd_odds_snapshot(config: dict):
    """Save current odds snapshot to DB."""
    from tracking.database import DatabaseHandler
    from data.sources.odds_api import OddsAPISource

    db = DatabaseHandler()
    source = OddsAPISource(config)
    data = source.fetch_and_normalize()

    if data is None or (hasattr(data, "empty") and data.empty):
        print("⚠️  No odds data retrieved")
        return

    count = 0
    for _, row in (data.iterrows() if hasattr(data, "iterrows") else []):
        snapshot = {
            "match_id": row.get("match_id", ""),
            "bookmaker": row.get("bookmaker", ""),
            "market": row.get("market", ""),
            "odds_home": row.get("odds_home"),
            "odds_draw": row.get("odds_draw"),
            "odds_away": row.get("odds_away"),
            "odds_over": row.get("odds_over"),
            "odds_under": row.get("odds_under"),
        }
        if db.insert_odds_snapshot(snapshot):
            count += 1

    print(f"✅ Saved {count} odds snapshots")


def cmd_summarize(config: dict):
    """Send evening summary via Telegram."""
    from tracking.database import DatabaseHandler
    from tracking.performance import PerformanceTracker
    from notifications.evening_summary import format_evening_summary
    from notifications.telegram_bot import TelegramBotHandler

    db = DatabaseHandler()
    tracker = PerformanceTracker(db, config)
    bets = db.get_pending_bets(date.today())
    # Include placed bets too
    try:
        with db._get_conn() as conn:
            rows = conn.execute(
                "SELECT * FROM bets WHERE match_date = ?", (str(date.today()),)
            ).fetchall()
            all_bets = [dict(r) for r in rows]
    except Exception:
        all_bets = bets

    db.update_daily_performance(date.today())
    perf_today = {"pnl_daily": 0.0}
    perf_total = tracker.get_full_summary()

    message = format_evening_summary(all_bets, perf_today, perf_total)
    bot = TelegramBotHandler(config, db)
    success = bot.send_message_sync(message)

    if success:
        print("✅ Evening summary sent")
    else:
        print("❌ Failed to send evening summary")


def cmd_retrain(config: dict):
    """Retrain all models."""
    from tracking.database import DatabaseHandler
    from models.poisson_model import PoissonModel
    from models.elo_model import EloModel
    from models.xgboost_model import XGBoostModel
    from models.ensemble import EnsembleModel
    from models.retrainer import ModelRetrainer
    from tracking.sheets import SheetsHandler

    db = DatabaseHandler()
    poisson = PoissonModel()
    elo = EloModel()
    xgboost = XGBoostModel()
    xgboost.load()
    ensemble = EnsembleModel(poisson, xgboost, elo, config)

    sheets = None
    try:
        sheets = SheetsHandler(config)
        sheets.connect()
    except Exception:
        pass

    retrainer = ModelRetrainer(db, ensemble, sheets, config)
    success = retrainer.retrain_weekly()
    print("✅ Retraining complete" if success else "⚠️  Retraining skipped (insufficient data)")


def cmd_weekly_report(config: dict):
    """Send weekly report via Telegram."""
    from tracking.database import DatabaseHandler
    from tracking.performance import PerformanceTracker
    from notifications.weekly_report import format_weekly_report
    from notifications.telegram_bot import TelegramBotHandler

    db = DatabaseHandler()
    tracker = PerformanceTracker(db, config)
    perf = tracker.get_full_summary()
    message = format_weekly_report(perf)
    bot = TelegramBotHandler(config, db)
    success = bot.send_message_sync(message)
    print("✅ Weekly report sent" if success else "❌ Failed to send weekly report")


def cmd_test():
    """Run all tests."""
    import subprocess
    result = subprocess.run(
        [sys.executable, "-m", "pytest", str(ROOT / "tests"), "-v", "--tb=short"],
        cwd=str(ROOT),
    )
    return result.returncode == 0


def cmd_paper_status(config: dict):
    """Print current paper mode statistics."""
    from tracking.database import DatabaseHandler
    from tracking.performance import PerformanceTracker

    db = DatabaseHandler()
    tracker = PerformanceTracker(db, config)
    summary = tracker.get_full_summary()

    roi_emoji = "🟢" if summary["roi"] > 3 else ("🟡" if summary["roi"] >= 0 else "🔴")
    print(f"\n{'='*40}")
    print(f"  PAPER MODE STATUS")
    print(f"{'='*40}")
    print(f"  Bankroll:    €{summary['bankroll']:.2f}")
    print(f"  ROI:         {summary['roi']:+.2f}% {roi_emoji}")
    print(f"  Total P&L:   €{summary['total_pnl']:+.2f}")
    print(f"  Settled:     {summary['settled_bets']}/200 bets")
    print(f"  Win Rate:    {summary['win_rate']:.1f}%")
    print(f"  Max DD:      €{summary['max_drawdown']:.2f}")
    print(f"  Ready Live:  {'YES ✅' if summary['ready_for_live'] else 'NO ❌'}")
    print(f"{'='*40}\n")
    return summary


def main():
    # Ensure log dir exists before logging starts
    log_dir = ROOT / "data"
    log_dir.mkdir(parents=True, exist_ok=True)

    parser = argparse.ArgumentParser(description="Sports Betting Bot")
    parser.add_argument("--setup", action="store_true")
    parser.add_argument("--collect", action="store_true")
    parser.add_argument("--predict", action="store_true")
    parser.add_argument("--brief", action="store_true")
    parser.add_argument("--odds_snapshot", action="store_true")
    parser.add_argument("--summarize", action="store_true")
    parser.add_argument("--retrain", action="store_true")
    parser.add_argument("--weekly_report", action="store_true")
    parser.add_argument("--test", action="store_true")
    parser.add_argument("--paper_status", action="store_true")
    args = parser.parse_args()

    if args.test:
        success = cmd_test()
        sys.exit(0 if success else 1)

    config = load_config()

    if args.setup:
        cmd_setup(config)
    elif args.collect:
        cmd_collect(config)
    elif args.predict:
        cmd_predict(config)
    elif args.brief:
        cmd_brief(config)
    elif args.odds_snapshot:
        cmd_odds_snapshot(config)
    elif args.summarize:
        cmd_summarize(config)
    elif args.retrain:
        cmd_retrain(config)
    elif args.weekly_report:
        cmd_weekly_report(config)
    elif args.paper_status:
        cmd_paper_status(config)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
