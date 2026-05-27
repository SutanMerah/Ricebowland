import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Image,
  Platform,
  Linking, // 🚀 Tambahan untuk deteksi Web vs Mobile
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/components/system/AuthContext";
import { ArrowLeft, Check, CreditCard, Banknote, ShieldAlert, UploadCloud } from "lucide-react-native";
import { spacing, radius } from "@/components/system";
import * as ImagePicker from "expo-image-picker"; 
import * as ImageManipulator from "expo-image-manipulator";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { theme } from "@/constants/theme";
import { API_BASE_URL } from "@/lib/api";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface InvoiceData {
  id: number;
  invoice_code: string;
  total_amount: number;
}

export default function PurchasingPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const c = theme.colors;

  const cartItems: CartItem[] = params.cart ? JSON.parse(params.cart as string) : [];
  const { user } = useAuth();

  // --- STATE MANAGEMENT ---
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [purchaseType, setPurchaseType] = useState<"transfer" | "cod">("cod");
  
  // State Isolasi
  const [step, setStep] = useState<"form" | "qris" | "waiting">("form");
  const [currentInvoice, setCurrentInvoice] = useState<InvoiceData | null>(null);
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  
  // State Upload Bukti Transfer
  const [paymentProof, setPaymentProof] = useState<string | null>(null);
  const [paymentProofName, setPaymentProofName] = useState<string | null>(null); // 🚀 Tambahan nama file

  const getSubtotal = () => cartItems.reduce((t, i) => t + i.price * i.quantity, 0);
  const formatIDR = (price: number) => `Rp ${price.toLocaleString("id-ID")}`;

  // 🚀 FUNGSI BARU: Memilih Gambar Bukti Transfer
  const pickImage = async () => {
    // 1. Ambil gambar dari galeri dengan kualitas penuh dulu agar tidak pecah saat di-resize
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1, 
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      
      try {
        // 2. 🚀 SAYA MENAMBAHKAN PROSES KOMPRESI SUPER KUAT
        // Mengubah lebar gambar menjadi maks 1000px (tinggi otomatis mengikuti aspek rasio)
        // Sekaligus menurunkan kualitas biner gambar ke 60%
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 1000 } }], 
          { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG } 
        );

        // 3. Simpan hasil kompresi yang sudah sangat ringan (kisaran 100KB - 250KB) ke State
        setPaymentProof(manipulatedImage.uri);
        
        // Tetap gunakan fallback nama file dari asset asli milik ImagePicker
        setPaymentProofName(asset.fileName || `proof_${Date.now()}.jpg`);

      } catch (compressError) {
        console.error("Gagal mengompres gambar:", compressError);
        
        // Fallback aman: Jika kompresi mendadak gagal, tetap pakai file asli picker agar aplikasi tidak crash
        setPaymentProof(asset.uri);
        setPaymentProofName(asset.fileName || `proof_${Date.now()}.jpg`);
      }
    }
  };

  const handleConfirmOrder = async () => {
    if (!phoneNumber) {
      alert("Nomor Handphone wajib diisi untuk koordinasi pengantaran.");
      return;
    }

    const sendingUserId = user?.id || 1;

    // --- ALUR STAGING INVOICE (TRANSFER) ---
    if (purchaseType === "transfer") {
      try {
        const payload = {
          user_id: Number(sendingUserId),
          customer_name: customerName,
          phone_number: phoneNumber,
          notes: notes,
          subtotal: getSubtotal(),
          cart_items: cartItems, 
        };

        const res = await fetch(`${API_BASE_URL}/invoices/stage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("Gagal menginisiasi pembayaran transfer.");
        const result = await res.json();
        
        setCurrentInvoice(result.data);
        setStep("qris"); 
      } catch (error: any) {
        alert(error.message);
      }
      return;
    }

    // --- ALUR COD ---
    try {
      const orderPromises = cartItems.map(async (item) => {
        const payload = {
          user_id: Number(sendingUserId),
          menu_id: Number(item.id),
          qty: item.quantity,
          customer_name: customerName,
          phone_number: phoneNumber,
          notes: notes,
        };

        const response = await fetch(`${API_BASE_URL}/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error(`Gagal memesan item: ${item.name}`);
        return response.json();
      });

      await Promise.all(orderPromises);
      alert("Pesanan COD berhasil disimpan!");
      router.push({ pathname: "/(customer)/dashboard", params: { hasOrders: "true" } });
    } catch (error: any) {
      alert("Gagal memproses pesanan COD: " + error.message);
    }
  };

  const handleCancelInvoice = async () => {
    if (!currentInvoice) return;
    try {
      await fetch(`${API_BASE_URL}/invoices/${currentInvoice.id}/cancel`, { method: "POST" });
      setStep("form");
      setCurrentInvoice(null);
      setPaymentProof(null); 
      setPaymentProofName(null);
    } catch (err) {
      console.error(err);
    }
  };

  // 🚀 FUNGSI UPLOAD YANG SUDAH DIPERBAIKI
  const handleDonePayment = async () => {
    if (!paymentProof || !paymentProofName) {
      alert("Harap unggah bukti transfer terlebih dahulu sebelum melanjutkan.");
      return;
    }

    setIsSubmittingProof(true);

    try {
      const formData = new FormData();
      const imageType = paymentProofName.endsWith(".png") ? "image/png" : "image/jpeg";

      if (Platform.OS === "web") {
        // Logika konversi File untuk Web agar terbaca oleh Laravel $request->hasFile()
        const response = await fetch(paymentProof);
        const blob = await response.blob();
        const imageFile = new File([blob], paymentProofName, { type: imageType });
        formData.append("image", imageFile);
      } else {
        // Logika native mobile
        formData.append("image", {
          uri: paymentProof,
          name: paymentProofName,
          type: imageType,
        } as any);
      }

      const res = await fetch(`${API_BASE_URL}/invoices/${currentInvoice?.id}/upload-proof`, {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: formData,
      });

      if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          throw new Error(errorData?.message || "Gagal mengunggah bukti pembayaran");
      }
      
      setStep("waiting");
    } catch (error: any) {
      alert("Terjadi kesalahan saat upload: " + error.message);
      console.error(error);
    } finally {
      setIsSubmittingProof(false);
    }
  };

  // --- RENDER SCREEN KONDISIONAL ---

  if (step === "qris" && currentInvoice) {
    // 🚀 Perbaikan Scroll: Membungkus dengan ScrollView agar bisa digulir
    return (
      <ScrollView 
        style={{ backgroundColor: c.background, flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", paddingVertical: 24 }}
      >
        <Card style={{ width: isDesktop ? 460 : "92%", padding: 20 }}>
          <Text style={styles.qrisHeader}>Pembayaran QRIS</Text>
          <Text style={styles.invoiceCode}>{currentInvoice.invoice_code}</Text>
          
          <View style={styles.qrWrapper}>
            <Image 
              source={require("@/assets/images/qris-statis-anda.png")} 
              style={{ width: 220, height: 220 }}
              resizeMode="contain"
            />
          </View>

          <View style={styles.alertBox}>
            <Text style={styles.alertText}>
              Total yang harus dibayar:
            </Text>
            <Text style={styles.largeTotal}>{formatIDR(currentInvoice.total_amount)}</Text>
          </View>

          <View style={styles.uploadSection}>
            <Text style={styles.uploadLabel}>Bukti Transfer:</Text>
            <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
              {paymentProof ? (
                <Image source={{ uri: paymentProof }} style={styles.previewImage} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <UploadCloud color={c.mutedForeground} size={24} />
                  <Text style={styles.uploadText}>Ketuk untuk unggah screenshot/foto</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <Button 
            title={isSubmittingProof ? "Mengunggah..." : "Saya Sudah Bayar & Kirim Bukti"} 
            onPress={handleDonePayment} 
            disabled={isSubmittingProof}
            style={{ marginTop: 16 }} 
          />
          <TouchableOpacity onPress={handleCancelInvoice} style={styles.cancelBtnText} disabled={isSubmittingProof}>
            <Text style={{ color: "#EF4444", fontWeight: "600", textAlign: "center" }}>Batal / Ubah Metode Pembayaran</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    );
  }

  if (step === "waiting") {
    return (
      <View style={[styles.centerContainer, { backgroundColor: c.background }]}>
        <Card style={{ width: isDesktop ? 420 : "90%", padding: 24, alignItems: "center" }}>
          <ShieldAlert size={48} color={c.primary} />
          <Text style={styles.waitingTitle}>Bukti Pembayaran Sedang Ditinjau</Text>
          <Text style={styles.waitingSub}>
            Terima kasih! Bukti transfer Anda telah kami terima dan pesanan akan segera diproses dan tampil pada dashboard Anda setelah admin melakukan verifikasi. Harap bersabar menunggu.
          </Text>
          
          <Button 
          title="Antisipasi: Hubungi WA Admin" 
          onPress={() => {
          const message = encodeURIComponent(
          `Halo Admin, saya ingin bertanya terkait Invoice: ${currentInvoice?.invoice_code || ''}`
          );

          Linking.openURL(
          `https://wa.me/6281265563773?text=${message}`
          ).catch((err) =>
          alert("Gagal membuka WhatsApp. Pastikan aplikasi terinstal.")
          );
        }} 
        variant="outline" 
        style={{ marginTop: 10, width: "100%" }} 
        />

          
          <TouchableOpacity onPress={() => router.push("/(customer)/dashboard")} style={{ marginTop: 20 }}>
            <Text style={{ color: c.mutedForeground, textDecorationLine: "underline" }}>Kembali ke halaman utama</Text>
          </TouchableOpacity>
        </Card>
      </View>
    );
  }

  if (cartItems.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Card style={{ width: isDesktop ? 400 : '90%' }}>
          <CardContent style={styles.emptyCard}>
            <Text style={[styles.emptyTitle, { color: c.foreground }]}>Keranjang Anda kosong</Text>
            <Button title="Ke Menu" onPress={() => router.push("/(customer)/menu")} />
          </CardContent>
        </Card>
      </View>
    );
  }
  
  return (
    <ScrollView style={[styles.screen, { backgroundColor: c.background }]}>
      <View style={styles.mainWrapper}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <ArrowLeft size={18} color={c.mutedForeground} />
          <Text style={[styles.backText, { color: c.mutedForeground }]}>Kembali ke Menu</Text>
        </TouchableOpacity>

        <View style={[styles.grid, !isDesktop && styles.stack]}>
          {/* LEFT: Customer Information */}
          <View style={styles.flex2}>
            <Card style={styles.cardBorder}>
              <CardContent style={styles.p24}>
                <Text style={[styles.sectionTitle, { color: c.foreground }]}>Informasi Pelanggan</Text>
                <View style={styles.inputGap}>
                  <Label>Nama Pembeli</Label>
                  <Input
                    value={customerName}
                    onChangeText={setCustomerName}
                    placeholder="Masukkan nama Anda"
                    style={styles.inputFigma}
                  />
                </View>
                <View style={styles.inputGap}>
                  <Label>Nomor HP/WhatsApp</Label>
                  <Input
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    placeholder="Contoh: 0812XXXXXXXX"
                    style={styles.inputFigma}
                  />
                </View>
                <View style={styles.inputGap}>
                  <Label>Instruksi Khusus (Opsional)</Label>
                  <Input
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Ada alergi, preferensi, atau permintaan khusus..."
                    multiline
                    numberOfLines={4}
                    style={[styles.inputFigma, styles.textArea]}
                  />
                </View>
              </CardContent>
            </Card>
          </View>

          {/* RIGHT: Purchase Type */}
          <View style={styles.flex1}>
            <Card style={styles.cardBorder}>
              <CardContent style={styles.p24}>
                <Text style={[styles.sectionTitle, { color: c.foreground }]}>Metode Pembayaran</Text>
                <View style={styles.optionRow}>
                  {/* RE-AKTIVASI LAYANAN SEKARANG SUDAH AKTIF MELALUI STAGING */}
                  <TouchableOpacity
                    onPress={() => setPurchaseType("transfer")}
                    style={[styles.paymentOption, purchaseType === "transfer" && styles.paymentActive]}
                  >
                    <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
                      <CreditCard size={20} color="#0284C7" />
                    </View>
                    <Text style={styles.paymentTitle}>Transfer QRIS</Text>
                    <Text style={styles.paymentSub}>Bayar dengan QRIS</Text>
                    {purchaseType === "transfer" && (
                      <View style={styles.checkBadge}><Check size={10} color="white" /></View>
                    )}
                  </TouchableOpacity>

                  {/* TOMBOL COD */}
                  <TouchableOpacity
                    onPress={() => setPurchaseType("cod")}
                    style={[styles.paymentOption, purchaseType === "cod" && styles.paymentActive]}
                  >
                    <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
                      <Banknote size={20} color="#16A34A" />
                    </View>
                    <Text style={styles.paymentTitle}>COD</Text>
                    <Text style={styles.paymentSub}>Bayar tunai di tempat</Text>
                    {purchaseType === "cod" && (
                      <View style={styles.checkBadge}><Check size={10} color="white" /></View>
                    )}
                  </TouchableOpacity>
                </View>
              </CardContent>
            </Card>
          </View>
        </View>

        {/* BARIS BAWAH: Order Summary */}
        <View style={styles.bottomSection}>
          <Card style={styles.cardBorder}>
            <CardContent style={styles.p24}>
              <Text style={[styles.sectionTitle, { color: c.foreground }]}>Ringkasan Pesanan</Text>
              <View style={styles.itemsList}>
                {cartItems.map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemName, { color: c.foreground }]}>{item.name}</Text>
                      <Text style={[styles.itemSub, { color: c.mutedForeground }]}>
                        {formatIDR(item.price)} × {item.quantity}
                      </Text>
                    </View>
                    <Text style={[styles.itemTotal, { color: c.foreground }]}>
                      {formatIDR(item.price * item.quantity)}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.figmaTotalBox}>
                <View style={styles.totalRow}>
                  <Text style={{ color: c.mutedForeground, fontSize: 16 }}>Subtotal</Text>
                  <Text style={{ fontWeight: "600", fontSize: 16 }}>{formatIDR(getSubtotal())}</Text>
                </View>
                <View style={[styles.totalRow, { marginTop: 16 }]}>
                  <Text style={[styles.totalLabelLarge, { color: c.foreground }]}>Total</Text>
                  <Text style={[styles.totalValueLarge, { color: c.primary }]}>
                    {formatIDR(getSubtotal())}
                  </Text>
                </View>
              </View>

              <Button 
                title={purchaseType === "transfer" ? "Lanjut Ke Pembayaran QRIS" : "Konfirmasi Pesanan COD"} 
                onPress={handleConfirmOrder} 
                style={styles.confirmBtn}
              />
            </CardContent>
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  mainWrapper: {
    maxWidth: 1100,
    width: "100%",
    alignSelf: "center",
    padding: spacing.lg,
  },
  back: { flexDirection: "row", alignItems: "center", marginBottom: 24, gap: 8 },
  backText: { fontWeight: "500" },

  grid: { flexDirection: "row", gap: 20 },
  stack: { flexDirection: "column" },
  flex2: { flex: 2 },
  flex1: { flex: 1.2 },
  
  bottomSection: { marginTop: 20 },

  p24: { padding: 24 },
  cardBorder: { borderRadius: radius.xl, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: 'white' },
  sectionTitle: { fontSize: 20, fontWeight: "700", marginBottom: 24 },

  inputGap: { marginBottom: 20 },
  inputFigma: { 
    backgroundColor: "#FFF7ED", 
    borderColor: "#FFEDD5", 
    borderRadius: radius.md,
    marginTop: 8,
    height: 50
  },
  textArea: { height: 120, textAlignVertical: 'top', padding: 12 },

  optionRow: { flexDirection: "row", gap: 12 },
  paymentOption: {
    flex: 1,
    paddingVertical: 24,
    paddingHorizontal: 12,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: "center",
    position: 'relative'
  },
  paymentActive: { borderColor: theme.colors.primary, backgroundColor: "#FFF7ED" },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  paymentTitle: { fontWeight: "700", fontSize: 15, marginBottom: 4 },
  paymentSub: { fontSize: 11, color: theme.colors.mutedForeground, textAlign: 'center', lineHeight: 14 },
  checkBadge: { 
    position: 'absolute', top: 8, right: 8, 
    backgroundColor: theme.colors.primary, borderRadius: 10, padding: 2 
  },

  itemsList: { marginBottom: 24 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  itemName: { fontWeight: "600", fontSize: 16 },
  itemSub: { fontSize: 14, marginTop: 4 },
  itemTotal: { fontWeight: "700", fontSize: 16 },

  figmaTotalBox: { 
    backgroundColor: "#FFF7ED", 
    padding: 24, 
    borderRadius: radius.lg, 
    marginBottom: 24 
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabelLarge: { fontWeight: "800", fontSize: 20 },
  totalValueLarge: { fontWeight: "800", fontSize: 24 },

  confirmBtn: { height: 56, borderRadius: radius.lg },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyCard: { padding: 40, alignItems: "center", gap: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "600" },

  // STYLE ISOLASI SCREEN QRIS & WAITING (Tambahan Baru dari Bagian Kedua)
  qrisHeader: { fontSize: 20, fontWeight: "700", textAlign: "center" },
  invoiceCode: { fontSize: 13, color: "#64748B", textAlign: "center", marginVertical: 4 },
  qrWrapper: { alignItems: "center", marginVertical: 20, padding: 10, alignSelf: "center", backgroundColor: "white", borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0" },
  alertBox: { backgroundColor: "#FFFBEB", borderWidth: 1, borderColor: "#FDE68A", padding: 16, borderRadius: 10 },
  alertText: { fontSize: 13, color: "#92400E", textAlign: "center", marginBottom: 8 },
  largeTotal: { fontSize: 26, fontWeight: "800", color: "#B45309", textAlign: "center" },
  uniqueDetail: { fontSize: 11, color: "#B45309", textAlign: "center" },
  cancelBtnText: { marginTop: 16, padding: 8 },
  waitingTitle: { fontSize: 18, fontWeight: "700", marginTop: 16 },
  waitingSub: { fontSize: 13, textAlign: "center", color: "#64748B", marginVertical: 12, lineHeight: 18 },
// Styling tambahan untuk section upload
  uploadSection: { marginTop: 16, marginBottom: 8 },
  uploadLabel: { fontSize: 13, fontWeight: "600", marginBottom: 8, color: theme.colors.foreground },
  uploadBtn: { 
    height: 120, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderStyle: "dashed", 
    borderColor: "#CBD5E1", 
    overflow: "hidden",
    backgroundColor: "#F8FAFC" 
  },
  uploadPlaceholder: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8 },
  uploadText: { fontSize: 12, color: theme.colors.mutedForeground },
  previewImage: { width: "100%", height: "100%", resizeMode: "cover" },
});