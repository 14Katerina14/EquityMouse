const axios = require("axios");
const cheerio = require("cheerio");
const { HOLDER_SOURCES } = require("../config/scrapingSources");

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const HOLDERS_CACHE_MS = 5 * 60 * 1000;

const SUPPORTED_HOLDER_SYMBOLS = Object.keys(HOLDER_SOURCES);
const cache = new Map();

const FALLBACK_HOLDERS = {
  TSLA: {
    asOf: "Mar 20, 2026",
    totalHolders: 5,
    holders: [
      { name: "The Vanguard Group, Inc.", stake: 7.59, sharesHeld: "252.39M", reportedDate: "Mar 20, 2026", valueThousands: "n/a" },
      { name: "BlackRock, Inc.", stake: 6.22, sharesHeld: "206.74M", reportedDate: "Mar 20, 2026", valueThousands: "n/a" },
      { name: "State Street", stake: 3.5, sharesHeld: "113.76M", reportedDate: "Mar 20, 2026", valueThousands: "n/a" },
      { name: "Geode Capital Management", stake: 1.96, sharesHeld: "65.33M", reportedDate: "Mar 20, 2026", valueThousands: "n/a" },
      { name: "Capital World Investors", stake: 1.32, sharesHeld: "44.04M", reportedDate: "Mar 20, 2026", valueThousands: "n/a" },
    ],
  },
  AAPL: {
    asOf: "Jan 13, 2026",
    totalHolders: 10,
    holders: [
      { name: "Vanguard", stake: 9.52, sharesHeld: "1.40B", reportedDate: "Jan 13, 2026", valueThousands: "$364B" },
      { name: "BlackRock", stake: 7.8, sharesHeld: "1.15B", reportedDate: "Jan 13, 2026", valueThousands: "$298B" },
      { name: "State Street", stake: 4.07, sharesHeld: "598M", reportedDate: "Jan 13, 2026", valueThousands: "$155B" },
      { name: "JP Morgan Chase", stake: 3.22, sharesHeld: "473M", reportedDate: "Jan 13, 2026", valueThousands: "$123B" },
      { name: "Geode Capital Management", stake: 2.42, sharesHeld: "356M", reportedDate: "Jan 13, 2026", valueThousands: "$93B" },
      { name: "FMR", stake: 2.06, sharesHeld: "303M", reportedDate: "Jan 13, 2026", valueThousands: "$72B" },
      { name: "Berkshire Hathaway", stake: 1.62, sharesHeld: "238M", reportedDate: "Jan 13, 2026", valueThousands: "$62B" },
      { name: "Morgan Stanley", stake: 1.56, sharesHeld: "229M", reportedDate: "Jan 13, 2026", valueThousands: "$60B" },
      { name: "T. Rowe Price", stake: 1.45, sharesHeld: "213M", reportedDate: "Jan 13, 2026", valueThousands: "$55B" },
      { name: "Norges Bank", stake: 1.29, sharesHeld: "190M", reportedDate: "Jan 13, 2026", valueThousands: "$49B" },
    ],
  },
  NVDA: {
    asOf: "Mar 19, 2026",
    totalHolders: 10,
    holders: [
      { name: "Vanguard Group", stake: 9.33, sharesHeld: "2.27B", reportedDate: "Mar 19, 2026", valueThousands: "n/a" },
      { name: "BlackRock", stake: 7.98, sharesHeld: "1.94B", reportedDate: "Mar 19, 2026", valueThousands: "n/a" },
      { name: "State Street", stake: 4.08, sharesHeld: "991.48M", reportedDate: "Mar 19, 2026", valueThousands: "n/a" },
      { name: "FMR", stake: 3.65, sharesHeld: "971.06M", reportedDate: "Mar 19, 2026", valueThousands: "n/a" },
      { name: "Geode Capital Management", stake: 2.42, sharesHeld: "588.8M", reportedDate: "Mar 19, 2026", valueThousands: "n/a" },
      { name: "JPMorgan Chase", stake: 1.88, sharesHeld: "456.14M", reportedDate: "Mar 19, 2026", valueThousands: "n/a" },
      { name: "Price (T.Rowe) Associates", stake: 1.54, sharesHeld: "373.19M", reportedDate: "Mar 19, 2026", valueThousands: "n/a" },
      { name: "Norges Bank", stake: 1.37, sharesHeld: "333.75M", reportedDate: "Mar 19, 2026", valueThousands: "n/a" },
      { name: "Morgan Stanley", stake: 1.33, sharesHeld: "323.73M", reportedDate: "Mar 19, 2026", valueThousands: "n/a" },
      { name: "Northern Trust", stake: 1.04, sharesHeld: "253.79M", reportedDate: "Mar 19, 2026", valueThousands: "n/a" },
    ],
  },
};

