const { QUOTE_SOURCES, METRIC_SOURCES } = require("../config/scrapingSources");

const ASSET_CATALOG = [
  { ticker: "TSLA", company: "Tesla, Inc.", category: "stocks", tag: "EV Leader", featured: true },
  { ticker: "AAPL", company: "Apple Inc.", category: "stocks", tag: "Consumer Tech", featured: true },
  { ticker: "NVDA", company: "NVIDIA Corporation", category: "stocks", tag: "AI Semis", featured: true },
  { ticker: "MSFT", company: "Microsoft Corporation", category: "stocks", tag: "Cloud Software", featured: false },
  { ticker: "AMZN", company: "Amazon.com, Inc.", category: "stocks", tag: "Consumer Platform", featured: false },
  { ticker: "GOOGL", company: "Alphabet Inc.", category: "stocks", tag: "Search Ads", featured: false },
  { ticker: "META", company: "Meta Platforms, Inc.", category: "stocks", tag: "Social Platforms", featured: false },
  { ticker: "AVGO", company: "Broadcom Inc.", category: "stocks", tag: "Semis & Infra", featured: false },
  { ticker: "AMD", company: "Advanced Micro Devices, Inc.", category: "stocks", tag: "Compute Chips", featured: false },
  { ticker: "NFLX", company: "Netflix, Inc.", category: "stocks", tag: "Streaming Media", featured: false },
  { ticker: "ORCL", company: "Oracle Corporation", category: "stocks", tag: "Enterprise Software", featured: false },
  { ticker: "JPM", company: "JPMorgan Chase & Co.", category: "stocks", tag: "Banking Giant", featured: false },
  { ticker: "BAC", company: "Bank of America Corporation", category: "stocks", tag: "Money Center Bank", featured: false },
  { ticker: "WMT", company: "Walmart Inc.", category: "stocks", tag: "Retail Scale", featured: false },
  { ticker: "COST", company: "Costco Wholesale Corporation", category: "stocks", tag: "Membership Retail", featured: false },
  { ticker: "LLY", company: "Eli Lilly and Company", category: "stocks", tag: "Pharma Growth", featured: false },
  { ticker: "XOM", company: "Exxon Mobil Corporation", category: "stocks", tag: "Energy Major", featured: false },
  { ticker: "JNJ", company: "Johnson & Johnson", category: "stocks", tag: "Healthcare Defensive", featured: false },
  { ticker: "KO", company: "The Coca-Cola Company", category: "stocks", tag: "Consumer Staples", featured: false },
  { ticker: "GOLD", company: "GOLD OZ", category: "metals", tag: "Gold Exposure", featured: true },
  { ticker: "SILVER", company: "Silver OZ", category: "metals", tag: "Silver Exposure", featured: true },
  { ticker: "PALLADIUM", company: "Palladium OZ", category: "metals", tag: "Palladium Exposure", featured: true },
  { ticker: "PLATINUM", company: "Platinum OZ", category: "metals", tag: "Platinum Exposure", featured: true },
  { ticker: "COPPER", company: "Copper", category: "metals", tag: "Industrial Metal", featured: false },
  { ticker: "NICKEL", company: "Nickel", category: "metals", tag: "Battery Metal", featured: false },
  { ticker: "LITHIUM", company: "Lithium", category: "metals", tag: "Battery Metal", featured: false },
  { ticker: "URANIUM", company: "Uranium", category: "metals", tag: "Energy Metal", featured: false },
  { ticker: "COBALT", company: "Cobalt", category: "metals", tag: "Strategic Metal", featured: false },
  { ticker: "ZINC", company: "Zinc", category: "metals", tag: "Industrial Metal", featured: false },
  { ticker: "SPY", company: "SPDR S&P 500 ETF", category: "etfs", tag: "Index ETF", featured: true },
  { ticker: "VGT", company: "Vanguard Information Technology ETF", category: "etfs", tag: "Tech ETF", featured: true },
  { ticker: "QQQ", company: "Invesco QQQ Trust", category: "etfs", tag: "Nasdaq 100 ETF", featured: false },
  { ticker: "VOO", company: "Vanguard S&P 500 ETF", category: "etfs", tag: "S&P 500 ETF", featured: false },
  { ticker: "IVV", company: "iShares Core S&P 500 ETF", category: "etfs", tag: "Core Index ETF", featured: false },
  { ticker: "DIA", company: "SPDR Dow Jones Industrial Average ETF Trust", category: "etfs", tag: "Dow ETF", featured: false },
  { ticker: "IWM", company: "iShares Russell 2000 ETF", category: "etfs", tag: "Small Cap ETF", featured: false },
  { ticker: "XLK", company: "Technology Select Sector SPDR Fund", category: "etfs", tag: "Sector Tech ETF", featured: false },
  { ticker: "XLF", company: "Financial Select Sector SPDR Fund", category: "etfs", tag: "Sector Financials ETF", featured: false },
  { ticker: "XLV", company: "Health Care Select Sector SPDR Fund", category: "etfs", tag: "Sector Healthcare ETF", featured: false },
  { ticker: "VTI", company: "Vanguard Total Stock Market ETF", category: "etfs", tag: "Total Market ETF", featured: false },
  { ticker: "SMH", company: "VanEck Semiconductor ETF", category: "etfs", tag: "Semiconductor ETF", featured: false },
];

const quoteSymbols = new Set(Object.keys(QUOTE_SOURCES));
const metricSymbols = new Set(Object.keys(METRIC_SOURCES));

const SEARCHABLE_ASSETS = ASSET_CATALOG.filter((asset) => quoteSymbols.has(asset.ticker) && metricSymbols.has(asset.ticker));

function normalizeQuery(value) {
  return String(value || "").trim().toLowerCase();
}

function sortSearchResults(a, b, query) {
  const aTicker = a.ticker.toLowerCase();
  const bTicker = b.ticker.toLowerCase();
  const aCompany = a.company.toLowerCase();
  const bCompany = b.company.toLowerCase();

  const aExactTicker = aTicker === query ? 0 : 1;
  const bExactTicker = bTicker === query ? 0 : 1;
  if (aExactTicker !== bExactTicker) {
    return aExactTicker - bExactTicker;
  }

  const aStartsTicker = aTicker.startsWith(query) ? 0 : 1;
  const bStartsTicker = bTicker.startsWith(query) ? 0 : 1;
  if (aStartsTicker !== bStartsTicker) {
    return aStartsTicker - bStartsTicker;
  }

  const aStartsCompany = aCompany.startsWith(query) ? 0 : 1;
  const bStartsCompany = bCompany.startsWith(query) ? 0 : 1;
  if (aStartsCompany !== bStartsCompany) {
    return aStartsCompany - bStartsCompany;
  }

  return a.ticker.localeCompare(b.ticker);
}

function searchAssets(rawQuery, limit = 20) {
  const query = normalizeQuery(rawQuery);

  if (!query) {
    return [];
  }

  return SEARCHABLE_ASSETS.filter((asset) => {
    const searchable = [asset.ticker, asset.company, asset.tag, asset.category].join(" ").toLowerCase();
    return searchable.includes(query);
  })
    .sort((a, b) => sortSearchResults(a, b, query))
    .slice(0, limit);
}

function findAssetBySymbol(symbol) {
  const normalized = String(symbol || "").trim().toUpperCase();
  return SEARCHABLE_ASSETS.find((asset) => asset.ticker === normalized) || null;
}

module.exports = {
  ASSET_CATALOG,
  SEARCHABLE_ASSETS,
  searchAssets,
  findAssetBySymbol,
};
