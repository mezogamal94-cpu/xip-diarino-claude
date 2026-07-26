import { View, Text, Pressable, StyleSheet } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { Seller } from "../../lib/types";

// ↔ .reel-side-actions (left:10px on RTL page, so on native — which we
// force to RTL globally — this rail sits on the right in physical space,
// same as web). Buttons top-to-bottom: search, seller avatar+follow, like, share, save.

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill={filled ? "#ef4444" : "none"} stroke="white" strokeWidth={2}>
      <Path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" />
    </Svg>
  );
}

function ShareIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Circle cx={18} cy={5} r={3} />
      <Circle cx={6} cy={12} r={3} />
      <Circle cx={18} cy={19} r={3} />
      <Path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
    </Svg>
  );
}

function SaveIcon({ filled }: { filled: boolean }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill={filled ? "#FBBF24" : "none"} stroke={filled ? "#FBBF24" : "white"} strokeWidth={2}>
      <Path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
    </Svg>
  );
}

function SearchGlyph() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
      <Circle cx={11} cy={11} r={7} />
      <Path d="M21 21l-4.3-4.3" />
    </Svg>
  );
}

function FollowGlyph({ following }: { following: boolean }) {
  return following ? (
    <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}>
      <Path d="M5 12l5 5L20 7" />
    </Svg>
  ) : (
    <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}>
      <Path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

// ↔ getSellerAvatarHtml() — for now only the "not me" branch (gradient +
// initial); the "me with custom avatar" branch comes back once account/
// profile photo upload is ported.
function SellerAvatar({ seller, size = 38 }: { seller: Seller; size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={{ color: "white", fontWeight: "900", fontSize: Math.floor(size * 0.45) }}>{seller.initial}</Text>
    </View>
  );
}

type Props = {
  seller: Seller;
  likes: number;
  liked: boolean;
  saved: boolean;
  following: boolean;
  onOpenSearch: () => void;
  onOpenSeller: () => void;
  onToggleFollow: () => void;
  onToggleLike: () => void;
  onShare: () => void;
  onToggleSave: () => void;
};

export function ReelActionRail({
  seller, likes, liked, saved, following,
  onOpenSearch, onOpenSeller, onToggleFollow, onToggleLike, onShare, onToggleSave,
}: Props) {
  return (
    <View style={styles.rail}>
      <Pressable style={styles.actionBtn} onPress={onOpenSearch} hitSlop={8}>
        <SearchGlyph />
      </Pressable>

      <Pressable style={styles.actionBtn} onPress={onOpenSeller} hitSlop={8}>
        <View style={{ position: "relative" }}>
          <SellerAvatar seller={seller} />
          <Pressable
            style={[styles.followBadge, following && styles.followBadgeActive]}
            onPress={onToggleFollow}
            hitSlop={8}
          >
            <FollowGlyph following={following} />
          </Pressable>
        </View>
      </Pressable>

      <Pressable style={styles.actionBtn} onPress={onToggleLike} hitSlop={8}>
        <HeartIcon filled={liked} />
        <Text style={styles.actionLabel}>{likes}</Text>
      </Pressable>

      <Pressable style={styles.actionBtn} onPress={onShare} hitSlop={8}>
        <ShareIcon />
      </Pressable>

      <Pressable style={styles.actionBtn} onPress={onToggleSave} hitSlop={8}>
        <SaveIcon filled={saved} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // .reel-side-actions
  rail: {
    position: "absolute",
    right: 10, // RTL-forced app, mirrors web's `html[dir="ltr"] { right: 10px }` rule inverted
    bottom: 80,
    alignItems: "center",
    gap: 16,
    zIndex: 45,
  },
  actionBtn: { alignItems: "center", gap: 3 },
  actionLabel: {
    color: "white",
    fontSize: 11,
    fontWeight: "900",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  avatar: {
    backgroundColor: "#22A652", // gradient(#22A652,#1E9449) approximated as flat — swap to expo-linear-gradient if needed
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  followBadge: {
    position: "absolute",
    bottom: -6,
    left: "50%",
    marginLeft: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#22A652",
    borderWidth: 2,
    borderColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  followBadgeActive: { backgroundColor: "#3b82f6" },
});
