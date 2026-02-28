import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { publicApi } from "../lib/api";

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
  errorBg: "#FDECEA",
};

// ── Restaurant row card ───────────────────────────────────────────────────────
function RestaurantRow({ item, onPress }) {
  const initials = item.name
    ? item.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "--";

  return (
    <TouchableOpacity style={styles.rowCard} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.rowThumb}>
        <Text style={styles.rowThumbText}>{initials}</Text>
      </View>

      <View style={styles.rowBody}>
        <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {[item.type, item.city, item.state].filter(Boolean).join("  ·  ")}
        </Text>
        {!!item.description && (
          <Text style={styles.rowDesc} numberOfLines={2}>{item.description}</Text>
        )}
      </View>

      <View style={styles.rowArrow}>
        <Ionicons name="arrow-forward" size={14} color={C.white} />
      </View>
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function Restaurants() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState([]);
  const [error, setError] = useState("");

  const load = async (query = "") => {
    setLoading(true);
    setError("");
    try {
      const res = await publicApi.listRestaurants({ q: query });
      setRestaurants(res?.data?.restaurants || []);
    } catch (e) {
      setError(e.message || "Failed to load restaurants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(""); }, []);

  const openRestaurant = (id) =>
    router.push({ pathname: "/restaurant-detail", params: { businessId: id } });

  const isEmpty = !loading && !error && restaurants.length === 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Restaurants</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => load(q)} disabled={loading}>
          <Ionicons name="refresh-outline" size={19} color={loading ? C.textMuted : C.green} />
        </TouchableOpacity>
      </View>

      {/* ── Search bar ─────────────────────────────────── */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={C.textMuted} />
          <TextInput
            value={q}
            onChangeText={(t) => {
              setQ(t);
              if (t.trim().length >= 2) load(t);
              if (t.trim().length === 0) load("");
            }}
            onSubmitEditing={() => load(q)}
            placeholder="Search by name, city, state..."
            placeholderTextColor={C.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {q.length > 0 && (
            <TouchableOpacity onPress={() => { setQ(""); load(""); }}>
              <Ionicons name="close-circle" size={18} color={C.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchBtn} onPress={() => load(q)}>
          <Ionicons name="arrow-forward-outline" size={22} color={C.white} />
        </TouchableOpacity>
      </View>

      {/* ── Loading ─────────────────────────────────────── */}
      {loading && (
        <View style={styles.stateBox}>
          <ActivityIndicator color={C.green} size="large" />
          <Text style={styles.stateText}>Loading restaurants...</Text>
        </View>
      )}

      {/* ── Error ───────────────────────────────────────── */}
      {!loading && error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => load(q)} style={styles.retryBtn}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Empty ───────────────────────────────────────── */}
      {isEmpty && (
        <View style={styles.emptyBox}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="storefront-outline" size={30} color={C.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>
            {q.trim() ? `No results for "${q}"` : "No restaurants yet"}
          </Text>
          <Text style={styles.emptySub}>
            {q.trim()
              ? "Try a different search term."
              : "Approve a business in admin to see it here."}
          </Text>
        </View>
      )}

      {/* ── List ────────────────────────────────────────── */}
      {!loading && !error && restaurants.length > 0 && (
        <FlatList
          data={restaurants}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListHeaderComponent={
            <Text style={styles.resultsCount}>
              {restaurants.length} {restaurants.length === 1 ? "restaurant" : "restaurants"}
            </Text>
          }
          renderItem={({ item }) => (
            <RestaurantRow item={item} onPress={() => openRestaurant(item.id)} />
          )}
        />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 12,
  },
  pageTitle: { fontSize: 24, fontWeight: "900", color: C.textDark, letterSpacing: -0.4 },
  refreshBtn: {
    width: 42, height: 42,
    backgroundColor: C.white,
    borderRadius: 21,
    alignItems: "center", justifyContent: "center",
    shadowColor: C.textDark, shadowOpacity: 0.06,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  // Search
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
  stateBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  stateText: { color: C.textMuted, fontSize: 13, marginTop: 12, fontWeight: "500" },
  errorBox: {
    margin: 20, backgroundColor: C.errorBg, borderRadius: 12,
    padding: 14, borderLeftWidth: 3, borderLeftColor: C.error,
  },
  errorText: { color: C.error, fontSize: 13, fontWeight: "500" },
  retryBtn: {
    marginTop: 10, alignSelf: "flex-start", backgroundColor: C.green,
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8,
  },
  retryText: { color: C.white, fontSize: 13, fontWeight: "700" },

  // Empty
  emptyBox: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 40, paddingBottom: 60,
  },
  emptyIconCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: C.border,
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: C.textDark, marginBottom: 6, textAlign: "center" },
  emptySub: { fontSize: 13, color: C.textMuted, textAlign: "center", lineHeight: 20 },

  // List
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  resultsCount: {
    fontSize: 12, color: C.textMuted, fontWeight: "600",
    textTransform: "uppercase", letterSpacing: 0.6,
    marginBottom: 12,
  },

  // Row card
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.cardBg,
    borderRadius: 14,
    padding: 12,
    gap: 12,
    shadowColor: C.textDark, shadowOpacity: 0.05,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  rowThumb: {
    width: 52, height: 52, borderRadius: 12,
    backgroundColor: C.greenMid,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  rowThumbText: { color: C.white, fontSize: 18, fontWeight: "900", letterSpacing: 0.5 },
  rowBody: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: "700", color: C.textDark, marginBottom: 3 },
  rowMeta: { fontSize: 12, color: C.textMuted, fontWeight: "500", marginBottom: 4 },
  rowDesc: { fontSize: 12, color: C.textMuted, lineHeight: 17 },
  rowArrow: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.green,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
});