import React from "react";
import { View } from "react-native";
import { styles } from "../styles/appStyles";
import { COLORS } from "../theme/colors";
import { AssetTrend } from "../types";

type TrendLineProps = {
  trend: AssetTrend;
};

export function TrendLine({ trend }: TrendLineProps) {
  const color =
    trend === "up" ? COLORS.success : trend === "down" ? COLORS.danger : COLORS.yellow;

  return (
    <View style={styles.trendTrack}>
      <View style={[styles.trendSegment, { width: 18, backgroundColor: color, marginTop: 12 }]} />
      <View style={[styles.trendSegment, { width: 22, backgroundColor: color, marginTop: 8 }]} />
      <View style={[styles.trendSegment, { width: 26, backgroundColor: color, marginTop: 4 }]} />
      <View style={[styles.trendSegment, { width: 30, backgroundColor: color }]} />
    </View>
  );
}
