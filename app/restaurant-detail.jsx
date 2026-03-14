import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CartContext } from "../context/CartContext";
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

// ── Restaurant hero (fallback initials banner) ────────────────────────────────
function RestaurantHero({ restaurant, onBack, cartCount, onCart }) {
  const initials = restaurant?.name
    ? restaurant.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "--";

  return (
    <View style={styles.hero}>
      {/* decorative circles */}
      <View style={styles.heroCircle1} />
      <View style={styles.heroCircle2} />

      {/* top bar */}
      <View style={styles.heroTopBar}>
        <TouchableOpacity style={styles.heroIconBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color={C.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.heroIconBtn} onPress={onCart}>
          <Ionicons name="bag-outline" size={20} color={C.white} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* initials circle */}
      <View style={styles.heroInitialsCircle}>
        <Text style={styles.heroInitialsText}>{initials}</Text>
      </View>

      <Text style={styles.heroName}>{restaurant?.name || "Restaurant"}</Text>

      {/* meta row */}
      <View style={styles.heroMetaRow}>
        {restaurant?.type && (
          <View style={styles.heroPill}>
            <Text style={styles.heroPillText}>{restaurant.type}</Text>
          </View>
        )}
        {(restaurant?.city || restaurant?.state) && (
          <View style={styles.heroLocationRow}>
            <Ionicons name="location-outline" size={12} color={C.greenLight} />
            <Text style={styles.heroLocationText}>
              {[restaurant.city, restaurant.state].filter(Boolean).join(", ")}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ── Menu item card ────────────────────────────────────────────────────────────
function MenuCard({ item, onAdd }) {
  const imageUrl = item.imageUrl;

  return (
    <View style={styles.menuCard}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.menuImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.menuThumb}>
          <Text style={styles.menuThumbText}>
            {(item.name || "?")[0].toUpperCase()}
          </Text>
        </View>
      )}

      <View style={styles.menuCardBody}>
        <Text style={styles.menuItemName} numberOfLines={1}>
          {item.name}
        </Text>

        {!!item.description && (
          <Text style={styles.menuItemDesc} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <Text style={styles.menuItemPrice}>
          {"\u20A6"}
          {Number(item.price).toLocaleString("en-NG")}
        </Text>
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
        <Ionicons name="add" size={20} color={C.white} />
      </TouchableOpacity>
    </View>
  );
}
// ── Main screen ───────────────────────────────────────────────────────────────
export default function RestaurantDetail() {
  const { businessId } = useLocalSearchParams();
  const router = useRouter();
  const { addToCart, cartItems, clearCart } = useContext(CartContext);

  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [error, setError] = useState("");

  const cartCount = useMemo(
    () => cartItems.reduce((s, i) => s + i.quantity, 0),
    [cartItems],
  );

useEffect(() => {
  (async () => {
    setLoading(true);
    setError("");
    try {
      const res = await publicApi.getRestaurantMenu(businessId);
      console.log("restaurant menu response:", JSON.stringify(res, null, 2));
      setRestaurant(res?.data?.restaurant || null);
      setMenu(res?.data?.menu || []);
    } catch (e) {
      setError(e.message || "Failed to load menu");
    } finally {
      setLoading(false);
    }
  })();
}, [businessId]);
  const addItem = (item) => {
    const currentBiz = cartItems[0]?.businessId;
    if (currentBiz && currentBiz !== Number(businessId)) {
      Alert.alert(
        "Start a new cart?",
        "Your cart has items from another restaurant. Adding this item will clear the old cart.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Clear & Add",
            style: "destructive",
            onPress: () => {
              clearCart();
              addToCart({ id: item.id, name: item.name, price: item.price, businessId: Number(businessId) });
            },
          },
        ],
      );
      return;
    }
    addToCart({ id: item.id, name: item.name, price: item.price, businessId: Number(businessId) });
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.fullCenter}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <ActivityIndicator color={C.green} size="large" />
        <Text style={styles.loadingText}>Loading menu...</Text>
      </View>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={styles.fullCenter}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.green} />

      <FlatList
        data={menu}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        // Hero as list header
        ListHeaderComponent={
          <RestaurantHero
            restaurant={restaurant}
            onBack={() => router.back()}
            cartCount={cartCount}
            onCart={() => router.push("/cart")}
          />
        }
        // Section label
        ListHeaderComponentStyle={{ marginBottom: 0 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="restaurant-outline" size={28} color={C.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No menu items yet</Text>
            <Text style={styles.emptySub}>Check back later for available dishes.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <MenuCard item={item} onAdd={() => addItem(item)} />
        )}
      />

      {/* ── Sticky cart bar (only when cart has items) ─── */}
      {cartCount > 0 && (
        <View style={styles.stickyCartBar}>
          <View>
            <Text style={styles.stickyCartLabel}>
              {cartCount} {cartCount === 1 ? "item" : "items"} in cart
            </Text>
          </View>
          <TouchableOpacity
            style={styles.stickyCartBtn}
            onPress={() => router.push("/cart")}
          >
            <Text style={styles.stickyCartBtnText}>View Cart</Text>
            <Ionicons name="arrow-forward" size={15} color={C.green} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  fullCenter: { flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" },
  loadingText: { color: C.textMuted, fontSize: 13, marginTop: 12, fontWeight: "500" },

  errorBox: {
    margin: 20, backgroundColor: C.errorBg,
    borderRadius: 12, padding: 16,
    borderLeftWidth: 3, borderLeftColor: C.error,
  },
  errorText: { color: C.error, fontSize: 13, fontWeight: "500" },
  retryBtn: {
    marginTop: 12, alignSelf: "flex-start",
    backgroundColor: C.green, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  retryText: { color: C.white, fontSize: 13, fontWeight: "700" },

  // Hero
  hero: {
    backgroundColor: C.green,
    paddingTop: 54,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 16,
  },
  heroCircle1: {
    position: "absolute", top: -50, right: -40,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: C.greenMid, opacity: 0.45,
  },
  heroCircle2: {
    position: "absolute", bottom: -30, left: -20,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: C.greenLight, opacity: 0.15,
  },
  heroTopBar: {
    flexDirection: "row", justifyContent: "space-between",
    alignSelf: "stretch", marginBottom: 20, zIndex: 2,
  },
  heroIconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  cartBadge: {
    position: "absolute", top: -2, right: -2,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: C.amberLight,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: C.green,
  },
  cartBadgeText: { color: C.white, fontSize: 9, fontWeight: "800" },
  heroInitialsCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 12, zIndex: 2,
    borderWidth: 2, borderColor: "rgba(255,255,255,0.2)",
  },
  heroInitialsText: { color: C.white, fontSize: 26, fontWeight: "900" },
  heroName: {
    color: C.white, fontSize: 22, fontWeight: "900",
    letterSpacing: -0.3, textAlign: "center", zIndex: 2, marginBottom: 10,
  },
  heroMetaRow: { flexDirection: "row", alignItems: "center", gap: 10, zIndex: 2 },
  heroPill: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  heroPillText: { color: C.white, fontSize: 12, fontWeight: "600" },
  heroLocationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  heroLocationText: { color: C.greenLight, fontSize: 12, fontWeight: "500" },

  // List
  listContent: { paddingBottom: 120 },

  // Menu card
  menuCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.cardBg,
    borderRadius: 14,
    marginHorizontal: 20,
    padding: 12,
    gap: 12,
    shadowColor: C.textDark, shadowOpacity: 0.05,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  menuThumb: {
    width: 52, height: 52, borderRadius: 12,
    backgroundColor: C.greenMid,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  menuImage: {
  width: 52,
  height: 52,
  borderRadius: 12,
  backgroundColor: C.border,
  flexShrink: 0,
},
  menuThumbText: { color: C.white, fontSize: 20, fontWeight: "900" },
  menuCardBody: { flex: 1 },
  menuItemName: { fontSize: 14, fontWeight: "700", color: C.textDark, marginBottom: 2 },
  menuItemDesc: { fontSize: 12, color: C.textMuted, lineHeight: 17, marginBottom: 4 },
  menuItemPrice: { fontSize: 14, fontWeight: "800", color: C.green },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.green,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },

  // Empty
  emptyBox: { alignItems: "center", paddingTop: 48, paddingHorizontal: 32 },
  emptyIconCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: C.border,
    alignItems: "center", justifyContent: "center", marginBottom: 14,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: C.textDark, marginBottom: 6 },
  emptySub: { fontSize: 13, color: C.textMuted, textAlign: "center", lineHeight: 20 },

  // Sticky cart bar
  stickyCartBar: {
    position: "absolute", bottom: 24, left: 20, right: 20,
    backgroundColor: C.white,
    borderRadius: 18, paddingHorizontal: 20, paddingVertical: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    shadowColor: C.textDark, shadowOpacity: 0.12,
    shadowRadius: 20, shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  stickyCartLabel: { fontSize: 14, fontWeight: "700", color: C.textDark },
  stickyCartBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.bg, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1.5, borderColor: C.border,
  },
  stickyCartBtnText: { fontSize: 13, fontWeight: "800", color: C.green },
});