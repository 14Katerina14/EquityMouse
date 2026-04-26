import React, { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { MetricsSection } from "../components/MetricsSection";
import { PerformanceChart } from "../components/PerformanceChart";
import { TopHoldingsChart } from "../components/TopHoldingsChart";
import { getTopHoldingsData, HoldingsData } from "../data/topHoldings";
import { fetchBackendHolders } from "../services/backendHolders";
import { fetchBackendQuoteAsset } from "../services/backendQuotes";
import { fetchBackendMetrics } from "../services/backendMetrics";
import { fetchSpyMarketData, hasSpyApiKey } from "../services/marketData";
import { styles } from "../styles/appStyles";
import { COLORS } from "../theme/colors";
import { Asset, ChartRange, ChartSeriesByRange, MetricValuesMap } from "../types";

type DetailScreenProps = {
  initialAsset: Asset;
  onBack: () => void;
};

function buildGenericSeries(price: number): ChartSeriesByRange {
  const base = price || 100;

  return {
    "1D": {
      labels: ["9:30", "10:30", "11:30", "12:30", "13:30", "14:30", "15:30", "16:00"],
      values: [0.992, 0.996, 1.001, 0.999, 1.004, 1.002, 1.006, 1].map((factor) => Number((base * factor).toFixed(2))),
    },
    "1W": {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      values: [0.982, 0.989, 0.994, 1.003, 1].map((factor) => Number((base * factor).toFixed(2))),
    },
    "1M": {
      labels: ["W1", "W1", "W1", "W2", "W2", "W2", "W3", "W3", "W4", "W4", "W4", "Now"],
      values: [0.95, 0.958, 0.966, 0.973, 0.968, 0.976, 0.984, 0.992, 1.004, 1.012, 1.008, 1].map((factor) =>
        Number((base * factor).toFixed(2))
      ),
    },
    "6M": {
      labels: ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"],
      values: [0.82, 0.87, 0.9, 0.94, 0.97, 1].map((factor) => Number((base * factor).toFixed(2))),
    },
    "1Y": {
      labels: ["May", "Jul", "Sep", "Nov", "Jan", "Mar", "Apr"],
      values: [0.76, 0.8, 0.85, 0.89, 0.93, 0.97, 1].map((factor) => Number((base * factor).toFixed(2))),
    },
    "5Y": {
      labels: ["2021", "2022", "2023", "2024", "2025", "2026"],
      values: [0.48, 0.56, 0.63, 0.74, 0.88, 1].map((factor) => Number((base * factor).toFixed(2))),
    },
  };
}

function parseAssetPrice(rawPrice: string) {
  const numericPrice = Number(String(rawPrice).replace(/[$,]/g, ""));
  return Number.isFinite(numericPrice) ? numericPrice : 100;
}

export function DetailScreen({ initialAsset, onBack }: DetailScreenProps) {
  const fallbackAsset = initialAsset;
  const assetTicker = initialAsset.ticker;
  const apiKeyDetected = hasSpyApiKey();
  const [asset, setAsset] = useState<Asset>(fallbackAsset);
  const [seriesByRange, setSeriesByRange] = useState<ChartSeriesByRange | undefined>(undefined);
  const [dataSource, setDataSource] = useState<"live" | "mock">("mock");
  const [dataReason, setDataReason] = useState(`Loading ${fallbackAsset.ticker} data...`);
  const [activeRange, setActiveRange] = useState<ChartRange>("1M");
  const [metricValues, setMetricValues] = useState<MetricValuesMap>({});
  const [topHoldingsData, setTopHoldingsData] = useState<HoldingsData | null>(getTopHoldingsData(assetTicker));

  useEffect(() => {
    let mounted = true;

    setAsset(fallbackAsset);
    setMetricValues({});
    setTopHoldingsData(getTopHoldingsData(assetTicker));

    fetchBackendQuoteAsset(assetTicker, fallbackAsset)
      .then((backendAsset) => {
        if (!mounted) {
          return;
        }

        setAsset(backendAsset);

        if (assetTicker !== "SPY") {
          setSeriesByRange(buildGenericSeries(parseAssetPrice(backendAsset.price)));
          setDataSource("mock");
          setDataReason(`Live quote loaded for ${backendAsset.ticker}. Historical detail data is still using the seeded overview chart.`);
        }
      })
      .catch(() => {
        if (!mounted) {
          return;
        }

        setAsset(fallbackAsset);

        if (assetTicker !== "SPY") {
          setSeriesByRange(buildGenericSeries(parseAssetPrice(fallbackAsset.price)));
          setDataSource("mock");
          setDataReason(`Detailed live data for ${fallbackAsset.ticker} is not connected yet. Showing seeded overview data.`);
        }
      });

    fetchBackendMetrics(assetTicker)
      .then((result) => {
        if (!mounted) {
          return;
        }

        setMetricValues(result.metrics);
      })
      .catch(() => {
        if (!mounted) {
          return;
        }

        setMetricValues({});
      });

    if (fallbackAsset.category === "stocks" || fallbackAsset.category === "etfs") {
      fetchBackendHolders(assetTicker)
        .then((result) => {
          if (!mounted) {
            return;
          }

          setTopHoldingsData(result);
        })
        .catch(() => {
          if (!mounted) {
            return;
          }

          setTopHoldingsData(getTopHoldingsData(assetTicker));
        });
    } else {
      setTopHoldingsData(null);
    }

    if (assetTicker === "SPY") {
      fetchSpyMarketData().then((result) => {
        if (!mounted) {
          return;
        }

        setAsset((currentAsset) => ({
          ...currentAsset,
          move: result.asset.move,
          changeValue: result.asset.changeValue,
          trend: result.asset.trend,
          price: currentAsset.price || result.asset.price,
        }));
        setSeriesByRange(result.seriesByRange);
        setDataSource(result.source);
        setDataReason(result.reason ?? (result.source === "live" ? "Live market data loaded for SPY." : "Using fallback demo data."));
      });
    }

    return () => {
      mounted = false;
    };
  }, [assetTicker, fallbackAsset]);

  const activeSeries = seriesByRange?.[activeRange];
  const rangeBasedAsset = (() => {
    if (!activeSeries || activeSeries.values.length < 2) {
      return asset;
    }

    const start = activeSeries.values[0];
    const end = activeSeries.values[activeSeries.values.length - 1];
    const change = end - start;
    const percent = start !== 0 ? (change / start) * 100 : 0;

    return {
      ...asset,
      changeValue: `${change >= 0 ? "+" : "-"}$${Math.abs(change).toFixed(2)}`,
      move: `${percent >= 0 ? "+" : "-"}${Math.abs(percent).toFixed(4)}%`,
      trend: change < 0 ? "down" : "up",
    };
  })();

  const changeColor = rangeBasedAsset.trend === "down" ? COLORS.danger : COLORS.success;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.screen} contentContainerStyle={styles.detailContent}>
        <View style={styles.detailTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.85}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          >
            <Text style={styles.backButtonText}>{"<"}</Text>
          </TouchableOpacity>
          <View style={styles.marketOpenWrap}>
            <View style={styles.marketDot} />
            <Text style={styles.marketOpenText}>Market Open</Text>
          </View>
        </View>

        <View style={styles.detailHeader}>
          <Text style={styles.detailCompany}>{asset.company}</Text>
          <View style={styles.detailMetaRow}>
            <Text style={styles.detailTicker}>{asset.ticker}</Text>
            <View style={styles.stockPill}>
              <Text style={styles.stockPillText}>
                {asset.category === "etfs" ? "ETF" : asset.category === "metals" ? "Commodity" : "Stock"}
              </Text>
            </View>
          </View>
          <Text style={styles.detailPrice}>{asset.price}</Text>
          <Text style={[styles.detailChange, { color: changeColor }]}>
            {rangeBasedAsset.changeValue} ({rangeBasedAsset.move})
          </Text>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.detailSectionTitle}>Performance</Text>
          <Text
            style={[
              styles.detailSubtext,
              dataSource === "live" ? styles.detailSubtextLive : styles.detailSubtextFallback,
            ]}
          >
            {dataSource === "live"
              ? `Live market data loaded for ${asset.ticker}.`
              : "Using fallback demo data."}
          </Text>
          <Text style={styles.detailSubtext}>Selected range: {activeRange}</Text>
          <Text style={styles.detailSubtext}>
            {dataSource === "live"
              ? dataReason
              : assetTicker === "SPY"
                ? `API key detected: ${apiKeyDetected ? "yes" : "no"} · ${dataReason}`
                : dataReason}
          </Text>
          <PerformanceChart
            seriesByRange={seriesByRange}
            activeRange={activeRange}
            onRangeChange={setActiveRange}
          />
        </View>

        {asset.category !== "metals" && topHoldingsData ? (
          <View style={styles.sectionBlock}>
            <Text style={styles.detailSectionTitle}>{asset.category === "etfs" ? "Top Holdings" : "Major Holders"}</Text>
            <TopHoldingsChart
              title={asset.category === "etfs" ? "Top Holdings" : "Major Holders"}
              data={topHoldingsData}
            />
          </View>
        ) : null}

        <MetricsSection assetCategory={asset.category} assetTicker={asset.ticker} metricValues={metricValues} />
      </ScrollView>
    </SafeAreaView>
  );
}
