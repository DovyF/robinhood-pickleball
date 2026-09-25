"""
Grabline server — a small HTTP wrapper around yt-dlp.

Gives a browser front end what a browser cannot do for itself: extract media
from a page, transcode or merge it with ffmpeg, and hand back a real file.

Endpoints
    GET    /                  service banner + capability summary
    GET    /health            liveness, yt-dlp and ffmpeg versions
    GET    /extractors?q=     search the supported-site list
    POST   /probe             inspect a URL: title, formats, subtitles, playlist entries
    POST   /jobs              start a download; returns a job id
    GET    /jobs/{id}         job state, progress, speed, eta
    GET    /jobs              recent jobs
    DELETE /jobs/{id}         cancel and delete a job with its files
    GET    /files/{id}        download the finished file
    GET    /files/{id}/{name} download one file of a multi-file job

Auth is off unless GRABLINE_API_KEY is set, in which case every endpoint but
/ and /health wants `Authorization: Api-Key <key>`.
"""

from __future__ import annotations

import os
import re
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.parse import quote

from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from pydantic import BaseModel, Field

import yt_dlp

# --------------------------------------------------------------------------- #
# configuration
# --------------------------------------------------------------------------- #

API_KEY = os.environ.get("GRABLINE_API_KEY", "").strip()
WORK_DIR = Path(os.environ.get("GRABLINE_WORK_DIR", tempfile.gettempdir())) / "grabline"
FILE_TTL_SECONDS = int(os.environ.get("GRABLINE_FILE_TTL", "3600"))
MAX_CONCURRENT = int(os.environ.get("GRABLINE_CONCURRENCY", "2"))
MAX_DURATION = int(os.environ.get("GRABLINE_MAX_DURATION", "0"))  # 0 = no limit
COOKIES_FILE = os.environ.get("GRABLINE_COOKIES_FILE", "").strip()
PUBLIC_URL = os.environ.get("GRABLINE_PUBLIC_URL", "").strip().rstrip("/")

WORK_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Grabline", version="1.0.0", docs_url="/docs")

# The front end is a static page on another origin and carries no cookies,
# so a wildcard origin with credentials off is the correct, safe setting.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Length"],
)


def require_key(authorization: Optional[str] = Header(default=None)) -> None:
    if not API_KEY:
        return
    supplied = (authorization or "").strip()
    for prefix in ("Api-Key ", "Bearer "):
        if supplied.lower().startswith(prefix.lower()):
            supplied = supplied[len(prefix):].strip()
            break
    if supplied != API_KEY:
        raise HTTPException(status_code=401, detail="api key missing or invalid")


# --------------------------------------------------------------------------- #
# job bookkeeping
# --------------------------------------------------------------------------- #

JOBS: Dict[str, Dict[str, Any]] = {}
JOBS_LOCK = threading.Lock()
POOL = ThreadPoolExecutor(max_workers=MAX_CONCURRENT)


def set_job(job_id: str, **fields: Any) -> None:
    with JOBS_LOCK:
        job = JOBS.get(job_id)
        if job is not None:
            job.update(fields)


def get_job(job_id: str) -> Dict[str, Any]:
    with JOBS_LOCK:
        job = JOBS.get(job_id)
        if job is None:
            raise HTTPException(status_code=404, detail="no such job")
        return dict(job)


class Cancelled(Exception):
    """Raised inside a yt-dlp hook to abort a running download."""


# --------------------------------------------------------------------------- #
# helpers
# --------------------------------------------------------------------------- #

SAFE_NAME = re.compile(r'[\\/:*?"<>|\x00-\x1f]+')


def safe_filename(name: str, fallback: str = "download") -> str:
    cleaned = SAFE_NAME.sub("_", (name or "").strip()).strip(". ")
    return cleaned[:180] or fallback


def ffmpeg_version() -> Optional[str]:
    binary = shutil.which("ffmpeg")
    if not binary:
        return None
    try:
        out = subprocess.run(
            [binary, "-version"], capture_output=True, text=True, timeout=10
        ).stdout
        return out.splitlines()[0] if out else "present"
    except Exception:
        return "present"


