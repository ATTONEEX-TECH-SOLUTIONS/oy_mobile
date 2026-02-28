import { useRouter } from "expo-router";
import { useContext, useState, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
  StyleSheet,
} from "react-native";
import { CartContext } from "../../context/CartContext";
import { customerAuthApi } from "../../lib/api";

// ── Brand tokens ────────────────────────────────────────────────────────────
const C = {
  green: "#1B4332",       // deep forest green (nav / CTA background)
  greenMid: "#2D6A4F",    // mid green (accents)
  greenLight: "#52B788",  // light green (highlights)
  amber: "#D4860B",       // warm amber (icon accent from site)
  bg: "#F5F1EB",          // warm off-white (site hero overlay feel)
  white: "#FFFFFF",
  textDark: "#111C14",    // near-black text
  textMuted: "#6B7C6E",   // muted grey-green
  border: "#D8E4DC",
  error: "#C0392B",
  inputBg: "#FFFFFF",
};

// ── Bolt / logo icon (matches site bolt icon) ────────────────────────────────
function BoltIcon({ size = 28, color = C.white }) {
  return (
    <View style={{
      width: size, height: size,
      borderRadius: size * 0.28,
      backgroundColor: color === C.white ? C.green : C.white,
      alignItems: "center", justifyContent: "center",
    }}>
      <Text style={{ fontSize: size * 0.55, color, lineHeight: size * 0.7, marginTop: 1 }}>⚡</Text>
    </View>
  );
}

// ── Animated input wrapper ───────────────────────────────────────────────────
function FloatingInput({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize }) {
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setFocused(true);
    Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  };
  const handleBlur = () => {
    setFocused(false);
    Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [C.border, C.greenMid],
  });
  const shadowOpacity = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.12],
  });

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <Animated.View style={[
        styles.inputWrapper,
        { borderColor, shadowColor: C.greenMid, shadowOpacity, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: focused ? 3 : 0 }
      ]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.textMuted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? "none"}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={styles.input}
        />
      </Animated.View>
    </View>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export default function Login() {
  const router = useRouter();
  const { saveAuth } = useContext(CartContext);

  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Button press scale animation
  const btnScale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(btnScale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();

  const submit = async () => {
    setError("");
    if (!emailOrPhone || !password) {
      setError("Please enter your email/phone and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await customerAuthApi.login({ emailOrPhone, password });
      const token = res?.data?.token;
      const user = res?.data?.user;
      await saveAuth({ token, user });
      router.replace("/(tabs)/home");
    } catch (e) {
      setError(e.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" backgroundColor={C.green} />

      {/* ── Header band ───────────────────────────────── */}
      <View style={styles.header}>
        {/* Decorative circles */}
        <View style={styles.circleTopRight} />
        <View style={styles.circleBottomLeft} />

        <View style={styles.logoRow}>
          <BoltIcon size={36} color={C.white} />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.brandName}>OyaEat</Text>
            <Text style={styles.brandTag}>FAST DELIVERY</Text>
          </View>
        </View>

        <Text style={styles.heroTitle}>Welcome{"\n"}back! 👋</Text>
        <Text style={styles.heroSub}>Order sharp sharp. Chop happy.</Text>
      </View>

      {/* ── Card ──────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>

          {/* Error banner */}
          {!!error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠️  {error}</Text>
            </View>
          )}

          <FloatingInput
            label="Email or Phone"
            value={emailOrPhone}
            onChangeText={setEmailOrPhone}
            placeholder="e.g. you@email.com or 080..."
            keyboardType="email-address"
          />

          <FloatingInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
          />

          {/* Forgot password */}
          <Pressable
            onPress={() => router.push("/(auth)/forgot-password")}
            style={{ alignSelf: "flex-end", marginBottom: 24, marginTop: -6 }}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>

          {/* CTA button */}
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <Pressable
              onPress={submit}
              onPressIn={pressIn}
              onPressOut={pressOut}
              disabled={loading}
              style={[styles.ctaBtn, loading && { opacity: 0.7 }]}
            >
              {loading
                ? <ActivityIndicator color={C.white} />
                : <Text style={styles.ctaBtnText}>Login  →</Text>
              }
            </Pressable>
          </Animated.View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Sign up nudge */}
          <Pressable
            onPress={() => router.push("/(auth)/signup")}
            style={styles.signupRow}
          >
            <Text style={styles.signupText}>Don't have an account? </Text>
            <Text style={styles.signupLink}>Sign up</Text>
          </Pressable>
        </View>

        {/* Footer note */}
        <Text style={styles.footerNote}>
          Hot food 🍛 · Cold drinks 🧃 · Groceries 🛍️
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Header
  header: {
    backgroundColor: C.green,
    paddingTop: 56,
    paddingBottom: 36,
    paddingHorizontal: 28,
    overflow: "hidden",
  },
  circleTopRight: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: C.greenMid,
    opacity: 0.4,
  },
  circleBottomLeft: {
    position: "absolute",
    bottom: -30,
    left: -30,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: C.greenLight,
    opacity: 0.2,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },
  brandName: {
    color: C.white,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  brandTag: {
    color: C.greenLight,
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 2,
    marginTop: 1,
  },
  heroTitle: {
    color: C.white,
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  heroSub: {
    color: C.greenLight,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
    letterSpacing: 0.2,
  },

  // Scroll / card
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: C.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: C.textDark,
    shadowOpacity: 0.07,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: C.textDark,
    marginBottom: 20,
    letterSpacing: -0.3,
  },

  // Error
  errorBanner: {
    backgroundColor: "#FDECEA",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: C.error,
  },
  errorText: {
    color: C.error,
    fontSize: 13,
    fontWeight: "500",
  },

  // Input
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: C.textDark,
    marginBottom: 6,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  inputWrapper: {
    borderWidth: 1.5,
    borderRadius: 12,
    backgroundColor: C.inputBg,
    overflow: "hidden",
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: C.textDark,
    fontWeight: "500",
  },

  // Forgot
  forgotText: {
    fontSize: 13,
    color: C.greenMid,
    fontWeight: "600",
  },

  // CTA
  ctaBtn: {
    backgroundColor: C.green,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaBtnText: {
    color: C.white,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  // Divider
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
  },
  dividerText: {
    marginHorizontal: 12,
    color: C.textMuted,
    fontSize: 13,
    fontWeight: "500",
  },

  // Sign up
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signupText: {
    color: C.textMuted,
    fontSize: 14,
    fontWeight: "500",
  },
  signupLink: {
    color: C.green,
    fontSize: 14,
    fontWeight: "800",
  },

  // Footer
  footerNote: {
    textAlign: "center",
    color: C.textMuted,
    fontSize: 12,
    marginTop: 20,
    letterSpacing: 0.2,
    fontWeight: "500",
  },
});