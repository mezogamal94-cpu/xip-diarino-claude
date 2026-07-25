import { useState } from "react";
import { router } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useIsAdmin } from "../../lib/hooks/useIsAdmin";
import { AdminOverview } from "../../components/admin/AdminOverview";
import { AdminReels } from "../../components/admin/AdminReels";
import { AdminLives } from "../../components/admin/AdminLives";
import { AdminReports } from "../../components/admin/AdminReports";
import { AdminAnalytics } from "../../components/admin/AdminAnalytics";
import { AdminUsers } from "../../components/admin/AdminUsers";
import { AdminFeatures } from "../../components/admin/AdminFeatures";
import { ToastHost } from "../../components/shared/Toast";

type AdminPage = "overview" | "reels" | "lives" | "reports" | "analytics" | "users" | "features";

// ↔ pageTitles + the #nav sidebar in admin-viewer.html. A desktop sidebar
// doesn't fit a phone screen, so this became a horizontal scrollable chip
// nav instead — same 7 sections, same instant-switch/no-navigation-stack
// behavior (this is one screen with local state, not 7 routes).
const PAGES: { key: AdminPage; icon: string; label: string; title: string; subtitle: string }[] = [
  { key: "overview", icon: "📊", label: "نظرة عامة", title: "نظرة عامة", subtitle: "ملخص أداء المنصة اليوم" },
  { key: "reels", icon: "🎬", label: "الريلز", title: "إدارة الريلز", subtitle: "الموافقة، الرفض، والحذف" },
  { key: "lives", icon: "📡", label: "البث المسجل", title: "البث المباشر المسجل", subtitle: "مراجعة وإدارة البث المنشور" },
  { key: "reports", icon: "🚩", label: "الإبلاغات", title: "الإبلاغات", subtitle: "مراجعة المحتوى المُبلَّغ عنه" },
  { key: "analytics", icon: "📈", label: "التحليلات", title: "التحليلات", subtitle: "مشاهدات، إعلانات، وتحويلات واتساب" },
  { key: "users", icon: "👥", label: "المستخدمون", title: "المستخدمون", subtitle: "التحكم في صلاحيات كل مستخدم" },
  { key: "features", icon: "⚙️", label: "الميزات العامة", title: "الميزات العامة", subtitle: "تفعيل أو تعطيل ميزات المنصة" },
];

export default function AdminScreen() {
  const { isAdmin, checking } = useIsAdmin();
  const [page, setPage] = useState<AdminPage>("overview");

  if (checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6366f1" size="large" />
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Text style={styles.deniedTitle}>غير مصرح لك بالدخول</Text>
        <Text style={styles.deniedText}>هذه الصفحة مخصصة لمسؤولي المنصة فقط.</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>رجوع</Text>
        </Pressable>
      </View>
    );
  }

  const current = PAGES.find((p) => p.key === page)!;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.closeBtn} onPress={() => router.back()} hitSlop={8}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth={2}><Path d="M18 6L6 18M6 6l12 12" /></Svg>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{current.title}</Text>
          <Text style={styles.headerSubtitle}>{current.subtitle}</Text>
        </View>
        <View style={styles.brandDot}><Text style={styles.brandDotText}>د</Text></View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.nav} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        {PAGES.map((p) => (
          <Pressable key={p.key} style={[styles.navChip, page === p.key && styles.navChipActive]} onPress={() => setPage(p.key)}>
            <Text style={styles.navIcon}>{p.icon}</Text>
            <Text style={[styles.navLabel, page === p.key && styles.navLabelActive]}>{p.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {page === "overview" && <AdminOverview />}
        {page === "reels" && <AdminReels />}
        {page === "lives" && <AdminLives />}
        {page === "reports" && <AdminReports />}
        {page === "analytics" && <AdminAnalytics />}
        {page === "users" && <AdminUsers />}
        {page === "features" && <AdminFeatures />}
      </ScrollView>

      <ToastHost />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6fb" },
  center: { flex: 1, backgroundColor: "#f4f6fb", alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  deniedTitle: { fontSize: 16, fontWeight: "900", color: "#0f172a" },
  deniedText: { fontSize: 12.5, color: "#64748b", textAlign: "center" },
  backBtn: { marginTop: 8, backgroundColor: "#0f172a", borderRadius: 999, paddingVertical: 10, paddingHorizontal: 24 },
  backBtnText: { color: "white", fontWeight: "900" },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 50, paddingBottom: 14, paddingHorizontal: 16, backgroundColor: "white", borderBottomWidth: 1, borderBottomColor: "#eef1f6" },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "900", color: "#0f172a" },
  headerSubtitle: { fontSize: 11.5, color: "#64748b", marginTop: 1 },
  brandDot: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#6366f1", alignItems: "center", justifyContent: "center" },
  brandDotText: { color: "white", fontWeight: "900" },
  nav: { flexGrow: 0, paddingVertical: 12, backgroundColor: "white", borderBottomWidth: 1, borderBottomColor: "#eef1f6" },
  navChip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#f1f5f9", borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  navChipActive: { backgroundColor: "#0f172a" },
  navIcon: { fontSize: 13 },
  navLabel: { fontSize: 12, fontWeight: "800", color: "#334155" },
  navLabelActive: { color: "white" },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
});
