import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Check, CreditCard, Banknote } from "lucide-react-native";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { theme } from "@/constants/theme";
import { spacing, radius } from "@/components/system";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export default function PurchasingPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const c = theme.colors;

  const cartItems: CartItem[] = params.cart
    ? JSON.parse(params.cart as string)
    : [];

  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  
  // 🚀 1. SINKRONISASI: Ubah default state ke "cod" karena transfer sedang mogok kerja
  const [purchaseType, setPurchaseType] = useState<"transfer" | "cod">("cod");

  const getSubtotal = () =>
    cartItems.reduce((t, i) => t + i.price * i.quantity, 0);

  const formatIDR = (price: number) => 
    `Rp ${price.toLocaleString("id-ID")}`;

  const API_BASE_URL = "http://192.168.43.144:8000/api"; 

  const handleConfirmOrder = async () => {
    // 🚀 2. VALIDASI KEAMANAN FRONTEND: Cegah order masuk jika memilih transfer
    if (purchaseType === "transfer") {
      alert("Metode transfer sedang tidak tersedia. Harap pilih metode COD.");
      return;
    }

    try {
      const testUserId = 1; 

      const orderPromises = cartItems.map(async (item) => {
        const payload = {
          user_id: testUserId,
          menu_id: item.id, 
          qty: item.quantity,
          customer_name: customerName,
          notes: notes
        };

        const response = await fetch(`${API_BASE_URL}/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorResult = await response.json();
          throw new Error(errorResult.message || `Gagal memesan item: ${item.name}`);
        }

        return response.json();
      });

      await Promise.all(orderPromises);

      alert("Pesanan berhasil disimpan ke database!");
      
      router.push({
        pathname: "/(customer)/dashboard",
        params: { hasOrders: "true" } // Kirim flag untuk trigger refresh di dashboard
      });

    } catch (error: any) {
      console.error("Error Integrasi:", error);
      alert("Gagal memproses pesanan: " + error.message);
    }
  };

  if (cartItems.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Card style={{ width: isDesktop ? 400 : '90%' }}>
          <CardContent style={styles.emptyCard}>
            <Text style={[styles.emptyTitle, { color: c.foreground }]}>Keranjang Anda kosong</Text>
            <Button title="Ke Menu" onPress={() => router.push("/menu")} />
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

        {/* BARIS ATAS: Customer Info & Purchase Type */}
        <View style={[styles.grid, !isDesktop && styles.stack]}>
          
          {/* LEFT: Customer Information */}
          <View style={styles.flex2}>
            <Card style={styles.cardBorder}>
              <CardContent style={styles.p24}>
                <Text style={[styles.sectionTitle, { color: c.foreground }]}>Informasi Pelanggan</Text>
                <View style={styles.inputGap}>
                  <Label>Nama (Opsional)</Label>
                  <Input
                    value={customerName}
                    onChangeText={setCustomerName}
                    placeholder="Masukkan nama Anda"
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
                  
                  {/* 🚀 3. KOSMETIK DEFENSIF: Tombol Transfer Dibuat Mati & Ada Warning Red */}
                  <View style={{ flex: 1 }}>
                    <TouchableOpacity
                      disabled={true} // Mematikan fungsi klik secara total
                      style={[
                        styles.paymentOption, 
                        { opacity: 0.5, borderColor: theme.colors.border } // Menurunkan kontras agar terlihat tidak aktif
                      ]}
                    >
                      <View style={[styles.iconBox, { backgroundColor: '#E2E8F0' }]}>
                        <CreditCard size={20} color="#64748B" />
                      </View>
                      <Text style={[styles.paymentTitle, { color: '#64748B' }]}>Transfer</Text>
                      <Text style={styles.paymentSub}>Bayar via Bank/E-Wallet</Text>
                    </TouchableOpacity>
                    
                    {/* Tulisan Merah Sesuai Permintaan Kamu */}
                    <Text style={{ 
                      color: "#EF4444", 
                      fontSize: 11, 
                      fontWeight: "500",
                      marginTop: 8, 
                      textAlign: "center",
                      lineHeight: 14
                    }}>
                      Maaf pembayaran melalui transfer sedang tidak tersedia saat ini, silahkan memilih metode pembayaran lain
                    </Text>
                  </View>

                  {/* TOMBOL COD (Tetap Berjalan Normal) */}
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
                title="Konfirmasi Pesanan" 
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
});