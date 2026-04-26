import Constants from "expo-constants";
import { Platform } from "react-native";
import { ASSETS } from "../data/assets";
import { Asset, AssetTrend } from "../types";

type BackendQuote = {
  symbol: string;
  type: string;
  price: number;
  changePercent: number | null;
  currency: string;
  source: string;
  sourceType: string;
  scrapedAt: string;
  url: string;
  delayed: boolean;
};

type QuotesResponse = {
  count: number;
  quotes: BackendQuote[];
};

function getBackendBaseUrl() {
  const fromEnv =
    process.env.EXPO_PUBLIC_BACKEND_BASE_URL ||
    (Constants.expoConfig?.extra?.backendBaseUrl as string | undefined) ||
    (Constants.manifest2?.extra?.expoClient?.extra?.backendBaseUrl as string | undefined) ||
    "";

  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:4000";
  }

  return "http://localhost:4000";
}

function formatPrice(price: number) {
  const decimals = price >= 1000 ? 2 : 2;
  return `$${price.toFixed(decimals)}`;
}

function formatChangeValue(price: number, changePercent: number | null) {
  if (changePercent === null) {
    return null;
  }

  const previousPrice = price / (1 + changePercent / 100);
  const changeValue = price - previousPrice;

  return `${changeValue >= 0 ? "+" : "-"}$${Math.abs(changeValue).toFixed(2)}`;
}

function formatMove(changePercent: number | null) {
  if (changePercent === null) {
    return null;
  }

  return `${changePercent >= 0 ? "+" : "-"}${Math.abs(changePercent).toFixed(2)}%`;
}

function toTrend(changePercent: number | null): AssetTrend {
  if (changePercent === null || changePercent === 0) {
    return "flat";
  }

  return changePercent > 0 ? "up" : "down";
}

function mergeQuotesWithAssets(quotes: BackendQuote[]) {
  const quoteMap = new Map(quotes.map((quote) => [quote.symbol.toUpperCase(), quote]));

  return ASSETS.map((asset) => {
    return mapQuoteOntoAsset(asset, quoteMap.get(asset.ticker.toUpperCase()));
  });
}

function mapQuoteOntoAsset(asset: Asset, quote?: BackendQuote) {
  if (!quote || !Number.isFinite(quote.price)) {
    return asset;
  }

  const move = formatMove(quote.changePercent);
  const changeValue = formatChangeValue(quote.price, quote.changePercent);

  return {
    ...asset,
    price: formatPrice(quote.price),
    move: move ?? asset.move,
    changeValue: changeValue ?? asset.changeValue,
    trend: toTrend(quote.changePercent),
  } as Asset;
}

export async function fetchHomeQuotes() {
  const baseUrl = getBackendBaseUrl();
  const response = await fetch(`${baseUrl}/api/quotes`);

  if (!response.ok) {
    throw new Error(`Backend quotes request failed with status ${response.status}`);
  }

  const data = (await response.json()) as QuotesResponse;

  if (!Array.isArray(data.quotes)) {
    throw new Error("Backend quotes response is missing quotes array");
  }

  return {
    assets: mergeQuotesWithAssets(data.quotes),
    source: "backend" as const,
    baseUrl,
  };
}

export async function fetchBackendQuoteAsset(symbol: string, fallbackAsset: Asset) {
  const baseUrl = getBackendBaseUrl();
  const response = await fetch(`${baseUrl}/api/quotes/${encodeURIComponent(symbol.toUpperCase())}`);

  if (!response.ok) {
    throw new Error(`Backend quote request failed with status ${response.status}`);
  }

  const quote = (await response.json()) as BackendQuote;
  return mapQuoteOntoAsset(fallbackAsset, quote);
}