const FALLBACK_ETF_HOLDINGS = {
  SPY: {
    asOf: "Apr 8, 2026",
    totalHoldings: 505,
    top10Concentration: 36.7,
    holdings: [
      { symbol: "NVDA", name: "NVIDIA", weight: 7.61 },
      { symbol: "AAPL", name: "Apple", weight: 6.54 },
      { symbol: "MSFT", name: "Microsoft", weight: 4.78 },
      { symbol: "AMZN", name: "Amazon", weight: 3.72 },
      { symbol: "GOOGL", name: "Alphabet A", weight: 3.18 },
      { symbol: "AVGO", name: "Broadcom", weight: 2.86 },
      { symbol: "GOOG", name: "Alphabet C", weight: 2.53 },
      { symbol: "META", name: "Meta", weight: 2.31 },
      { symbol: "TSLA", name: "Tesla", weight: 1.66 },
      { symbol: "BRK.B", name: "Berkshire Hathaway", weight: 1.51 },
      { symbol: "JPM", name: "JPMorgan", weight: 1.43 },
      { symbol: "LLY", name: "Eli Lilly", weight: 1.3 },
      { symbol: "XOM", name: "Exxon Mobil", weight: 1.12 },
      { symbol: "JNJ", name: "Johnson & Johnson", weight: 1.0 },
      { symbol: "WMT", name: "Walmart", weight: 0.96 },
    ],
  },
  VGT: {
    asOf: "Apr 8, 2026",
    totalHoldings: 316,
    top10Concentration: 58.4,
    holdings: [
      { symbol: "MSFT", name: "Microsoft", weight: 14.35 },
      { symbol: "NVDA", name: "NVIDIA", weight: 13.92 },
      { symbol: "AAPL", name: "Apple", weight: 12.88 },
      { symbol: "AVGO", name: "Broadcom", weight: 5.61 },
      { symbol: "CRM", name: "Salesforce", weight: 2.39 },
      { symbol: "ORCL", name: "Oracle", weight: 2.31 },
      { symbol: "CSCO", name: "Cisco", weight: 2.2 },
      { symbol: "IBM", name: "IBM", weight: 1.76 },
      { symbol: "AMD", name: "AMD", weight: 1.63 },
      { symbol: "ACN", name: "Accenture", weight: 1.35 },
      { symbol: "INTU", name: "Intuit", weight: 1.27 },
      { symbol: "ADBE", name: "Adobe", weight: 1.25 },
      { symbol: "QCOM", name: "Qualcomm", weight: 1.12 },
      { symbol: "TXN", name: "Texas Instruments", weight: 1.04 },
      { symbol: "NOW", name: "ServiceNow", weight: 0.96 },
    ],
  },
};

function normalizeSymbol(input) {
  return String(input || "").trim().toUpperCase();
}

function normalizeText(html) {
  const $ = cheerio.load(html);
  return $("body").text().replace(/\s+/g, " ").trim();
}

function buildPayload(config, snapshot, source = "scraped-web") {
  return {
    symbol: config.symbol,
    type: config.type,
    source,
    scrapedAt: new Date().toISOString(),
    snapshot: {
      asOf: snapshot.asOf,
      totalHolders: snapshot.totalHolders,
      top10Concentration: Number(snapshot.holders.reduce((sum, holder) => sum + holder.stake, 0).toFixed(2)),
    },
    holders: snapshot.holders,
  };
}

