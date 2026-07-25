import { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Modal } from "react-native";
import { useAdminDB, setReelStatus, deleteReel } from "../../lib/hooks/useAdminDB";
import { StatusChip } from "./StatusChip";
import { ConfirmModal } from "../shared/ConfirmModal";
import { showToast } from "../shared/Toast";
import { AdminReel, ReelStatus } from "../../data/mock-admin";

const FILTERS: { key: "all" | ReelStatus; label: string }[] = [
  { key: "all", label: "الكل" }, { key: "pending", label: "قيد المراجعة" },
  { key: "approved", label: "منشورة" }, { key: "rejected", label: "مرفوضة" },
];

export function AdminReels() {
  const db = useAdminDB();
  const [filter, setFilter] = useState<"all" | ReelStatus>("all");
  const [query, setQuery] = useState("");
  const [previewReel, setPreviewReel] = useState<AdminReel | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const rows = useMemo(() => {
    return db.reels.filter((r) => (filter === "all" || r.status === filter))
      .filter((r) => !query || r.title.includes(query) || r.owner.includes(query));
  }, [db.reels, filter, query]);

  function approve(id: string) { setReelStatus(id, "approved"); showToast("✓ تم قبول الريلز"); }
  function reject(id: string) { setReelStatus(id, "rejected"); showToast("✕ تم رفض الريلز"); }
  function confirmDelete() {
    if (!confirmDeleteId) return;
    deleteReel(confirmDeleteId);
    showToast("🗑️ تم الحذف");
    setConfirmDeleteId(null);
    setPreviewReel(null);
  }

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Pressable key={f.key} style={filter === f.key ? styles.chipActive : styles.chip} onPress={() => setFilter(f.key)}>
            <Text style={filter === f.key ? styles.chipActiveText : styles.chipText}>{f.label}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput style={styles.search} value={query} onChangeText={setQuery} placeholder="🔍 ابحث بالعنوان أو المالك..." placeholderTextColor="#94a3b8" />

      {rows.length === 0 ? (
        <Text style={styles.empty}>لا يوجد ريلز مطابق</Text>
      ) : (
        rows.map((r) => (
          <Pressable key={r.id} style={styles.row} onPress={() => setPreviewReel(r)}>
            <View style={[styles.thumb, { backgroundColor: r.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>{r.title}</Text>
              <Text style={styles.sub}>{r.owner} · {r.price} · 👁 {r.views.toLocaleString("ar-EG")}</Text>
              <StatusChip status={r.status} />
            </View>
            <View style={styles.actions}>
              {r.status !== "approved" && <ActionBtn label="قبول" bg="#dcfce7" fg="#166534" onPress={() => approve(r.id)} />}
              {r.status !== "rejected" && <ActionBtn label="رفض" bg="#fee2e2" fg="#991b1b" onPress={() => reject(r.id)} />}
              <ActionBtn label="حذف" bg="#0f172a" fg="white" onPress={() => setConfirmDeleteId(r.id)} />
            </View>
          </Pressable>
        ))
      )}

      <Modal visible={!!previewReel} transparent animationType="fade" onRequestClose={() => setPreviewReel(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPreviewReel(null)} />
        {previewReel && (
          <View style={styles.modalCard}>
            <View style={[styles.previewBox, { backgroundColor: previewReel.color }]}><Text style={{ fontSize: 40 }}>🏠</Text></View>
            <KV k="العنوان" v={previewReel.title} />
            <KV k="المالك" v={previewReel.owner} />
            <KV k="السعر" v={previewReel.price} />
            <KV k="المشاهدات" v={previewReel.views.toLocaleString("ar-EG")} />
            <KV k="الإعجابات" v={previewReel.likes.toLocaleString("ar-EG")} />
            <KV k="تحويلات واتساب" v={String(previewReel.wa)} />
            <View style={styles.modalActions}>
              <ActionBtn label="قبول" bg="#dcfce7" fg="#166534" onPress={() => { approve(previewReel.id); setPreviewReel(null); }} />
              <ActionBtn label="رفض" bg="#fee2e2" fg="#991b1b" onPress={() => { reject(previewReel.id); setPreviewReel(null); }} />
              <ActionBtn label="حذف" bg="#0f172a" fg="white" onPress={() => setConfirmDeleteId(previewReel.id)} />
            </View>
          </View>
        )}
      </Modal>

      <ConfirmModal
        visible={!!confirmDeleteId}
        title="حذف الريلز"
        text="حذف هذا الريلز نهائياً؟"
        confirmLabel="حذف"
        danger
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </View>
  );
}

function ActionBtn({ label, bg, fg, onPress }: { label: string; bg: string; fg: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.actionBtn, { backgroundColor: bg }]} onPress={onPress}>
      <Text style={[styles.actionBtnText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}
function KV({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.kvRow}>
      <Text style={styles.kvKey}>{k}</Text>
      <Text style={styles.kvVal}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { backgroundColor: "#f1f5f9", borderRadius: 999, paddingVertical: 7, paddingHorizontal: 14 },
  chipText: { fontSize: 12, fontWeight: "700", color: "#334155" },
  chipActive: { backgroundColor: "#0f172a", borderRadius: 999, paddingVertical: 7, paddingHorizontal: 14 },
  chipActiveText: { fontSize: 12, fontWeight: "700", color: "white" },
  search: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 999, paddingVertical: 9, paddingHorizontal: 14, fontSize: 13 },
  empty: { textAlign: "center", color: "#64748b", fontSize: 13, padding: 30 },
  row: { flexDirection: "row", gap: 10, backgroundColor: "white", borderRadius: 14, padding: 12, borderWidth: 1, borderColor: "#eef1f6" },
  thumb: { width: 44, height: 56, borderRadius: 8 },
  title: { fontSize: 12.5, fontWeight: "900", color: "#0f172a", marginBottom: 3 },
  sub: { fontSize: 11, color: "#64748b", marginBottom: 6 },
  actions: { justifyContent: "center", gap: 6 },
  actionBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  actionBtnText: { fontSize: 10.5, fontWeight: "800" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(15,23,42,0.6)" },
  modalCard: { position: "absolute", left: 20, right: 20, top: "18%", backgroundColor: "white", borderRadius: 20, padding: 20, maxHeight: "70%" },
  previewBox: { width: "100%", aspectRatio: 1.4, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  kvRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  kvKey: { fontSize: 12, color: "#64748b" },
  kvVal: { fontSize: 12, fontWeight: "900", color: "#0f172a" },
  modalActions: { flexDirection: "row", gap: 8, justifyContent: "flex-end", marginTop: 16 },
});
