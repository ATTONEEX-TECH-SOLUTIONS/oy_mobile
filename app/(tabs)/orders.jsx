import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CartContext } from "../../context/CartContext";
import { ordersApi } from "../../lib/api";

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

// ── Status config (color + label) ─────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:    { color: "#D4860B", bg: "#FEF3CD", label: "Pending" },
  confirmed:  { color: "#2D6A4F", bg: "#D8F0E4", label: "Confirmed" },
  preparing:  { color: "#1A5276", bg: "#D6EAF8", label: "Preparing" },
  ready:      { color: "#1B4332", bg: "#D8F0E4", label: "Ready" },
  delivered:  { color: "#1B4332", bg: "#D8F0E4", label: "Delivered" },
  cancelled:  { color: "#C0392B", bg: "#FDECEA", label: "Cancelled" },
};

function statusStyle(status) {
  const key = (status || "").toLowerCase();
  return STATUS_CONFIG[key] || { color: C.textMuted, bg: C.border, label: status || "Unknown" };
}

// ── Order card ────────────────────────────────────────────────────────────────
function OrderCard({ item }) {
  const st = statusStyle(item.status);
  const itemCount = (item.items || []).length;

  return (
    <View style={styles.orderCard}>
      {/* Top row */}
      <View style={styles.orderCardTop}>
        <View>
          <Text style={styles.orderId}>Order #{item.id}</Text>
          {item.createdAt && (
            <Text style={styles.orderDate}>
              {new Date(item.createdAt).toLocaleDateString("en-NG", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
          <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.cardDivider} />

      {/* Bottom row */}
      <View style={styles.orderCardBottom}>
        <View style={styles.orderMeta}>
          <Ionicons name="receipt-outline" size={14} color={C.textMuted} />
          <Text style={styles.orderMetaText}>
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </Text>
        </View>
        <Text style={styles.orderTotal}>
          {"\u20A6"}{Number(item.total || 0).toLocaleString("en-NG")}
        </Text>
      </View>
    </View>
  );
}

// ── Not logged in screen ──────────────────────────────────────────────────────
function NotLoggedIn({ onLogin }) {
  return (
    <View style={styles.centeredContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Orders</Text>
      </View>

      <View style={styles.authPromptBox}>
        <View style={styles.authIconCircle}>
          <Ionicons name="lock-closed-outline" size={28} color={C.textMuted} />
        </View>
        <Text style={styles.authPromptTitle}>Sign in to continue</Text>
        <Text style={styles.authPromptSub}>
          You need to be logged in to view your order history.
        </Text>
        <TouchableOpacity style={styles.ctaBtn} onPress={onLogin}>
          <Text style={styles.ctaBtnText}>Go to Login</Text>
          <Ionicons name="arrow-forward" size={16} color={C.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function OrdersTab() {
  const router = useRouter();
  const { token } = useContext(CartContext);

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await ordersApi.myOrders();
      setOrders(res?.data?.orders || []);
    } catch (e) {
      setError(e.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) { setLoading(false); setOrders([]); return; }
    load();
  }, [token]);

  if (!token) {
    return <NotLoggedIn onLogin={() => router.push("/(auth)/login")} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ── Page header ─────────────────────────────────── */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>My Orders</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={load} disabled={loading}>
          <Ionicons
            name="refresh-outline"
            size={19}
            color={loading ? C.textMuted : C.green}
          />
        </TouchableOpacity>
      </View>

      {/* ── Content ─────────────────────────────────────── */}
      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color={C.green} size="large" />
          <Text style={styles.stateText}>Loading your orders...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={load} style={styles.retryBtn}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="bag-outline" size={30} color={C.textMuted} />
              </View>
              <Text style={styles.emptyText}>No orders yet</Text>
              <Text style={styles.emptySubText}>
                Your completed orders will appear here.
              </Text>
              <TouchableOpacity
                style={styles.ctaBtn}
                onPress={() => router.push("/(tabs)/home")}
              >
                <Text style={styles.ctaBtnText}>Browse Restaurants</Text>
                <Ionicons name="arrow-forward" size={16} color={C.white} />
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => <OrderCard item={item} />}
        />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  centeredContainer: { flex: 1, backgroundColor: C.bg },

  // Page header
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
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

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 100,
  },

  // Order card
  orderCard: {
    backgroundColor: C.cardBg,
    borderRadius: 16,
    padding: 16,
    shadowColor: C.textDark,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  orderCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderId: { fontSize: 15, fontWeight: "800", color: C.textDark },
  orderDate: { fontSize: 12, color: C.textMuted, marginTop: 3, fontWeight: "500" },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: { fontSize: 12, fontWeight: "700" },
  cardDivider: { height: 1, backgroundColor: C.border, marginVertical: 12 },
  orderCardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  orderMetaText: { fontSize: 13, color: C.textMuted, fontWeight: "500" },
  orderTotal: { fontSize: 16, fontWeight: "800", color: C.textDark },

  // State boxes
  stateBox: { flex: 1, alignItems: "center", justifyContent: "center" },
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

  // Empty state
  emptyBox: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: C.border,
    alignItems: "center", justifyContent: "center",
    marginBottom: 16,
  },
  emptyText: { fontSize: 17, fontWeight: "800", color: C.textDark, marginBottom: 6 },
  emptySubText: {
    fontSize: 13, color: C.textMuted, textAlign: "center",
    lineHeight: 20, marginBottom: 24,
  },

  // Auth prompt
  authPromptBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  authIconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: C.border,
    alignItems: "center", justifyContent: "center",
    marginBottom: 20,
  },
  authPromptTitle: { fontSize: 20, fontWeight: "800", color: C.textDark, marginBottom: 8 },
  authPromptSub: {
    fontSize: 14, color: C.textMuted, textAlign: "center",
    lineHeight: 21, marginBottom: 28,
  },

  // Shared CTA
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.green,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  ctaBtnText: { color: C.white, fontSize: 15, fontWeight: "800" },
});