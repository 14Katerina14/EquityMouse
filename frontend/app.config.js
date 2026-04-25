require("dotenv").config();

module.exports = () => ({
  expo: {
    name: "EquityMouse",
    slug: "equitymouse",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "dark",
    splash: {
      resizeMode: "contain",
      backgroundColor: "#070b16",
    },
    assetBundlePatterns: ["**/*"],
    extra: {
      twelveDataApiKey: process.env.EXPO_PUBLIC_TWELVE_DATA_API_KEY ?? "",
      backendBaseUrl: process.env.EXPO_PUBLIC_BACKEND_BASE_URL ?? "",
    },
  },
});
