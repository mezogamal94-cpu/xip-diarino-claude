import { View, Text, Pressable, StyleSheet } from "react-native";
import { useAdminDB, deleteReel, resolveReport } from "../../lib/hooks/useAdminDB";
import { showToast } from "../shared/Toast";

export function AdminReports() {
  const db = useAdminDB();

  function dismiss(id: string) {
    resolveReport(id);
    showToast("✓ تم تجاهل البلاغ");
  }
  function removeContent(id: string, targetId: string) {
    deleteReel(targetId);
    resolveReport(id);
    showToast("🗑️ تم حذف المحتوى المُبلَّغ عنه");
  }

  if (db.reports.length === 0) {
    return <Text style={styles.empty}>لا توجد بلاغات مفتوحة</Text>;
  }

  return (
    <View style={{ gap: 10 }}>
      {db.reports.map((r) => (
        <View key={r.id} style={styles.row}>
          <View style={[styles.thumb, { backgroundColor: r.targetColor }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>{r.target}</Text>
            <Text style={styles.sub}>السبب: {r.reason}</Text>
            <Text style={styles.sub}>المُبلِّغ: {r.reporter} · {r.count} بلاغ · {r.date}</Text>
          </View>
          <View style={styles.actions}>
            <Pressable style={[styles.actionBtn, { backgroundColor: "#f1f5f9" }]} onPress={() => dismiss(r.id)}>
              <Text style={[styles.actionBtnText, { color: "#334155" }]}>تجاهل</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, { backgroundColor: "#0f172a" }]} onPress={() => removeContent(r.id, r.targetId)}>
              <Text style={[styles.actionBtnText, { color: "white" }]}>حذف المحتوى</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { textAlign: "center", color: "#64748b", fontSize: 13, padding: 30 },
  row: { flexDirection: "row", gap: 10, backgroundColor: "white", borderRadius: 14, padding: 12, borderWidth: 1, borderColor: "#eef1f6" },
  thumb: { width: 44, height: 56, borderRadius: 8 },
  title: { fontSize: 12.5, fontWeight: "900", color: "#0f172a", marginBottom: 3 },
  sub: { fontSize: 11, color: "#64748b" },
  actions: { justifyContent: "center", gap: 6 },
  actionBtn: { paddingVertical: 7, paddingHorizontal: 10, borderRadius: 8 },
  actionBtnText: { fontSize: 10.5, fontWeight: "800" },
});
