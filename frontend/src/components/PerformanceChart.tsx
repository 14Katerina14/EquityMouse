import React, { useState } from "react";
import { LayoutChangeEvent, Text, TouchableOpacity, View } from "react-native";
import Svg, { Line, Path } from "react-native-svg";
import { CHART_ORDER, SPY_RANGE_DATA } from "../data/chartData";
import { styles } from "../styles/appStyles";
import { COLORS } from "../theme/colors";
import { ChartRange, ChartSeriesByRange } from "../types";

type PerformanceChartProps = {
  seriesByRange?: ChartSeriesByRange;
  activeRange?: ChartRange;
  onRangeChange?: (range: ChartRange) => void;
};

export function PerformanceChart({
  seriesByRange = SPY_RANGE_DATA,
  activeRange: controlledRange,
  onRangeChange,
}: PerformanceChartProps) {
  if (!seriesByRange) {
    return (
      <View style={styles.chartCard}>
        <View style={styles.chartEmptyState}>
          <Text style={styles.chartEmptyTitle}>Chart data unavailable</Text>
          <Text style={styles.chartEmptyBody}>
            Live price loaded, but historical data could not be fetched right now.
          </Text>
        </View>
      </View>
    );
  }

  const [internalRange, setInternalRange] = useState<ChartRange>("1M");
  const [chartWidth, setChartWidth] = useState(0);
  const activeRange = controlledRange ?? internalRange;
  const height = 220;
  const activeData = seriesByRange[activeRange];
  const max = Math.max(...activeData.values);
  const min = Math.min(...activeData.values);
  const range = max - min || 1;
  const width = Math.max(chartWidth, 1);

  const onChartLayout = (event: LayoutChangeEvent) => {
    setChartWidth(event.nativeEvent.layout.width);
  };

  const points = activeData.values.map((value, index) => {
    const x = activeData.values.length === 1 ? width / 2 : (index / (activeData.values.length - 1)) * width;
    const normalized = (value - min) / range;
    const y = height - normalized * (height - 8) - 4;
    return { x, y };
  });

  const pathData = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");

  const yAxisLabels = Array.from({ length: 4 }, (_, index) => {
    const ratio = (3 - index) / 3;
    const value = min + range * ratio;
    return value.toFixed(0);
  });

  const visibleLabels =
    activeData.labels.length <= 6
      ? activeData.labels
      : activeData.labels.filter(
          (_, index) =>
            index % Math.ceil(activeData.labels.length / 6) === 0 || index === activeData.labels.length - 1,
        );

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartArea}>
        <View style={styles.chartYAxis}>
          {yAxisLabels.map((label, index) => (
            <Text key={`${label}-${index}`} style={styles.chartAxisLabel}>
              {label}
            </Text>
          ))}
        </View>

        <View style={styles.chartBody}>
          <View style={[styles.chartGrid, { top: 8 }]} />
          <View style={[styles.chartGrid, { top: 72 }]} />
          <View style={[styles.chartGrid, { top: 136 }]} />
          <View style={[styles.chartGrid, { top: 200 }]} />

          <View style={styles.chartSvgShell} onLayout={onChartLayout}>
            {chartWidth > 0 ? (
              <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
                {[8, 72, 136, 200].map((gridY) => (
                  <Line
                    key={gridY}
                    x1="0"
                    y1={gridY}
                    x2={width}
                    y2={gridY}
                    stroke="#1a2234"
                    strokeWidth="1"
                  />
                ))}
                <Path
                  d={pathData}
                  fill="none"
                  stroke={COLORS.yellowBright}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            ) : null}
          </View>

          <View style={styles.chartLabelsRow}>
            {visibleLabels.map((label, index) => (
              <Text key={`${label}-${index}`} style={styles.chartXLabel}>
                {label}
              </Text>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.rangeRow}>
        {CHART_ORDER.map((rangeItem) => {
          const active = rangeItem === activeRange;
          return (
            <TouchableOpacity
              key={rangeItem}
              style={[styles.rangeChip, active && styles.rangeChipActive]}
              activeOpacity={0.85}
              onPress={() => {
                setInternalRange(rangeItem);
                onRangeChange?.(rangeItem);
              }}
            >
              <Text style={[styles.rangeChipText, active && styles.rangeChipTextActive]}>{rangeItem}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
