const express = require("express");
const cors = require("cors");

const quoteRoutes = require("./routes/quotes");
const holdersRoutes = require("./routes/holders");
const metricsRoutes = require("./routes/metrics");
const assetRoutes = require("./routes/assets");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "equitymouse-backend",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/quotes", quoteRoutes);
app.use("/api/holders", holdersRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/assets", assetRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({
    error: "Internal server error",
    details: err.message,
  });
});

module.exports = app;
