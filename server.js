require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { catalogRouter } = require("./src/routes/catalog");
const { buildsRouter } = require("./src/routes/builds");
const { sourcesRouter } = require("./src/routes/sources");
const { healthRouter } = require("./src/routes/health");

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigin = process.env.FRONTEND_URL;

app.use(cors({
  origin(origin, callback) {
    if (!origin || !allowedOrigin || origin === allowedOrigin || origin.startsWith("http://localhost")) return callback(null, true);
    return callback(new Error("Origine non autorizzata da CORS"));
  }
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/health", healthRouter);
app.use("/api/catalog", catalogRouter);
app.use("/api/builds", buildsRouter);
app.use("/api/sources", sourcesRouter);

app.get("/api", (_req, res) => res.json({
  name: "JARVIS Diablo IV API",
  version: "1.0.0",
  endpoints: ["/api/health", "/api/catalog", "/api/builds", "/api/sources"]
}));

app.use((err, _req, res, _next) => {
  console.error("[api-error]", err.message);
  res.status(err.status || 500).json({ error: err.publicMessage || "Errore del server. Riprova più tardi." });
});

app.listen(PORT, () => console.log(`JARVIS API in ascolto sulla porta ${PORT}`));
