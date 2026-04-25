import React from "react";
import { View } from "react-native";
import { styles } from "../styles/appStyles";

export function MouseBankerLogo() {
  return (
    <View style={styles.logoWrap}>
      <View style={[styles.ear, styles.earLeft]} />
      <View style={[styles.ear, styles.earRight]} />
      <View style={styles.face}>
        <View style={styles.glassesRow}>
          <View style={styles.glass} />
          <View style={styles.bridge} />
          <View style={styles.glass} />
        </View>
        <View style={styles.eyeRow}>
          <View style={styles.eye} />
          <View style={styles.eye} />
        </View>
        <View style={styles.nose} />
        <View style={styles.whiskerRow}>
          <View style={styles.whiskerLeft} />
          <View style={styles.whiskerRight} />
        </View>
      </View>
      <View style={styles.collar} />
      <View style={styles.tie} />
    </View>
  );
}
