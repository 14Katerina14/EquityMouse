import React from "react";
import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { HoldingsData } from "../data/topHoldings";
import { styles } from "../styles/appStyles";

const CHART_SIZE = 196;
const RADIUS = 48;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type TopHoldingsChartProps = {
  title?: string;
  data: HoldingsData;
};

export function TopHoldingsChart({ title = "Top Holdings", data }: TopHoldingsChartProps) {
  const { snapshot, holdings } = data;
  const chartHoldings = [
    ...holdings,
    {
      symbol: "Others",
      name: "Remaining holdings",
      weight: Number((100 - holdings.reduce((sum, item) => sum + item.weight, 0)).toFixed(2)),
      color: "#a8afbd",
    },
  ];

  let offset = 0;

  return (
    <View style={styles.holdersCard}>
      <Text style={styles.guideCardTitle}>{title}</Text>

      <View style={styles.holdingsSummaryRow}>
        <View style={styles.holdingsSummaryChip}>
          <Text style={styles.holdingsSummaryLabel}>Total Holdings</Text>
          <Text style={styles.holdingsSummaryValue}>{snapshot.totalHoldings}</Text>
        </View>
        <View style={styles.holdingsSummaryChip}>
          <Text style={styles.holdingsSummaryLabel}>Top 10</Text>
          <Text style={styles.holdingsSummaryValue}>{snapshot.top10Concentration}%</Text>
        </View>
      </View>

      <Text style={styles.holdingsAsOf}>Public holdings snapshot as of {snapshot.asOf}</Text>

      <View style={styles.holdersChartWrap}>
        <Svg width={CHART_SIZE} height={CHART_SIZE} viewBox="0 0 120 120">
          {chartHoldings.map((holding, index) => {
            const strokeDasharray = `${(holding.weight / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`;
            const strokeDashoffset = -offset;
            offset += (holding.weight / 100) * CIRCUMFERENCE;

            return (
              <Circle
                key={`${holding.symbol}-${index}`}
                cx="60"
                cy="60"
                r={RADIUS}
                fill="transparent"
                stroke={holding.color}
                strokeWidth="34"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                rotation="-90"
                origin="60, 60"
              />
            );
          })}
          <Circle cx="60" cy="60" r="30" fill="#111829" />
        </Svg>
      </View>

      <View style={styles.holdersLegend}>
        {chartHoldings.map((holding) => (
          <View key={holding.symbol} style={styles.holdersLegendItem}>
            <View style={[styles.holdersLegendSwatch, { backgroundColor: holding.color }]} />
            <Text style={styles.holdersLegendText}>
              {holding.symbol} ({holding.weight}%)
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.topHoldingsList}>
        {holdings.map((holding, index) => (
          <View key={`${holding.symbol}-${index}`} style={styles.topHoldingRow}>
            <View style={styles.topHoldingLeft}>
              <Text style={styles.topHoldingRank}>{index + 1}</Text>
              <View>
                <Text style={styles.topHoldingSymbol}>{holding.symbol}</Text>
                <Text style={styles.topHoldingName}>{holding.name}</Text>
              </View>
            </View>
            <Text style={styles.topHoldingWeight}>{holding.weight}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
