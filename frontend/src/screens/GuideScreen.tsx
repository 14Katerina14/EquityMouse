import React from "react";
import { SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { AVAILABLE_METRICS } from "../data/metrics";
import { GUIDEBOOK_TOPICS, INVESTING_GUIDE } from "../data/guidebook";
import { styles } from "../styles/appStyles";

type GuideScreenProps = {
  onBack: () => void;
};

export function GuideScreen({ onBack }: GuideScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.screen} contentContainerStyle={styles.guideContent}>
        <View style={styles.detailTopRow}>
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.85}>
            <Text style={styles.backButtonText}>{"<"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.guideHeader}>
          <Text style={styles.detailSectionTitle}>Guidebook</Text>
          <Text style={styles.detailSubtext}>
            Learn the basics of markets, funds, ownership signals, and how to read the metrics inside EquityMouse.
          </Text>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.detailSectionTitle}>Market Basics</Text>
          {GUIDEBOOK_TOPICS.map((topic) => (
            <View key={topic.id} style={styles.guideCard}>
              <Text style={styles.guideCardTitle}>{topic.title}</Text>
              <Text style={styles.guideCardBody}>{topic.body}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.detailSectionTitle}>Metric Cheat Sheet</Text>
          {AVAILABLE_METRICS.map((metric) => (
            <View key={metric.id} style={styles.guideCard}>
              <Text style={styles.guideCardTitle}>{metric.label}</Text>
              <Text style={styles.guideCardBody}>{metric.definition}</Text>
              <Text style={styles.guideGuideLabel}>Formula</Text>
              <Text style={styles.guideCardBody}>{metric.formula}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.detailSectionTitle}>How To Invest</Text>
          <View style={styles.guideCard}>
            {INVESTING_GUIDE.map((tip, index) => (
              <View key={`tip-${index}`} style={styles.guideTipRow}>
                <Text style={styles.guideTipIndex}>{index + 1}</Text>
                <Text style={styles.guideTipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
