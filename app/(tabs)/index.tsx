import { useCallback, useMemo, useRef, useState } from "react";
import { router } from "expo-router";
import { View, FlatList, StyleSheet, ViewToken, useWindowDimensions, Share, Linking } from "react-native";
import { useProperties } from "../../lib/hooks/useProperties";
import { fmtPrice } from "../../lib/types";
import { ReelCard } from "../../components/reel/ReelCard";
import { ReelsHeader } from "../../components/reel/ReelsHeader";
import { ReelFilterModal, ReelFilter } from "../../components/reel/ReelFilterModal";
import { AccountDropdown } from "../../components/account/AccountDropdown";
import { NotificationsDropdown } from "../../components/notifications/NotificationsDropdown";
import { useNotifications } from "../../lib/hooks/useNotifications";
import { useFavorites } from "../../lib/hooks/useFavorites";
import { supabase } from "../../lib/supabase";
import { signOut } from "../../lib/hooks/useAuth";

const TAB_BAR_HEIGHT = 64;

// ↔ getOrderedReels() sorts by engagementScore then shuffles the rest.
// Deferred: real engagement-based ordering + shuffle, and the `lives`
// row prepended to the feed (renderLiveReel) — comes with wiring live
// discovery into the feed itself (separate from the live screens already built).
export default function ReelsScreen() {
  const { height: windowHeight } = useWindowDimensions();
  const reelHeight = windowHeight - TAB_BAR_HEIGHT;

  const { properties } = useProperties();
  const [activeIndex, setActiveIndex] = useState(0);

  // ↔ state.followedSellers (still local — only affects the reels feed UI,
  // no cross-tab consumer like favorites has)
  const [followedSellers, setFollowedSellers] = useState<Set<string>>(new Set());
  const { favoriteProperties, toggleFavoriteProperty, totalCount: favoritesTotalCount } = useFavorites();

  // ↔ reelProvinceFilters / reelRegionFilters
  const [filter, setFilter] = useState<ReelFilter>({ provinces: [], regions: [] });
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const [notifMenuVisible, setNotifMenuVisible] = useState(false);
  const notifications = useNotifications();
  const [notificationsOn, setNotificationsOn] = useState(true);

  const filteredProperties = useMemo(() => {
    if (filter.provinces.length === 0) return properties;
    let list = properties.filter((p) => filter.provinces.includes(p.province));
    if (filter.provinces.length === 1 && filter.regions.length > 0) {
      list = list.filter((p) => filter.regions.includes(p.location));
    }
    return list;
  }, [properties, filter]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const toggleFollow = useCallback((sellerId: string) => {
    setFollowedSellers((prev) => {
      const next = new Set(prev);
      next.has(sellerId) ? next.delete(sellerId) : next.add(sellerId);
      return next;
    });
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredProperties}
        keyExtractor={(p) => p.id}
        renderItem={({ item, index }) => (
          <ReelCard
            property={item}
            index={index}
            isActive={index === activeIndex}
            isFollowing={followedSellers.has(item.seller.id)}
            isFavorite={favoriteProperties.has(item.id)}
            onOpenDetails={() => router.push(`/property/${item.id}`)}
            onOpenSearch={() => router.push("/(tabs)/search")}
            onOpenSeller={() => router.push(`/seller/${item.seller.id}`)}
            onToggleFollow={() => toggleFollow(item.seller.id)}
            onToggleFavorite={() => toggleFavoriteProperty(item.id)}
            onShare={() => {
              // ↔ shareProperty()/openShareModal() — the original built a
              // custom share sheet with a copy-link box + social icons.
              // The OS's native share sheet (Share.share) covers the same
              // job on mobile and is the more idiomatic pattern here, so
              // we use that instead of reproducing the custom modal.
              Share.share({
                message: `${item.title} — ${fmtPrice(item.price)} ج.م\nhttps://diartok.app/property/${item.id}`,
              });
            }}
          />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={reelHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        getItemLayout={(_, index) => ({ length: reelHeight, offset: reelHeight * index, index })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
      <ReelsHeader
        onOpenFilter={() => setFilterModalVisible(true)}
        onOpenNotifications={() => setNotifMenuVisible(true)}
        onOpenAccountMenu={() => setAccountMenuVisible(true)}
        notifBadgeCount={notifications.totalUnread}
      />

      <ReelFilterModal
        visible={filterModalVisible}
        value={filter}
        onApply={setFilter}
        onClose={() => setFilterModalVisible(false)}
      />

      <AccountDropdown
        visible={accountMenuVisible}
        onClose={() => setAccountMenuVisible(false)}
        notificationsOn={notificationsOn}
        favoritesCount={favoritesTotalCount}
        onOpenFavorites={() => router.push({ pathname: "/(tabs)/account", params: { tab: "favorites" } })}
        onOpenMyAccount={() => router.push("/(tabs)/account")}
        onContactUs={() => {
          // ↔ contactUs() — same support number as the web version
          Linking.openURL("https://wa.me/201117107131");
        }}
        onToggleNotifications={() => setNotificationsOn((v) => !v)}
        onLogout={() => {
          signOut();
          router.replace("/");
        }}
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
          // ↔ handleNotifClick() — routes by action.type. `chat` has no
          // destination screen yet, so it's still a TODO; the other three
          // (reel/seller/property) all resolve to real screens now.
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
  container: { flex: 1, backgroundColor: "#000" },
});
