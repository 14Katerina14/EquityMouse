const axios = require("axios");
const cheerio = require("cheerio");
const { METRIC_SOURCES } = require("../config/scrapingSources");

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const METRICS_CACHE_MS = 5 * 60 * 1000;

const SYMBOL_METRICS_CONFIG = METRIC_SOURCES;

const SUPPORTED_METRIC_SYMBOLS = Object.keys(SYMBOL_METRICS_CONFIG);
const cache = new Map();

function normalizeSymbol(input) {
  return String(input || "").trim().toUpperCase();
}

function normalizeText(html) {
  const $ = cheerio.load(html);
  return $("body").text().replace(/\s+/g, " ").trim();
}

function extractTokenAfterLabel(text, label) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`${escapedLabel}\\s*[:|]?\\s*([+\\-]?[0-9][0-9,]*(?:\\.[0-9]+)?%?|n/a|[0-9][0-9,]*(?:\\.[0-9]+)?[KMBT])`, "i"),
    new RegExp(`([+\\-]?[0-9][0-9,]*(?:\\.[0-9]+)?%?|n/a|[0-9][0-9,]*(?:\\.[0-9]+)?[KMBT])\\s*${escapedLabel}`, "i"),
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

function extractNetMargin(text) {
  const direct = extractTokenAfterLabel(text, "Net Margin");
  if (direct) {
    return direct;
  }

  const match = text.match(/profit margins? of ([0-9]+(?:\.[0-9]+)?)%/i);
  return match ? `${match[1]}%` : null;
}

function buildMetricPayload(config, values) {
  return {
    symbol: config.symbol,
    type: config.type,
    source: "scraped-web",
    scrapedAt: new Date().toISOString(),
    metrics: values,
  };
}

function parseStockStatistics(html, config) {
  const text = normalizeText(html);

  return buildMetricPayload(config, {
    pe: extractTokenAfterLabel(text, "PE Ratio"),
    ps: extractTokenAfterLabel(text, "PS Ratio"),
    pb: extractTokenAfterLabel(text, "PB Ratio"),
    peg: extractTokenAfterLabel(text, "PEG Ratio"),
    roe: extractTokenAfterLabel(text, "Return on Equity (ROE)"),
    roic: extractTokenAfterLabel(text, "Return on Invested Capital (ROIC)"),
    "net-margin": extractNetMargin(text),
    "debt-equity": extractTokenAfterLabel(text, "Debt / Equity"),
    "free-cash-flow": extractTokenAfterLabel(text, "Free Cash Flow"),
  });
}

function parseEtfOverview(html, config) {
  const text = normalizeText(html);

  return buildMetricPayload(config, {
    pe: extractTokenAfterLabel(text, "PE Ratio"),
    ps: null,
    pb: null,
    peg: null,
    roe: null,
    roic: null,
    "net-margin": null,
    "debt-equity": null,
    "free-cash-flow": null,
  });
}

async function fetchMetrics(symbol) {
  const config = SYMBOL_METRICS_CONFIG[symbol];

  if (!config) {
    throw new Error(`Unsupported symbol for metrics scraping: ${symbol}`);
  }

  const response = await axios.get(config.url, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept-Language": "en-US,en;q=0.9",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    timeout: 15000,
  });

  if (config.parser === "stockStatistics") {
    return parseStockStatistics(response.data, config);
  }

  return parseEtfOverview(response.data, config);
}

async function scrapeMetricsBySymbol(inputSymbol) {
  const symbol = normalizeSymbol(inputSymbol);
  const cached = cache.get(symbol);

  if (cached && Date.now() - cached.timestamp < METRICS_CACHE_MS) {
    return cached.value;
  }

  const metrics = await fetchMetrics(symbol);
  cache.set(symbol, {
    timestamp: Date.now(),
    value: metrics,
  });

  return metrics;
}

module.exports = {
  scrapeMetricsBySymbol,
  SUPPORTED_METRIC_SYMBOLS,
};
