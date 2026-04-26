export type HoldingEntry = {
  symbol: string;
  name: string;
  weight: number;
  color: string;
};

export type HoldingsSnapshot = {
  asOf: string;
  totalHoldings: number;
  top10Concentration: number;
};

export type HoldingsData = {
  snapshot: HoldingsSnapshot;
  holdings: HoldingEntry[];
};

const palette = [
  "#4f7cff",
  "#22c55e",
  "#f59e0b",
  "#ff5f56",
  "#a855f7",
  "#14b8a6",
  "#eab308",
  "#ec4899",
  "#f97316",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
  "#ef4444",
  "#3b82f6",
  "#10b981",
];

function withColors(holdings: Array<Omit<HoldingEntry, "color">>): HoldingEntry[] {
  return holdings.map((holding, index) => ({
    ...holding,
    color: palette[index % palette.length],
  }));
}

export const TOP_HOLDINGS_BY_TICKER: Record<string, HoldingsData> = {
  SPY: {
    snapshot: {
      asOf: "Apr 8, 2026",
      totalHoldings: 505,
      top10Concentration: 36.7,
    },
    holdings: withColors([
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
    ]),
  },
  VGT: {
    snapshot: {
      asOf: "Apr 8, 2026",
      totalHoldings: 316,
      top10Concentration: 58.4,
    },
    holdings: withColors([
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
    ]),
  },
  TSLA: {
    snapshot: {
      asOf: "Apr 26, 2026",
      totalHoldings: 10,
      top10Concentration: 21.51,
    },
    holdings: withColors([
      { symbol: "Vanguard", name: "The Vanguard Group, Inc.", weight: 6.9 },
      { symbol: "BlackRock", name: "BlackRock, Inc.", weight: 5.57 },
      { symbol: "State Street", name: "State Street Global Advisors, Inc.", weight: 3.06 },
      { symbol: "Geode", name: "Geode Capital Management, LLC", weight: 1.75 },
      { symbol: "Capital Res.", name: "Capital Research and Management Company", weight: 1.4 },
      { symbol: "Norges", name: "Norges Bank Investment Management", weight: 1.01 },
      { symbol: "JPMorgan", name: "JP Morgan Asset Management", weight: 0.95 },
      { symbol: "FMR", name: "FMR LLC", weight: 0.9 },
      { symbol: "Northern", name: "Northern Trust Global Investments", weight: 0.69 },
      { symbol: "T. Rowe", name: "T. Rowe Price Group, Inc.", weight: 0.68 },
    ]),
  },
  AAPL: {
    snapshot: {
      asOf: "Apr 26, 2026",
      totalHoldings: 10,
      top10Concentration: 32.53,
    },
    holdings: withColors([
      { symbol: "Vanguard", name: "The Vanguard Group, Inc.", weight: 9.72 },
      { symbol: "BlackRock", name: "BlackRock, Inc.", weight: 7.83 },
      { symbol: "State Street", name: "State Street Global Advisors, Inc.", weight: 4.11 },
      { symbol: "Geode", name: "Geode Capital Management, LLC", weight: 2.44 },
      { symbol: "FMR", name: "FMR LLC", weight: 1.83 },
      { symbol: "Berkshire", name: "Berkshire Hathaway Inc.", weight: 1.55 },
      { symbol: "T. Rowe", name: "T. Rowe Price Group, Inc.", weight: 1.5 },
      { symbol: "Norges", name: "Norges Bank Investment Management", weight: 1.31 },
      { symbol: "JPMorgan", name: "JP Morgan Asset Management", weight: 1.15 },
      { symbol: "Northern", name: "Northern Trust Global Investments", weight: 1.09 },
    ]),
  },
  NVDA: {
    snapshot: {
      asOf: "Apr 26, 2026",
      totalHoldings: 10,
      top10Concentration: 40.63,
    },
    holdings: withColors([
      { symbol: "Vanguard", name: "The Vanguard Group, Inc.", weight: 9.33 },
      { symbol: "BlackRock", name: "BlackRock, Inc.", weight: 7.98 },
      { symbol: "State Street", name: "State Street Global Advisors, Inc.", weight: 4.08 },
      { symbol: "FMR", name: "FMR LLC", weight: 3.65 },
      { symbol: "Geode", name: "Geode Capital Management, LLC", weight: 2.42 },
      { symbol: "Capital Res.", name: "Capital Research and Management Company", weight: 1.69 },
      { symbol: "T. Rowe", name: "T. Rowe Price Group, Inc.", weight: 1.65 },
      { symbol: "Norges", name: "Norges Bank Investment Management", weight: 1.37 },
      { symbol: "JPMorgan", name: "JP Morgan Asset Management", weight: 1.37 },
      { symbol: "UBS", name: "UBS Asset Management AG", weight: 1.13 },
    ]),
  },
};

export function getTopHoldingsData(ticker: string): HoldingsData | null {
  return TOP_HOLDINGS_BY_TICKER[ticker] ?? null;
}
