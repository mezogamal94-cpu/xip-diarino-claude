import { useMemo, useState } from "react";
import { router } from "expo-router";
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, Linking } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { useProperties } from "../../lib/hooks/useProperties";
import { fmtPrice } from "../../lib/types";
import { ReelBackground } from "../../components/reel/ReelBackground";
import { PageTopBar } from "../../components/shared/PageTopBar";
import { SearchFilterModal, SearchFilters, DEFAULT_SEARCH_FILTERS } from "../../components/search/SearchFilterModal";
import { GeoSearchModal, GeoPoint } from "../../components/search/GeoSearchModal";
import { AccountDropdown } from "../../components/account/AccountDropdown";
import { NotificationsDropdown } from "../../components/notifications/NotificationsDropdown";
import { useNotifications } from "../../lib/hooks/useNotifications";
import { useFavorites } from "../../lib/hooks/useFavorites";
import { useLanguage } from "../../lib/hooks/useLanguage";
import { haversineKm } from "../../lib/geo";
import { supabase } from "../../lib/supabase";
import { signOut } from "../../lib/hooks/useAuth";

// ↔ page-search / renderSearchResults() in app-viewer.html.
export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_SEARCH_FILTERS);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [geoModalVisible, setGeoModalVisible] = useState(false);
  const [geoPoint, setGeoPoint] = useState<GeoPoint>(null); // ↔ state.searchFilters.useGeo/userLat/userLng/geoRadiusKm
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const [notifMenuVisible, setNotifMenuVisible] = useState(false);
  const notifications = useNotifications();
  const [notificationsOn, setNotificationsOn] = useState(true);
  const { totalCount: favoritesTotalCount } = useFavorites();
  const { t } = useLanguage();
  const { properties } = useProperties();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = properties.filter((p) => {
      if (filters.purpose !== "all" && p.purpose !== filters.purpose) return false;
      if (filters.type !== "all" && p.type !== filters.type) return false;
      if (filters.provinces.length && !filters.provinces.includes(p.province)) return false;
      if (filters.provinces.length === 1 && filters.regions.length && !filters.regions.includes(p.location)) return false;
      if (p.price < filters.priceMin || p.price > filters.priceMax) return false;
      if (p.area < filters.areaMin || p.area > filters.areaMax) return false;
      if (filters.minRooms && (p.rooms || 0) < filters.minRooms) return false;
      // ↔ the `f.useGeo && f.userLat != null && p.lat != null` guard in renderSearchResults()
      if (geoPoint && p.lat != null && p.lng != null) {
        const dist = haversineKm(geoPoint.lat, geoPoint.lng, p.lat, p.lng);
        if (dist > geoPoint.radiusKm) return false;
      }
      if (q) {
        const hay = `${p.title} ${p.location} ${p.type} ${p.description} ${p.province}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return list;
  }, [properties, query, filters, geoPoint]);

  const activeFilterCount =
    (filters.purpose !== "all" ? 1 : 0) +
    (filters.type !== "all" ? 1 : 0) +
    filters.provinces.length +
    (filters.minRooms > 0 ? 1 : 0) +
    (filters.priceMin > 0 || Number.isFinite(filters.priceMax) ? 1 : 0) +
    (filters.areaMin > 0 || Number.isFinite(filters.areaMax) ? 1 : 0);

  return (
    <View style={styles.container}>
      <PageTopBar
        title="البحث"
        notifBadgeCount={notifications.totalUnread}
        onOpenNotifications={() => setNotifMenuVisible(true)}
        onOpenAccountMenu={() => setAccountMenuVisible(true)}
      />

      <View style={styles.searchBar}>
        <View style={styles.inputWrap}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={2} style={styles.inputIcon}>
            <Circle cx={11} cy={11} r={7} /><Path d="M21 21l-4.3-4.3" />
          </Svg>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder={t("ابحث بالمنطقة، نوع العقار ...")}
            placeholderTextColor="#9ca3af"
          />
        </View>
        <Pressable
          style={[styles.geoBtn, geoPoint && styles.geoBtnActive]}
          onPress={() => setGeoModalVisible(true)}
        >
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={geoPoint ? "white" : "#22A652"} strokeWidth={2}>
            <Circle cx={12} cy={12} r={3} /><Path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </Svg>
        </Pressable>
        <Pressable style={styles.filterBtn} onPress={() => setFilterModalVisible(true)}>
          <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
            <Path d="M4 6h16M7 12h10M10 18h4" />
          </Svg>
          <Text style={styles.filterBtnText}>{t("فلترة")}</Text>
          {activeFilterCount > 0 && (
            <View style={styles.filterCountBadge}><Text style={styles.filterCountText}>{activeFilterCount}</Text></View>
          )}
        </Pressable>
      </View>

      {/* ↔ #geoIndicator */}
      {geoPoint && (
        <View style={styles.geoIndicatorRow}>
          <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#22A652" strokeWidth={2}>
            <Circle cx={12} cy={12} r={3} /><Path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </Svg>
          <Text style={styles.geoIndicatorText}>
            {t("البحث ضمن")} {geoPoint.radiusKm} {t("كم")} {t("من النقطة المحددة")}
          </Text>
          <Pressable onPress={() => setGeoPoint(null)} hitSlop={6}>
            <Text style={styles.geoIndicatorClear}>✕</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 10, paddingHorizontal: 14 }}
        contentContainerStyle={{ gap: 10, paddingTop: 10, paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={1.5}>
              <Circle cx={11} cy={11} r={7} /><Path d="M21 21l-4.3-4.3" />
            </Svg>
            <Text style={styles.emptyText}>{t("لا توجد نتائج")}</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/property/${item.id}`)}>
            <View style={styles.cardMedia}>
              <ReelBackground index={index} type={item.type} />
              <View style={[styles.purposeBadge, { backgroundColor: item.purpose === "sale" ? "#22A652" : "#F4673F" }]}>
                <Text style={styles.purposeBadgeText}>{item.purpose === "sale" ? t("بيع") : t("إيجار")}</Text>
              </View>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardType}>{t(item.type)}</Text>
              <Text style={styles.cardPrice}>{fmtPrice(item.price)} {t("ج.م")} {item.purpose === "rent" ? t("/ شهر") : ""}</Text>
              <Text style={styles.cardLocation} numberOfLines={1}>📍 {t(item.province)} · {t(item.location)}</Text>
              <View style={styles.cardMetaRow}>
                {!!item.rooms && <Text style={styles.cardMeta}>🛏 {item.rooms}</Text>}
                <Text style={styles.cardMeta}>📐 {item.area} {t("م²")}</Text>
              </View>
            </View>
          </Pressable>
        )}
      />

      <SearchFilterModal
        visible={filterModalVisible}
        value={filters}
        onApply={setFilters}
        onClose={() => setFilterModalVisible(false)}
      />

      <GeoSearchModal
        visible={geoModalVisible}
        value={geoPoint}
        onApply={setGeoPoint}
        onClose={() => setGeoModalVisible(false)}
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
  container: { flex: 1, backgroundColor: "white" },
  searchBar: { flexDirection: "row", gap: 8, paddingHorizontal: 14, paddingVertical: 12 },
  inputWrap: { flex: 1, position: "relative", justifyContent: "center" },
  inputIcon: { position: "absolute", left: 12, zIndex: 1 },
  input: { backgroundColor: "#f3f4f6", borderRadius: 12, paddingVertical: 10, paddingLeft: 34, paddingRight: 12, fontSize: 13, color: "#111827" },
  filterBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#22A652", borderRadius: 12, paddingHorizontal: 14, position: "relative" },
  filterBtnText: { color: "white", fontSize: 12, fontWeight: "900" },
  geoBtn: { width: 40, alignItems: "center", justifyContent: "center", backgroundColor: "#ECFDF5", borderRadius: 12, borderWidth: 1, borderColor: "#22A652" },
  geoBtnActive: { backgroundColor: "#22A652" },
  geoIndicatorRow: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#ECFDF5", marginHorizontal: 14, marginBottom: 8, borderRadius: 10, paddingVertical: 7, paddingHorizontal: 10 },
  geoIndicatorText: { flex: 1, fontSize: 11, fontWeight: "800", color: "#065F46" },
  geoIndicatorClear: { color: "#065F46", fontSize: 13, fontWeight: "900" },
  filterCountBadge: { position: "absolute", top: -6, right: -6, backgroundColor: "#ef4444", borderRadius: 999, minWidth: 18, height: 18, alignItems: "center", justifyContent: "center", paddingHorizontal: 4, borderWidth: 2, borderColor: "white" },
  filterCountText: { color: "white", fontSize: 9.5, fontWeight: "900" },
  empty: { alignItems: "center", paddingTop: 70, gap: 10 },
  emptyText: { fontSize: 14, fontWeight: "900", color: "#374151" },
  card: { flex: 1, backgroundColor: "#f9fafb", borderRadius: 14, overflow: "hidden" },
  cardMedia: { height: 120, position: "relative" },
  purposeBadge: { position: "absolute", top: 8, right: 8, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 8 },
  purposeBadgeText: { color: "white", fontSize: 9.5, fontWeight: "900" },
  cardInfo: { padding: 10 },
  cardType: { fontSize: 10.5, fontWeight: "800", color: "#9ca3af", marginBottom: 3 },
  cardPrice: { fontSize: 13.5, fontWeight: "900", color: "#22A652", marginBottom: 4 },
  cardLocation: { fontSize: 10.5, color: "#6b7280", marginBottom: 6 },
  cardMetaRow: { flexDirection: "row", gap: 8 },
  cardMeta: { fontSize: 10, fontWeight: "800", color: "#374151" },
});
