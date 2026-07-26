import { useState } from "react";
import { router } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import { FormLabel, FormError, FormInput, ChipRow, HelpBox } from "../../components/publish/FormControls";
import { ProvinceAutocomplete } from "../../components/publish/ProvinceAutocomplete";
import { useCreateRequest } from "../../lib/hooks/useRequests";
import { useCurrentUser } from "../../lib/hooks/useCurrentUser";
import { useLanguage } from "../../lib/hooks/useLanguage";

const TYPES = ["شقة", "فيلا", "بنتهاوس", "تاون هاوس", "تجاري", "إداري", "طبي", "أرض"];

export default function CreateRequestScreen() {
  const { user } = useCurrentUser();
  const { t } = useLanguage();
  const createRequest = useCreateRequest();
  const [purpose, setPurpose] = useState<"sale" | "rent" | "">("");
  const [type, setType] = useState("");
  const [province, setProvince] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [area, setArea] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<Set<string>>(new Set());

  function validate(): boolean {
    const errs = new Set<string>();
    if (!purpose) errs.add("purpose");
    if (!type) errs.add("type");
    if (!province) errs.add("province");
    if (!location.trim()) errs.add("location");
    if (!description.trim()) errs.add("description");
    if (!name.trim()) errs.add("name");
    setErrors(errs);
    return errs.size === 0;
  }

  function submit() {
    if (!validate()) return;
    if (!user) return;

    createRequest.mutate({
      purpose: purpose as "sale" | "rent",
      type,
      province,
      location: location.trim(),
      priceMax: price ? Number(price) : 0,
      area: area || "",
      rooms: "",
      baths: "",
      description: description.trim(),
      requesterName: name.trim(),
      requesterId: user.id,
    });

    router.replace({ pathname: "/(tabs)/account", params: { tab: "requests" } });
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.closeBtn} onPress={() => router.back()} hitSlop={8}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth={2}><Path d="M18 6L6 18M6 6l12 12" /></Svg>
        </Pressable>
        <Text style={styles.headerTitle}>{t("اطلب عقارك")}</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        <HelpBox title="كيف تعمل صفحة الطلبات؟">
          اكتب وصف ما تبحث عنه، وسيتواصل معك البائعون بعروضهم عبر الشات.
        </HelpBox>

        <FormLabel text="الغرض" required />
        <ChipRow options={["sale", "rent"]} value={purpose} onChange={setPurpose} labels={{ sale: "أريد الشراء", rent: "أريد الإيجار" }} />
        <FormError text="من فضلك اختر الغرض" show={errors.has("purpose")} />

        <FormLabel text="نوع العقار" required />
        <ChipRow options={TYPES} value={type} onChange={setType} />
        <FormError text="من فضلك اختر نوع العقار" show={errors.has("type")} />

        <FormLabel text="المحافظة" required />
        <ProvinceAutocomplete value={province} onChange={setProvince} error={errors.has("province")} />
        <FormError text="من فضلك اختر المحافظة" show={errors.has("province")} />

        <FormLabel text="المنطقة / الكمبوند" required />
        <FormInput value={location} onChangeText={setLocation} placeholder="مثال: الحي 16، كمبوند ..." error={errors.has("location")} />
        <FormError text="من فضلك أدخل المنطقة" show={errors.has("location")} />

        <FormLabel text="الوصف" required />
        <FormInput value={description} onChangeText={setDescription} placeholder="اكتب تفاصيل ما تبحث عنه ..." multiline numberOfLines={4} style={{ minHeight: 90, textAlignVertical: "top" }} error={errors.has("description")} />
        <FormError text="من فضلك أدخل الوصف" show={errors.has("description")} />

        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <FormLabel text="السعر حتى (ج.م)" optional />
            <FormInput value={price} onChangeText={setPrice} placeholder="4000000" keyboardType="number-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <FormLabel text="المساحة (م²)" optional />
            <FormInput value={area} onChangeText={setArea} placeholder="150" keyboardType="number-pad" />
          </View>
        </View>

        <FormLabel text="اسمك" required />
        <FormInput value={name} onChangeText={setName} placeholder="مثال: محمود علي" error={errors.has("name")} />
        <FormError text="من فضلك أدخل اسمك" show={errors.has("name")} />
      </ScrollView>

      <View style={styles.submitBar}>
        <Pressable style={styles.submitBtn} onPress={submit}>
          <Text style={styles.submitBtnText}>{t("نشر الطلب")}</Text>
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
  submitBar: { padding: 14, paddingBottom: 26, borderTopWidth: 1, borderTopColor: "#f3f4f6", backgroundColor: "white" },
  submitBtn: { backgroundColor: "#4338CA", borderRadius: 14, paddingVertical: 15, alignItems: "center" },
  submitBtnText: { color: "white", fontWeight: "900", fontSize: 14 },
});
