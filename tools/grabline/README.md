# Grabline

A self-hosted video downloader you use from your phone's browser. Paste a link
from most any site, pick a quality, get the file.

It is a small [yt-dlp](https://github.com/yt-dlp/yt-dlp) + ffmpeg server that
also serves its own mobile web app. Around **1750 sites** have dedicated
support, and links from thousands more work through the generic extractor.

Nothing here talks to a third-party service. The server is yours.

---

## Why it's a server and not just a web page

Pulling media off a page means fetching that page, finding the real stream URL,
and usually merging separate video and audio tracks with ffmpeg. A browser tab
can't do any of that: cross-origin rules block the fetch, and there is no muxer
in a tab. So the extraction runs on a server, and the server hands you the app.

Because the app is served from that same origin, the Save button is a real
download — no CORS, no sandbox, no "open in a new tab and long-press" dance.

---

## Run it

### On your own machine (simplest, and the most reliable)

```bash
cd tools/grabline
./serve.sh
```

Then open `http://<your-computer's-LAN-ip>:7860` on your phone, on the same
Wi-Fi. Requires Python 3.9+ and ffmpeg (`brew install ffmpeg` /
`sudo apt install ffmpeg`).

Running it at home rather than in a datacentre also means sites see an ordinary
residential connection, which avoids most bot checks.

### With Docker

```bash
cd tools/grabline
docker build -t grabline .
docker run -p 7860:7860 grabline
```

### Free hosting, reachable anywhere

| Host | Cost | Notes |
| --- | --- | --- |
| **Hugging Face Spaces** | free, no card | Create a Space → SDK **Docker** → upload `Dockerfile`, `app.py`, `ui.html`, `requirements.txt`, and `deploy/space-README.md` renamed to `README.md`. Your app is at `https://<user>-<space>.hf.space`. |
| **Render** | free tier | `deploy/render.yaml`. Sleeps after 15 min idle and takes ~30s to wake. |
| **Fly.io** | free allowance | `deploy/fly.toml`. Scales to zero between downloads. |

Cloud hosts share IP ranges with a lot of bots, so some large sites will
challenge them. See **Sites that want a login** below.

Add the app to your home screen (Share → Add to Home Screen) and it behaves
like an installed app.

---

## What it does

- **Any quality the site offers** — presets up to 4K, or pick an exact stream
  from the full format list, including HDR and high-frame-rate variants.
  Video-only streams get merged with the best audio automatically.
- **Audio extraction** — MP3, M4A, Opus, FLAC, WAV, or the site's original
  audio untouched, at a bitrate you choose.
- **Containers** — mp4, mkv, webm, or whatever came down the wire.
- **Subtitles** — burn them into the video or save them as separate `.srt`
  files, in any languages the site publishes (auto-captions included).
- **Metadata and cover art** — title, artist and chapters written into the
  file; thumbnail embedded as cover art.
- **Trim** — take just the span between two timestamps, cut on keyframes.
- **Playlists and channels** — whole thing, or a slice like `1-5,9,12-`.
- **SponsorBlock** — drop sponsor segments where the database has them.
- **Live progress** — percent, size, speed, ETA, and a stop button.

---

## Sites that want a login

Private videos, age-gated content, subscriber-only posts and most bot checks
are solved the same way: give the server your browser's cookies.

1. Export `cookies.txt` with any "Get cookies.txt" browser extension while
   logged in to that site.
2. Put the file where the server can read it.
3. Set `GRABLINE_COOKIES_FILE=/path/to/cookies.txt` and restart.

The **Server** panel in the app shows `cookies loaded` when it picked them up.

Treat that file like a password — it *is* your logged-in session. Don't put it
on shared hosting you don't control.

---

## Settings

All optional, all environment variables:

| Variable | Default | Meaning |
| --- | --- | --- |
| `PORT` | `7860` | Port to listen on |
| `GRABLINE_API_KEY` | _unset_ | Require `Authorization: Api-Key <key>`. Set this if the server is reachable from the internet. |
| `GRABLINE_COOKIES_FILE` | _unset_ | Path to a `cookies.txt` |
| `GRABLINE_FILE_TTL` | `3600` | Seconds a finished file stays downloadable |
| `GRABLINE_CONCURRENCY` | `2` | Simultaneous downloads |
| `GRABLINE_MAX_DURATION` | `0` | Reject media longer than N seconds (0 = no limit) |
| `GRABLINE_WORK_DIR` | system temp | Where files are staged |

Finished files are deleted after `GRABLINE_FILE_TTL`, and a sweeper clears
orphaned directories after a restart.

---

## API

The app is just a client of this. Everything returns JSON; errors are
`{"error": "..."}`.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/` | the web app |
| `GET` | `/api` | version, ffmpeg state, supported-site count |
| `GET` | `/health` | liveness, active job count |
| `GET` | `/extractors?q=` | search supported sites |
| `POST` | `/probe` | inspect a link: title, formats, subtitles, playlist entries |
| `POST` | `/jobs` | start a download → `{job_id}` |
| `GET` | `/jobs/{id}` | state, progress, speed, eta, files |
| `DELETE` | `/jobs/{id}` | cancel a running job, or delete a finished one |
| `GET` | `/files/{id}` | the finished file |

Interactive docs at `/docs`.

```bash
curl -X POST http://localhost:7860/jobs \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://…","mode":"audio","audio_format":"mp3"}'
```

File downloads are authorised by the unguessable job id rather than the API
key, because a browser navigating to a file can't send a header.

---

## Keeping it working

Sites change; yt-dlp keeps up, usually within days. When something breaks:

```bash
cd tools/grabline && .venv/bin/pip install -U yt-dlp
```

On Docker hosts, rebuild — the image pulls the current release. If a
Hugging Face Space goes stale, use its **Factory rebuild**.

---

## What's tested, and what isn't

Verified end to end in a real browser at phone width: the job pipeline
(create → progress → file), byte-identical file delivery, the format list,
audio/video panes, playlist and trim options, cancel, cleanup, error
reporting, path-traversal rejection, and both colour themes.

**Not** verified here: live extraction from real sites and the ffmpeg
postprocessing paths (merge, audio conversion). The build environment this was
written in blocks outbound traffic and ships no usable ffmpeg, so those rely on
yt-dlp's and ffmpeg's own behaviour rather than a test run. Expect the first
real download to be the true proof.

---

## Fair use

Your own recordings, Creative Commons work and public-domain material are fair
game. Paid catalogues and DRM-protected streams are not, and most sites' terms
forbid ripping them. Grabline doesn't police what you paste — that part is
yours.
