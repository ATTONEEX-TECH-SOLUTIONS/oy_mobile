import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
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
  danger: "#C0392B",
  dangerBg: "#FDECEA",
};

// ── Menu row ──────────────────────────────────────────────────────────────────
function MenuItem({ icon, title, badge, onPress, danger }) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuLeft}>
        <View style={[styles.iconCircle, danger && styles.iconCircleDanger]}>
          <Ionicons
            name={icon}
            size={20}
            color={danger ? C.danger : C.greenMid}
          />
        </View>
        <Text style={[styles.menuTitle, danger && { color: C.danger }]}>
          {title}
        </Text>
      </View>
      <View style={styles.menuRight}>
        {badge != null && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
        <Ionicons
          name="chevron-forward"
          size={16}
          color={danger ? C.danger : C.textMuted}
        />
      </View>
    </TouchableOpacity>
  );
}

// ── Stat tile ─────────────────────────────────────────────────────────────────
function StatTile({ label, value, loading }) {
  return (
    <View style={styles.statTile}>
      {loading ? (
        <ActivityIndicator color={C.green} size="small" />
      ) : (
        <Text style={styles.statValue}>{value}</Text>
      )}
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function Profile() {
  const router = useRouter();
  const { user, token, logout } = useContext(CartContext);

  const [loadingStats, setLoadingStats] = useState(false);
  const [ordersCount, setOrdersCount] = useState(0);
  const [spent, setSpent] = useState(0);
  const [statsError, setStatsError] = useState("");

  const menuItems = useMemo(() => [
    { icon: "person-outline",        title: "Edit Profile",       action: () => {} },
    { icon: "location-outline",      title: "Addresses",          action: () => {} },
    { icon: "card-outline",          title: "Payment Methods",    action: () => {} },
    { icon: "heart-outline",         title: "Favourites",         action: () => {} },
    { icon: "notifications-outline", title: "Notifications",      action: () => {} },
    { icon: "help-circle-outline",   title: "Help & Support",     action: () => {} },
    { icon: "settings-outline",      title: "Settings",           action: () => {} },
  ], []);

  const profileName = user ? `${user.firstName} ${user.lastName}` : "Guest";
  const profileEmail = user?.email || "Login to place orders";
  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "G";

  const loadStats = async () => {
    if (!token) { setOrdersCount(0); setSpent(0); setStatsError(""); return; }
    setLoadingStats(true);
    setStatsError("");
    try {
      const res = await ordersApi.myOrders();
      const orders = res?.data?.orders || [];
      setOrdersCount(orders.length);
      setSpent(orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0));
    } catch (e) {
      setStatsError(e.message || "Failed to load stats");
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => { loadStats(); }, [token]);

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.green} />

      {/* ── Green header band ───────────────────────────── */}
      <View style={styles.headerBand}>
        <View style={styles.headerCircle1} />
        <View style={styles.headerCircle2} />

        <Text style={styles.headerTitle}>Profile</Text>

        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          {token && <View style={styles.onlineDot} />}
        </View>

        <Text style={styles.profileName}>{profileName}</Text>
        <Text style={styles.profileEmail}>{profileEmail}</Text>

        {/* Edit / Login button */}
        {!token ? (
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => router.push("/(auth)/login")}
          >
            <Text style={styles.headerBtnText}>Login</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.headerBtn} onPress={loadStats} disabled={loadingStats}>
            <Ionicons name="refresh-outline" size={14} color={C.green} style={{ marginRight: 5 }} />
            <Text style={styles.headerBtnText}>Refresh stats</Text>
          </TouchableOpacity>
        )}

        {!!statsError && (
          <Text style={styles.statsError}>{statsError}</Text>
        )}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Stats row ───────────────────────────────────── */}
        <View style={styles.statsCard}>
          <StatTile label="Orders" value={ordersCount} loading={loadingStats} />
          <View style={styles.statDivider} />
          <StatTile label="Favourites" value={0} loading={false} />
          <View style={styles.statDivider} />
          <StatTile
            label="Spent"
            value={`\u20A6${Number(spent).toLocaleString("en-NG")}`}
            loading={loadingStats}
          />
        </View>

        {/* ── Menu ────────────────────────────────────────── */}
        <View style={styles.menuCard}>
          {menuItems.map((item, i) => (
            <MenuItem
              key={i}
              icon={item.icon}
              title={item.title}
              badge={item.badge}
              onPress={item.action}
            />
          ))}
        </View>

        {/* ── Logout / Create account ──────────────────────── */}
        <View style={styles.menuCard}>
          {!token ? (
            <MenuItem
              icon="person-add-outline"
              title="Create account"
              onPress={() => router.push("/(auth)/signup")}
            />
          ) : (
            <MenuItem
              icon="log-out-outline"
              title="Log out"
              onPress={handleLogout}
              danger
            />
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },

  // Header band
  headerBand: {
    backgroundColor: C.green,
    paddingTop: 54,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    overflow: "hidden",
  },
  headerCircle1: {
    position: "absolute", top: -60, right: -40,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: C.greenMid, opacity: 0.45,
  },
  headerCircle2: {
    position: "absolute", bottom: -20, left: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: C.greenLight, opacity: 0.15,
  },
  headerTitle: {
    alignSelf: "flex-start",
    fontSize: 14, fontWeight: "700", color: C.greenLight,
    letterSpacing: 1.5, textTransform: "uppercase",
    marginBottom: 20, zIndex: 2,
  },
  avatarWrapper: { position: "relative", marginBottom: 14, zIndex: 2 },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: "rgba(255,255,255,0.2)" },
  avatarFallback: { backgroundColor: C.greenMid, alignItems: "center", justifyContent: "center" },
  avatarInitials: { color: C.white, fontSize: 28, fontWeight: "900" },
  onlineDot: {
    position: "absolute", bottom: 4, right: 4,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: C.amberLight, borderWidth: 2, borderColor: C.green,
  },
  profileName: { color: C.white, fontSize: 20, fontWeight: "900", letterSpacing: -0.3, zIndex: 2 },
  profileEmail: { color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 4, marginBottom: 16, zIndex: 2 },
  headerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 9,
    zIndex: 2,
  },
  headerBtnText: { color: C.green, fontSize: 13, fontWeight: "700" },
  statsError: { color: "rgba(255,100,100,0.9)", fontSize: 12, marginTop: 10, zIndex: 2 },

  // Stats
  statsCard: {
    flexDirection: "row",
    backgroundColor: C.cardBg,
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 18,
    paddingVertical: 20,
    shadowColor: C.textDark, shadowOpacity: 0.07,
    shadowRadius: 14, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  statTile: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "900", color: C.textDark, marginBottom: 3 },
  statLabel: { fontSize: 11, color: C.textMuted, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  statDivider: { width: 1, backgroundColor: C.border },

  // Menu
  menuCard: {
    backgroundColor: C.cardBg,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: C.textDark, shadowOpacity: 0.04,
    shadowRadius: 10, shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  menuLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  iconCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "#EDF7F2",
    alignItems: "center", justifyContent: "center",
    marginRight: 14,
  },
  iconCircleDanger: { backgroundColor: C.dangerBg },
  menuTitle: { fontSize: 15, color: C.textDark, fontWeight: "500" },
  menuRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  badge: {
    backgroundColor: C.amberLight, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  badgeText: { fontSize: 11, fontWeight: "700", color: C.white },
});