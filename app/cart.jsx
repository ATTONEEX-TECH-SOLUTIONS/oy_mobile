import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useContext, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CartContext } from "../context/CartContext";
import { ordersApi } from "../lib/api";

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

// ── Animated input ────────────────────────────────────────────────────────────
function Field({ label, value, onChangeText, placeholder, keyboardType, autoCapitalize }) {
  const [focused, setFocused] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const onFocus = () => { setFocused(true);  Animated.timing(anim, { toValue: 1, duration: 180, useNativeDriver: false }).start(); };
  const onBlur  = () => { setFocused(false); Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: false }).start(); };
  const borderColor = anim.interpolate({ inputRange: [0, 1], outputRange: [C.border, C.greenMid] });

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Animated.View style={[styles.fieldWrapper, { borderColor }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.textMuted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? "sentences"}
          onFocus={onFocus}
          onBlur={onBlur}
          style={styles.fieldInput}
        />
      </Animated.View>
    </View>
  );
}

// ── Cart item row ─────────────────────────────────────────────────────────────
function CartRow({ item, onDecrease, onIncrease, onRemove }) {
  return (
    <View style={styles.cartRow}>
      {/* Initials square */}
      <View style={styles.cartThumb}>
        <Text style={styles.cartThumbText}>
          {(item.name || "?")[0].toUpperCase()}
        </Text>
      </View>

      <View style={styles.cartRowBody}>
        <Text style={styles.cartItemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.cartItemPrice}>
          {"\u20A6"}{Number(item.price).toLocaleString("en-NG")}
        </Text>
      </View>

      {/* Qty controls */}
      <View style={styles.qtyRow}>
        <TouchableOpacity style={styles.qtyBtn} onPress={onDecrease}>
          <Ionicons name="remove" size={16} color={C.textDark} />
        </TouchableOpacity>
        <Text style={styles.qtyText}>{item.quantity}</Text>
        <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnPlus]} onPress={onIncrease}>
          <Ionicons name="add" size={16} color={C.white} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
        <Ionicons name="trash-outline" size={16} color={C.error} />
      </TouchableOpacity>
    </View>
  );
}

