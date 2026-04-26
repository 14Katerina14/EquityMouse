import Constants from "expo-constants";
import { Platform } from "react-native";
import { HoldingsData } from "../data/topHoldings";

type BackendHolderEntry = {
  name: string;
  stake: number;
  sharesHeld: string;
  reportedDate: string;
  valueThousands: string;
};

type BackendFundHoldingEntry = {
  symbol: string;
  name: string;
  weight: number;
  sharesHeld?: string;
};

type BackendHoldersResponse = {
  symbol: string;
  type: string;
  source: string;
  scrapedAt: string;
  snapshot: {
    asOf: string;
    totalHolders?: number;
    totalHoldings?: number;
    top10Concentration: number;
  };
  holders?: BackendHolderEntry[];
  holdings?: BackendFundHoldingEntry[];
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
];

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

function buildShortSymbol(name: string) {
  return name
    .replace(/\b(The|Inc|LLC|Ltd|Corp|Corporation|Group|Global|Advisors|Asset|Management)\b/gi, "")
    .replace(/[.,]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(" ");
}

export async function fetchBackendHolders(symbol: string): Promise<HoldingsData> {
  const baseUrl = getBackendBaseUrl();
  const response = await fetch(`${baseUrl}/api/holders/${encodeURIComponent(symbol.toUpperCase())}`);

  if (!response.ok) {
    throw new Error(`Backend holders request failed with status ${response.status}`);
  }

  const data = (await response.json()) as BackendHoldersResponse;
  const normalizedHoldings =
    data.holdings?.map((holding) => ({
      symbol: holding.symbol,
      name: holding.name,
      weight: holding.weight,
    })) ||
    data.holders?.map((holder) => ({
      symbol: buildShortSymbol(holder.name),
      name: holder.name,
      weight: holder.stake,
    })) ||
    [];

  return {
    snapshot: {
      asOf: data.snapshot?.asOf || data.holders?.[0]?.reportedDate || "Latest filing",
      totalHoldings: data.snapshot?.totalHoldings || data.snapshot?.totalHolders || normalizedHoldings.length || 0,
      top10Concentration: data.snapshot?.top10Concentration || 0,
    },
    holdings: normalizedHoldings.map((holding, index) => ({
      symbol: holding.symbol,
      name: holding.name,
      weight: holding.weight,
      color: palette[index % palette.length],
    })),
  };
}
