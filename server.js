
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3000;
const MAXROLL_HOSTS = new Set(["maxroll.gg", "www.maxroll.gg"]);

app.get("/", (_req, res) => {
  res.json({
    service: "Jarvis Maxroll Bridge",
    status: "online",
    endpoints: ["/api/health", "/api/import-guide", "/api/catalog"],
    note: "Catalogo best-effort: Maxroll non offre un catalogo pubblico documentato."
  });
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

function validGuideUrl(raw) {
  try {
    const url = new URL(raw);
    return MAXROLL_HOSTS.has(url.hostname) &&
      url.pathname.startsWith("/d4/build-guides/");
  } catch {
    return false;
  }
}

function extractPlannerIds(html) {
  const ids = new Set();
  const patterns = [
    /(?:https?:)?\/\/(?:www\.)?maxroll\.gg\/d4\/planner\/([a-z0-9]+)/gi,
    /\/d4\/planner\/([a-z0-9]+)/gi,
    /planners\.maxroll\.gg\/profiles\/d4\/([a-z0-9]+)/gi,
    /profiles\/d4\/([a-z0-9]+)/gi
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      if (match[1] && match[1].length >= 5 && match[1].length <= 20) {
        ids.add(match[1]);
      }
    }
  }

  return [...ids];
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; JarvisDiabloAssistant/1.0)",
      "Accept": "text/html,application/json,*/*"
    },
    redirect: "follow"
  });

  if (!response.ok) {
    throw new Error(`Maxroll ha risposto HTTP ${response.status}`);
  }

  return response.text();
}

async function getPlanner(id) {
  const url = `https://planners.maxroll.gg/profiles/d4/${encodeURIComponent(id)}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; JarvisDiabloAssistant/1.0)",
      "Accept": "application/json,text/plain,*/*"
    }
  });

  if (!response.ok) {
    throw new Error(`Planner ${id}: HTTP ${response.status}`);
  }

  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return { rawText: text.slice(0, 50000) };
  }
}

app.post("/api/import-guide", async (req, res) => {
  const guideUrl = String(req.body?.url || "").trim();

  if (!validGuideUrl(guideUrl)) {
    return res.status(400).json({
      error: "Inserisci una guida Maxroll Diablo IV valida."
    });
  }

  try {
    const html = await fetchText(guideUrl);
    const ids = extractPlannerIds(html);

    if (!ids.length) {
      return res.status(422).json({
        error: "Guida raggiunta, ma nessun ID Planner trovato nell'HTML.",
        guideUrl,
        hint: "Maxroll potrebbe caricare i dati dinamicamente o aver cambiato formato."
      });
    }

    const planners = [];

    for (const id of ids.slice(0, 5)) {
      try {
        planners.push({
          id,
          url: `https://maxroll.gg/d4/planner/${id}`,
          data: await getPlanner(id)
        });
      } catch (error) {
        planners.push({
          id,
          url: `https://maxroll.gg/d4/planner/${id}`,
          error: error.message
        });
      }
    }

    res.json({
      ok: true,
      source: "Maxroll",
      guideUrl,
      plannersFound: planners.length,
      planners
    });
  } catch (error) {
    res.status(502).json({
      error: "Jarvis non è riuscito a leggere la guida Maxroll.",
      detail: error.message,
      guideUrl
    });
  }
});

app.get("/api/catalog", async (_req, res) => {
  const indexUrls = [
    "https://maxroll.gg/d4/build-guides",
    "https://maxroll.gg/d4/tierlists"
  ];

  const found = new Map();
  const errors = [];

  for (const indexUrl of indexUrls) {
    try {
      const html = await fetchText(indexUrl);
      const pattern = /href=["'](\/d4\/build-guides\/[^"'?#]+)["']/gi;
      let match;

      while ((match = pattern.exec(html)) !== null) {
        const url = `https://maxroll.gg${match[1]}`;

        if (!found.has(url)) {
          found.set(url, {
            title: match[1].split("/").pop().replace(/-/g, " "),
            url
          });
        }
      }
    } catch (error) {
      errors.push(`${indexUrl}: ${error.message}`);
    }
  }

  res.json({
    ok: found.size > 0,
    source: "Maxroll",
    count: found.size,
    complete: false,
    message: found.size
      ? "Guide individuate dalle pagine pubbliche; elenco potenzialmente incompleto."
      : "Non è stato possibile leggere il catalogo pubblico di Maxroll.",
    guides: [...found.values()].slice(0, 100),
    errors
  });
});

app.listen(PORT, () => {
  console.log(`Jarvis Maxroll Bridge in ascolto sulla porta ${PORT}`);
});