def human_size(num: Optional[int]) -> Optional[str]:
    if not num:
        return None
    step = 1024.0
    value = float(num)
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if value < step:
            return f"{value:.0f} {unit}" if unit == "B" else f"{value:.1f} {unit}"
        value /= step
    return f"{value:.1f} PB"


def base_ydl_opts() -> Dict[str, Any]:
    opts: Dict[str, Any] = {
        "quiet": True,
        "no_warnings": True,
        "noprogress": True,
        "noplaylist": False,
        "ignoreerrors": False,
        "retries": 5,
        "fragment_retries": 5,
        "socket_timeout": 30,
        "restrictfilenames": False,
        "windowsfilenames": True,
        # Announce a real browser; several sites reject the default UA.
        "http_headers": {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
            )
        },
    }
    if COOKIES_FILE and Path(COOKIES_FILE).is_file():
        opts["cookiefile"] = COOKIES_FILE
    return opts


def format_label(f: Dict[str, Any]) -> str:
    """A short human label for one yt-dlp format."""
    vcodec = (f.get("vcodec") or "none").split(".")[0]
    acodec = (f.get("acodec") or "none").split(".")[0]
    has_video = vcodec != "none"
    has_audio = acodec != "none"

    parts: List[str] = []
    if has_video:
        height = f.get("height")
        parts.append(f"{height}p" if height else (f.get("resolution") or "video"))
        fps = f.get("fps")
        if fps and fps >= 50:
            parts.append(f"{int(fps)}fps")
        if f.get("dynamic_range") and f["dynamic_range"] != "SDR":
            parts.append(f["dynamic_range"])
    else:
        abr = f.get("abr")
        parts.append(f"{int(abr)} kbps" if abr else "audio")

    parts.append(f.get("ext") or "")
    if has_video and not has_audio:
        parts.append("video only")
    elif has_audio and not has_video:
        parts.append("audio only")

    size = human_size(f.get("filesize") or f.get("filesize_approx"))
    if size:
        parts.append(size)
    return " · ".join(p for p in parts if p)


