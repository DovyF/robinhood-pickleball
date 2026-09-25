FROM python:3.12-slim

# ffmpeg does the merging and audio conversion; without it yt-dlp can only
# fetch single pre-muxed streams, which caps quality on most sites.
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

# Hugging Face Spaces runs the container as uid 1000 and expects port 7860.
RUN useradd -m -u 1000 grabline \
 && mkdir -p /tmp/grabline \
 && chown -R grabline:grabline /app /tmp/grabline
USER grabline

ENV PORT=7860 \
    GRABLINE_WORK_DIR=/tmp \
    PYTHONUNBUFFERED=1

EXPOSE 7860

HEALTHCHECK --interval=60s --timeout=5s --start-period=20s \
  CMD python -c "import urllib.request,os;urllib.request.urlopen(f'http://127.0.0.1:{os.environ[\"PORT\"]}/health').read()"

CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT}"]
