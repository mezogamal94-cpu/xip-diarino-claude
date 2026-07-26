import { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useAdminDB, toggleUserActive, toggleUserPerm } from "../../lib/hooks/useAdminDB";
import { AdminUser } from "../../data/mock-admin";

const PERM_LABELS: { key: keyof AdminUser["perms"]; label: string }[] = [
  { key: "publishReels", label: "نشر ريلز" },
  { key: "live", label: "بث مباشر" },
  { key: "paidAds", label: "إعلانات مدفوعة" },
  { key: "directWa", label: "واتساب مباشر" },
];

export function AdminUsers() {
  const db = useAdminDB();
  const [query, setQuery] = useState("");

  const rows = useMemo(() => db.users.filter((u) => !query || u.name.includes(query)), [db.users, query]);

  return (
    <View style={{ gap: 12 }}>
      <TextInput style={styles.search} value={query} onChangeText={setQuery} placeholder="🔍 ابحث عن مستخدم..." placeholderTextColor="#94a3b8" />

      {rows.map((u) => (
        <View key={u.id} style={styles.card}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{u.name}</Text>
              <Text style={styles.sub}>{u.reels} ريلز · {u.views.toLocaleString("ar-EG")} مشاهدة</Text>
            </View>
            <Toggle value={u.active} onPress={() => toggleUserActive(u.id)} />
          </View>
          <View style={styles.permsGrid}>
            {PERM_LABELS.map((p) => (
              <View key={p.key} style={styles.permRow}>
                <Text style={styles.permLabel}>{p.label}</Text>
                <Toggle value={u.perms[p.key]} onPress={() => toggleUserPerm(u.id, p.key)} small />
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function Toggle({ value, onPress, small }: { value: boolean; onPress: () => void; small?: boolean }) {
  return (
    <Pressable
      style={[small ? styles.toggleSmall : styles.toggle, value && styles.toggleOn]}
      onPress={onPress}
    >
      <View style={[small ? styles.toggleThumbSmall : styles.toggleThumb, value && (small ? styles.toggleThumbOnSmall : styles.toggleThumbOn)]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  search: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 999, paddingVertical: 9, paddingHorizontal: 14, fontSize: 13 },
  card: { backgroundColor: "white", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#eef1f6" },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  name: { fontSize: 13.5, fontWeight: "900", color: "#0f172a" },
  sub: { fontSize: 11, color: "#64748b", marginTop: 2 },
  permsGrid: { gap: 8, borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 10 },
  permRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  permLabel: { fontSize: 12, color: "#334155", fontWeight: "700" },
  toggle: { width: 44, height: 24, borderRadius: 999, backgroundColor: "#cbd5e1", padding: 2, justifyContent: "center" },
  toggleOn: { backgroundColor: "#10b981" },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: "white", alignSelf: "flex-start" },
  toggleThumbOn: { alignSelf: "flex-end" },
  toggleSmall: { width: 36, height: 20, borderRadius: 999, backgroundColor: "#cbd5e1", padding: 2, justifyContent: "center" },
  toggleThumbSmall: { width: 16, height: 16, borderRadius: 8, backgroundColor: "white", alignSelf: "flex-start" },
  toggleThumbOnSmall: { alignSelf: "flex-end" },
});