def describe_formats(info: Dict[str, Any]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for f in info.get("formats") or []:
        if f.get("format_note") == "storyboard" or (f.get("ext") == "mhtml"):
            continue
        vcodec = f.get("vcodec") or "none"
        acodec = f.get("acodec") or "none"
        if vcodec == "none" and acodec == "none":
            continue
        out.append(
            {
                "format_id": f.get("format_id"),
                "label": format_label(f),
                "ext": f.get("ext"),
                "height": f.get("height"),
                "fps": f.get("fps"),
                "vcodec": None if vcodec == "none" else vcodec,
                "acodec": None if acodec == "none" else acodec,
                "abr": f.get("abr"),
                "tbr": f.get("tbr"),
                "filesize": f.get("filesize") or f.get("filesize_approx"),
                "has_video": vcodec != "none",
                "has_audio": acodec != "none",
            }
        )
    # Best video first, then audio-only tracks.
    out.sort(
        key=lambda f: (
            0 if f["has_video"] else 1,
            -(f.get("height") or 0),
            -(f.get("tbr") or 0),
        )
    )
    return out


# --------------------------------------------------------------------------- #
# request models
# --------------------------------------------------------------------------- #


class ProbeRequest(BaseModel):
    url: str
    flat: bool = Field(default=False, description="list playlist entries without probing each")


class JobRequest(BaseModel):
    url: str
    mode: str = Field(default="video", pattern="^(video|audio|mute)$")
    quality: str = Field(default="1080", description="max height, or 'max'")
    format_id: Optional[str] = Field(default=None, description="exact yt-dlp format id")
    container: str = Field(default="mp4", pattern="^(mp4|mkv|webm|original)$")
    audio_format: str = Field(default="mp3", pattern="^(mp3|m4a|opus|vorbis|wav|flac|aac|best)$")
    audio_quality: str = Field(default="192", description="kbps for lossy audio")
    embed_subs: bool = False
    subtitle_langs: str = "en"
    write_subs: bool = False
    embed_thumbnail: bool = False
    embed_metadata: bool = True
    sponsorblock: bool = False
    playlist: bool = False
    playlist_items: Optional[str] = Field(default=None, description="e.g. 1-5,8")
    start_time: Optional[str] = None
    end_time: Optional[str] = None


# --------------------------------------------------------------------------- #
# building yt-dlp options from a request
# --------------------------------------------------------------------------- #


def build_opts(req: JobRequest, out_dir: Path, hook) -> Dict[str, Any]:
    opts = base_ydl_opts()
    opts["progress_hooks"] = [hook]
    opts["postprocessor_hooks"] = [hook]
    opts["paths"] = {"home": str(out_dir)}
    opts["outtmpl"] = {"default": "%(title).150B [%(id)s].%(ext)s"}
    opts["noplaylist"] = not req.playlist
    opts["writethumbnail"] = req.embed_thumbnail

    postprocessors: List[Dict[str, Any]] = []

    if req.mode == "audio":
        opts["format"] = req.format_id or "bestaudio/best"
        if req.audio_format != "best":
            pp: Dict[str, Any] = {
                "key": "FFmpegExtractAudio",
                "preferredcodec": req.audio_format,
            }
            if req.audio_format not in ("wav", "flac"):
                pp["preferredquality"] = req.audio_quality
            postprocessors.append(pp)
    else:
        if req.format_id:
            opts["format"] = req.format_id
        else:
            cap = "" if req.quality == "max" else f"[height<=?{req.quality}]"
            if req.mode == "mute":
                opts["format"] = f"bestvideo{cap}/best{cap}/best"
            else:
                opts["format"] = (
                    f"bestvideo{cap}+bestaudio/best{cap}/best"
                )
        if req.container != "original":
            opts["merge_output_format"] = req.container

    if req.embed_metadata:
        postprocessors.append(
            {"key": "FFmpegMetadata", "add_metadata": True, "add_chapters": True}
        )
    if req.embed_thumbnail:
        postprocessors.append({"key": "EmbedThumbnail", "already_have_thumbnail": False})

    if req.embed_subs or req.write_subs:
        opts["writesubtitles"] = True
        opts["writeautomaticsub"] = True
        opts["subtitleslangs"] = [s.strip() for s in req.subtitle_langs.split(",") if s.strip()]
        if req.embed_subs and req.mode != "audio":
            postprocessors.append({"key": "FFmpegEmbedSubtitle", "already_have_subtitle": req.write_subs})

    if req.sponsorblock:
        postprocessors.append({"key": "SponsorBlock", "categories": ["sponsor"], "when": "after_filter"})
        postprocessors.append({"key": "ModifyChapters", "remove_sponsor_segments": ["sponsor"]})

    if req.playlist_items:
        opts["playlist_items"] = req.playlist_items

    if req.start_time or req.end_time:
        # Keep only the requested span, cutting on keyframes.
        from yt_dlp.utils import parse_duration

        start = parse_duration(req.start_time) if req.start_time else 0.0
        end = parse_duration(req.end_time) if req.end_time else None
        if start is None:
            start = 0.0
        opts["download_ranges"] = lambda info, ydl, s=start, e=end: [
            {"start_time": s, "end_time": e if e is not None else float("inf")}
        ]
        opts["force_keyframes_at_cuts"] = True

    if postprocessors:
        opts["postprocessors"] = postprocessors

    if MAX_DURATION:
        def _too_long(info: Dict[str, Any]) -> Optional[str]:
            duration = info.get("duration")
            if duration and duration > MAX_DURATION:
                return f"longer than this server's limit of {MAX_DURATION}s"
            return None

        opts["match_filter"] = _too_long

    return opts


# --------------------------------------------------------------------------- #
# the worker
# --------------------------------------------------------------------------- #


def run_job(job_id: str, req: JobRequest) -> None:
    out_dir = WORK_DIR / job_id
    out_dir.mkdir(parents=True, exist_ok=True)

    def hook(d: Dict[str, Any]) -> None:
        current = get_job(job_id)
        if current.get("cancel_requested"):
            raise Cancelled()

        status = d.get("status")
        if status == "downloading":
            total = d.get("total_bytes") or d.get("total_bytes_estimate")
            done = d.get("downloaded_bytes") or 0
            percent = round(done / total * 100, 1) if total else None
            set_job(
                job_id,
                state="downloading",
                progress=percent,
                downloaded_bytes=done,
                total_bytes=total,
                speed=d.get("speed"),
                eta=d.get("eta"),
                fragment_index=d.get("fragment_index"),
                fragment_count=d.get("fragment_count"),
            )
        elif status == "finished":
            set_job(job_id, state="processing", progress=100.0, speed=None, eta=None)
        elif status == "started" or d.get("postprocessor"):
            set_job(job_id, state="processing", stage=d.get("postprocessor"))

    try:
        set_job(job_id, state="resolving", started_at=time.time())
        opts = build_opts(req, out_dir, hook)

        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(req.url, download=True)

        if info is None:
            raise RuntimeError("nothing could be extracted from that link")

        entries = info.get("entries") if isinstance(info, dict) else None
        title = info.get("title") or "download"

        files = sorted(
            [p for p in out_dir.rglob("*") if p.is_file() and not p.name.endswith(".part")],
            key=lambda p: p.stat().st_size,
            reverse=True,
        )
        # Loose thumbnails and subtitle sidecars are noise unless asked for.
        images = (".jpg", ".jpeg", ".png", ".webp")
        media = [p for p in files if p.suffix.lower() not in images] or files
        if req.write_subs:
            keep = media
        else:
            keep = [p for p in media if p.suffix.lower() not in (".vtt", ".srt", ".ass")] or media

        if not keep:
            raise RuntimeError("the download produced no file")

        listing = [
            {
                "name": p.name,
                "size": p.stat().st_size,
                "size_human": human_size(p.stat().st_size),
                "url": f"/files/{job_id}/{quote(p.name)}",
            }
            for p in keep
        ]

        set_job(
            job_id,
            state="done",
            progress=100.0,
            title=title,
            uploader=info.get("uploader") or info.get("channel"),
            duration=info.get("duration"),
            extractor=info.get("extractor_key") or info.get("extractor"),
            is_playlist=bool(entries),
            files=listing,
            primary=listing[0]["name"],
            download_url=f"/files/{job_id}",
            finished_at=time.time(),
        )

    except Cancelled:
        shutil.rmtree(out_dir, ignore_errors=True)
        set_job(job_id, state="cancelled", finished_at=time.time())
    except yt_dlp.utils.DownloadError as exc:
        set_job(job_id, state="error", error=clean_error(str(exc)), finished_at=time.time())
    except Exception as exc:  # noqa: BLE001 - surface anything to the client
        set_job(job_id, state="error", error=clean_error(str(exc)), finished_at=time.time())


ANSI = re.compile(r"\x1b\[[0-9;]*m")


def clean_error(message: str) -> str:
    text = ANSI.sub("", message).replace("ERROR: ", "").strip()
    # yt-dlp's hints are useful but long; keep the first sentence-ish chunk.
    text = re.sub(r"\s+", " ", text)
    if len(text) > 400:
        text = text[:400] + "…"
    return text


# --------------------------------------------------------------------------- #
# routes
# --------------------------------------------------------------------------- #


UI_FILE = Path(__file__).parent / "ui.html"


@app.get("/", response_class=HTMLResponse)
def ui() -> HTMLResponse:
    """The app itself. Served from the same origin as the API, so the page can
    call it without CORS and can start real downloads."""
    if UI_FILE.is_file():
        return HTMLResponse(UI_FILE.read_text(encoding="utf-8"))
    return HTMLResponse(
        "<h1>Grabline server</h1><p>Running, but ui.html is missing next to "
        "app.py. The API is at <a href='/api'>/api</a>.</p>",
        status_code=200,
    )


@app.get("/api")
def api_banner() -> Dict[str, Any]:
    return {
        "service": "grabline",
        "version": app.version,
        "yt_dlp": yt_dlp.version.__version__,
        "ffmpeg": ffmpeg_version(),
        "supported_sites": len(list(yt_dlp.extractor.gen_extractor_classes())),
        "auth_required": bool(API_KEY),
        "endpoints": ["/health", "/extractors", "/probe", "/jobs", "/files/{id}"],
        "ui": "/",
    }


@app.get("/health")
def health() -> Dict[str, Any]:
    ff = ffmpeg_version()
    with JOBS_LOCK:
        active = sum(1 for j in JOBS.values() if j["state"] in ("queued", "resolving", "downloading", "processing"))
    return {
        "ok": True,
        "yt_dlp": yt_dlp.version.__version__,
        "ffmpeg": ff,
        "ffmpeg_present": bool(ff),
        "python": sys.version.split()[0],
        "active_jobs": active,
        "cookies_loaded": bool(COOKIES_FILE and Path(COOKIES_FILE).is_file()),
    }


@app.get("/extractors", dependencies=[Depends(require_key)])
def extractors(q: str = Query(default="", max_length=80), limit: int = 60) -> Dict[str, Any]:
    needle = q.strip().lower()
    names: List[str] = []
    total = 0
    for cls in yt_dlp.extractor.gen_extractor_classes():
        name = cls.IE_NAME
        if not name or name.lower() == "generic":
            continue
        total += 1
        if needle and needle not in name.lower():
            continue
        names.append(name)
    names.sort(key=str.lower)
    return {"total": total, "matched": len(names), "extractors": names[:limit]}


@app.post("/probe", dependencies=[Depends(require_key)])
def probe(req: ProbeRequest) -> Dict[str, Any]:
    opts = base_ydl_opts()
    opts["noplaylist"] = False
    if req.flat:
        opts["extract_flat"] = "in_playlist"
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(req.url, download=False)
    except yt_dlp.utils.DownloadError as exc:
        raise HTTPException(status_code=422, detail=clean_error(str(exc)))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=clean_error(str(exc)))

    if info is None:
        raise HTTPException(status_code=422, detail="nothing could be extracted from that link")

    entries = info.get("entries")
    if entries:
        listed = []
        for e in list(entries)[:200]:
            if not e:
                continue
            listed.append(
                {
                    "title": e.get("title"),
                    "url": e.get("webpage_url") or e.get("url"),
                    "duration": e.get("duration"),
                    "thumbnail": e.get("thumbnail"),
                }
            )
        return {
            "kind": "playlist",
            "title": info.get("title"),
            "uploader": info.get("uploader") or info.get("channel"),
            "extractor": info.get("extractor_key") or info.get("extractor"),
            "count": info.get("playlist_count") or len(listed),
            "entries": listed,
        }

    subs = sorted(set(list((info.get("subtitles") or {}).keys())))
    autos = sorted(set(list((info.get("automatic_captions") or {}).keys())))
    return {
        "kind": "video",
        "title": info.get("title"),
        "uploader": info.get("uploader") or info.get("channel"),
        "duration": info.get("duration"),
        "duration_string": info.get("duration_string"),
        "thumbnail": info.get("thumbnail"),
        "description": (info.get("description") or "")[:600] or None,
        "extractor": info.get("extractor_key") or info.get("extractor"),
        "webpage_url": info.get("webpage_url"),
        "is_live": bool(info.get("is_live")),
        "subtitles": subs,
        "automatic_captions": autos[:40],
        "formats": describe_formats(info),
    }


