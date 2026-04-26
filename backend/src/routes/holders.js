const express = require("express");

const { scrapeHoldersBySymbol, SUPPORTED_HOLDER_SYMBOLS } = require("../services/holdersScraper");

const router = express.Router();

router.get("/supported", (_req, res) => {
  res.json({
    symbols: SUPPORTED_HOLDER_SYMBOLS,
  });
});

router.get("/:symbol", async (req, res, next) => {
  try {
    const holders = await scrapeHoldersBySymbol(req.params.symbol);
    res.json(holders);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
