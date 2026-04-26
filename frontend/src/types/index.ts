export type AssetTrend = "up" | "down" | "flat";

export type AssetCategory = "stocks" | "metals" | "etfs";

export type Asset = {
  ticker: string;
  company: string;
  price: string;
  move: string;
  changeValue: string;
  trend: AssetTrend;
  tag: string;
  category: AssetCategory;
};

export type AssetLookup = {
  ticker: string;
  company: string;
  tag: string;
  category: AssetCategory;
};

export type Screen = "login" | "home" | "detail" | "guide";

export type ChartRange = "1D" | "1W" | "1M" | "6M" | "1Y" | "5Y";

export type ChartSeries = {
  labels: string[];
  values: number[];
};

export type ChartSeriesByRange = Record<ChartRange, ChartSeries>;

export type RangeStats = {
  activeRange: ChartRange;
  changeValue: string;
  changePercent: string;
  trend: AssetTrend;
};

export type MetricDefinition = {
  id: string;
  label: string;
  value: string;
  aliases: string[];
  title: string;
  definition: string;
  formula: string;
  interpretation: string;
  goodBad: string;
  sectors: string;
  warning: string;
};

export type MetricValuesMap = Partial<Record<string, string | null>>;
