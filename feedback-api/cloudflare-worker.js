export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    if (request.method !== "POST") {
      return json({ ok: false, error: "Method Not Allowed" }, 405, env);
    }

    const origin = request.headers.get("Origin") || "";
    if (env.ALLOWED_ORIGIN && origin && origin !== env.ALLOWED_ORIGIN) {
      return json({ ok: false, error: "Origin Not Allowed" }, 403, env);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "Invalid JSON" }, 400, env);
    }

    const vote = String(body.vote || "");
    const riddleId = String(body.riddleId || "").trim();
    const question = String(body.question || "").trim();
    const answer = String(body.answer || "").trim();
    const createdAt = String(body.createdAt || new Date().toISOString());

    if (!riddleId || !question || !answer) {
      return json({ ok: false, error: "Missing fields" }, 400, env);
    }
    if (vote !== "like" && vote !== "dislike") {
      return json({ ok: false, error: "Invalid vote" }, 400, env);
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

    const dispatchRes = await fetch(
      `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.GITHUB_PAT}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          "User-Agent": "riddle-feedback-worker"
        },
        body: JSON.stringify(dispatchBody)
      }
    );

    if (!dispatchRes.ok) {
      const errorText = await dispatchRes.text();
      return json({ ok: false, error: "GitHub dispatch failed", detail: errorText }, 502, env);
    }

    return json({ ok: true }, 200, env);
  }
};

function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function json(data, status, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(env)
    }
  });
}