@app.post("/jobs", dependencies=[Depends(require_key)])
def create_job(req: JobRequest) -> Dict[str, Any]:
    job_id = uuid.uuid4().hex[:16]
    with JOBS_LOCK:
        JOBS[job_id] = {
            "id": job_id,
            "state": "queued",
            "progress": None,
            "url": req.url,
            "mode": req.mode,
            "created_at": time.time(),
            "cancel_requested": False,
        }
    POOL.submit(run_job, job_id, req)
    return {"job_id": job_id, "state": "queued", "poll": f"/jobs/{job_id}"}


@app.get("/jobs", dependencies=[Depends(require_key)])
def list_jobs(limit: int = 25) -> Dict[str, Any]:
    with JOBS_LOCK:
        jobs = sorted(JOBS.values(), key=lambda j: j["created_at"], reverse=True)[:limit]
        return {"jobs": [{k: v for k, v in j.items() if k != "cancel_requested"} for j in jobs]}


@app.get("/jobs/{job_id}", dependencies=[Depends(require_key)])
def job_status(job_id: str) -> Dict[str, Any]:
    job = get_job(job_id)
    job.pop("cancel_requested", None)
    if PUBLIC_URL and job.get("state") == "done":
        job["absolute_download_url"] = f"{PUBLIC_URL}/files/{job_id}"
    return job


