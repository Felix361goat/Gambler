"""YouTube upload via the official YouTube Data API v3 (OAuth, your own Google account)."""
from pathlib import Path

SCOPES = ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube"]


def get_service(base_dir):
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build

    base_dir = Path(base_dir)
    token_file = base_dir / "token.json"
    secrets = sorted(base_dir.glob("client_secret*.json"))

    creds = None
    if token_file.exists():
        creds = Credentials.from_authorized_user_file(str(token_file), SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not secrets:
                raise SystemExit(
                    "Keine client_secret.json gefunden. Siehe README → 'YouTube einrichten'."
                )
            flow = InstalledAppFlow.from_client_secrets_file(str(secrets[0]), SCOPES)
            creds = flow.run_local_server(port=0)
        token_file.write_text(creds.to_json())
    return build("youtube", "v3", credentials=creds)


def upload(service, video_path, thumb_path, title, description, tags, yt_cfg, publish_at=None):
    from googleapiclient.errors import HttpError
    from googleapiclient.http import MediaFileUpload

    status = {
        "privacyStatus": yt_cfg.get("privacy", "public"),
        "selfDeclaredMadeForKids": yt_cfg.get("made_for_kids", False),
    }
    if publish_at:
        # Scheduled videos must be uploaded as private
        status["privacyStatus"] = "private"
        status["publishAt"] = publish_at

    body = {
        "snippet": {
            "title": title,
            "description": description,
            "tags": tags,
            "categoryId": yt_cfg.get("category_id", "10"),
        },
        "status": status,
    }
    media = MediaFileUpload(str(video_path), mimetype="video/mp4", chunksize=8 * 1024 * 1024, resumable=True)
    request = service.videos().insert(part="snippet,status", body=body, media_body=media)

    response = None
    while response is None:
        progress, response = request.next_chunk()
        if progress:
            print(f"   Upload: {int(progress.progress() * 100)}%", end="\r", flush=True)
    video_id = response["id"]
    print(f"   Upload: 100%  → https://youtu.be/{video_id}")

    try:
        service.thumbnails().set(videoId=video_id, media_body=MediaFileUpload(str(thumb_path))).execute()
    except HttpError as e:
        print(f"   ⚠ Thumbnail konnte nicht gesetzt werden (Kanal muss verifiziert sein): {e.reason}")
    return video_id
