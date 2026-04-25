const axios = require("axios");
const cheerio = require("cheerio");
const { QUOTE_SOURCES } = require("../config/scrapingSources");

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const QUOTE_CACHE_MS = 60 * 1000;

const SYMBOL_CONFIG = QUOTE_SOURCES;

const SUPPORTED_SYMBOLS = Object.keys(SYMBOL_CONFIG);
const cache = new Map();

function normalizeSymbol(input) {
  return String(input || "").trim().toUpperCase();
}

function parseNumber(rawValue) {
  const parsed = Number(String(rawValue).replace(/[$,%\s]/g, "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function extractLabelValue(text, label) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const beforePattern = new RegExp(`([+$-]?[0-9]{1,3}(?:,[0-9]{3})*(?:\\.[0-9]+)?)\\s+${escapedLabel}`, "i");
  const afterPattern = new RegExp(`${escapedLabel}\\s*([+$-]?[0-9]{1,3}(?:,[0-9]{3})*(?:\\.[0-9]+)?)`, "i");

  const beforeMatch = text.match(beforePattern);
  if (beforeMatch) {
    const parsed = parseNumber(beforeMatch[1]);
    if (parsed !== null) {
      return parsed;
    }
  }

  const afterMatch = text.match(afterPattern);
  if (afterMatch) {
    const parsed = parseNumber(afterMatch[1]);
    if (parsed !== null) {
      return parsed;
    }
  }

  return null;
}

function extractPriceAroundSharePrice(text) {
  const label = "Share price";
  const index = text.indexOf(label);

  if (index === -1) {
    return null;
  }

  const beforeWindow = text.slice(Math.max(0, index - 140), index);

  const dollarMatches = [...beforeWindow.matchAll(/\$([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?)/g)];
  if (dollarMatches.length > 0) {
    const lastDollarValue = dollarMatches[dollarMatches.length - 1][1];
    const parsed = parseNumber(lastDollarValue);
    if (parsed !== null) {
      return parsed;
    }
  }

  const plainMatches = [...beforeWindow.matchAll(/([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?)/g)];
  if (plainMatches.length === 0) {
    return null;
  }

  const filtered = plainMatches
    .map((match) => parseNumber(match[1]))
    .filter((value) => value !== null && value > 20);

  if (filtered.length === 0) {
    return null;
  }

  return filtered[filtered.length - 1];
}

function extractChangePercent(text) {
  const label = "Change (1 day)";
  const index = text.indexOf(label);

  if (index === -1) {
    return null;
  }

  const beforeWindow = text.slice(Math.max(0, index - 40), index);
  const beforeMatches = [...beforeWindow.matchAll(/([+\-]?[0-9]{1,3}(?:\.[0-9]+)?)%/g)];
  if (beforeMatches.length > 0) {
    const parsed = parseNumber(beforeMatches[beforeMatches.length - 1][1]);
    if (parsed !== null) {
      return parsed;
    }
  }

  const afterWindow = text.slice(index, Math.min(text.length, index + 40));
  const afterMatch = afterWindow.match(/([+\-]?[0-9]{1,3}(?:\.[0-9]+)?)%/);
  if (afterMatch) {
    const parsed = parseNumber(afterMatch[1]);
    if (parsed !== null) {
      return parsed;
    }
  }

  return null;
}

function collectDebugSnippets(text) {
  const patterns = [
    /Share price/gi,
    /Price/gi,
    /Change \(1 day\)/gi,
    /Marketcap/gi,
  ];

  const snippets = [];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null && snippets.length < 12) {
      const start = Math.max(0, match.index - 80);
      const end = Math.min(text.length, match.index + 180);
      snippets.push(text.slice(start, end));
    }
  }

  return snippets;
}

function parseMarketcapPage(html) {
  const $ = cheerio.load(html);
  const text = $("body").text().replace(/\s+/g, " ").trim();

  const priceFromLabel =
    extractPriceAroundSharePrice(text) ||
    extractLabelValue(text, "Share price") ||
    extractLabelValue(text, "Price");

  if (priceFromLabel !== null) {
    return {
      price: priceFromLabel,
      changePercent: extractChangePercent(text),
      debug: collectDebugSnippets(text),
    };
  }

  const fallbackPatterns = [
    /Share price\s*([+$-]?[0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?)/i,
    /Price history\s*([+$-]?[0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?)/i,
    /Country\s*([+$-]?[0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?)\s*Share price/i,
    /Market\s*([+$-]?[0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?)\s*Share price/i,
  ];

  for (const pattern of fallbackPatterns) {
    const match = text.match(pattern);
    if (!match) {
      continue;
    }

    const parsed = parseNumber(match[1]);
    if (parsed !== null) {
      return {
        price: parsed,
        changePercent: extractChangePercent(text),
        debug: collectDebugSnippets(text),
      };
    }
  }

  const error = new Error("Could not parse Share price from CompaniesMarketCap page");
  error.debugSnippets = collectDebugSnippets(text);
  error.pageTextPreview = text.slice(0, 2000);
  throw error;
}

function parseCommodityPage(html, commodityName) {
  const $ = cheerio.load(html);
  const text = $("body").text().replace(/\s+/g, " ").trim();
  const escapedName = commodityName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const directPattern = new RegExp(`current ${escapedName} price \\(\\$([0-9]{1,3}(?:,[0-9]{3})*(?:\\.[0-9]+)?) per ounce\\)`, "i");
  const directMatch = text.match(directPattern);

  if (directMatch) {
    return {
      price: parseNumber(directMatch[1]),
      changePercent: null,
    };
  }

  const fallbackPattern = new RegExp(`\\$([0-9]{1,3}(?:,[0-9]{3})*(?:\\.[0-9]+)?) per ounce`, "i");
  const fallbackMatch = text.match(fallbackPattern);

  if (fallbackMatch) {
    return {
      price: parseNumber(fallbackMatch[1]),
      changePercent: null,
    };
  }

  throw new Error(`Could not parse ${commodityName} price from CompaniesMarketCap page`);
}

async function fetchQuote(symbol) {
  const config = SYMBOL_CONFIG[symbol];

  if (!config) {
    throw new Error(`Unsupported symbol: ${symbol}`);
  }

  const response = await axios.get(config.url, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept-Language": "en-US,en;q=0.9",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    timeout: 15000,
  });

  const parsed =
    config.parser === "commodity"
      ? parseCommodityPage(response.data, config.commodityName)
      : parseMarketcapPage(response.data);

  return {
    symbol,
    type: config.type,
    price: parsed.price,
    changePercent: parsed.changePercent,
    currency: "USD",
    source: "scraped-web",
    sourceType: config.parser,
    scrapedAt: new Date().toISOString(),
    delayed: true,
  };
}

async function scrapeQuoteBySymbol(inputSymbol) {
  const symbol = normalizeSymbol(inputSymbol);
  const cached = cache.get(symbol);

  if (cached && Date.now() - cached.timestamp < QUOTE_CACHE_MS) {
    return cached.value;
  }

  const quote = await fetchQuote(symbol);
  cache.set(symbol, {
    timestamp: Date.now(),
    value: quote,
  });

  return quote;
}

async function scrapeBatchQuotes(symbols) {
  const normalizedSymbols = symbols.map(normalizeSymbol);
  return Promise.all(normalizedSymbols.map((symbol) => scrapeQuoteBySymbol(symbol)));
}

module.exports = {
  scrapeBatchQuotes,
  scrapeQuoteBySymbol,
  SUPPORTED_SYMBOLS,
};