// ── Empty cart ────────────────────────────────────────────────────────────────
function EmptyCart({ onBrowse }) {
  return (
    <View style={styles.emptyBox}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="bag-outline" size={32} color={C.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Your cart is empty</Text>
      <Text style={styles.emptySub}>Add items from a restaurant to get started.</Text>
      <TouchableOpacity style={styles.ctaBtn} onPress={onBrowse}>
        <Text style={styles.ctaBtnText}>Browse Restaurants</Text>
        <Ionicons name="arrow-forward" size={16} color={C.white} />
      </TouchableOpacity>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function Cart() {
  const router = useRouter();
  const {
    cartItems, cartTotal,
    decreaseQty, addToCart, removeFromCart, clearCart,
    user, token,
  } = useContext(CartContext);

  const [customerName, setCustomerName]   = useState(user ? `${user.firstName} ${user.lastName}` : "");
  const [customerPhone, setCustomerPhone] = useState(user?.phone || "");
  const [address, setAddress]             = useState("");
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");

  const btnScale = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(btnScale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () => Animated.spring(btnScale, { toValue: 1,    useNativeDriver: true, speed: 40 }).start();

  const businessId = useMemo(() => cartItems[0]?.businessId || null, [cartItems]);

  const checkout = async () => {
    setError("");
    if (!token) { setError("Please login to place an order."); router.push("/(auth)/login"); return; }
    if (!businessId || cartItems.length === 0) { setError("Your cart is empty."); return; }
    if (!customerName.trim()) { setError("Customer name is required."); return; }

    setLoading(true);
    try {
      const payload = {
        businessId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || null,
        address: address.trim() || null,
        paymentMethod: "cash",
        items: cartItems.map((x) => ({ menuItemId: x.id, quantity: x.quantity })),
      };
      await ordersApi.createOrder(payload);
      clearCart();
      router.replace("/(tabs)/orders");
    } catch (e) {
      setError(e?.message || "Checkout failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isEmpty = cartItems.length === 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={C.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart</Text>
        {!isEmpty && (
          <TouchableOpacity style={styles.clearBtn} onPress={clearCart}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Error banner ────────────────────────────────── */}
        {!!error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* ── Empty state ─────────────────────────────────── */}
        {isEmpty ? (
          <EmptyCart onBrowse={() => router.push("/(tabs)/home")} />
        ) : (
          <>
            {/* ── Cart items ────────────────────────────────── */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
              </Text>
              <View style={styles.card}>
                {cartItems.map((item, i) => (
                  <View key={String(item.id)}>
                    <CartRow
                      item={item}
                      onDecrease={() => decreaseQty(item.id)}
                      onIncrease={() => addToCart(item)}
                      onRemove={() => removeFromCart(item.id)}
                    />
                    {i < cartItems.length - 1 && <View style={styles.rowDivider} />}
                  </View>
                ))}
              </View>
            </View>

            {/* ── Checkout form ─────────────────────────────── */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Delivery details</Text>
              <View style={styles.card}>
                <Field
                  label="Full Name"
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholder="Ada Obi"
                />
                <Field
                  label="Phone (optional)"
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                  placeholder="080xxxxxxxx"
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                />
                <Field
                  label="Delivery Address (optional)"
                  value={address}
                  onChangeText={setAddress}
                  placeholder="e.g. 12 Adeola Street, Lagos"
                />
              </View>
            </View>

            {/* ── Order summary ─────────────────────────────── */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Order summary</Text>
              <View style={styles.card}>
                {cartItems.map((item) => (
                  <View key={String(item.id)} style={styles.summaryRow}>
                    <Text style={styles.summaryName} numberOfLines={1}>
                      {item.name} <Text style={styles.summaryQty}>x{item.quantity}</Text>
                    </Text>
                    <Text style={styles.summaryPrice}>
                      {"\u20A6"}{(item.price * item.quantity).toLocaleString("en-NG")}
                    </Text>
                  </View>
                ))}
                <View style={styles.totalDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>
                    {"\u20A6"}{Number(cartTotal).toLocaleString("en-NG")}
                  </Text>
                </View>
              </View>
            </View>

            {/* ── Place order button ─────────────────────────── */}
            <View style={styles.section}>
              <Animated.View style={{ transform: [{ scale: btnScale }] }}>
                <Pressable
                  onPress={checkout}
                  onPressIn={pressIn}
                  onPressOut={pressOut}
                  disabled={loading}
                  style={[styles.ctaBtn, loading && { opacity: 0.7 }]}
                >
                  {loading
                    ? <ActivityIndicator color={C.white} />
                    : (
                      <>
                        <Text style={styles.ctaBtnText}>Place Order</Text>
                        <Ionicons name="arrow-forward" size={16} color={C.white} />
                      </>
                    )
                  }
                </Pressable>
              </Animated.View>
              <Text style={styles.paymentNote}>
                Payment on delivery (cash)
              </Text>
            </View>
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.white, alignItems: "center", justifyContent: "center",
    shadowColor: C.textDark, shadowOpacity: 0.06, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
    marginRight: 12,
  },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: "900", color: C.textDark, letterSpacing: -0.3 },
  clearBtn: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: C.error,
  },
  clearBtnText: { fontSize: 12, fontWeight: "700", color: C.error },

  // Error
  errorBanner: {
    marginHorizontal: 20, marginBottom: 4,
    backgroundColor: C.errorBg, borderRadius: 12,
    padding: 12, borderLeftWidth: 3, borderLeftColor: C.error,
  },
  errorText: { color: C.error, fontSize: 13, fontWeight: "500" },

  // Section
  section: { paddingHorizontal: 20, marginBottom: 16 },
  sectionLabel: {
    fontSize: 12, fontWeight: "700", color: C.textMuted,
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10,
  },

  // Card
  card: {
    backgroundColor: C.cardBg, borderRadius: 16,
    padding: 16,
    shadowColor: C.textDark, shadowOpacity: 0.05,
    shadowRadius: 10, shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  // Cart row
  cartRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  cartThumb: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: C.greenMid,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  cartThumbText: { color: C.white, fontSize: 18, fontWeight: "900" },
  cartRowBody: { flex: 1 },
  cartItemName: { fontSize: 14, fontWeight: "700", color: C.textDark },
  cartItemPrice: { fontSize: 13, color: C.textMuted, marginTop: 2, fontWeight: "500" },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  qtyBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.border,
    alignItems: "center", justifyContent: "center",
  },
  qtyBtnPlus: { backgroundColor: C.green },
  qtyText: { fontSize: 15, fontWeight: "800", color: C.textDark, minWidth: 20, textAlign: "center" },
  removeBtn: { padding: 6 },
  rowDivider: { height: 1, backgroundColor: C.border, marginVertical: 12 },

  // Field
  fieldLabel: {
    fontSize: 11, fontWeight: "700", color: C.textDark,
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5,
  },
  fieldWrapper: {
    borderWidth: 1.5, borderRadius: 12,
    backgroundColor: C.white, overflow: "hidden",
  },
  fieldInput: {
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: C.textDark, fontWeight: "500",
  },

  // Summary
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  summaryName: { fontSize: 13, color: C.textDark, fontWeight: "500", flex: 1, marginRight: 8 },
  summaryQty: { color: C.textMuted, fontWeight: "400" },
  summaryPrice: { fontSize: 13, color: C.textDark, fontWeight: "700" },
  totalDivider: { height: 1, backgroundColor: C.border, marginVertical: 10 },
  totalLabel: { fontSize: 15, fontWeight: "800", color: C.textDark },
  totalValue: { fontSize: 18, fontWeight: "900", color: C.green },

  // CTA
  ctaBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: C.green, borderRadius: 14,
    paddingVertical: 16,
  },
  ctaBtnText: { color: C.white, fontSize: 16, fontWeight: "800", letterSpacing: 0.3 },
  paymentNote: {
    textAlign: "center", color: C.textMuted,
    fontSize: 12, marginTop: 10, fontWeight: "500",
  },

  // Empty
  emptyBox: {
    alignItems: "center", paddingTop: 80, paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: C.border,
    alignItems: "center", justifyContent: "center", marginBottom: 18,
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: C.textDark, marginBottom: 8 },
  emptySub: { fontSize: 13, color: C.textMuted, textAlign: "center", lineHeight: 20, marginBottom: 28 },
});