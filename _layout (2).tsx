import { useMemo, useState } from "react";
import { router } from "expo-router";
import { View, Text, Pressable, FlatList, StyleSheet, Linking, Alert } from "react-native";
import Svg, { Path } from "react-native-svg";
import { PropertyRequest } from "../../data/mock-requests";
import { fmtPrice } from "../../lib/types";
import { PageTopBar } from "../../components/shared/PageTopBar";
import { RequestFilterModal, RequestFilters, DEFAULT_REQUEST_FILTERS } from "../../components/requests/RequestFilterModal";
import { MakeOfferModal } from "../../components/requests/MakeOfferModal";
import { AccountDropdown } from "../../components/account/AccountDropdown";
import { NotificationsDropdown } from "../../components/notifications/NotificationsDropdown";
import { useNotifications } from "../../lib/hooks/useNotifications";
import { useFavorites } from "../../lib/hooks/useFavorites";
import { useRequests, useIncrementRequestOffers } from "../../lib/hooks/useRequests";
import { openOrCreateRequestChat, useSendMessage } from "../../lib/hooks/useChatsDB";
import { useCurrentUser } from "../../lib/hooks/useCurrentUser";
import { useLanguage } from "../../lib/hooks/useLanguage";
import { signOut } from "../../lib/hooks/useAuth";

