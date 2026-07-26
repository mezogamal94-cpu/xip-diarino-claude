import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import {
  View, Text, ScrollView, Pressable, StyleSheet, Image, Alert, ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Svg, { Path } from "react-native-svg";
import { FormLabel, FormError, FormInput, ChipRow, MultiChipRow, HelpBox } from "../../components/publish/FormControls";
import { ProvinceAutocomplete } from "../../components/publish/ProvinceAutocomplete";
import { MediaItem, Purpose } from "../../lib/types";
import { usePropertyById, useCreateProperty, useUpdateProperty } from "../../lib/hooks/useProperties";
import { useCurrentUser } from "../../lib/hooks/useCurrentUser";
import { useLanguage } from "../../lib/hooks/useLanguage";
import { supabase } from "../../lib/supabase";

const TYPES = ["شقة", "فيلا", "بنتهاوس", "تاون هاوس", "تجاري", "إداري", "طبي", "أرض"];
const FEATURES = [
  "حديقة", "جراج", "أمن وحراسة", "مطبخ مجهز", "مصعد", "حمام سباحة", "تراس",
  "مفروش", "مكيف", "خط أرضي", "عداد كهرباء", "عداد مياه", "عداد غاز طبيعي",
];
const MUSIC_OPTIONS = [
  { key: "Uplifting Corporate", note: "🎵", desc: "موسيقى حماسية" },
  { key: "Chill Lounge", note: "🎶", desc: "هادئة وعصرية" },
  { key: "Acoustic Morning", note: "🎸", desc: "جيتار هادئ" },
  { key: "Oriental Vibes", note: "🪕", desc: "شرقية خفيفة" },
  { key: "Modern Beat", note: "🥁", desc: "إيقاع عصري" },
];

// Deferred from the web version, flagged rather than half-built:
// floor-plan image upload, the separate full-screen preview step
// (openListingPreview/confirmPublishFromPreview), and delivery-date picker
// beyond a plain text field — none change what gets published, just how
// it's reviewed/entered.
export default function CreateListingScreen() {
  const { user } = useCurrentUser();
  const { t } = useLanguage();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const editingAd = usePropertyById(editId);
  const createProperty = useCreateProperty();
  const updateProperty = useUpdateProperty();

  const [purpose, setPurpose] = useState<Purpose | "">("");
  const [type, setType] = useState("");
  const [province, setProvince] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [area, setArea] = useState("");
  const [rooms, setRooms] = useState("");
  const [baths, setBaths] = useState("");
  const [reception, setReception] = useState("");
  const [floor, setFloor] = useState("");
  const [payment, setPayment] = useState<"cash" | "installment" | "">("");
  const [negotiable, setNegotiable] = useState<"yes" | "no" | "">("");
  const [features, setFeatures] = useState<Set<string>>(new Set());
  const [finishType, setFinishType] = useState("");
  const [status, setStatus] = useState<"ready" | "building" | "">("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [shortTitle, setShortTitle] = useState("");
  const [description, setDescription] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [music, setMusic] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  // ↔ editListing() — prefills the same form instead of a separate edit screen.
  useEffect(() => {
    if (!editingAd) return;
    setPurpose(editingAd.purpose);
    setType(editingAd.type);
    setProvince(editingAd.province);
    setLocation(editingAd.location);
    setPrice(String(editingAd.price));
    setArea(String(editingAd.area));
    setRooms(String(editingAd.rooms));
    setBaths(String(editingAd.baths));
    setReception(String(editingAd.reception));
    setFeatures(new Set(editingAd.features));
    setFinishType(editingAd.finishType || "");
    setStatus(editingAd.status || "");
    setDeliveryDate(editingAd.deliveryDate || "");
    setFloor(editingAd.floor != null ? String(editingAd.floor) : "");
    setPayment(editingAd.payment || "");
    setNegotiable(editingAd.negotiable === undefined ? "" : editingAd.negotiable ? "yes" : "no");
    setShortTitle(editingAd.shortTitle || editingAd.title);
    setDescription(editingAd.description);
    setMedia(editingAd.media);
    setMusic(editingAd.music || "");
    setPhone(editingAd.seller.phone);
  }, [editingAd?.id]);

  // ↔ limitWords(this,7)
  function onShortTitleChange(v: string) {
    const words = v.split(/\s+/).filter(Boolean);
    if (words.length > 7) return;
    setShortTitle(v);
  }

  async function pickMedia() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      selectionLimit: 6,
      quality: 0.8,
    });
    if (result.canceled) return;
    const picked: MediaItem[] = result.assets.map((a) => ({
      type: a.type === "video" ? "video" : "image",
      url: a.uri,
    }));
    setMedia((prev) => [...prev, ...picked].slice(0, 6));
  }
  function removeMedia(idx: number) {
    setMedia((prev) => prev.filter((_, i) => i !== idx));
  }

  // ↔ the property-media bucket didn't exist until the storage migration —
  // before that, `media` was saved straight into the property row as local
  // file:// URIs, which only the publisher's own device could ever load.
  // This uploads anything not already an http(s) URL (i.e. anything freshly
  // picked, as opposed to media already uploaded from a previous save when
  // editing) before the property row is written.
  async function uploadLocalMedia(sellerId: string, items: MediaItem[]): Promise<MediaItem[]> {
    const uploaded: MediaItem[] = [];
    for (const item of items) {
      if (/^https?:\/\//.test(item.url)) {
        uploaded.push(item); // already uploaded (editing an existing ad)
        continue;
      }
      const ext = item.url.split(".").pop() || (item.type === "video" ? "mp4" : "jpg");
      const path = `${sellerId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const response = await fetch(item.url);
      const blob = await response.blob();
      const { error } = await supabase.storage.from("property-media").upload(path, blob, {
        contentType: item.type === "video" ? `video/${ext}` : `image/${ext}`,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("property-media").getPublicUrl(path);
      uploaded.push({ type: item.type, url: data.publicUrl });
    }
    return uploaded;
  }

  const hasVideo = media.some((m) => m.type === "video");

  function validate(): boolean {
    const errs = new Set<string>();
    if (!purpose) errs.add("purpose");
    if (!type) errs.add("type");
    if (!province) errs.add("province");
    if (!location.trim()) errs.add("location");
    if (!price || Number(price) <= 0) errs.add("price");
    if (!area || Number(area) <= 0) errs.add("area");
    if (rooms === "") errs.add("rooms");
    if (baths === "") errs.add("baths");
    if (reception === "") errs.add("reception");
    if (floor === "") errs.add("floor");
    if (!payment) errs.add("payment");
    if (!negotiable) errs.add("negotiable");
    if (!status) errs.add("status");
    if (!shortTitle.trim()) errs.add("shortTitle");
    if (!description.trim()) errs.add("description");
    if (!hasVideo) errs.add("media"); // ↔ "الفيديو مطلوب"
    if (!music) errs.add("music");
    if (!phone.trim() || phone.trim().length < 8) errs.add("phone");
    setErrors(errs);
    return errs.size === 0;
  }

  async function submit() {
    if (!validate()) return;
    if (!user) return;

    setSubmitting(true);
    try {
      const uploadedMedia = await uploadLocalMedia(user.id, media);

      const adFields = {
        purpose: purpose as Purpose,
        type,
        title: shortTitle.trim(),
        shortTitle: shortTitle.trim(),
        province,
        location: location.trim(),
        price: Number(price),
        area: Number(area),
        rooms: Number(rooms),
        baths: Number(baths),
        reception: Number(reception),
        floor: Number(floor),
        payment: payment as "cash" | "installment",
        negotiable: negotiable === "yes",
        finishType: finishType.trim() || undefined,
        status: status as "ready" | "building",
        deliveryDate: status === "building" ? deliveryDate.trim() || undefined : undefined,
        features: Array.from(features),
        description: description.trim(),
        media: uploadedMedia,
        coverImage: uploadedMedia.find((m) => m.type === "image")?.url ?? null,
        music: music || null,
      };

      // Phone lives on the user's profile row now (shared across all their
      // listings), not copied onto every property like the old mock seller
      // object did — keep it in sync with whatever's in the form.
      if (phone.trim()) {
        await supabase.from("profiles").upsert({ id: user.id, phone: phone.trim() });
      }

      if (editingAd) {
        // ↔ editListing()'s save path — keeps id/stats/seller/createdAt as-is.
        await updateProperty.mutateAsync({ id: editingAd.id, patch: adFields });
      } else {
        await createProperty.mutateAsync({ ...adFields, sellerId: user.id });
      }

      router.replace({ pathname: "/(tabs)/account", params: { tab: "ads" } });
    } catch (err) {
      Alert.alert(t("تعذر نشر الإعلان"), t("حاول مرة أخرى."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.closeBtn} onPress={() => router.back()} hitSlop={8}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth={2}><Path d="M18 6L6 18M6 6l12 12" /></Svg>
        </Pressable>
        <Text style={styles.headerTitle}>{editingAd ? t("تعديل الإعلان") : t("انشر عقارك")}</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        <HelpBox title="🎥 وسائط الإعلان">
          الفيديو مطلوب لعرض إعلانك في الريلز. يمكنك إضافة صورة واحدة لتكون الواجهة في صفحة البحث.
        </HelpBox>

        <FormLabel text="الغرض من الإعلان" required />
        <ChipRow options={["sale", "rent"]} value={purpose} onChange={setPurpose} labels={{ sale: "للبيع", rent: "للإيجار" }} />
        <FormError text="من فضلك اختر الغرض" show={errors.has("purpose")} />

        <FormLabel text="نوع العقار" required />
        <ChipRow options={TYPES} value={type} onChange={setType} />
        <FormError text="من فضلك اختر نوع العقار" show={errors.has("type")} />

        <FormLabel text="المحافظة" required />
        <ProvinceAutocomplete value={province} onChange={setProvince} error={errors.has("province")} />
        <FormError text="من فضلك اختر المحافظة" show={errors.has("province")} />

        <FormLabel text="المنطقة / الحي / الكمبوند" required />
        <FormInput value={location} onChangeText={setLocation} placeholder="مثال: الشيخ زايد، كمبوند بالم هيلز ..." error={errors.has("location")} />
        <FormError text="من فضلك أدخل المنطقة" show={errors.has("location")} />

        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <FormLabel text="السعر (ج.م)" required />
            <FormInput value={price} onChangeText={setPrice} placeholder="3500000" keyboardType="number-pad" error={errors.has("price")} />
            <FormError text="من فضلك أدخل السعر" show={errors.has("price")} />
          </View>
          <View style={{ flex: 1 }}>
            <FormLabel text="المساحة (م²)" required />
            <FormInput value={area} onChangeText={setArea} placeholder="180" keyboardType="number-pad" error={errors.has("area")} />
            <FormError text="من فضلك أدخل المساحة" show={errors.has("area")} />
          </View>
        </View>

        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <FormLabel text="عدد الغرف" required />
            <FormInput value={rooms} onChangeText={setRooms} placeholder="3" keyboardType="number-pad" error={errors.has("rooms")} />
          </View>
          <View style={{ flex: 1 }}>
            <FormLabel text="عدد الحمامات" required />
            <FormInput value={baths} onChangeText={setBaths} placeholder="2" keyboardType="number-pad" error={errors.has("baths")} />
          </View>
        </View>

        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <FormLabel text="الريسبشن" required />
            <FormInput value={reception} onChangeText={setReception} placeholder="2" keyboardType="number-pad" error={errors.has("reception")} />
          </View>
          <View style={{ flex: 1 }}>
            <FormLabel text="رقم الطابق" required />
            <FormInput value={floor} onChangeText={setFloor} placeholder="3" keyboardType="number-pad" error={errors.has("floor")} />
          </View>
        </View>
        <Text style={styles.hint}>💡 رقم الطابق (0 = أرضي)</Text>

        <FormLabel text="طريقة الدفع" required />
        <ChipRow options={["cash", "installment"]} value={payment} onChange={setPayment} labels={{ cash: "كاش", installment: "قسط" }} />
        <FormError text="من فضلك اختر طريقة الدفع" show={errors.has("payment")} />

        <FormLabel text="السعر قابل للتفاوض" required />
        <ChipRow options={["yes", "no"]} value={negotiable} onChange={setNegotiable} labels={{ yes: "نعم", no: "لا" }} />
        <FormError text="من فضلك اختر" show={errors.has("negotiable")} />

        <FormLabel text="الكماليات والمرافق" />
        <MultiChipRow
          options={FEATURES.map((f) => ({ key: f, label: f }))}
          values={features}
          onToggle={(k) => setFeatures((prev) => { const next = new Set(prev); next.has(k) ? next.delete(k) : next.add(k); return next; })}
        />

        <FormLabel text="نوع التشطيب" optional />
        <FormInput value={finishType} onChangeText={setFinishType} placeholder="بدون تشطيب / نص تشطيب / لوكس / سوبر لوكس ..." />

        <FormLabel text="حالة العقار" required />
        <ChipRow options={["ready", "building"]} value={status} onChange={setStatus} labels={{ ready: "جاهز للتسليم", building: "قيد الإنشاء" }} />
        <FormError text="من فضلك اختر حالة العقار" show={errors.has("status")} />

        {status === "building" && (
          <>
            <FormLabel text="تاريخ التسليم المتوقع" optional />
            <FormInput value={deliveryDate} onChangeText={setDeliveryDate} placeholder="2027-06-30" />
          </>
        )}

        <FormLabel text="عنوان الإعلان (بحد أقصى 7 كلمات)" required />
        <FormInput value={shortTitle} onChangeText={onShortTitleChange} placeholder="مثال: شقة فاخرة بموقع مميز" maxLength={80} error={errors.has("shortTitle")} />
        <FormError text="أدخل عنوان مختصر (حتى 7 كلمات)" show={errors.has("shortTitle")} />

        <FormLabel text="الوصف" required />
        <FormInput value={description} onChangeText={setDescription} placeholder="اكتب وصف تفصيلي ..." multiline numberOfLines={4} style={{ minHeight: 90, textAlignVertical: "top" }} error={errors.has("description")} />
        <FormError text="من فضلك أدخل الوصف" show={errors.has("description")} />

        <FormLabel text="فيديو وصور العقار (فيديو مطلوب)" required />
        <View style={styles.mediaGrid}>
          {media.map((m, i) => (
            <View key={i} style={styles.mediaCell}>
              {m.type === "image" ? (
                <Image source={{ uri: m.url }} style={StyleSheet.absoluteFill} />
              ) : (
                <View style={[StyleSheet.absoluteFill, styles.videoCell]}>
                  <Text style={styles.videoCellText}>🎬</Text>
                </View>
              )}
              <Pressable style={styles.mediaRemove} onPress={() => removeMedia(i)}>
                <Text style={styles.mediaRemoveText}>×</Text>
              </Pressable>
            </View>
          ))}
          {media.length < 6 && (
            <Pressable style={styles.mediaAdd} onPress={pickMedia}>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#22A652" strokeWidth={2}><Path d="M12 5v14M5 12h14" /></Svg>
            </Pressable>
          )}
        </View>
        <FormError text="يجب رفع فيديو للإعلان" show={errors.has("media")} />

        <FormLabel text="موسيقى الإعلان" required />
        <View style={{ gap: 8 }}>
          {MUSIC_OPTIONS.map((m) => (
            <Pressable
              key={m.key}
              style={[styles.musicItem, music === m.key && styles.musicItemActive]}
              onPress={() => setMusic(m.key)}
            >
              <Text style={styles.musicNote}>{m.note}</Text>
              <Text style={styles.musicText}>{m.key} — {t(m.desc)}</Text>
            </Pressable>
          ))}
        </View>
        <FormError text="من فضلك اختر موسيقى بدون حقوق نشر" show={errors.has("music")} />

        <FormLabel text="رقم التواصل (واتساب)" required />
        <FormInput value={phone} onChangeText={setPhone} placeholder="01xxxxxxxxx" keyboardType="phone-pad" error={errors.has("phone")} />
        <FormError text="من فضلك أدخل رقم صحيح" show={errors.has("phone")} />
      </ScrollView>

      <View style={styles.submitBar}>
        <Pressable style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={submit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.submitBtnText}>{editingAd ? t("حفظ") : t("نشر الإعلان")}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  header: { paddingTop: 50, paddingBottom: 12, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 14, fontWeight: "900", color: "#111827" },
  row2: { flexDirection: "row", gap: 12 },
  hint: { fontSize: 10.5, color: "#9ca3af", marginTop: 4 },
  mediaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  mediaCell: { width: 84, height: 84, borderRadius: 10, overflow: "hidden", backgroundColor: "#f3f4f6" },
  videoCell: { alignItems: "center", justifyContent: "center", backgroundColor: "#111827" },
  videoCellText: { fontSize: 22 },
  mediaRemove: { position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center" },
  mediaRemoveText: { color: "white", fontSize: 13, fontWeight: "900", marginTop: -1 },
  mediaAdd: { width: 84, height: 84, borderRadius: 10, borderWidth: 1.5, borderColor: "#22A652", borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
  musicItem: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#f9fafb", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#f3f4f6" },
  musicItemActive: { borderColor: "#22A652", backgroundColor: "#ECFDF5" },
  musicNote: { fontSize: 16 },
  musicText: { fontSize: 12.5, fontWeight: "700", color: "#374151" },
  submitBar: { padding: 14, paddingBottom: 26, borderTopWidth: 1, borderTopColor: "#f3f4f6", backgroundColor: "white" },
  submitBtn: { backgroundColor: "#22A652", borderRadius: 14, paddingVertical: 15, alignItems: "center" },
  submitBtnDisabled: { backgroundColor: "#8fcaa6" },
  submitBtnText: { color: "white", fontWeight: "900", fontSize: 14 },
});
