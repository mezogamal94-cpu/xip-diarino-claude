import { View, Text, StyleSheet } from "react-native";
import { useAdminDB } from "../../lib/hooks/useAdminDB";
import { SimpleBarChart } from "./SimpleBarChart";
import { SimpleDonutChart } from "./SimpleDonutChart";

const WEEK_VALUES = [45, 62, 58, 75, 88, 72, 95];
const WEEK_LABELS = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

export function AdminOverview() {
  const db = useAdminDB();
  const approvedCount = db.reels.filter((r) => r.status === "approved").length;
  const totalViews = db.reels.reduce((a, b) => a + b.views, 0);
  const totalWa = db.reels.reduce((a, b) => a + b.wa, 0);

  return (
    <View style={{ gap: 14 }}>
      <View style={styles.statsGrid}>
        <StatCard icon="🎬" bg="#6366f1" title="ريلز منشورة" value={approvedCount.toLocaleString("ar-EG")} />
        <StatCard icon="👁️" bg="#10b981" title="إجمالي المشاهدات" value={totalViews.toLocaleString("ar-EG")} />
        <StatCard icon="📢" bg="#f59e0b" title="إعلانات منشورة" value={approvedCount.toLocaleString("ar-EG")} />
        <StatCard icon="💬" bg="#25d366" title="تحويلات واتساب" value={totalWa.toLocaleString("ar-EG")} />
        <StatCard icon="🚩" bg="#ec4899" title="بلاغات مفتوحة" value={db.reports.length.toLocaleString("ar-EG")} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>المشاهدات هذا الأسبوع (بالآلاف)</Text>
        <SimpleBarChart values={WEEK_VALUES} labels={WEEK_LABELS} color="#6366f1" />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>توزيع العقارات حسب النوع</Text>
        <SimpleDonutChart
          slices={[
            { label: "شقق", value: 42, color: "#6366f1" },
            { label: "فلل", value: 28, color: "#ec4899" },
            { label: "أراضٍ", value: 18, color: "#10b981" },
            { label: "مكاتب", value: 12, color: "#f59e0b" },
          ]}
        />
      </View>
    </View>
  );
}

function StatCard({ icon, bg, title, value }: { icon: string; bg: string; title: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: bg }]}><Text style={{ fontSize: 18 }}>{icon}</Text></View>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { width: "47%", backgroundColor: "white", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#eef1f6" },
  statIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  statTitle: { fontSize: 11.5, color: "#64748b", fontWeight: "700", marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: "900", color: "#0f172a" },
  card: { backgroundColor: "white", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#eef1f6" },
  cardTitle: { fontSize: 13.5, fontWeight: "900", color: "#0f172a", marginBottom: 12 },
});
