import Constants from "expo-constants";
import { ASSETS } from "../data/assets";
import { SPY_RANGE_DATA } from "../data/chartData";
import { fetchBackendQuoteAsset } from "./backendQuotes";
import { Asset, ChartSeries, ChartSeriesByRange } from "../types";

const BASE_URL = "https://api.twelvedata.com";
const SPY_FALLBACK = ASSETS.find((asset) => asset.ticker === "SPY")!;

type MarketDataResult = {
  asset: Asset;
  seriesByRange?: ChartSeriesByRange;
  source: "live" | "mock";
  reason?: string;
};

type TimeSeriesValue = {
  datetime: string;
  close: string;
};

function getApiKey() {
  return (
    process.env.EXPO_PUBLIC_TWELVE_DATA_API_KEY ||
    (Constants.expoConfig?.extra?.twelveDataApiKey as string | undefined) ||
    (Constants.manifest2?.extra?.expoClient?.extra?.twelveDataApiKey as string | undefined) ||
    ""
  );
}

function formatDateLabel(value: string) {
  const parsed = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  return `${parsed.getMonth() + 1}/${parsed.getDate()}`;
}

function formatWeekdayLabel(value: string) {
  const parsed = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  return parsed.toLocaleString("en-US", { weekday: "short" });
}

function formatMonthYearLabel(value: string) {
  const parsed = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  return parsed.toLocaleString("en-US", { month: "short", year: "2-digit" });
}

function sortSeries(values: TimeSeriesValue[]) {
  return values
    .map((entry) => ({
      datetime: entry.datetime,
      close: Number(entry.close),
    }))
    .filter((entry) => Number.isFinite(entry.close))
    .sort((a, b) => a.datetime.localeCompare(b.datetime));
}

function takeLast<T>(items: T[], count: number) {
  return items.slice(Math.max(0, items.length - count));
}

function sampleEvenly<T>(items: T[], count: number) {
  if (items.length <= count) {
    return items;
  }

  const picked: T[] = [];
  const step = (items.length - 1) / (count - 1);

  for (let index = 0; index < count; index += 1) {
    picked.push(items[Math.round(index * step)]);
  }

  return picked;
}

function toSeries(entries: Array<{ datetime: string; close: number }>, formatter: (value: string) => string): ChartSeries {
  return {
    labels: entries.map((entry) => formatter(entry.datetime)),
    values: entries.map((entry) => Number(entry.close.toFixed(2))),
  };
}

function buildFallback(reason = "Live data unavailable."): MarketDataResult {
  return {
    asset: SPY_FALLBACK,
    seriesByRange: SPY_RANGE_DATA,
    source: "mock",
    reason,
  };
}

function mapPriceToAsset(price: number, previousClose: number) {
  const change = price - previousClose;
  const percent = previousClose > 0 ? (change / previousClose) * 100 : 0;

  return {
    ...SPY_FALLBACK,
    price: `$${price.toFixed(2)}`,
    changeValue: `${change >= 0 ? "+" : "-"}$${Math.abs(change).toFixed(2)}`,
    move: `${percent >= 0 ? "+" : "-"}${Math.abs(percent).toFixed(4)}%`,
    trend: change < 0 ? "down" : "up",
  } as Asset;
}

