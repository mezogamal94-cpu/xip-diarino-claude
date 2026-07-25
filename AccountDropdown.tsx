import { useMemo, useState } from "react";
import { router, useLocalSearchParams, Link } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet, Linking, FlatList, Alert } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useProperties } from "../../lib/hooks/useProperties";
import { fmtPrice } from "../../lib/types";
import { ReelBackground } from "../../components/reel/ReelBackground";
import { openOrCreateChat } from "../../lib/hooks/useChatsDB";
import { useCurrentUser } from "../../lib/hooks/useCurrentUser";
import { useLanguage } from "../../lib/hooks/useLanguage";

// ↔ #screen-seller in app-viewer.html.
export default function SellerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLanguage();
  const { user } = useCurrentUser();
  const [following, setFollowing] = useState(false);

  const { properties } = useProperties();
  const sellerListings = useMemo(() => properties.filter((p) => p.seller.id === id), [properties, id]);
  const seller = sellerListings[0]?.seller;

  if (!seller) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>{t("هذا البائع غير متاح")}</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>{t("رجوع")}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.closeBtn} onPress={() => router.back()} hitSlop={8}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth={2.5}>
            <Path d="M6 6l12 12M18 6L6 18" />
          </Svg>
        </Pressable>
      </View>

      <FlatList
        data={sellerListings}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 10, paddingHorizontal: 14 }}
        contentContainerStyle={{ gap: 10, paddingBottom: 30 }}
        ListHeaderComponent={
          <View style={styles.profileBlock}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{seller.initial}</Text></View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Text style={styles.name}>{t(seller.name)}</Text>
              {seller.verified && <Text style={{ color: "#22A652", fontSize: 15 }}>✓</Text>}
            </View>
            <Text style={styles.bio}>{t(seller.bio)}</Text>

            <View style={styles.statsRow}>
              <Stat label="إعلان" value={seller.listings} />
              <Stat label="متابع" value={seller.followers} />
            </View>

            <View style={styles.actionsRow}>
              <Pressable
                style={[styles.followBtn, following && styles.followBtnActive]}
                onPress={() => setFollowing((v) => !v)}
              >
                <Text style={[styles.followBtnText, following && styles.followBtnTextActive]}>
                  {following ? t("متابَع ✓") : t("متابعة")}
                </Text>
              </Pressable>
              <Pressable
                style={styles.whatsappBtn}
                onPress={() => Linking.openURL(`https://wa.me/${seller.phone}`)}
              >
                <Text style={styles.whatsappBtnText}>{t("واتساب")}</Text>
              </Pressable>
              {sellerListings[0] && (
                <Pressable
                  style={styles.chatIconBtn}
                  onPress={async () => {
                    if (!user) return;
                    const isRealSeller = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seller.id);
                    if (!isRealSeller) {
                      Alert.alert(t("هذا حساب تجريبي"), t("لا يمكن بدء محادثة مع هذا الحساب."));
                      return;
                    }
                    const chatId = await openOrCreateChat(user.id, seller.id, sellerListings[0].id);
                    router.push(`/chat/${chatId}`);
                  }}
                >
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#22A652" strokeWidth={2}>
                    <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </Svg>
                </Pressable>
              )}
            </View>

            <Text style={styles.sectionTitle}>{t("إعلاناتي")} — {t(seller.name)}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Link href={`/property/${item.id}`} asChild>
            <Pressable style={styles.card}>
              <View style={styles.cardMedia}>
                <ReelBackground index={0} type={item.type} />
              </View>
              <Text style={styles.cardPrice}>{fmtPrice(item.price)} {t("ج.م")}</Text>
              <Text style={styles.cardTitle} numberOfLines={1}>{t(item.shortTitle || item.title)}</Text>
            </Pressable>
          </Link>
        )}
      />
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  const { t } = useLanguage();
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{t(label)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, backgroundColor: "white" },
  notFoundText: { fontSize: 14, fontWeight: "800", color: "#374151" },
  backBtn: { backgroundColor: "#22A652", borderRadius: 999, paddingVertical: 10, paddingHorizontal: 24 },
  backBtnText: { color: "white", fontWeight: "900" },
  header: { paddingTop: 50, paddingHorizontal: 14, paddingBottom: 6 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#f3f4f6" },
  profileBlock: { alignItems: "center", paddingHorizontal: 20, paddingBottom: 16 },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: "#22A652", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  avatarText: { color: "white", fontWeight: "900", fontSize: 28 },
  name: { fontSize: 16, fontWeight: "900", color: "#111827" },
  bio: { fontSize: 12.5, color: "#6b7280", marginTop: 4, textAlign: "center" },
  statsRow: { flexDirection: "row", gap: 28, marginTop: 14 },
  stat: { alignItems: "center" },
  statValue: { fontSize: 15, fontWeight: "900", color: "#111827" },
  statLabel: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 16, width: "100%" },
  followBtn: { flex: 1, backgroundColor: "#22A652", borderRadius: 999, paddingVertical: 11, alignItems: "center" },
  followBtnActive: { backgroundColor: "#f3f4f6" },
  followBtnText: { color: "white", fontWeight: "900", fontSize: 13 },
  followBtnTextActive: { color: "#374151" },
  whatsappBtn: { flex: 1, borderWidth: 1.5, borderColor: "#22A652", borderRadius: 999, paddingVertical: 11, alignItems: "center" },
  whatsappBtnText: { color: "#22A652", fontWeight: "900", fontSize: 13 },
  chatIconBtn: { width: 44, height: 44, borderRadius: 999, borderWidth: 1.5, borderColor: "#22A652", alignItems: "center", justifyContent: "center" },
  sectionTitle: { alignSelf: "flex-start", fontSize: 13, fontWeight: "900", color: "#111827", marginTop: 22, marginBottom: 4 },
  card: { flex: 1, backgroundColor: "#f9fafb", borderRadius: 12, overflow: "hidden", marginBottom: 4 },
  cardMedia: { height: 110, position: "relative" },
  cardPrice: { fontSize: 13, fontWeight: "900", color: "#22A652", marginTop: 6, marginHorizontal: 8 },
  cardTitle: { fontSize: 11, color: "#6b7280", marginHorizontal: 8, marginBottom: 8, marginTop: 2 },
});
