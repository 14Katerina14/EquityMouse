const express = require("express");

const { scrapeMetricsBySymbol, SUPPORTED_METRIC_SYMBOLS } = require("../services/metricsScraper");

const router = express.Router();

router.get("/supported", (_req, res) => {
  res.json({
    symbols: SUPPORTED_METRIC_SYMBOLS,
  });
});

router.get("/:symbol", async (req, res, next) => {
  try {
    const metrics = await scrapeMetricsBySymbol(req.params.symbol);
    res.json(metrics);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
