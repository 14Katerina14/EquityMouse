import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";
import { MouseBankerLogo } from "../components/MouseBankerLogo";
import { ASSETS } from "../data/assets";
import { searchBackendAssets } from "../services/backendAssets";
import { fetchHomeQuotes } from "../services/backendQuotes";
import { styles } from "../styles/appStyles";
import { COLORS } from "../theme/colors";
import { Asset, AssetCategory, AssetLookup } from "../types";

type HomeScreenProps = {
  onOpenDetail: (asset: Asset) => void;
  onOpenGuide: () => void;
};

export function HomeScreen({ onOpenDetail, onOpenGuide }: HomeScreenProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<AssetCategory>("stocks");
  const [assets, setAssets] = useState<Asset[]>(ASSETS);
  const [searchResults, setSearchResults] = useState<AssetLookup[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    fetchHomeQuotes()
      .then((result) => {
        if (!mounted) {
          return;
        }

        setAssets(result.assets);
      })
      .catch(() => {
        if (!mounted) {
          return;
        }

        setAssets(ASSETS);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const query = search.trim();

    if (!query) {
      setSearchResults([]);
      setIsSearchLoading(false);
      return;
    }

    let cancelled = false;
    setIsSearchLoading(true);

    const timeoutId = setTimeout(() => {
      searchBackendAssets(query)
        .then((results) => {
          if (cancelled) {
            return;
          }

          setSearchResults(results);
          setIsSearchLoading(false);
        })
        .catch(() => {
          if (cancelled) {
            return;
          }

          setSearchResults([]);
          setIsSearchLoading(false);
        });
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [search]);

  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase();
    return assets.filter((asset) => {
      const matchesCategory = asset.category === activeCategory;
      const matchesSearch =
        !query ||
        asset.ticker.toLowerCase().includes(query) ||
        asset.company.toLowerCase().includes(query) ||
        asset.tag.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, assets, search]);

  const isSearchMode = search.trim().length > 0;
  const filteredSearchResults = useMemo(() => {
    return searchResults.filter((asset) => asset.category === activeCategory);
  }, [activeCategory, searchResults]);

  const sectionTitle =
    isSearchMode
      ? "Search Results"
      : activeCategory === "stocks"
      ? "Trending Stocks"
      : activeCategory === "metals"
        ? "Precious Metals"
        : "Popular ETFs";

  const buildLookupAsset = (lookup: AssetLookup): Asset => ({
    ticker: lookup.ticker,
    company: lookup.company,
    tag: lookup.tag,
    category: lookup.category,
    price: "--",
    move: "--",
    changeValue: "--",
    trend: "flat",
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
        <View style={styles.searchRow}>
          <View style={styles.searchShell}>
            <TextInput
              placeholder="Search assets..."
              placeholderTextColor={COLORS.muted}
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />
          </View>
          <TouchableOpacity style={styles.docsButton} activeOpacity={0.85} onPress={onOpenGuide}>
            <View style={styles.docsIconPaper}>
              <View style={styles.docsIconLineShort} />
              <View style={styles.docsIconLine} />
              <View style={styles.docsIconLine} />
            </View>
          </TouchableOpacity>
          <View style={styles.avatarButton}>
            <Text style={styles.avatarText}>EM</Text>
          </View>
        </View>

        <View style={styles.bannerCard}>
          <View>
            <Text style={styles.bannerEyebrow}>Today's Focus</Text>
            <Text style={styles.bannerTitle}>EquityMouse Dashboard</Text>
            <Text style={styles.bannerBody}>
              Yellow-accent watchlist built around big-name equities, metals, and the S&P 500.
            </Text>
          </View>
          <MouseBankerLogo />
        </View>

        <View style={styles.categoryRow}>
          <TouchableOpacity
            style={[styles.categoryChip, activeCategory === "stocks" ? styles.categoryChipActive : null]}
            activeOpacity={0.85}
            onPress={() => setActiveCategory("stocks")}
          >
            <Text style={activeCategory === "stocks" ? styles.categoryChipActiveText : styles.categoryChipText}>
              Trending Stocks
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.categoryChip, activeCategory === "metals" ? styles.categoryChipActive : null]}
            activeOpacity={0.85}
            onPress={() => setActiveCategory("metals")}
          >
            <Text style={activeCategory === "metals" ? styles.categoryChipActiveText : styles.categoryChipText}>
              Precious Metals
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.categoryChip, activeCategory === "etfs" ? styles.categoryChipActive : null]}
            activeOpacity={0.85}
            onPress={() => setActiveCategory("etfs")}
          >
            <Text style={activeCategory === "etfs" ? styles.categoryChipActiveText : styles.categoryChipText}>
              Popular ETFs
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{sectionTitle}</Text>
        </View>

        {isSearchMode ? (
          <View style={styles.searchResultsWrap}>
            {isSearchLoading ? <Text style={styles.detailSubtext}>Searching more supported assets...</Text> : null}

            {!isSearchLoading && filteredSearchResults.length === 0 ? (
              <Text style={styles.detailSubtext}>No supported assets matched this search yet.</Text>
            ) : null}

            {filteredSearchResults.map((asset) => (
              <TouchableOpacity
                key={`search-${asset.ticker}`}
                style={styles.searchResultCard}
                activeOpacity={0.88}
                onPress={() => onOpenDetail(buildLookupAsset(asset))}
              >
                <View style={styles.searchResultTopRow}>
                  <View>
                    <Text style={styles.searchResultTicker}>{asset.ticker}</Text>
                    <Text style={styles.searchResultCompany}>{asset.company}</Text>
                  </View>
                  <View style={styles.assetTag}>
                    <Text style={styles.assetTagText}>{asset.tag}</Text>
                  </View>
                </View>
                <View style={styles.searchResultBottomRow}>
                  <Text style={styles.searchResultMeta}>
                    {asset.category === "stocks" ? "Stock" : asset.category === "etfs" ? "ETF" : "Metal"}
                  </Text>
                  <Text style={styles.searchResultHint}>Open detail to load live data</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          filteredAssets.map((asset) => {
          const moveColor = asset.trend === "down" ? COLORS.danger : COLORS.success;

          return (
            <TouchableOpacity
              key={asset.ticker}
              style={styles.assetCard}
              activeOpacity={0.9}
              onPress={() => onOpenDetail(asset)}
            >
              <View style={styles.assetInfo}>
                <View style={styles.assetTopRow}>
                  <View>
                    <Text style={styles.assetTicker}>{asset.ticker}</Text>
                    <Text style={styles.assetCompany}>{asset.company}</Text>
                  </View>
                  <View style={styles.assetTag}>
                    <Text style={styles.assetTagText}>{asset.tag}</Text>
                  </View>
                </View>

                <View style={styles.assetBottomRow}>
                  <Text style={styles.assetPrice}>{asset.price}</Text>
                  <Text style={[styles.assetMove, { color: moveColor }]}>{asset.move}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }))}
      </ScrollView>
    </SafeAreaView>
  );
}
