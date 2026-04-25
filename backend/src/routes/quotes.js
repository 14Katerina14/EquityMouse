const express = require("express");

const { scrapeBatchQuotes, scrapeQuoteBySymbol, SUPPORTED_SYMBOLS } = require("../services/quoteScraper");

const router = express.Router();

router.get("/supported", (_req, res) => {
  res.json({
    symbols: SUPPORTED_SYMBOLS,
  });
});

router.get("/debug/:symbol", async (req, res) => {
  try {
    const quote = await scrapeQuoteBySymbol(req.params.symbol);
    res.json({
      ok: true,
      quote,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message,
      debugSnippets: error.debugSnippets || [],
      pageTextPreview: error.pageTextPreview || null,
    });
  }
});

router.get("/:symbol", async (req, res, next) => {
  try {
    const quote = await scrapeQuoteBySymbol(req.params.symbol);
    res.json(quote);
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const rawSymbols = typeof req.query.symbols === "string" ? req.query.symbols : "";
    const symbols = rawSymbols
      .split(",")
      .map((symbol) => symbol.trim().toUpperCase())
      .filter(Boolean);

    const quotes = await scrapeBatchQuotes(symbols.length > 0 ? symbols : SUPPORTED_SYMBOLS);

    res.json({
      count: quotes.length,
      quotes,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
