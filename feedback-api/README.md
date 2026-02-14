# Riddle Feedback Server Setup

This folder provides two API options that forward thumbs feedback to GitHub:

- `cloudflare-worker.js` (recommended)
- `node-server.js` (Express)

Both options trigger `repository_dispatch` and then GitHub Actions updates:

- `data/riddle-feedback.json`

## 1) GitHub Actions (already in repo)

Workflow file:

- `.github/workflows/riddle-feedback-save.yml`

It listens to:

- `event_type: riddle_feedback`

and increments `like` / `dislike` per `riddleId`.

## 2) Cloudflare Worker

### Worker secrets / vars

- `GITHUB_OWNER` = `jsh1986`
- `GITHUB_REPO` = `game`
- `GITHUB_PAT` = personal access token (repo access)
- `ALLOWED_ORIGIN` = your game origin (optional but recommended)

### Required token scope

- Fine-grained token:
  - Repository access: `game`
  - Permission: `Contents: Read and Write`, `Metadata: Read`

### Request endpoint

- `POST https://<your-worker-domain>/`

Body:

```json
{
  "game": "riddle-game",
  "riddleId": "r123abc",
  "question": "문제",
  "answer": "정답",
  "vote": "like",
  "createdAt": "2026-02-14T12:00:00.000Z"
}
```

## 3) Node API (alternative)

Install and run:

```bash
cd feedback-api
npm install
set GITHUB_OWNER=jsh1986
set GITHUB_REPO=game
set GITHUB_PAT=YOUR_TOKEN
set ALLOWED_ORIGIN=https://<your-site-domain>
npm start
```

Endpoint:

- `POST /riddle-feedback`

## 4) Frontend connection

`riddle-game/index.html` already reads:

- `window.RIDDLE_FEEDBACK_API_URL`

Set before the game script:

```html
<script>
  window.RIDDLE_FEEDBACK_API_URL = "https://<api-endpoint>";
</script>
```

For Node server example:

- `https://<server-domain>/riddle-feedback`
