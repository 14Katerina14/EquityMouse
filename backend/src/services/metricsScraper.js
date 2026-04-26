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
  const tokenPattern = "((?:\\$)?[+\\-]?[0-9][0-9,]*(?:\\.[0-9]+)?(?:\\s?[KMBT])?%?|n/a)";
  const patterns = [
    new RegExp(`${escapedLabel}\\s*[:|]?\\s*${tokenPattern}`, "i"),
    new RegExp(`${tokenPattern}\\s*${escapedLabel}`, "i"),
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

function extractEtfMetric(text, labels) {
  for (const label of labels) {
    const value = extractTokenAfterLabel(text, label);

    if (value) {
      return value;
    }
  }

  return null;
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

function extractCommodityPrice(text, commodityName) {
  const escapedName = commodityName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const directPattern = new RegExp(`current ${escapedName} price \\(\\$([0-9]{1,3}(?:,[0-9]{3})*(?:\\.[0-9]+)?) per ounce\\)`, "i");
  const directMatch = text.match(directPattern);

  if (directMatch) {
    return `$${directMatch[1]}`;
  }

  const fallbackMatch = text.match(/\$([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?) per ounce/i);
  return fallbackMatch ? `$${fallbackMatch[1]}` : null;
}

function extractCommoditySupply(text, commodityName) {
  if (commodityName === "gold" || commodityName === "silver") {
    const match = text.match(/estimated to (?:be around|have been mined is)\s+([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?)\s+metric tonnes/i);
    return match ? `${match[1]} metric tonnes` : null;
  }

  const escapedName = commodityName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const ouncesPattern = new RegExp(
    `around\\s+([0-9]{1,3}(?:,[0-9]{3})*(?:\\.[0-9]+)?)\\s+ounces of ${escapedName} have been mined`,
    "i"
  );
  const ouncesMatch = text.match(ouncesPattern);
  return ouncesMatch ? `${ouncesMatch[1]} ounces` : null;
}

function extractCommodityEstimateBasis(text, commodityName) {
  if (commodityName === "gold") {
    const match = text.match(/World Gold Council\s*\(([^)]+)\)/i);
    return match ? match[1] : "World Gold Council";
  }

  if (commodityName === "silver") {
    const match = text.match(/\((CPM Group Silver Yearbook\s+[0-9]{4})\)/i);
    return match ? match[1] : "CPM Group";
  }

  const genericMatch = text.match(/as of\s+([0-9]{4})\s+around/i);
  return genericMatch ? genericMatch[1] : "Estimated";
}

function extractCommodityMarketCap(text, commodityName) {
  const escapedName = commodityName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const namedPattern = new RegExp(
    `The Market Capitalization of ${escapedName}\\s+is currently around\\s+(\\$[0-9]{1,3}(?:,[0-9]{3})*(?:\\.[0-9]+)?\\s?[KMBT]?)`,
    "i"
  );
  const namedMatch = text.match(namedPattern);

  if (namedMatch) {
    return namedMatch[1].replace(/\s+/g, "");
  }

  const headlinePattern = /Estimated Market Cap:\s*(\$[0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?\s?[KMBT]?)/i;
  const headlineMatch = text.match(headlinePattern);
  return headlineMatch ? headlineMatch[1].replace(/\s+/g, "") : null;
}

function extractTradingEconomicsOverview(text, commodityName) {
  const escapedName = commodityName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const summaryPattern = new RegExp(
    `${escapedName}\\s+(rose|fell|traded flat|traded|slipped|steadied|climbed|dropped|declined|advanced)\\s+(?:to|at|around)\\s+\\$?([0-9]{1,3}(?:,[0-9]{3})*(?:\\.[0-9]+)?)\\s+([A-Z/]+).*?(?:up|down)\\s+([0-9]+(?:\\.[0-9]+)?)%\\s+from the previous day\\. Over the past month,\\s+${escapedName}'s price has\\s+(risen|fallen|remained flat),?\\s*(?:by\\s*)?([0-9]+(?:\\.[0-9]+)?)%.*?(up|higher|increased|down|lower|fallen)\\s+([0-9]+(?:\\.[0-9]+)?)%\\s+(?:compared to|than) the same time last year`,
    "i"
  );
  const summaryMatch = text.match(summaryPattern);

  if (!summaryMatch) {
    return null;
  }

  const dailyVerb = summaryMatch[1].toLowerCase();
  const monthlyVerb = summaryMatch[5].toLowerCase();
  const yearlyVerb = summaryMatch[7].toLowerCase();
  const dailyNegative = ["fell", "slipped", "dropped", "declined"].includes(dailyVerb);
  const monthlyNegative = monthlyVerb === "fallen";
  const yearlyNegative = ["down", "lower", "fallen"].includes(yearlyVerb);

  return {
    price: summaryMatch[2],
    unit: summaryMatch[3],
    dayChange: `${dailyNegative ? "-" : "+"}${summaryMatch[4]}%`,
    monthChange: `${monthlyNegative ? "-" : "+"}${summaryMatch[6]}%`,
    yearChange: `${yearlyNegative ? "-" : "+"}${summaryMatch[8]}%`,
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
    "expense-ratio": extractEtfMetric(text, ["Expense Ratio"]),
    assets: extractEtfMetric(text, ["Assets", "AUM"]),
    "holdings-count": extractEtfMetric(text, ["Holdings"]),
    "top10-concentration": extractEtfMetric(text, ["Top 10 Percentage", "Top 10 Holdings"]),
    "dividend-yield": extractEtfMetric(text, ["Dividend Yield"]),
    "payout-ratio": extractEtfMetric(text, ["Payout Ratio"]),
    beta: extractEtfMetric(text, ["Beta"]),
    "shares-out": extractEtfMetric(text, ["Shares Out"]),
  });
}

function parseCommodityOverview(html, config) {
  const text = normalizeText(html);

  return buildMetricPayload(config, {
    "price-oz": extractCommodityPrice(text, config.commodityName),
    "market-cap": extractCommodityMarketCap(text, config.commodityName),
    "estimated-supply": extractCommoditySupply(text, config.commodityName),
    "estimate-basis": extractCommodityEstimateBasis(text, config.commodityName),
  });
}

function parseTradingEconomicsCommodityOverview(html, config) {
  const text = normalizeText(html);
  const overview = extractTradingEconomicsOverview(text, config.commodityName);

  return buildMetricPayload(config, {
    "price-oz": overview ? `${overview.price} ${overview.unit}` : null,
    "market-cap": overview ? overview.dayChange : null,
    "estimated-supply": overview ? overview.monthChange : null,
    "estimate-basis": overview ? overview.yearChange : null,
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

  if (config.parser === "commodityOverview") {
    return parseCommodityOverview(response.data, config);
  }

  if (config.parser === "commodityTradingEconomicsOverview") {
    return parseTradingEconomicsCommodityOverview(response.data, config);
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