@app.delete("/jobs/{job_id}", dependencies=[Depends(require_key)])
def delete_job(job_id: str) -> Dict[str, Any]:
    job = get_job(job_id)
    if job["state"] in ("queued", "resolving", "downloading", "processing"):
        set_job(job_id, cancel_requested=True)
        return {"id": job_id, "state": "cancelling"}
    shutil.rmtree(WORK_DIR / job_id, ignore_errors=True)
    with JOBS_LOCK:
        JOBS.pop(job_id, None)
    return {"id": job_id, "state": "deleted"}


def serve_file(path: Path) -> FileResponse:
    if not path.is_file():
        raise HTTPException(status_code=404, detail="file is gone — it may have expired")
    name = safe_filename(path.name)
    # RFC 5987 so non-ASCII titles survive the trip.
    disposition = f"attachment; filename=\"{name.encode('ascii', 'ignore').decode() or 'download'}\"; filename*=UTF-8''{quote(name)}"
    return FileResponse(
        path,
        media_type="application/octet-stream",
        headers={"Content-Disposition": disposition, "Cache-Control": "no-store"},
    )


# Files are fetched by navigating a tab to them, which cannot carry an
# Authorization header, so the unguessable job id is the capability here.
@app.get("/files/{job_id}")
def download_primary(job_id: str):
    job = get_job(job_id)
    if job["state"] != "done":
        raise HTTPException(status_code=409, detail=f"job is {job['state']}, not finished")
    return serve_file(WORK_DIR / job_id / job["primary"])


