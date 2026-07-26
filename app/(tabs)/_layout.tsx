import { Tabs } from "expo-router";
import { View, StyleSheet, Platform } from "react-native";
import {
  ReelsIcon,
  SearchIcon,
  MenuIcon,
  RequestsIcon,
  AccountIcon,
} from "./_tab-icons";
import { useLanguage } from "../../lib/hooks/useLanguage";

// Colors/sizes pulled directly from app-viewer.html:
// .nav-btn { color: #9ca3af; font-size: 10px; font-weight: 800; }
// .nav-btn.active { color: #22A652; }
// .nav-btn svg { width: 22px; height: 22px; }
// .bottom-nav { height: 64px; background: #fff; border-top: 1px solid #f0f0f0; }
const ACTIVE = "#22A652";
const INACTIVE = "#9ca3af";
const ICON_SIZE = 22;
const MENU_ICON_SIZE_ACTIVE = 28; // .nav-btn.menu-btn.active svg { width: 28px; height: 28px; }

export default function TabsLayout() {
  const { t } = useLanguage();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          height: 64,
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#f0f0f0",
          paddingBottom: Platform.OS === "ios" ? 0 : 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "800",
          // Swap for the loaded Cairo font once expo-font/Cairo is wired in
          // (root __root/global styling uses Cairo everywhere on web).
          fontFamily: undefined,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("الرئيسية"),
          tabBarIcon: ({ color, focused }) => (
            <ReelsIcon color={color} size={ICON_SIZE} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t("البحث"),
          tabBarIcon: ({ color }) => <SearchIcon color={color} size={ICON_SIZE} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: t("القائمة"),
          // .nav-btn.menu-btn.active { transform: translateY(-8px) } —
          // the middle tab "floats" up and grows when active.
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.menuIconActive : styles.menuIcon}>
              <MenuIcon color={color} size={focused ? MENU_ICON_SIZE_ACTIVE : ICON_SIZE} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: t("الطلبات"),
          tabBarIcon: ({ color }) => <RequestsIcon color={color} size={ICON_SIZE} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: t("الحساب"),
          tabBarIcon: ({ color }) => <AccountIcon color={color} size={ICON_SIZE} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  menuIcon: {
    alignItems: "center",
    justifyContent: "center",
  },
  menuIconActive: {
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateY: -8 }],
  },
});
