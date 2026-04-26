import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { getAvailableMetrics, getDefaultMetricIds } from "../data/metrics";
import { styles } from "../styles/appStyles";
import { COLORS } from "../theme/colors";
import { AssetCategory, MetricDefinition, MetricValuesMap } from "../types";

type MetricsSectionProps = {
  assetCategory: AssetCategory;
  assetTicker?: string;
  metricValues?: MetricValuesMap;
};

export function MetricsSection({ assetCategory, assetTicker, metricValues }: MetricsSectionProps) {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>(getDefaultMetricIds(assetCategory, assetTicker));
  const [activeMetric, setActiveMetric] = useState<MetricDefinition | null>(null);
  const availableMetrics = useMemo(() => getAvailableMetrics(assetCategory, assetTicker), [assetCategory, assetTicker]);

  useEffect(() => {
    setSelectedIds(getDefaultMetricIds(assetCategory, assetTicker));
    setQuery("");
    setActiveMetric(null);
  }, [assetCategory, assetTicker]);

  const resolvedMetrics = useMemo(() => {
    return availableMetrics.map((metric) => ({
      ...metric,
      value:
        metricValues && Object.prototype.hasOwnProperty.call(metricValues, metric.id)
          ? metricValues[metric.id] ?? "N/A"
          : metric.value,
    }));
  }, [availableMetrics, metricValues]);

  const metricMap = useMemo(() => {
    return new Map(resolvedMetrics.map((metric) => [metric.id, metric]));
  }, [resolvedMetrics]);

  const selectedMetrics = useMemo<MetricDefinition[]>(() => {
    return selectedIds
      .map((id) => metricMap.get(id))
      .filter((metric): metric is MetricDefinition => Boolean(metric));
  }, [metricMap, selectedIds]);

  const searchResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return [];
    }

    return resolvedMetrics.filter((metric) => {
      const searchable = [metric.label, ...metric.aliases].join(" ").toLowerCase();

      return !selectedIds.includes(metric.id) && searchable.includes(normalized);
    });
  }, [query, resolvedMetrics, selectedIds]);

  const removeMetric = (metricId: string) => {
    setSelectedIds((current) => current.filter((id) => id !== metricId));
  };

  const addMetric = (metricId: string) => {
    setSelectedIds((current) => (current.includes(metricId) ? current : [...current, metricId]));
    setQuery("");
  };

  return (
    <View style={styles.sectionBlock}>
      <Text style={styles.detailSectionTitle}>Metrics</Text>

      <View style={styles.metricsSearchWrap}>
        <TextInput
          placeholder="Search metrics like P/E, ROE or FCF..."
          placeholderTextColor={COLORS.muted}
          value={query}
          onChangeText={setQuery}
          style={styles.metricsSearchInput}
        />
      </View>

      {query.trim() ? (
        <View style={styles.metricsSearchResults}>
          {searchResults.length > 0 ? (
            searchResults.map((metric) => (
              <TouchableOpacity
                key={metric.id}
                style={styles.metricSearchItem}
                activeOpacity={0.85}
                onPress={() => addMetric(metric.id)}
              >
                <Text style={styles.metricSearchLabel}>{metric.label}</Text>
                <Text style={styles.metricSearchValue}>{metric.value}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.detailSubtext}>No matching metrics found.</Text>
          )}
        </View>
      ) : null}

      <View style={styles.metricChipRow}>
        {selectedMetrics.map((metric) => (
          <View key={metric.id} style={styles.metricChip}>
            <Text style={styles.metricChipText}>{metric.label}</Text>
            <TouchableOpacity onPress={() => removeMetric(metric.id)} activeOpacity={0.8}>
              <Text style={styles.metricChipClose}>x</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {selectedMetrics.length === 0 ? (
        <Text style={styles.detailSubtext}>No metrics selected. Use the search bar to add metrics back.</Text>
      ) : null}

      <View style={styles.metricsGrid}>
        {selectedMetrics.map((metric) => (
          <View key={`card-${metric.id}`} style={styles.metricCard}>
            <View style={styles.metricCardTopRow}>
              <Text style={styles.metricCardLabel}>{metric.label}</Text>
              <TouchableOpacity activeOpacity={0.8} onPress={() => setActiveMetric(metric)}>
                <Text style={styles.metricInfoIcon}>i</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.metricCardValue}>{metric.value}</Text>
          </View>
        ))}
      </View>

      <Modal visible={Boolean(activeMetric)} transparent animationType="fade" onRequestClose={() => setActiveMetric(null)}>
        <Pressable style={styles.metricModalOverlay} onPress={() => setActiveMetric(null)}>
          <Pressable style={styles.metricModalCard} onPress={() => undefined}>
            {activeMetric ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.metricModalHeader}>
                  <View>
                    <Text style={styles.metricModalTitle}>{activeMetric.title}</Text>
                    <Text style={styles.metricModalValue}>{activeMetric.value}</Text>
                  </View>
                  <TouchableOpacity activeOpacity={0.8} onPress={() => setActiveMetric(null)}>
                    <Text style={styles.metricModalClose}>x</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.metricModalSection}>
                  <Text style={styles.metricModalSectionLabel}>Definition</Text>
                  <Text style={styles.metricModalBody}>{activeMetric.definition}</Text>
                </View>

                <View style={styles.metricModalSection}>
                  <Text style={styles.metricModalSectionLabel}>Formula</Text>
                  <View style={styles.metricFormulaBox}>
                    <Text style={styles.metricFormulaText}>{activeMetric.formula}</Text>
                  </View>
                </View>

                <View style={styles.metricModalSection}>
                  <Text style={styles.metricModalSectionLabel}>Interpretation</Text>
                  <Text style={styles.metricModalBody}>{activeMetric.interpretation}</Text>
                </View>

                <View style={styles.metricModalSection}>
                  <Text style={styles.metricModalSectionLabel}>Good / Bad</Text>
                  <Text style={styles.metricModalBody}>{activeMetric.goodBad}</Text>
                </View>

                <View style={styles.metricModalSection}>
                  <Text style={styles.metricModalSectionLabel}>Important Sectors</Text>
                  <Text style={styles.metricModalBody}>{activeMetric.sectors}</Text>
                </View>

                <View style={styles.metricModalSection}>
                  <Text style={styles.metricModalSectionLabel}>Warning</Text>
                  <Text style={styles.metricModalBody}>{activeMetric.warning}</Text>
                </View>
              </ScrollView>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