function parseMotleyFoolInstitutions(html, config) {
  const text = normalizeText(html);
  const sectionMatch = text.match(/### Institutions\s+(.+?)\s+About the Author/i);

  if (!sectionMatch) {
    throw new Error("Could not find Institutions section in Motley Fool holders page");
  }

  const rowPattern =
    /\d+\.\s+([A-Z][A-Za-z0-9&.,'()\- ]+?)[:(].*?holds?\s+([0-9]+(?:\.[0-9]+)?)\s+million shares.*?ownership stake of (?:more than )?([0-9]+(?:\.[0-9]+)?)%/gi;

  const holders = [];
  let match;

  while ((match = rowPattern.exec(sectionMatch[1])) !== null) {
    holders.push({
      name: match[1].trim(),
      stake: Number(match[3]),
      sharesHeld: `${match[2]}M`,
      reportedDate: "Mar 20, 2026",
      valueThousands: "n/a",
    });
  }

  if (holders.length === 0) {
    throw new Error("Could not parse institutional holders from Motley Fool page");
  }

  return buildPayload(
    config,
    {
      asOf: "Mar 20, 2026",
      totalHolders: holders.length,
      holders,
    },
    "scraped-web"
  );
}

function parseCoincodexInstitutional(html, config) {
  const text = normalizeText(html);
  const sectionMatch = text.match(/Top 10 institutional owners of Apple\s+(.+?)\s+Data collected on/i);

  if (!sectionMatch) {
    throw new Error("Could not find institutional owners section in CoinCodex page");
  }

  const rowPattern =
    /([A-Z][A-Za-z0-9&.,'()\- ]+?)\s+([0-9]+(?:\.[0-9]+)?)%\s+([0-9]+(?:\.[0-9]+)?\s+(?:billion|million|B|M))\s+\$([0-9]+(?:\.[0-9]+)?\s+(?:billion|million|B|M))/gi;

  const holders = [];
  let match;

  while ((match = rowPattern.exec(sectionMatch[1])) !== null) {
    const cleanedName = match[1]
      .replace(/^Stockholder Stake Shares Owned Total value\s+/i, "")
      .trim();

    holders.push({
      name: cleanedName,
      stake: Number(match[2]),
      sharesHeld: match[3].trim(),
      reportedDate: "Jan 13, 2026",
      valueThousands: match[4].trim(),
    });
  }

  if (holders.length === 0) {
    throw new Error("Could not parse institutional holders from CoinCodex page");
  }

  return buildPayload(
    config,
    {
      asOf: "Jan 13, 2026",
      totalHolders: holders.length,
      holders,
    },
    "scraped-web"
  );
}

function parseTheStreetInstitutions(html, config) {
  const text = normalizeText(html);
  const sectionMatch = text.match(/The 10 biggest institutional owners of Nvidia stock\s+(.+?)\s+Collectively, these 10 financial institutions own/i);
  const concentrationMatch = text.match(/Collectively, these 10 financial institutions own\s+([0-9]+(?:\.[0-9]+)?)%\s+of Nvidia/i);

  if (!sectionMatch) {
    throw new Error("Could not find institutional owners section in TheStreet page");
  }

  const rowPattern = /\d+\.\s+([A-Z][A-Za-z0-9&.,'()\- ]+?)\s+\(([0-9]+(?:\.[0-9]+)?)\s+(billion|million)\s+shares\)/gi;
  const holders = [];
  let match;

  while ((match = rowPattern.exec(sectionMatch[1])) !== null) {
    holders.push({
      name: match[1].trim(),
      stake: 0,
      sharesHeld: `${match[2]}${match[3].toLowerCase().startsWith("b") ? "B" : "M"}`,
      reportedDate: "Mar 19, 2026",
      valueThousands: "n/a",
    });
  }

  if (holders.length === 0) {
    throw new Error("Could not parse institutional holders from TheStreet page");
  }

  const totalTop10 = concentrationMatch ? Number(concentrationMatch[1]) : 35;
  const totalSharesMillions = 24300;

  const normalizedHolders = holders.map((holder) => {
    const sharesMillions = holder.sharesHeld.endsWith("B")
      ? Number(holder.sharesHeld.replace("B", "")) * 1000
      : Number(holder.sharesHeld.replace("M", ""));
    const stake = Number(((sharesMillions / totalSharesMillions) * 100).toFixed(2));

    return {
      ...holder,
      stake,
    };
  });

  return {
    symbol: config.symbol,
    type: config.type,
    source: "scraped-web",
    scrapedAt: new Date().toISOString(),
    snapshot: {
      asOf: "Mar 19, 2026",
      totalHolders: normalizedHolders.length,
      top10Concentration: totalTop10,
    },
    holders: normalizedHolders,
  };
}

function parseFundConstituentsTable(html, config) {
  const $ = cheerio.load(html);
  const pageText = $("body").text().replace(/\s+/g, " ").trim();
  const totalHoldingsMatch = pageText.match(/total of\s+([0-9,]+)\s+individual holdings/i);
  const top10Match = pageText.match(/Top 10 Percentage\s+([0-9]+(?:\.[0-9]+)?)%/i);
  const asOfMatch = pageText.match(/As of\s+([A-Z][a-z]{2}\s+\d{1,2},\s+\d{4})/i);

  const rows = [];

  $("table tbody tr").each((_, row) => {
    const cells = $(row)
      .find("td")
      .map((__, cell) => $(cell).text().replace(/\s+/g, " ").trim())
      .get();

    if (cells.length >= 5 && /^\d+$/.test(cells[0]) && /%$/.test(cells[3])) {
      rows.push({
        symbol: cells[1],
        name: cells[2],
        weight: Number(cells[3].replace("%", "")),
        sharesHeld: cells[4],
      });
    }
  });

  const holdings = rows.slice(0, 15);

  if (holdings.length === 0) {
    throw new Error("Could not parse ETF holdings table");
  }

  return {
    symbol: config.symbol,
    type: config.type,
    source: "scraped-web",
    scrapedAt: new Date().toISOString(),
    snapshot: {
      asOf: asOfMatch ? asOfMatch[1] : "Latest fund report",
      totalHoldings: totalHoldingsMatch ? Number(totalHoldingsMatch[1].replace(/,/g, "")) : holdings.length,
      top10Concentration: top10Match ? Number(top10Match[1]) : Number(holdings.slice(0, 10).reduce((sum, item) => sum + item.weight, 0).toFixed(2)),
    },
    holdings,
  };
}

function parseHolders(html, config) {
  if (config.parser === "institutionalArticleListA") {
    return parseMotleyFoolInstitutions(html, config);
  }

  if (config.parser === "institutionalArticleTableB") {
    return parseCoincodexInstitutional(html, config);
  }

  if (config.parser === "institutionalArticleListC") {
    return parseTheStreetInstitutions(html, config);
  }

  if (config.parser === "fundConstituentsTable") {
    return parseFundConstituentsTable(html, config);
  }

  throw new Error(`Unsupported holders parser: ${config.parser}`);
}

async function fetchHolders(symbol) {
  const config = HOLDER_SOURCES[symbol];

  if (!config) {
    throw new Error(`Unsupported symbol for holders scraping: ${symbol}`);
  }

  const response = await axios.get(config.url, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept-Language": "en-US,en;q=0.9",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    timeout: 15000,
  });

  return parseHolders(response.data, config);
}

async function scrapeHoldersBySymbol(inputSymbol) {
  const symbol = normalizeSymbol(inputSymbol);
  const cached = cache.get(symbol);

  if (cached && Date.now() - cached.timestamp < HOLDERS_CACHE_MS) {
    return cached.value;
  }

  try {
    const holders = await fetchHolders(symbol);
    cache.set(symbol, {
      timestamp: Date.now(),
      value: holders,
    });

    return holders;
  } catch (_error) {
    const config = HOLDER_SOURCES[symbol];
    const fallback = FALLBACK_HOLDERS[symbol];
    const etfFallback = FALLBACK_ETF_HOLDINGS[symbol];

    if (config?.type === "etf" && etfFallback) {
      const payload = {
        symbol: config.symbol,
        type: config.type,
        source: "snapshot-fallback",
        scrapedAt: new Date().toISOString(),
        snapshot: {
          asOf: etfFallback.asOf,
          totalHoldings: etfFallback.totalHoldings,
          top10Concentration: etfFallback.top10Concentration,
        },
        holdings: etfFallback.holdings,
      };

      cache.set(symbol, {
        timestamp: Date.now(),
        value: payload,
      });

      return payload;
    }

    if (!config || !fallback) {
      throw _error;
    }

    const payload = buildPayload(config, fallback, "snapshot-fallback");
    cache.set(symbol, {
      timestamp: Date.now(),
      value: payload,
    });

    return payload;
  }
}

module.exports = {
  scrapeHoldersBySymbol,
  SUPPORTED_HOLDER_SYMBOLS,
};
