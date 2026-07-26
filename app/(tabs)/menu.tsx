import { useState } from "react";
import { router } from "expo-router";
import { View, Text, Pressable, ScrollView, StyleSheet, Linking } from "react-native";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { PageTopBar } from "../../components/shared/PageTopBar";
import { AccountDropdown } from "../../components/account/AccountDropdown";
import { NotificationsDropdown } from "../../components/notifications/NotificationsDropdown";
import { useNotifications } from "../../lib/hooks/useNotifications";
import { useFavorites } from "../../lib/hooks/useFavorites";
import { useLanguage } from "../../lib/hooks/useLanguage";
import { supabase } from "../../lib/supabase";
import { signOut } from "../../lib/hooks/useAuth";

// ↔ page-menu / openExternalService() in app-viewer.html. The external
// service cards (legal/ads/repoo/crane) all just deep-link to WhatsApp with
// a pre-filled message — ported 1:1, same support number and message text.
const SUPPORT_PHONE = "201117107131";

function waLink(message: string) {
  return `https://wa.me/${SUPPORT_PHONE}?text=${encodeURIComponent(message)}`;
}

export default function MenuScreen() {
  const { t } = useLanguage();
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const [notifMenuVisible, setNotifMenuVisible] = useState(false);
  const notifications = useNotifications();
  const [notificationsOn, setNotificationsOn] = useState(true);
  const { totalCount: favoritesTotalCount } = useFavorites();

  return (
    <View style={styles.container}>
      <PageTopBar
        title="القائمة"
        notifBadgeCount={notifications.totalUnread}
        onOpenNotifications={() => setNotifMenuVisible(true)}
        onOpenAccountMenu={() => setAccountMenuVisible(true)}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Card
          color="#1e293b"
          title="ابحث عن عقار"
          subtitle="اشترِ واستأجر بسهولة"
          icon={<Svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8}><Circle cx={11} cy={11} r={7} /><Path d="M21 21l-4.3-4.3" /></Svg>}
          onPress={() => router.push("/(tabs)/search")}
        />

        <View style={styles.row}>
          <Card
            flex color="#22A652"
            title="انشر عقارك" subtitle="بدون أي رسوم"
            icon={<Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8}><Path d="M12 5v14M5 12h14" /></Svg>}
            onPress={() => router.push("/publish/create-listing")}
          />
          <Card
            flex color="#0ea5e9"
            title="اطلب عقارك" subtitle="والعروض توصلك"
            icon={<Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8}><Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></Svg>}
            onPress={() => router.push("/publish/create-request")}
          />
        </View>

        <View style={styles.protectRow}>
          <Card
            flex color="#722F37"
            title="احمي نفسك" subtitle="خدمات قانونية متخصصة للعقارات"
            icon={<Svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke="#FDE047" strokeWidth={1.6}><Path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" /></Svg>}
            waMessage="مرحباً، أرغب في الاستفسار عن خدمة الاستشارات القانونية للعقارات (احمي نفسك) من تطبيق ديار توك"
            onPress={() => Linking.openURL(waLink("مرحباً، أرغب في الاستفسار عن خدمة الاستشارات القانونية للعقارات (احمي نفسك) من تطبيق ديار توك"))}
          />
          <Pressable style={styles.liveBtn} onPress={() => router.push("/live/broadcast")}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
              <Rect x={2} y={7} width={20} height={14} rx={2} /><Path d="M8 2l4 4 4-4" />
            </Svg>
            <Text style={styles.liveBtnText}>{t("اطلع لايف")}</Text>
          </Pressable>
        </View>

        <Card
          color="#F59E0B" small
          title="مساحة اعلانية — اعرض هنا"
          waMessage="مرحباً، أرغب في حجز مساحة إعلانية داخل تطبيق ديار توك"
          onPress={() => Linking.openURL(waLink("مرحباً، أرغب في حجز مساحة إعلانية داخل تطبيق ديار توك"))}
        />

        <View style={styles.row}>
          <Card
            flex color="#334155"
            title="Repoo" subtitle="تشطيبات وديكور"
            icon={<Svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8}><Path d="M3 21h18M5 21V8l7-4 7 4v13" /></Svg>}
            onPress={() => Linking.openURL(waLink("مرحباً، أرغب في الاستفسار عن خدمات التشطيب والديكور (Repoo) من تطبيق ديار توك"))}
          />
          <Card
            flex color="#7c2d12"
            title="ونش ونقل أثاث" subtitle="عرض سعر فوري"
            icon={<Svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8}><Path d="M3 17h4V7H3zM7 17h10l3-5h-6l-2-4H9v9z" /><Circle cx={7} cy={19} r={1.5} /><Circle cx={17} cy={19} r={1.5} /></Svg>}
            onPress={() => Linking.openURL(waLink("مرحباً، أرغب في طلب خدمة ونش ونقل الأثاث من تطبيق ديار توك"))}
          />
        </View>
      </ScrollView>

      <AccountDropdown
        visible={accountMenuVisible}
        onClose={() => setAccountMenuVisible(false)}
        notificationsOn={notificationsOn}
        favoritesCount={favoritesTotalCount}
        onOpenFavorites={() => router.push({ pathname: "/(tabs)/account", params: { tab: "favorites" } })}
        onOpenMyAccount={() => router.push("/(tabs)/account")}
        onContactUs={() => Linking.openURL(waLink("مرحباً"))}
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

function Card({
  color, title, subtitle, icon, onPress, flex, small,
}: {
  color: string; title: string; subtitle?: string; icon?: React.ReactNode; onPress: () => void; flex?: boolean; small?: boolean; waMessage?: string;
}) {
  const { t } = useLanguage();
  return (
    <Pressable
      style={[
        styles.card,
        { backgroundColor: color },
        flex && { flex: 1 },
        small && styles.cardSmall,
      ]}
      onPress={onPress}
    >
      {icon}
      <View style={icon ? { marginTop: 8 } : undefined}>
        <Text style={[styles.cardTitle, small && styles.cardTitleSmall]}>{t(title)}</Text>
        {!!subtitle && <Text style={styles.cardSubtitle}>{t(subtitle)}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  scroll: { padding: 14, gap: 10 },
  row: { flexDirection: "row", gap: 10 },
  protectRow: { flexDirection: "row", gap: 10, alignItems: "stretch" },
  card: { borderRadius: 16, padding: 16, minHeight: 100, justifyContent: "center" },
  cardSmall: { minHeight: 64, alignItems: "center", justifyContent: "center" },
  cardTitle: { color: "white", fontWeight: "900", fontSize: 15 },
  cardTitleSmall: { fontSize: 13, textAlign: "center" },
  cardSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 11.5, marginTop: 3 },
  liveBtn: {
    width: 90, borderRadius: 16, backgroundColor: "#ef4444",
    alignItems: "center", justifyContent: "center", gap: 6,
  },
  liveBtnText: { color: "white", fontSize: 11, fontWeight: "900" },
});
