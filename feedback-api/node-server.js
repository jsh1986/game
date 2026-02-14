const express = require("express");

const app = express();
app.use(express.json({ limit: "50kb" }));

const PORT = process.env.PORT || 8787;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "";
const GITHUB_OWNER = process.env.GITHUB_OWNER || "";
const GITHUB_REPO = process.env.GITHUB_REPO || "";
const GITHUB_PAT = process.env.GITHUB_PAT || "";

app.use((req, res, next) => {
  const origin = req.header("Origin") || "";
  if (ALLOWED_ORIGIN) {
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (ALLOWED_ORIGIN && origin && origin !== ALLOWED_ORIGIN) {
    return res.status(403).json({ ok: false, error: "Origin Not Allowed" });
  }
  next();
});

app.post("/riddle-feedback", async (req, res) => {
  const vote = String(req.body.vote || "");
  const riddleId = String(req.body.riddleId || "").trim();
  const question = String(req.body.question || "").trim();
  const answer = String(req.body.answer || "").trim();
  const createdAt = String(req.body.createdAt || new Date().toISOString());

  if (!riddleId || !question || !answer) {
    return res.status(400).json({ ok: false, error: "Missing fields" });
  }
  if (vote !== "like" && vote !== "dislike") {
    return res.status(400).json({ ok: false, error: "Invalid vote" });
  }
  if (!GITHUB_OWNER || !GITHUB_REPO || !GITHUB_PAT) {
    return res.status(500).json({ ok: false, error: "Server env is not configured" });
  }

  const dispatchBody = {
    event_type: "riddle_feedback",
    client_payload: {
      vote,
      riddleId,
      question,
      answer,
      createdAt
    }
  };

  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GITHUB_PAT}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          "User-Agent": "riddle-feedback-node-server"
        },
        body: JSON.stringify(dispatchBody)
      }
    );

    if (!response.ok) {
      const detail = await response.text();
      return res.status(502).json({ ok: false, error: "GitHub dispatch failed", detail });
    }

    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Unexpected error", detail: String(error) });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`riddle feedback api listening on ${PORT}`);
});
