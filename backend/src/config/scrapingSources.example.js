const QUOTE_SOURCES = {
  TSLA: {
    symbol: "TSLA",
    type: "stock",
    source: "scraped-web",
    url: "https://example.com/path-to-tsla-price-page",
    parser: "marketcap",
  },
  AAPL: {
    symbol: "AAPL",
    type: "stock",
    source: "scraped-web",
    url: "https://example.com/path-to-aapl-price-page",
    parser: "marketcap",
  },
  NVDA: {
    symbol: "NVDA",
    type: "stock",
    source: "scraped-web",
    url: "https://example.com/path-to-nvda-price-page",
    parser: "marketcap",
  },
  SPY: {
    symbol: "SPY",
    type: "etf",
    source: "scraped-web",
    url: "https://example.com/path-to-spy-page",
    parser: "marketcap",
  },
  VGT: {
    symbol: "VGT",
    type: "etf",
    source: "scraped-web",
    url: "https://example.com/path-to-vgt-page",
    parser: "marketcap",
  },
  GOLD: {
    symbol: "GOLD",
    type: "metal",
    source: "scraped-web",
    url: "https://example.com/path-to-gold-page",
    parser: "commodity",
    commodityName: "gold",
  },
  SILVER: {
    symbol: "SILVER",
    type: "metal",
    source: "scraped-web",
    url: "https://example.com/path-to-silver-page",
    parser: "commodity",
    commodityName: "silver",
  },
  PALLADIUM: {
    symbol: "PALLADIUM",
    type: "metal",
    source: "scraped-web",
    url: "https://example.com/path-to-palladium-page",
    parser: "commodity",
    commodityName: "palladium",
  },
};

const METRIC_SOURCES = {
  TSLA: {
    symbol: "TSLA",
    type: "stock",
    source: "scraped-web",
    url: "https://example.com/path-to-tsla-metrics-page",
    parser: "stockStatistics",
  },
  AAPL: {
    symbol: "AAPL",
    type: "stock",
    source: "scraped-web",
    url: "https://example.com/path-to-aapl-metrics-page",
    parser: "stockStatistics",
  },
  NVDA: {
    symbol: "NVDA",
    type: "stock",
    source: "scraped-web",
    url: "https://example.com/path-to-nvda-metrics-page",
    parser: "stockStatistics",
  },
  SPY: {
    symbol: "SPY",
    type: "etf",
    source: "scraped-web",
    url: "https://example.com/path-to-spy-metrics-page",
    parser: "etfOverview",
  },
  VGT: {
    symbol: "VGT",
    type: "etf",
    source: "scraped-web",
    url: "https://example.com/path-to-vgt-metrics-page",
    parser: "etfOverview",
  },
};

const HOLDER_SOURCES = {
  TSLA: {
    symbol: "TSLA",
    type: "stock",
    source: "scraped-web",
    url: "https://example.com/path-to-tsla-holders-page",
    parser: "institutionalArticleListA",
  },
  AAPL: {
    symbol: "AAPL",
    type: "stock",
    source: "scraped-web",
    url: "https://example.com/path-to-aapl-holders-page",
    parser: "institutionalArticleTableB",
  },
  NVDA: {
    symbol: "NVDA",
    type: "stock",
    source: "scraped-web",
    url: "https://example.com/path-to-nvda-holders-page",
    parser: "institutionalArticleListC",
  },
  SPY: {
    symbol: "SPY",
    type: "etf",
    source: "scraped-web",
    url: "https://example.com/path-to-spy-holdings-page",
    parser: "fundConstituentsTable",
  },
  VGT: {
    symbol: "VGT",
    type: "etf",
    source: "scraped-web",
    url: "https://example.com/path-to-vgt-holdings-page",
    parser: "fundConstituentsTable",
  },
};

module.exports = {
  QUOTE_SOURCES,
  METRIC_SOURCES,
  HOLDER_SOURCES,
};
