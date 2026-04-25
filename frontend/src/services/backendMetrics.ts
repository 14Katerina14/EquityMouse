import Constants from "expo-constants";
import { Platform } from "react-native";
import { MetricValuesMap } from "../types";

type BackendMetricsResponse = {
  symbol: string;
  type: string;
  source: string;
  url: string;
  scrapedAt: string;
  metrics: MetricValuesMap;
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

export async function fetchBackendMetrics(symbol: string) {
  const baseUrl = getBackendBaseUrl();
  const response = await fetch(`${baseUrl}/api/metrics/${encodeURIComponent(symbol.toUpperCase())}`);

  if (!response.ok) {
    throw new Error(`Backend metrics request failed with status ${response.status}`);
  }

  const data = (await response.json()) as BackendMetricsResponse;

  return {
    symbol: data.symbol,
    metrics: data.metrics || {},
    source: data.source,
  };
}