async function fetchJson(path: string, params: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${BASE_URL}${path}?${query}`);

  if (!response.ok) {
    throw new Error(`Twelve Data request failed with status ${response.status}`);
  }

  const data = await response.json();

  if (data.status === "error" || data.code || data.message) {
    throw new Error(data.message || "Twelve Data returned an error.");
  }

  return data;
}

export async function fetchSpyMarketData(): Promise<MarketDataResult> {
  const apiKey = getApiKey();
  let backendAsset: Asset | null = null;

  try {
    backendAsset = await fetchBackendQuoteAsset("SPY", SPY_FALLBACK);
  } catch {
    backendAsset = null;
  }

  if (!apiKey) {
    if (backendAsset) {
      return {
        asset: backendAsset,
        seriesByRange: SPY_RANGE_DATA,
        source: "live",
        reason: "Backend scrape loaded SPY price. Performance chart is using demo data because the API key is missing.",
      };
    }

    return buildFallback("Backend scrape failed and the Twelve Data API key is missing.");
  }

  try {
    const [quoteData, intradayData, dailyData, weeklyData, monthlyData] = await Promise.all([
      fetchJson("/price", { symbol: "SPY", apikey: apiKey }),
      fetchJson("/time_series", {
        symbol: "SPY",
        interval: "1h",
        outputsize: "8",
        order: "asc",
        apikey: apiKey,
      }),
      fetchJson("/time_series", {
        symbol: "SPY",
        interval: "1day",
        outputsize: "260",
        order: "asc",
        apikey: apiKey,
      }),
      fetchJson("/time_series", {
        symbol: "SPY",
        interval: "1week",
        outputsize: "260",
        order: "asc",
        apikey: apiKey,
      }),
      fetchJson("/time_series", {
        symbol: "SPY",
        interval: "1month",
        outputsize: "120",
        order: "asc",
        apikey: apiKey,
      }),
    ]);

    const currentPrice = Number(quoteData.price);
    const intradaySeries = sortSeries((intradayData.values ?? []) as TimeSeriesValue[]);
    const dailySeries = sortSeries((dailyData.values ?? []) as TimeSeriesValue[]);
    const weeklySeries = sortSeries((weeklyData.values ?? []) as TimeSeriesValue[]);
    const monthlySeries = sortSeries((monthlyData.values ?? []) as TimeSeriesValue[]);

    if (!Number.isFinite(currentPrice) || dailySeries.length < 22 || weeklySeries.length < 26 || monthlySeries.length < 60) {
      throw new Error("Twelve Data returned incomplete SPY data.");
    }

    const previousClose = dailySeries.length > 1 ? dailySeries[dailySeries.length - 2].close : currentPrice;
    const apiAsset = mapPriceToAsset(currentPrice, previousClose);

    const oneDay = intradaySeries.length >= 2 ? intradaySeries : takeLast(dailySeries, 8);
    const oneWeek = takeLast(dailySeries, 5);
    const oneMonth = takeLast(dailySeries, 22);
    const sixMonths = takeLast(weeklySeries, 26);
    const oneYear = sampleEvenly(takeLast(weeklySeries, 52), 12);
    const fiveYears = takeLast(monthlySeries, 60);

    const seriesByRange: ChartSeriesByRange = {
      "1D": toSeries(oneDay, formatDateLabel),
      "1W": toSeries(oneWeek, formatWeekdayLabel),
      "1M": toSeries(oneMonth, formatDateLabel),
      "6M": toSeries(sixMonths, formatMonthYearLabel),
      "1Y": toSeries(oneYear, formatMonthYearLabel),
      "5Y": toSeries(fiveYears, formatMonthYearLabel),
    };

    return {
      asset: backendAsset ?? apiAsset,
      seriesByRange,
      source: "live",
      reason: backendAsset
        ? "Backend scrape loaded SPY price. Twelve Data API loaded the performance chart."
        : "Backend scrape failed, so SPY loaded from the API.",
    };
  } catch (error) {
    if (backendAsset) {
      return {
        asset: backendAsset,
        seriesByRange: SPY_RANGE_DATA,
        source: "live",
        reason: `Backend scrape loaded SPY price. Twelve Data API failed, so the performance chart is using demo data. ${error instanceof Error ? error.message : "Unknown Twelve Data error."}`,
      };
    }

    return buildFallback(
      error instanceof Error
        ? `Backend scrape failed, the API failed, and mock data was loaded. ${error.message}`
        : "Backend scrape failed, the API failed, and mock data was loaded."
    );
  }
}

export function hasSpyApiKey() {
  return Boolean(getApiKey());
}