@app.get("/files/{job_id}/{name}")
def download_named(job_id: str, name: str):
    get_job(job_id)
    target = (WORK_DIR / job_id / name).resolve()
    root = (WORK_DIR / job_id).resolve()
    if root not in target.parents and target != root:
        raise HTTPException(status_code=400, detail="bad path")
    return serve_file(target)


@app.exception_handler(HTTPException)
def http_error(_request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


@app.exception_handler(RequestValidationError)
def validation_error(_request, exc: RequestValidationError) -> JSONResponse:
    first = (exc.errors() or [{}])[0]
    field = ".".join(str(p) for p in first.get("loc", [])[1:]) or "request"
    return JSONResponse(
        status_code=422, content={"error": f"{field}: {first.get('msg', 'is not valid')}"}
    )


# --------------------------------------------------------------------------- #
# housekeeping
# --------------------------------------------------------------------------- #


def reaper() -> None:
    while True:
        time.sleep(120)
        cutoff = time.time() - FILE_TTL_SECONDS
        try:
            with JOBS_LOCK:
                stale = [
                    j["id"]
                    for j in JOBS.values()
                    if j.get("finished_at") and j["finished_at"] < cutoff
                ]
            for job_id in stale:
                shutil.rmtree(WORK_DIR / job_id, ignore_errors=True)
                with JOBS_LOCK:
                    JOBS.pop(job_id, None)
            # Sweep directories no job remembers (e.g. after a restart).
            for path in WORK_DIR.iterdir():
                if path.is_dir() and path.stat().st_mtime < cutoff:
                    with JOBS_LOCK:
                        known = path.name in JOBS
                    if not known:
                        shutil.rmtree(path, ignore_errors=True)
        except Exception:
            pass


threading.Thread(target=reaper, daemon=True).start()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "7860")),
        log_level="info",
    )