// ↔ page-requests / renderRequests() in app-viewer.html.
export default function RequestsScreen() {
  const { user } = useCurrentUser();
  const { data: requests = [] } = useRequests();
  const incrementOffers = useIncrementRequestOffers();
  const sendMessage = useSendMessage();
  const { favoriteRequests, toggleFavoriteProperty: _unused, toggleFavoriteRequest, totalCount: favoritesTotalCount } = useFavorites();
  const [filters, setFilters] = useState<RequestFilters>(DEFAULT_REQUEST_FILTERS);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [offerRequest, setOfferRequest] = useState<PropertyRequest | null>(null);

  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const [notifMenuVisible, setNotifMenuVisible] = useState(false);
  const notifications = useNotifications();
  const [notificationsOn, setNotificationsOn] = useState(true);
  const { t } = useLanguage();

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (filters.province && r.province !== filters.province) return false;
      if (filters.location && !(r.location || "").includes(filters.location)) return false;
      if (filters.type !== "all" && r.type !== filters.type) return false;
      if (filters.purpose !== "all" && r.purpose !== filters.purpose) return false;
      return true;
    });
  }, [requests, filters]);

  // ↔ submitOffer()
  async function submitOffer(message: string, price: string, whatsapp: string) {
    if (!offerRequest || !user) return;
    const r = offerRequest;

    if (r.requesterId === user.id) {
      Alert.alert(t("لا يمكنك تقديم عرض على طلبك الخاص"));
      setOfferRequest(null);
      return;
    }

    try {
      incrementOffers.mutate(r.id);
      const chatId = await openOrCreateRequestChat(user.id, r.requesterId, r.id);
      const fullMsg = message + (price ? `\nالسعر: ${fmtPrice(Number(price))} ج.م` : "");
      await sendMessage.mutateAsync({
        chatId, senderId: user.id,
        text: `بخصوص طلبك (${r.type} - ${r.location}):\n${fullMsg}`,
        whatsapp,
      });
      setOfferRequest(null);
      router.push(`/chat/${chatId}`);
    } catch {
      Alert.alert(t("تعذر إرسال العرض"), t("حاول مرة أخرى."));
    }
  }

  return (
    <View style={styles.container}>
      <PageTopBar
        title="الطلبات"
        notifBadgeCount={notifications.totalUnread}
        onOpenNotifications={() => setNotifMenuVisible(true)}
        onOpenAccountMenu={() => setAccountMenuVisible(true)}
      />

      <View style={styles.filterBar}>
        <Pressable style={styles.filterPill} onPress={() => setFilterModalVisible(true)}>
          <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
            <Path d="M4 6h16M7 12h10M10 18h4" />
          </Svg>
          <Text style={styles.filterPillText}>{t("تصفية")}</Text>
        </Pressable>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 14, gap: 12, paddingBottom: 90 }}
        ListEmptyComponent={
          <View style={styles.empty}><Text style={styles.emptyText}>{t("لا توجد طلبات")}</Text></View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle}>{t(item.type)} {item.purpose === "sale" ? t("للبيع") : t("للإيجار")}</Text>
              <Text style={styles.cardPrice}>{t("حتى")} {item.priceMax ? fmtPrice(item.priceMax) : "—"} {t("ج.م")} {item.purpose === "rent" ? t("/ شهر") : ""}</Text>
            </View>
            <Text style={styles.cardLoc}>📍 {t(item.province)} · {t(item.location)}</Text>
            <View style={styles.specsRow}>
              {item.rooms !== "-" && !!item.rooms && <Text style={styles.spec}>🛏 {item.rooms}</Text>}
              {item.baths !== "-" && !!item.baths && <Text style={styles.spec}>🛁 {item.baths}</Text>}
              {!!item.area && <Text style={styles.spec}>📐 {item.area} {t("م²")}</Text>}
            </View>
            <View style={styles.descRow}>
              <Text style={styles.desc}>{t(item.description)}</Text>
              <Pressable onPress={() => toggleFavoriteRequest(item.id)} hitSlop={6}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill={favoriteRequests.has(item.id) ? "#FBBF24" : "none"} stroke={favoriteRequests.has(item.id) ? "#FBBF24" : "#9ca3af"} strokeWidth={2}>
                  <Path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                </Svg>
              </Pressable>
            </View>
            <Pressable style={styles.offerBtn} onPress={() => setOfferRequest(item)}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
                <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </Svg>
              <Text style={styles.offerBtnText}>{t("تقديم عرض")}</Text>
            </Pressable>
            <Text style={styles.offersCount}>{item.offers || 0} {t("عروض")}</Text>
          </View>
        )}
      />

      <RequestFilterModal
        visible={filterModalVisible}
        value={filters}
        onApply={setFilters}
        onClose={() => setFilterModalVisible(false)}
      />

      <MakeOfferModal
        visible={!!offerRequest}
        request={offerRequest}
        onClose={() => setOfferRequest(null)}
        onSubmit={submitOffer}
      />

      <AccountDropdown
        visible={accountMenuVisible}
        onClose={() => setAccountMenuVisible(false)}
        notificationsOn={notificationsOn}
        favoritesCount={favoritesTotalCount}
        onOpenFavorites={() => router.push({ pathname: "/(tabs)/account", params: { tab: "favorites" } })}
        onOpenMyAccount={() => router.push("/(tabs)/account")}
        onContactUs={() => Linking.openURL("https://wa.me/201117107131")}
        onToggleNotifications={() => setNotificationsOn((v) => !v)}
        onLogout={() => { signOut(); router.replace("/"); }}
      />

      <NotificationsDropdown
        visible={notifMenuVisible}
        onClose={() => setNotifMenuVisible(false)}
        activeCat={notifications.activeCat}
        onSwitchCat={notifications.setActiveCat}
        filter={notifications.filter}
        onSetFilter={notifications.setFilter}
        badges={notifications.badges}
        items={notifications.visibleItems}
        onMarkAllRead={notifications.markAllRead}
        onItemPress={(index) => {
          const item = notifications.visibleItems[index];
          notifications.markItemRead(notifications.activeCat, index);
          setNotifMenuVisible(false);
          if (!item?.action) return;
          const a = item.action;
          if (a.type === "seller") router.push(`/seller/${a.id}`);
          else if (a.type === "property") router.push(`/property/${a.id}`);
          else if (a.type === "reel") router.push(`/property/${a.propertyId}`);
          else if (a.type === "chat") router.push(`/chat/${a.id}`);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  filterBar: { paddingHorizontal: 14, paddingTop: 12 },
  filterPill: { flexDirection: "row", alignSelf: "flex-start", alignItems: "center", gap: 6, backgroundColor: "#22A652", borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16 },
  filterPillText: { color: "white", fontSize: 12, fontWeight: "900" },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyText: { color: "#9ca3af", fontSize: 13, fontWeight: "800" },
  card: { backgroundColor: "white", borderRadius: 16, padding: 14 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  cardTitle: { fontSize: 13, fontWeight: "900", color: "#111827" },
  cardPrice: { fontSize: 12, fontWeight: "900", color: "#22A652" },
  cardLoc: { fontSize: 11.5, color: "#6b7280", marginBottom: 8 },
  specsRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  spec: { fontSize: 10.5, fontWeight: "800", color: "#374151", backgroundColor: "#f3f4f6", borderRadius: 999, paddingVertical: 3, paddingHorizontal: 8 },
  descRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 12 },
  desc: { flex: 1, fontSize: 12, color: "#4b5563", lineHeight: 18 },
  offerBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#22A652", borderRadius: 12, paddingVertical: 11 },
  offerBtnText: { color: "white", fontWeight: "900", fontSize: 12.5 },
  offersCount: { textAlign: "center", fontSize: 10.5, color: "#9ca3af", marginTop: 8 },
});
