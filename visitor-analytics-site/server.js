const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_FILE = path.join(__dirname, "data.json");
const adminToken = process.env.ANALYTICS_ADMIN_TOKEN || crypto.randomBytes(24).toString("hex");
const browsers = new Set(["Chrome", "Edge", "Firefox", "Safari", "Other"]);
const devices = new Set(["Mobile", "Tablet", "Desktop"]);

function readStats() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      return { pageViews: 0, browsers: {}, devices: {}, updatedAt: null };
    }
    throw error;
  }
}

const stats = readStats();

function sendJson(res, status, value) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(value));
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    let tooLarge = false;
    req.on("data", chunk => {
      if (tooLarge) return;
      body += chunk;
      if (body.length > 2048) {
        tooLarge = true;
        reject(Object.assign(new Error("Request body is too large"), { status: 413 }));
      }
    });
    req.on("end", () => {
      if (!tooLarge) resolve(body);
    });
    req.on("error", reject);
  });
}

function isAdmin(req) {
  const supplied = req.headers.authorization?.replace(/^Bearer\s+/i, "") || "";
  const expectedBuffer = Buffer.from(adminToken);
  const suppliedBuffer = Buffer.from(supplied);
  return suppliedBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(suppliedBuffer, expectedBuffer);
}

function serveStatic(req, res) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    res.writeHead(400).end("Bad request");
    return;
  }

  const requestedPath = pathname === "/" ? "index.html" : pathname.slice(1);
  const filePath = path.resolve(PUBLIC_DIR, requestedPath);
  if (!filePath.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(404).end("Not found");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(error.code === "ENOENT" ? 404 : 500).end(error.code === "ENOENT" ? "Not found" : "Unable to read file");
      return;
    }
    const type = filePath.endsWith(".css") ? "text/css" :
      filePath.endsWith(".js") ? "text/javascript" : "text/html";
    res.writeHead(200, {
      "Content-Type": `${type}; charset=utf-8`,
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer"
    });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/api/analytics") {
    try {
      const body = await readRequestBody(req);
      const event = JSON.parse(body);
      if (
        !event ||
        Object.keys(event).sort().join(",") !== "browser,device" ||
        !browsers.has(event.browser) ||
        !devices.has(event.device)
      ) {
        sendJson(res, 400, { error: "Invalid analytics event" });
        return;
      }

      stats.pageViews += 1;
      stats.browsers[event.browser] = (stats.browsers[event.browser] || 0) + 1;
      stats.devices[event.device] = (stats.devices[event.device] || 0) + 1;
      stats.updatedAt = new Date().toISOString();
      fs.writeFileSync(DATA_FILE, JSON.stringify(stats, null, 2));
      sendJson(res, 200, { recorded: true });
    } catch (error) {
      if (error.status) {
        sendJson(res, error.status, { error: error.message });
      } else if (error instanceof SyntaxError) {
        sendJson(res, 400, { error: "Invalid JSON" });
      } else {
        console.error("Analytics event could not be saved:", error);
        sendJson(res, 500, { error: "Analytics event could not be saved" });
      }
    }
    return;
  }

  if (req.method === "GET" && req.url === "/api/analytics") {
    if (!isAdmin(req)) {
      sendJson(res, 401, { error: "Admin token required" });
      return;
    }
    sendJson(res, 200, stats);
    return;
  }

  if (req.method === "GET") {
    serveStatic(req, res);
    return;
  }

  res.writeHead(405, { Allow: "GET, POST" }).end("Method not allowed");
});

server.listen(PORT, () => {
  console.log(`Visitor analytics site running at http://localhost:${PORT}`);
  if (!process.env.ANALYTICS_ADMIN_TOKEN) {
    console.log(`Temporary admin token (keep private): ${adminToken}`);
  }
});
