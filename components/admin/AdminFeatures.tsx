import { View, Text, Pressable, StyleSheet } from "react-native";
import { useAdminDB, toggleFeature } from "../../lib/hooks/useAdminDB";

export function AdminFeatures() {
  const db = useAdminDB();

  return (
    <View style={styles.card}>
      <Text style={styles.title}>الميزات العامة للمنصة</Text>
      <Text style={styles.subtitle}>تفعيل أو تعطيل الميزات لكل المستخدمين</Text>

      <View style={{ marginTop: 14, gap: 4 }}>
        {db.features.map((f) => (
          <View key={f.key} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{f.name}</Text>
              <Text style={styles.desc}>{f.desc}</Text>
            </View>
            <Pressable style={[styles.toggle, f.on && styles.toggleOn]} onPress={() => toggleFeature(f.key)}>
              <View style={[styles.thumb, f.on && styles.thumbOn]} />
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "white", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#eef1f6" },
  title: { fontSize: 15, fontWeight: "900", color: "#0f172a" },
  subtitle: { fontSize: 12, color: "#64748b", marginTop: 2 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  name: { fontSize: 13, fontWeight: "800", color: "#0f172a" },
  desc: { fontSize: 11, color: "#64748b", marginTop: 2 },
  toggle: { width: 44, height: 24, borderRadius: 999, backgroundColor: "#cbd5e1", padding: 2, justifyContent: "center" },
  toggleOn: { backgroundColor: "#10b981" },
  thumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: "white", alignSelf: "flex-start" },
  thumbOn: { alignSelf: "flex-end" },
});
