import { router, useLocalSearchParams, Link } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet, Linking, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { usePropertyById } from "../../lib/hooks/useProperties";
import { fmtPrice, getReelMode } from "../../lib/types";
import { ReelBackground } from "../../components/reel/ReelBackground";
import { openOrCreateChat } from "../../lib/hooks/useChatsDB";
import { useCurrentUser } from "../../lib/hooks/useCurrentUser";
import { useLanguage } from "../../lib/hooks/useLanguage";

// ↔ #screen-details in app-viewer.html. Kept the "fixed CTA bar outside the
// scroll container" fix from the web version — it's a separate sibling View
// here, not something that can accidentally end up inside the ScrollView.
export default function PropertyDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLanguage();
  const { user } = useCurrentUser();
  const property = usePropertyById(id);

  if (!property) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>{t("هذا العقار لم يعد متاحًا")}</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>{t("رجوع")}</Text>
        </Pressable>
      </View>
    );
  }

  const mode = getReelMode(property);

  function openWhatsapp() {
    // ↔ WhatsApp button converted to a real anchor on web so the OS
    // app-chooser handles it — Linking.openURL is the native equivalent.
    Linking.openURL(`https://wa.me/${property!.seller.phone}?text=${encodeURIComponent(`مهتم بعقارك: ${property!.title}`)}`);
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        <View style={styles.cover}>
          {mode === "none" ? (
            <ReelBackground index={0} type={property.type} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "#111" }]} />
          )}
          <LinearGradient colors={["rgba(0,0,0,0.4)", "transparent"]} style={styles.coverTopFade} />
          <Pressable style={styles.closeBtn} onPress={() => router.back()} hitSlop={8}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
              <Path d="M6 6l12 12M18 6L6 18" />
            </Svg>
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.row}>
            <View style={[styles.purposeTag, { backgroundColor: property.purpose === "sale" ? "#22A652" : "#F4673F" }]}>
              <Text style={styles.purposeTagText}>{property.purpose === "sale" ? t("للبيع") : t("للإيجار")}</Text>
            </View>
            <Text style={styles.typeText}>{t(property.type)}</Text>
          </View>

          <Text style={styles.title}>{t(property.title)}</Text>
          <Text style={styles.location}>📍 {t(property.location)}، {t(property.province)}</Text>
          <Text style={styles.price}>
            {fmtPrice(property.price)} ج.م {property.purpose === "rent" ? "/ شهر" : ""}
          </Text>

          <View style={styles.specsGrid}>
            {!!property.rooms && <Spec icon="🛏" label={`${property.rooms} غرف`} />}
            {!!property.baths && <Spec icon="🛁" label={`${property.baths} حمام`} />}
            {!!property.reception && <Spec icon="🛋" label={`${property.reception} ريسبشن`} />}
            <Spec icon="📐" label={`${property.area} م²`} />
          </View>

          {property.features.length > 0 && (
            <View style={styles.featuresRow}>
              {property.features.map((f) => (
                <View key={f} style={styles.featureChip}><Text style={styles.featureChipText}>{t(f)}</Text></View>
              ))}
            </View>
          )}

          <Text style={styles.sectionTitle}>{t("الوصف")}</Text>
          <Text style={styles.description}>{t(property.description)}</Text>

          <Link href={`/seller/${property.seller.id}`} asChild>
            <Pressable style={styles.sellerCard}>
              <View style={styles.sellerAvatar}><Text style={styles.sellerAvatarText}>{property.seller.initial}</Text></View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={styles.sellerName}>{t(property.seller.name)}</Text>
                  {property.seller.verified && <Text style={{ color: "#22A652" }}>✓</Text>}
                </View>
                <Text style={styles.sellerMeta}>{property.seller.listings} إعلان · {property.seller.followers} متابع</Text>
              </View>
              <Text style={styles.sellerArrow}>‹</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>

      {/* ↔ the fixed CTA bar fix — lives outside the ScrollView on purpose */}
      <View style={styles.ctaBar}>
        <Pressable
          style={styles.chatBtn}
          onPress={async () => {
            if (!user) return;
            // ↔ demo/seed listings (merged in from data/mock-properties.ts)
            // have a placeholder seller id that isn't a real auth user —
            // creating a chat with it would fail the chats.partner_id FK,
            // so this is caught here with a clear message instead.
            const isRealSeller = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(property.seller.id);
            if (!isRealSeller) {
              Alert.alert(t("هذا إعلان تجريبي"), t("لا يمكن بدء محادثة مع هذا الإعلان."));
              return;
            }
            const chatId = await openOrCreateChat(user.id, property.seller.id, property.id);
            router.push(`/chat/${chatId}`);
          }}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#22A652" strokeWidth={2}>
            <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </Svg>
        </Pressable>
        <Pressable style={styles.whatsappBtn} onPress={openWhatsapp}>
          <Text style={styles.whatsappBtnText}>{t("تواصل عبر واتساب")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Spec({ icon, label }: { icon: string; label: string }) {
  const { t } = useLanguage();
  return (
    <View style={styles.specItem}>
      <Text style={styles.specIcon}>{icon}</Text>
      <Text style={styles.specLabel}>{t(label)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, backgroundColor: "white" },
  notFoundText: { fontSize: 14, fontWeight: "800", color: "#374151" },
  backBtn: { backgroundColor: "#22A652", borderRadius: 999, paddingVertical: 10, paddingHorizontal: 24 },
  backBtnText: { color: "white", fontWeight: "900" },
  cover: { height: 280, backgroundColor: "#111" },
  coverTopFade: { position: "absolute", top: 0, left: 0, right: 0, height: 80 },
  closeBtn: { position: "absolute", top: 50, left: 14, width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" },
  content: { padding: 18 },
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  purposeTag: { borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  purposeTagText: { color: "white", fontSize: 10, fontWeight: "900" },
  typeText: { fontSize: 12, fontWeight: "800", color: "#6b7280" },
  title: { fontSize: 18, fontWeight: "900", color: "#111827", marginBottom: 6 },
  location: { fontSize: 13, color: "#6b7280", marginBottom: 8 },
  price: { fontSize: 22, fontWeight: "900", color: "#22A652", marginBottom: 16 },
  specsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  specItem: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#f9fafb", borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  specIcon: { fontSize: 14 },
  specLabel: { fontSize: 12, fontWeight: "800", color: "#374151" },
  featuresRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  featureChip: { backgroundColor: "#ecfdf5", borderRadius: 999, paddingVertical: 5, paddingHorizontal: 11 },
  featureChipText: { fontSize: 11, fontWeight: "800", color: "#047857" },
  sectionTitle: { fontSize: 13, fontWeight: "900", color: "#111827", marginBottom: 8 },
  description: { fontSize: 13, color: "#4b5563", lineHeight: 21, marginBottom: 20 },
  sellerCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#f9fafb", borderRadius: 14, padding: 14 },
  sellerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#22A652", alignItems: "center", justifyContent: "center" },
  sellerAvatarText: { color: "white", fontWeight: "900", fontSize: 17 },
  sellerName: { fontSize: 13.5, fontWeight: "900", color: "#111827" },
  sellerMeta: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  sellerArrow: { fontSize: 20, color: "#9ca3af" },
  ctaBar: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    flexDirection: "row", gap: 10, padding: 14, paddingBottom: 28,
    backgroundColor: "white", borderTopWidth: 1, borderTopColor: "#f3f4f6",
  },
  chatBtn: { width: 48, height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: "#22A652", alignItems: "center", justifyContent: "center" },
  whatsappBtn: { flex: 1, backgroundColor: "#22A652", borderRadius: 14, alignItems: "center", justifyContent: "center" },
  whatsappBtnText: { color: "white", fontWeight: "900", fontSize: 14 },
});
