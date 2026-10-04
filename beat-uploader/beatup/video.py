"""Render the upload video: still cover + audio (+ optional animated waveform)."""
import subprocess


def render(image_path, audio_path, out_path, width=1920, height=1080, waveform=True):
    wave_h = int(height * 0.07)
    if waveform:
        filt = (
            f"[0:v]scale={width}:{height},format=yuv420p[bg];"
            f"[1:a]showwaves=s={width}x{wave_h}:mode=cline:rate=30:scale=sqrt:draw=full:colors=white@0.8,format=rgba[w];"
            f"[bg][w]overlay=0:{height - wave_h - int(height * 0.02)}:shortest=1,format=yuv420p[v]"
        )
    else:
        filt = f"[0:v]scale={width}:{height},format=yuv420p[v]"

    cmd = [
        "ffmpeg", "-y", "-v", "error",
        "-loop", "1", "-framerate", "30", "-i", str(image_path),
        "-i", str(audio_path),
        "-filter_complex", filt, "-map", "[v]", "-map", "1:a",
        "-c:v", "libx264", "-preset", "veryfast", "-tune", "stillimage", "-crf", "23",
        "-c:a", "aac", "-b:a", "320k",
        "-shortest", "-movflags", "+faststart",
        str(out_path),
    ]
    subprocess.run(cmd, check=True)
    return out_path
