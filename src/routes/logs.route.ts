import express, { Request, Response } from "express";
import { logEmitter } from "../logger/logger";

const router = express.Router();

const LOG_ACCESS_KEY = process.env.LOG_ACCESS_KEY;

const isAuthorized = (req: Request) => {
  if (!LOG_ACCESS_KEY) return true; // no key configured -> open (dev convenience)
  return req.query.key === LOG_ACCESS_KEY;
};

const PAGE = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Live Logs</title>
<style>
  body { margin: 0; background: #0d1117; color: #c9d1d9; font-family: ui-monospace, Menlo, Consolas, monospace; }
  #bar { position: sticky; top: 0; background: #161b22; padding: 8px 12px; border-bottom: 1px solid #30363d; display: flex; gap: 12px; align-items: center; }
  #log { padding: 12px; white-space: pre-wrap; word-break: break-word; font-size: 13px; line-height: 1.5; }
  .line { border-bottom: 1px solid #21262d; padding: 4px 0; }
  .info { color: #7ee787; }
  .error { color: #ff7b72; }
  .warn { color: #d29922; }
  .ts { color: #8b949e; margin-right: 8px; }
  button { background: #21262d; color: #c9d1d9; border: 1px solid #30363d; border-radius: 6px; padding: 4px 10px; cursor: pointer; }
</style>
</head>
<body>
  <div id="bar">
    <strong>Live Logs</strong>
    <span id="status" style="color:#8b949e">connecting...</span>
    <button id="clear">Clear</button>
    <label style="margin-left:auto"><input type="checkbox" id="autoscroll" checked /> Auto-scroll</label>
  </div>
  <div id="log"></div>
  <script>
    const logEl = document.getElementById('log');
    const statusEl = document.getElementById('status');
    const autoscroll = document.getElementById('autoscroll');
    document.getElementById('clear').onclick = () => { logEl.innerHTML = ''; };

    const params = new URLSearchParams(window.location.search);
    const key = params.get('key');
    const streamUrl = '/logs/stream' + (key ? ('?key=' + encodeURIComponent(key)) : '');
    const es = new EventSource(streamUrl);

    es.onopen = () => { statusEl.textContent = 'connected'; statusEl.style.color = '#7ee787'; };
    es.onerror = () => { statusEl.textContent = 'disconnected'; statusEl.style.color = '#ff7b72'; };

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      const div = document.createElement('div');
      div.className = 'line ' + (data.level || 'info');
      const ts = data.timestamp ? '[' + data.timestamp + '] ' : '';
      div.innerHTML = '<span class="ts">' + ts + '</span>' + (data.message || '');
      logEl.appendChild(div);
      if (autoscroll.checked) window.scrollTo(0, document.body.scrollHeight);
    };
  </script>
</body>
</html>`;

// GET /logs -> live viewer page
router.get("/logs", (req: Request, res: Response) => {
  if (!isAuthorized(req)) return res.status(401).send("Unauthorized");
  res.status(200).type("html").send(PAGE);
});

// GET /logs/stream -> Server-Sent Events feed of everything the logger emits
router.get("/logs/stream", (req: Request, res: Response) => {
  if (!isAuthorized(req)) return res.status(401).end();

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.write(": connected\n\n");

  const onLog = (payload: unknown) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };
  logEmitter.on("log", onLog);

  const heartbeat = setInterval(() => res.write(": ping\n\n"), 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    logEmitter.off("log", onLog);
  });
});

export const logsRoutes = router;
