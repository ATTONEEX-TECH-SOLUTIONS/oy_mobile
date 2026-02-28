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

// ── Brand tokens ──────────────────────────────────────────────────────────────
const C = {
  green: "#1B4332",
  greenMid: "#2D6A4F",
  greenLight: "#52B788",
  amber: "#D4860B",
  bg: "#F5F1EB",
  white: "#FFFFFF",
  textDark: "#111C14",
  textMuted: "#6B7C6E",
  border: "#D8E4DC",
  error: "#C0392B",
  inputBg: "#FFFFFF",
};

// ── Step progress bar ─────────────────────────────────────────────────────────
function StepDots({ current, total }) {
  return (
    <View style={{ flexDirection: "row", gap: 6, marginBottom: 20 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            height: 4,
            borderRadius: 2,
            flex: i === current ? 2 : 1,
            backgroundColor: i <= current ? C.greenLight : C.border,
          }}
        />
      ))}
    </View>
  );
}

// ── Animated input ────────────────────────────────────────────────────────────
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

  const borderColor = borderAnim.interpolate({ inputRange: [0, 1], outputRange: [C.border, C.greenMid] });
  const shadowOpacity = borderAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.12] });

  return (
    <View style={{ marginBottom: 14 }}>
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

// ── Main screen ───────────────────────────────────────────────────────────────
export default function Signup() {
  const router = useRouter();
  const { saveAuth } = useContext(CartContext);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");
  const [password, setPassword]   = useState("");

  const [step, setStep]       = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const btnScale = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(btnScale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () => Animated.spring(btnScale, { toValue: 1,    useNativeDriver: true, speed: 40 }).start();

  const goNext = () => {
    setError("");
    if (!firstName || !lastName) { setError("Please enter your first and last name."); return; }
    setStep(1);
  };

  const submit = async () => {
    setError("");
    if (!email || !phone || !password) { setError("All fields are required."); return; }
    setLoading(true);
    try {
      const res = await customerAuthApi.register({ firstName, lastName, email, phone, password });
      await saveAuth({ token: res?.data?.token, user: res?.data?.user });
      router.replace("/(tabs)/home");
    } catch (e) {
      setError(e.message || "Signup failed. Please try again.");
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
        <View style={styles.circleTopRight} />
        <View style={styles.circleMid} />

        <Pressable
          onPress={() => step === 1 ? setStep(0) : router.push("/(auth)/login")}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <View style={styles.logoRow}>
          <View style={styles.boltBadge}>
            {/* Lightning shape using pure borders — no emoji */}
            <View style={styles.boltShape} />
          </View>
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.brandName}>OyaEats</Text>
            <Text style={styles.brandTag}>FAST DELIVERY</Text>
          </View>
        </View>

        <Text style={styles.heroTitle}>
          {step === 0 ? "Join the\ncrowd." : "Almost\nthere."}
        </Text>
        <Text style={styles.heroSub}>
          {step === 0 ? "Tell us who you are" : "Set up your credentials"}
        </Text>
      </View>

      {/* ── Card ──────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <StepDots current={step} total={2} />

          <Text style={styles.cardTitle}>
            {step === 0 ? "Personal Info" : "Account Setup"}
          </Text>

          {!!error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* ── Step 0: name ────────────────────────────── */}
          {step === 0 && (
            <>
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <FloatingInput
                    label="First Name"
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Ada"
                    autoCapitalize="words"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <FloatingInput
                    label="Last Name"
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Obi"
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Live avatar preview */}
              <View style={styles.avatarRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitials}>
                    {(firstName[0] || "?").toUpperCase()}{(lastName[0] || "").toUpperCase()}
                  </Text>
                </View>
                <View style={{ marginLeft: 14 }}>
                  <Text style={styles.avatarName}>
                    {firstName || "Your"} {lastName || "Name"}
                  </Text>
                  <Text style={styles.avatarSub}>New OyaEats member</Text>
                </View>
              </View>

              <Animated.View style={{ transform: [{ scale: btnScale }] }}>
                <Pressable onPress={goNext} onPressIn={pressIn} onPressOut={pressOut} style={styles.ctaBtn}>
                  <Text style={styles.ctaBtnText}>Continue  →</Text>
                </Pressable>
              </Animated.View>
            </>
          )}

          {/* ── Step 1: credentials ─────────────────────── */}
          {step === 1 && (
            <>
              <FloatingInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="ada@email.com"
                keyboardType="email-address"
              />
              <FloatingInput
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                placeholder="080xxxxxxxx"
                keyboardType="phone-pad"
              />
              <FloatingInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Create a strong password"
                secureTextEntry
              />

              <View style={styles.hintBox}>
                <Text style={styles.hintText}>
                  Use at least 8 characters with a mix of letters and numbers.
                </Text>
              </View>

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
                    : <Text style={styles.ctaBtnText}>Create Account  →</Text>
                  }
                </Pressable>
              </Animated.View>
            </>
          )}

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable onPress={() => router.push("/(auth)/login")} style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Text style={styles.loginLink}>Log in</Text>
          </Pressable>
        </View>

        <Text style={styles.footerNote}>Hot food · Cold drinks · Groceries</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    backgroundColor: C.green,
    paddingTop: 52,
    paddingBottom: 32,
    paddingHorizontal: 28,
    overflow: "hidden",
  },
  circleTopRight: {
    position: "absolute", top: -60, right: -40,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: C.greenMid, opacity: 0.4,
  },
  circleMid: {
    position: "absolute", bottom: -20, right: 60,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.greenLight, opacity: 0.18,
  },
  backBtn: { marginBottom: 16, alignSelf: "flex-start" },
  backText: { color: C.greenLight, fontSize: 14, fontWeight: "600" },
  logoRow: { flexDirection: "row", alignItems: "center", marginBottom: 22 },
  boltBadge: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.greenMid,
    alignItems: "center", justifyContent: "center",
  },
  // Geometric bolt: two stacked triangles using borders
  boltShape: {
    width: 10,
    height: 10,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: C.white,
    marginBottom: -3,
    transform: [{ rotate: "20deg" }],
  },
  brandName: { color: C.white, fontSize: 18, fontWeight: "800", letterSpacing: 0.5 },
  brandTag: { color: C.greenLight, fontSize: 9, fontWeight: "600", letterSpacing: 2, marginTop: 1 },
  heroTitle: { color: C.white, fontSize: 32, fontWeight: "900", lineHeight: 40, letterSpacing: -0.5 },
  heroSub: { color: C.greenLight, fontSize: 13, fontWeight: "600", marginTop: 6, letterSpacing: 0.2 },

  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  card: {
    backgroundColor: C.white, borderRadius: 24, padding: 24,
    shadowColor: C.textDark, shadowOpacity: 0.07, shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 }, elevation: 5,
  },
  cardTitle: { fontSize: 20, fontWeight: "800", color: C.textDark, marginBottom: 16, letterSpacing: -0.3 },

  errorBanner: {
    backgroundColor: "#FDECEA", borderRadius: 10, padding: 12, marginBottom: 14,
    borderLeftWidth: 3, borderLeftColor: C.error,
  },
  errorText: { color: C.error, fontSize: 13, fontWeight: "500" },

  row: { flexDirection: "row" },

  avatarRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F0F7F3", borderRadius: 14,
    padding: 14, marginBottom: 20, marginTop: 4,
  },
  avatarCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: C.greenMid, alignItems: "center", justifyContent: "center",
  },
  avatarInitials: { color: C.white, fontSize: 18, fontWeight: "800" },
  avatarName: { color: C.textDark, fontSize: 15, fontWeight: "700" },
  avatarSub: { color: C.textMuted, fontSize: 12, marginTop: 2 },

  inputLabel: {
    fontSize: 11, fontWeight: "700", color: C.textDark,
    marginBottom: 5, letterSpacing: 0.5, textTransform: "uppercase",
  },
  inputWrapper: { borderWidth: 1.5, borderRadius: 12, backgroundColor: C.inputBg, overflow: "hidden" },
  input: { paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: C.textDark, fontWeight: "500" },

  hintBox: {
    backgroundColor: "#F0F7F3", borderRadius: 10,
    padding: 12, marginBottom: 18, marginTop: 2,
  },
  hintText: { color: C.greenMid, fontSize: 12, fontWeight: "500", lineHeight: 18 },

  ctaBtn: {
    backgroundColor: C.green, borderRadius: 14,
    paddingVertical: 16, alignItems: "center", justifyContent: "center",
  },
  ctaBtnText: { color: C.white, fontSize: 16, fontWeight: "800", letterSpacing: 0.3 },

  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  dividerText: { marginHorizontal: 12, color: C.textMuted, fontSize: 13, fontWeight: "500" },

  loginRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  loginText: { color: C.textMuted, fontSize: 14, fontWeight: "500" },
  loginLink: { color: C.green, fontSize: 14, fontWeight: "800" },

  footerNote: {
    textAlign: "center", color: C.textMuted, fontSize: 12,
    marginTop: 20, letterSpacing: 0.2, fontWeight: "500",
  },
});