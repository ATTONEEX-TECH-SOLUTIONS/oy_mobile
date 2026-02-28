import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { publicApi } from "../../lib/api";

// ── Brand tokens ──────────────────────────────────────────────────────────────
const C = {
  green: "#1B4332",
  greenMid: "#2D6A4F",
  greenLight: "#52B788",
  amber: "#D4860B",
  amberLight: "#F4A620",
  bg: "#F5F1EB",
  white: "#FFFFFF",
  textDark: "#111C14",
  textMuted: "#6B7C6E",
  border: "#D8E4DC",
  cardBg: "#FFFFFF",
  error: "#C0392B",
};

// ── Restaurant result row ─────────────────────────────────────────────────────
function ResultRow({ restaurant, onPress }) {
  return (
    <TouchableOpacity style={styles.resultCard} onPress={onPress} activeOpacity={0.75}>
      {/* Initials thumbnail */}
      <View style={styles.resultThumb}>
        <Text style={styles.resultThumbText}>
          {restaurant.name
            ? restaurant.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
            : "--"}
        </Text>
      </View>

      <View style={styles.resultBody}>
        <Text style={styles.resultName} numberOfLines={1}>{restaurant.name}</Text>
        <Text style={styles.resultMeta} numberOfLines={1}>
          {[restaurant.type, restaurant.city, restaurant.state].filter(Boolean).join("  ·  ")}
        </Text>
      </View>

      <View style={styles.resultArrow}>
        <Ionicons name="arrow-forward" size={14} color={C.white} />
      </View>
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function Search() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const initial = typeof params.query === "string" ? params.query : "";
  const [searchQuery, setSearchQuery] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(!!initial);

  const runSearch = async (q) => {
    const query = (q || "").trim();
    if (!query) { setResults([]); setError(""); setHasSearched(false); return; }

    setLoading(true);
    setError("");
    setHasSearched(true);
    try {
      const res = await publicApi.listRestaurants({ q: query, page: 1, limit: 20 });
      setResults(res?.data?.restaurants || []);
    } catch (e) {
      setError(e.message || "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initial) runSearch(initial);
  }, []);

  const openRestaurant = (id) => {
    router.push(`/restaurant-detail?businessId=${encodeURIComponent(String(id))}`);
  };

  const isEmpty = searchQuery.trim().length === 0;
  const noResults = !loading && !error && hasSearched && results.length === 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ── Page header ─────────────────────────────────── */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Search</Text>
      </View>

      {/* ── Search bar ─────────────────────────────────── */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={C.textMuted} />
          <TextInput
            placeholder="Search restaurants, cities..."
            placeholderTextColor={C.textMuted}
            value={searchQuery}
            onChangeText={(t) => {
              setSearchQuery(t);
              if (t.trim().length >= 2) runSearch(t);
              if (t.trim().length === 0) runSearch("");
            }}
            onSubmitEditing={() => runSearch(searchQuery)}
            style={styles.searchInput}
            returnKeyType="search"
            autoFocus={!initial}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(""); runSearch(""); }}>
              <Ionicons name="close-circle" size={18} color={C.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchBtn} onPress={() => runSearch(searchQuery)}>
          <Ionicons name="arrow-forward-outline" size={22} color={C.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Loading ──────────────────────────────────── */}
        {loading && (
          <View style={styles.stateBox}>
            <ActivityIndicator color={C.green} size="large" />
            <Text style={styles.stateText}>Searching...</Text>
          </View>
        )}

        {/* ── Error ───────────────────────────────────── */}
        {!loading && error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => runSearch(searchQuery)} style={styles.retryBtn}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Empty prompt (no query yet) ──────────────── */}
        {!loading && !error && isEmpty && (
          <View style={styles.promptBox}>
            <View style={styles.promptIconCircle}>
              <Ionicons name="search-outline" size={32} color={C.textMuted} />
            </View>
            <Text style={styles.promptTitle}>Find your next meal</Text>
            <Text style={styles.promptSub}>Search by restaurant name, city, or food type.</Text>

            {/* Suggestion chips */}
            <View style={styles.suggestionsRow}>
              {["Jollof Rice", "Suya", "Pizza", "Chicken"].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={styles.suggestionChip}
                  onPress={() => { setSearchQuery(s); runSearch(s); }}
                >
                  <Text style={styles.suggestionChipText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── No results ───────────────────────────────── */}
        {noResults && (
          <View style={styles.promptBox}>
            <View style={styles.promptIconCircle}>
              <Ionicons name="storefront-outline" size={32} color={C.textMuted} />
            </View>
            <Text style={styles.promptTitle}>No results found</Text>
            <Text style={styles.promptSub}>
              No restaurants matched "{searchQuery}". Try a different search.
            </Text>
          </View>
        )}

        {/* ── Results ─────────────────────────────────── */}
        {!loading && !error && results.length > 0 && (
          <View style={styles.resultsList}>
            <Text style={styles.resultsCount}>
              {results.length} {results.length === 1 ? "restaurant" : "restaurants"} found
            </Text>
            {results.map((r) => (
              <ResultRow key={r.id} restaurant={r} onPress={() => openRestaurant(r.id)} />
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },

  // Header
  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 12,
  },
  pageTitle: { fontSize: 24, fontWeight: "900", color: C.textDark, letterSpacing: -0.4 },

  // Search bar
  searchWrapper: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 8,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.textDark, fontWeight: "500" },
  searchBtn: {
    width: 50, height: 50,
    backgroundColor: C.green,
    borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },

  // States
  stateBox: { alignItems: "center", paddingTop: 60 },
  stateText: { color: C.textMuted, fontSize: 13, marginTop: 12, fontWeight: "500" },
  errorBox: {
    margin: 20, backgroundColor: "#FDECEA", borderRadius: 12,
    padding: 14, borderLeftWidth: 3, borderLeftColor: C.error,
  },
  errorText: { color: C.error, fontSize: 13, fontWeight: "500" },
  retryBtn: {
    marginTop: 10, alignSelf: "flex-start", backgroundColor: C.green,
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8,
  },
  retryText: { color: C.white, fontSize: 13, fontWeight: "700" },

  // Prompt / empty
  promptBox: { alignItems: "center", paddingTop: 60, paddingHorizontal: 32 },
  promptIconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: C.border,
    alignItems: "center", justifyContent: "center",
    marginBottom: 18,
  },
  promptTitle: { fontSize: 18, fontWeight: "800", color: C.textDark, marginBottom: 8 },
  promptSub: { fontSize: 13, color: C.textMuted, textAlign: "center", lineHeight: 20 },
  suggestionsRow: {
    flexDirection: "row", flexWrap: "wrap",
    justifyContent: "center", gap: 8, marginTop: 24,
  },
  suggestionChip: {
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 30, backgroundColor: C.white,
    borderWidth: 1.5, borderColor: C.border,
  },
  suggestionChipText: { fontSize: 13, fontWeight: "600", color: C.greenMid },

  // Results
  resultsList: { paddingHorizontal: 20, paddingTop: 8, gap: 10 },
  resultsCount: {
    fontSize: 13, color: C.textMuted, fontWeight: "600",
    marginBottom: 4, letterSpacing: 0.2,
  },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.cardBg,
    borderRadius: 14,
    padding: 12,
    gap: 12,
    shadowColor: C.textDark, shadowOpacity: 0.05,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 10,
  },
  resultThumb: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: C.greenMid,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  resultThumbText: { color: C.white, fontSize: 15, fontWeight: "900", letterSpacing: 0.5 },
  resultBody: { flex: 1 },
  resultName: { fontSize: 15, fontWeight: "700", color: C.textDark, marginBottom: 3 },
  resultMeta: { fontSize: 12, color: C.textMuted, fontWeight: "500" },
  resultArrow: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.green,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
});