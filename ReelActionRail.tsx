import { View, Text, StyleSheet } from "react-native";
import { useAdminDB } from "../../lib/hooks/useAdminDB";
import { SimpleBarChart } from "./SimpleBarChart";

// ↔ the four hardcoded month stat cards + convChart + topWa + cityBody in renderAnalytics()
export function AdminAnalytics() {
  const db = useAdminDB();
  const topWa = [...db.reels].sort((a, b) => b.wa - a.wa).slice(0, 5);
  const weeklyViews = [32, 41, 38, 52, 60, 48, 65];
  const weeklyWa = [8, 12, 10, 16, 20, 15, 22];

  return (
    <View style={{ gap: 14 }}>
      <View style={styles.statsGrid}>
        <StatCard icon="👁️" bg="#10b981" title="مشاهدات هذا الشهر" value="248,540" delta="▲ 18%" />
        <StatCard icon="📢" bg="#f59e0b" title="إعلانات هذا الشهر" value="1,284" delta="▲ 22%" />
        <StatCard icon="💬" bg="#25d366" title="تحويلات واتساب" value="3,412" delta="▲ 31%" />
        <StatCard icon="🎯" bg="#6366f1" title="معدل التحويل" value="4.8%" delta="▲ 0.6%" />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>المشاهدات (بالآلاف)</Text>
        <SimpleBarChart values={weeklyViews} color="#6366f1" />
        <Text style={[styles.cardTitle, { marginTop: 14 }]}>تحويلات واتساب (بالآلاف)</Text>
        <SimpleBarChart values={weeklyWa} color="#25d366" />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>الأكثر تحويلاً على واتساب</Text>
        {topWa.map((r, i) => (
          <View key={r.id} style={styles.waRow}>
            <View style={[styles.waRank, { backgroundColor: r.color }]}><Text style={styles.waRankText}>{i + 1}</Text></View>
            <Text style={styles.waTitle} numberOfLines={1}>{r.title}</Text>
            <Text style={styles.waCount}>{r.wa}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>تحليل الإعلانات حسب المدينة</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 2 }]}>المدينة</Text>
          <Text style={styles.th}>إعلانات</Text>
          <Text style={styles.th}>معدل التحويل</Text>
        </View>
        {db.cityStats.map((c) => (
          <View key={c.city} style={styles.tableRow}>
            <Text style={[styles.td, { flex: 2, fontWeight: "900", color: "#0f172a" }]}>{c.city}</Text>
            <Text style={styles.td}>{c.ads}</Text>
            <Text style={styles.td}>{c.rate}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function StatCard({ icon, bg, title, value, delta }: { icon: string; bg: string; title: string; value: string; delta: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: bg }]}><Text style={{ fontSize: 18 }}>{icon}</Text></View>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.delta}>{delta}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { width: "47%", backgroundColor: "white", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#eef1f6" },
  statIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  statTitle: { fontSize: 11.5, color: "#64748b", fontWeight: "700", marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: "900", color: "#0f172a" },
  delta: { fontSize: 11, fontWeight: "800", color: "#16a34a", marginTop: 2 },
  card: { backgroundColor: "white", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#eef1f6" },
  cardTitle: { fontSize: 13.5, fontWeight: "900", color: "#0f172a", marginBottom: 12 },
  waRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  waRank: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  waRankText: { color: "white", fontSize: 11, fontWeight: "900" },
  waTitle: { flex: 1, fontSize: 12, color: "#334155", fontWeight: "700" },
  waCount: { fontSize: 12.5, fontWeight: "900", color: "#25d366" },
  tableHeader: { flexDirection: "row", paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  th: { flex: 1, fontSize: 10.5, color: "#64748b", fontWeight: "800" },
  tableRow: { flexDirection: "row", paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  td: { flex: 1, fontSize: 11.5, color: "#334155" },
});
