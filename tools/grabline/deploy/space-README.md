---
title: Grabline
emoji: ⬇️
colorFrom: gray
colorTo: yellow
sdk: docker
app_port: 7860
pinned: false
short_description: yt-dlp download API for the Grabline web front end
---

# Grabline server

A small yt-dlp + ffmpeg HTTP API. Paste this Space's URL into the Grabline
front end under **Server**.

Your URL is `https://<your-username>-<space-name>.hf.space`.

Optional settings, under the Space's **Settings → Variables and secrets**:

| Name                     | Effect                                               |
| ------------------------ | ---------------------------------------------------- |
| `GRABLINE_API_KEY`       | require `Authorization: Api-Key <key>` on requests   |
| `GRABLINE_MAX_DURATION`  | reject anything longer than N seconds                |
| `GRABLINE_FILE_TTL`      | how long finished files stay downloadable (default 3600s) |
| `GRABLINE_CONCURRENCY`   | simultaneous downloads (default 2)                   |
| `GRABLINE_COOKIES_FILE`  | path to a cookies.txt, for sites that want a login   |
