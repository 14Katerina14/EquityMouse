import React, { useState } from "react";
import { DetailScreen } from "./src/screens/DetailScreen";
import { GuideScreen } from "./src/screens/GuideScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { Asset, Screen } from "./src/types";
import { ASSETS } from "./src/data/assets";

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [selectedAsset, setSelectedAsset] = useState<Asset>(ASSETS.find((asset) => asset.ticker === "SPY")!);

  if (screen === "login") {
    return <LoginScreen onLogin={() => setScreen("home")} />;
  }

  if (screen === "home") {
    return (
      <HomeScreen
        onOpenDetail={(asset) => {
          setSelectedAsset(asset);
          setScreen("detail");
        }}
        onOpenGuide={() => setScreen("guide")}
      />
    );
  }

  if (screen === "guide") {
    return <GuideScreen onBack={() => setScreen("home")} />;
  }

  return <DetailScreen initialAsset={selectedAsset} onBack={() => setScreen("home")} />;
}
