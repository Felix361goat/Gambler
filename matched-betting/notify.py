"""
Optional Telegram push. Reuses the same bot token/chat id as the prediction
bot (set in config.yaml via ${TELEGRAM_BOT_TOKEN}/${TELEGRAM_CHAT_ID}).
Silently no-ops if not configured, so the workflow never breaks without it.
"""
import json
import urllib.parse
import urllib.request


def send(cfg, text):
    tg = cfg.get("telegram", {}) or {}
    token = (tg.get("bot_token") or "").strip()
    chat = (tg.get("chat_id") or "").strip()
    # unresolved ${ENV} or empty -> disabled
    if not token or not chat or token.startswith("${") or chat.startswith("${"):
        return False
    try:
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        data = urllib.parse.urlencode(
            {"chat_id": chat, "text": text, "parse_mode": "HTML"}).encode()
        req = urllib.request.Request(url, data=data)
        resp = json.load(urllib.request.urlopen(req, timeout=10))
        return bool(resp.get("ok"))
    except Exception as e:  # noqa: BLE001
        print(f"(Telegram push failed: {e})")
        return False
