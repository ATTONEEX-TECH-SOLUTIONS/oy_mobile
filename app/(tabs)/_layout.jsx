import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

// ── Brand tokens ──────────────────────────────────────────────────────────────
const C = {
  green: "#1B4332",
  greenMid: "#2D6A4F",
  greenLight: "#52B788",
  amberLight: "#F4A620",
  bg: "#F5F1EB",
  white: "#FFFFFF",
  textDark: "#111C14",
  textMuted: "#6B7C6E",
  border: "#D8E4DC",
};

const TABS = [
  { name: "home",    icon: "home",    iconOutline: "home-outline",    label: "Home"    },
  { name: "search",  icon: "search",  iconOutline: "search-outline",  label: "Search"  },
  { name: "orders",  icon: "receipt", iconOutline: "receipt-outline", label: "Orders"  },
  { name: "profile", icon: "person",  iconOutline: "person-outline",  label: "Profile" },
];

function TabIcon({ name, iconFilled, iconOutline, focused }) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemActive]}>
      <Ionicons
        name={focused ? iconFilled : iconOutline}
        size={22}
        color={focused ? C.green : C.textMuted}
      />
      {focused && <View style={styles.activeDot} />}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                name={tab.name}
                iconFilled={tab.icon}
                iconOutline={tab.iconOutline}
                focused={focused}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: C.border,
    height: 72,
    paddingBottom: 10,
    paddingTop: 8,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    width: 52,
    height: 44,
    borderRadius: 14,
  },
  tabItemActive: {
    backgroundColor: "#EDF7F2",
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.green,
    marginTop: 3,
  },
});