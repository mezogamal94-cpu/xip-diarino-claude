import { View, Text, Pressable, Modal, StyleSheet } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { useLanguage } from "../../lib/hooks/useLanguage";

// ↔ #accountDropdown in app-viewer.html. Positioned as a small card, not a
// full modal sheet — top-left-ish anchor matching `.account-dropdown { top:
// 54px; left: 16px }` (kept as literal "left" since that's the icon's fixed
// physical position regardless of RTL, same as the header icons themselves).
//
// Language toggle now reads/writes the real global store (lib/hooks/
// useLanguage.ts) directly instead of taking language/onToggleLanguage as
// props — every screen previously had its own disconnected `useState("ar")`
// that didn't actually share state with anything else.

export type AccountDropdownProps = {
  visible: boolean;
  onClose: () => void;
  notificationsOn: boolean;
  favoritesCount: number;
  onOpenFavorites: () => void;
  onOpenMyAccount: () => void;
  onContactUs: () => void;
  onToggleNotifications: () => void;
  onLogout: () => void;
};

export function AccountDropdown({
  visible, onClose, notificationsOn, favoritesCount,
  onOpenFavorites, onOpenMyAccount, onContactUs, onToggleNotifications, onLogout,
}: AccountDropdownProps) {
  const { language, toggleLanguage, t } = useLanguage();
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.card}>
        <Row
          icon={<GlobeIcon />}
          label={language === "ar" ? "English" : "العربية"}
          onPress={toggleLanguage}
        />
        <Row
          icon={<BookmarkIcon />}
          label={t("المفضلة")}
          badge={favoritesCount > 0 ? favoritesCount : undefined}
          onPress={() => { onOpenFavorites(); onClose(); }}
        />
        <Divider />
        <Row icon={<UserIcon />} label={t("حسابي")} onPress={() => { onOpenMyAccount(); onClose(); }} />
        <Divider />
        <Row icon={<MailIcon />} label={t("تواصل معنا")} onPress={() => { onContactUs(); onClose(); }} />
        <Divider />
        <Row
          icon={<BellIcon />}
          label={t("الإشعارات")}
          toggle={notificationsOn}
          onPress={onToggleNotifications}
        />
        <Divider />
        <Row icon={<LogoutIcon />} label={t("تسجيل خروج")} danger onPress={() => { onLogout(); onClose(); }} />
      </View>
    </Modal>
  );
}

function Row({
  icon, label, onPress, badge, toggle, danger,
}: {
  icon: React.ReactNode; label: string; onPress: () => void; badge?: number; toggle?: boolean; danger?: boolean;
}) {
  return (
    <Pressable style={styles.item} onPress={onPress}>
      {icon}
      <Text style={[styles.itemText, danger && styles.itemTextDanger]}>{label}</Text>
      {badge !== undefined && (
        <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View>
      )}
      {toggle !== undefined && (
        <View style={[styles.toggle, toggle && styles.toggleOn]}>
          <View style={[styles.toggleThumb, toggle && styles.toggleThumbOn]} />
        </View>
      )}
    </Pressable>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const iconProps = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none" as const, stroke: "#6b7280", strokeWidth: 2 };
function GlobeIcon() { return <Svg {...iconProps}><Circle cx={12} cy={12} r={10} /><Path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></Svg>; }
function BookmarkIcon() { return <Svg {...iconProps}><Path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></Svg>; }
function UserIcon() { return <Svg {...iconProps}><Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><Circle cx={12} cy={7} r={4} /></Svg>; }
function MailIcon() { return <Svg {...iconProps}><Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></Svg>; }
function BellIcon() { return <Svg {...iconProps}><Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" /></Svg>; }
function LogoutIcon() { return <Svg {...iconProps} stroke="#991B1B"><Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><Path d="M16 17l5-5-5-5M21 12H9" /></Svg>; }

const styles = StyleSheet.create({
  card: {
    position: "absolute", top: 90, left: 16,
    backgroundColor: "white", borderRadius: 14, minWidth: 240,
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 10,
    borderWidth: 1, borderColor: "#f3f4f6", overflow: "hidden",
  },
  item: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 14 },
  itemText: { fontSize: 13, fontWeight: "700", color: "#374151" },
  itemTextDanger: { color: "#991B1B" },
  divider: { height: 1, backgroundColor: "#e5e7eb", marginHorizontal: 0 },
  badge: { marginLeft: "auto", backgroundColor: "#ef4444", borderRadius: 999, paddingVertical: 2, paddingHorizontal: 7 },
  badgeText: { color: "white", fontSize: 10, fontWeight: "900" },
  toggle: { marginLeft: "auto", width: 36, height: 20, borderRadius: 999, backgroundColor: "#e5e7eb", padding: 2, justifyContent: "center" },
  toggleOn: { backgroundColor: "#22A652" },
  toggleThumb: { width: 16, height: 16, borderRadius: 8, backgroundColor: "white", alignSelf: "flex-start" },
  toggleThumbOn: { alignSelf: "flex-end" },
});
