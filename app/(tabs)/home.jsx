import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
} from "react-native";

import { CartContext } from "../../context/CartContext";
import { publicApi } from "../../lib/api";

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
};

function CategoryChip({ label, active, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function RestaurantThumbnail({ uri, name }) {
  const [errored, setErrored] = useState(false);
  const initials = name
    ? name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "--";

  if (uri && !errored) {
    return (
      <Image
        source={{ uri }}
        style={styles.restaurantImage}
        onError={() => setErrored(true)}
      />
    );
  }

  return (
    <View style={[styles.restaurantImage, styles.restaurantImageFallback]}>
      <Text style={styles.restaurantImageInitials}>{initials}</Text>
    </View>
  );
}

function RestaurantCard({ restaurant, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.restaurantCard}>
      <View style={{ position: "relative" }}>
        <RestaurantThumbnail uri={restaurant.imageUrl} name={restaurant.name} />
        {restaurant.rating != null && (
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={10} color={C.amberLight} />
            <Text style={styles.ratingText}>{Number(restaurant.rating).toFixed(1)}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.restaurantName} numberOfLines={1}>{restaurant.name}</Text>
        <Text style={styles.restaurantMeta} numberOfLines={1}>
          {[restaurant.type, restaurant.city, restaurant.state].filter(Boolean).join("  ·  ")}
        </Text>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.cardCta}>View menu</Text>
        <View style={styles.arrowBtn}>
          <Ionicons name="arrow-forward" size={14} color={C.white} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function Home() {
  const [searchText, setSearchText] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const router = useRouter();
  const { user } = useContext(CartContext);

  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState([]);
  const [error, setError] = useState("");

  const categories = ["All", "Rice", "Chicken", "Wraps", "Grills", "Drinks", "Healthy"];

  const handleSearch = () => {
    if (searchText.trim() === "") return;
    router.push(`/(tabs)/search?query=${encodeURIComponent(searchText.trim())}`);
  };

  const openRestaurant = (id) => {
    router.push(`/restaurant-detail?businessId=${encodeURIComponent(String(id))}`);
  };

  const loadRestaurants = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await publicApi.listRestaurants({ page: 1, limit: 20 });
      setRestaurants(res?.data?.restaurants || []);
    } catch (e) {
      setError(e.message || "Failed to load restaurants");
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRestaurants(); }, []);

  const popularRestaurants = useMemo(() => restaurants.slice(0, 2), [restaurants]);
  const recommendedRestaurants = useMemo(() => restaurants.slice(2, 4), [restaurants]);

  const displayName = user?.firstName || "there";
  const displayLocation = restaurants?.[0]?.city
    ? `${restaurants[0].city}${restaurants[0].state ? `, ${restaurants[0].state}` : ""}`
    : "Nigeria";

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarWrapper}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>
                  {(user?.firstName?.[0] || "U").toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.onlineDot} />
          </View>
          <View>
            <Text style={styles.greeting}>Hello, {displayName}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={11} color={C.amber} />
              <Text style={styles.locationText}>{displayLocation}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.refreshBtn} onPress={loadRestaurants}>
          <Ionicons name="refresh-outline" size={19} color={C.green} />
        </TouchableOpacity>
      </View>

      {/* Hero Banner */}
      <View style={styles.heroBanner}>
        <View style={styles.heroCircle1} />
        <View style={styles.heroCircle2} />

        <View style={styles.heroBannerContent}>
          <Text style={styles.heroTag}>OYAEATS</Text>
          <Text style={styles.heroTitle}>Better chow,{"\n"}no wahala.</Text>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillText}>Order sharp sharp. Chop happy.</Text>
          </View>
        </View>

        <View style={styles.heroDecor}>
          <View style={styles.heroRingOuter}>
            <View style={styles.heroRingInner} />
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={C.textMuted} />
          <TextInput
            placeholder="Find what you want..."
            placeholderTextColor={C.textMuted}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            style={styles.searchInput}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Ionicons name="close-circle" size={18} color={C.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Ionicons name="arrow-forward-outline" size={22} color={C.white} />
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesRow}
      >
        {categories.map((c) => (
          <CategoryChip
            key={c}
            label={c}
            active={activeCategory === c}
            onPress={() => setActiveCategory(c)}
          />
        ))}
      </ScrollView>

      {/* Loading */}
      {loading && (
        <View style={styles.stateBox}>
          <ActivityIndicator color={C.green} size="large" />
          <Text style={styles.stateText}>Finding restaurants near you...</Text>
        </View>
      )}

      {/* Error */}
      {!loading && error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadRestaurants} style={styles.retryBtn}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Popular */}
      {!loading && !error && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Restaurants</Text>
            <TouchableOpacity onPress={() => router.push("/restaurants")}>
              <Text style={styles.seeMore}>See all</Text>
            </TouchableOpacity>
          </View>

          {popularRestaurants.length > 0 ? (
            <View style={styles.cardsRow}>
              {popularRestaurants.map((r) => (
                <RestaurantCard key={r.id} restaurant={r} onPress={() => openRestaurant(r.id)} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="storefront-outline" size={28} color={C.textMuted} />
              </View>
              <Text style={styles.emptyText}>No restaurants yet</Text>
              <Text style={styles.emptySubText}>Approve a business in admin to see it here.</Text>
            </View>
          )}
        </View>
      )}

      {/* Recommended */}
      {!loading && !error && recommendedRestaurants.length > 0 && (
        <View style={[styles.section, styles.lastSection]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended for you</Text>
            <TouchableOpacity onPress={() => router.push("/restaurants")}>
              <Text style={styles.seeMore}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.cardsRow}>
            {recommendedRestaurants.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} onPress={() => openRestaurant(r.id)} />
            ))}
          </View>
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 54, paddingBottom: 16,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarWrapper: { position: "relative" },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  avatarFallback: { backgroundColor: C.greenMid, alignItems: "center", justifyContent: "center" },
  avatarInitial: { color: C.white, fontSize: 17, fontWeight: "800" },
  onlineDot: {
    position: "absolute", bottom: 1, right: 1,
    width: 11, height: 11, borderRadius: 6,
    backgroundColor: C.amberLight, borderWidth: 2, borderColor: C.bg,
  },
  greeting: { fontSize: 16, fontWeight: "700", color: C.textDark },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  locationText: { fontSize: 12, color: C.textMuted, fontWeight: "500" },
  refreshBtn: {
    width: 42, height: 42, backgroundColor: C.white, borderRadius: 21,
    alignItems: "center", justifyContent: "center",
    shadowColor: C.textDark, shadowOpacity: 0.06, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  heroBanner: {
    marginHorizontal: 20, marginBottom: 20, backgroundColor: C.green,
    borderRadius: 20, padding: 24, flexDirection: "row", alignItems: "center",
    minHeight: 140, overflow: "hidden",
  },
  heroCircle1: {
    position: "absolute", top: -50, right: -30, width: 160, height: 160,
    borderRadius: 80, backgroundColor: C.greenMid, opacity: 0.5,
  },
  heroCircle2: {
    position: "absolute", bottom: -30, right: 50, width: 100, height: 100,
    borderRadius: 50, backgroundColor: C.greenLight, opacity: 0.18,
  },
  heroBannerContent: { flex: 1, zIndex: 2 },
  heroTag: {
    color: C.amberLight, fontSize: 10, fontWeight: "700",
    letterSpacing: 2, marginBottom: 6,
  },
  heroTitle: {
    color: C.white, fontSize: 22, fontWeight: "900",
    lineHeight: 28, letterSpacing: -0.3, marginBottom: 12,
  },
  heroPill: {
    alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  heroPillText: { color: C.white, fontSize: 11, fontWeight: "600" },
  heroDecor: { zIndex: 2, alignItems: "center", justifyContent: "center" },
  heroRingOuter: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 2, borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  heroRingInner: {
    width: 46, height: 46, borderRadius: 23,
    borderWidth: 2, borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  searchContainer: {
    flexDirection: "row", paddingHorizontal: 20, marginBottom: 16, gap: 10,
  },
  searchBar: {
    flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: C.white,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, gap: 8,
    shadowColor: C.textDark, shadowOpacity: 0.05, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.textDark, fontWeight: "500" },
  searchBtn: {
    width: 50, height: 50, backgroundColor: C.green,
    borderRadius: 14, alignItems: "center", justifyContent: "center",
  },
  categoriesRow: { paddingHorizontal: 20, paddingBottom: 20, gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 30,
    backgroundColor: C.white, borderWidth: 1.5, borderColor: C.border,
  },
  chipActive: { backgroundColor: C.green, borderColor: C.green },
  chipLabel: { fontSize: 13, fontWeight: "600", color: C.textMuted },
  chipLabelActive: { color: C.white },
  stateBox: { alignItems: "center", paddingVertical: 40 },
  stateText: { color: C.textMuted, fontSize: 13, marginTop: 12, fontWeight: "500" },
  errorBox: {
    marginHorizontal: 20, backgroundColor: "#FDECEA", borderRadius: 12,
    padding: 14, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: "#C0392B",
  },
  errorText: { color: "#C0392B", fontSize: 13, fontWeight: "500" },
  retryBtn: {
    marginTop: 10, alignSelf: "flex-start", backgroundColor: C.green,
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8,
  },
  retryText: { color: C.white, fontSize: 13, fontWeight: "700" },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  lastSection: { marginBottom: 8 },
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 14,
  },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: C.textDark, letterSpacing: -0.2 },
  seeMore: { fontSize: 13, color: C.greenMid, fontWeight: "600" },
  cardsRow: { flexDirection: "row", gap: 14 },
  restaurantCard: {
    flex: 1, borderRadius: 16, backgroundColor: C.cardBg, overflow: "hidden",
    shadowColor: C.textDark, shadowOpacity: 0.06, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  restaurantImage: { width: "100%", height: 96 },
  restaurantImageFallback: {
    backgroundColor: C.greenMid, alignItems: "center", justifyContent: "center",
  },
  restaurantImageInitials: { color: C.white, fontSize: 24, fontWeight: "900", letterSpacing: 1 },
  ratingBadge: {
    position: "absolute", top: 8, right: 8,
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  ratingText: { color: C.white, fontSize: 10, fontWeight: "700" },
  cardBody: { padding: 12, paddingBottom: 6 },
  restaurantName: { fontSize: 14, fontWeight: "700", color: C.textDark, marginBottom: 3 },
  restaurantMeta: { fontSize: 11, color: C.textMuted, fontWeight: "500" },
  cardFooter: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: C.border, marginTop: 4,
  },
  cardCta: { fontSize: 12, color: C.greenMid, fontWeight: "700" },
  arrowBtn: {
    width: 28, height: 28, backgroundColor: C.green,
    borderRadius: 14, alignItems: "center", justifyContent: "center",
  },
  emptyBox: {
    alignItems: "center", paddingVertical: 32,
    backgroundColor: C.white, borderRadius: 16,
  },
  emptyIconCircle: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: C.border,
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  emptyText: { fontSize: 15, fontWeight: "700", color: C.textDark },
  emptySubText: {
    fontSize: 12, color: C.textMuted, marginTop: 4,
    textAlign: "center", paddingHorizontal: 24,
  },
});