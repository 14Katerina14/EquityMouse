import Constants from "expo-constants";
import { Platform } from "react-native";
import { AssetLookup } from "../types";

type AssetSearchResponse = {
  query: string;
  count: number;
  assets: AssetLookup[];
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

export async function searchBackendAssets(query: string) {
  const trimmed = query.trim();

  if (!trimmed) {
    return [] as AssetLookup[];
  }

  const baseUrl = getBackendBaseUrl();
  const response = await fetch(`${baseUrl}/api/assets/search?q=${encodeURIComponent(trimmed)}`);

  if (!response.ok) {
    throw new Error(`Backend asset search request failed with status ${response.status}`);
  }

  const data = (await response.json()) as AssetSearchResponse;
  return Array.isArray(data.assets) ? data.assets : [];
}
