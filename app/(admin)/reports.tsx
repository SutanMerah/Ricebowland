import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, useWindowDimensions, Modal, Pressable, TouchableOpacity } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { theme } from "@/constants/theme";
import { spacing } from "@/components/system/spacing";
import { apiFetch } from "@/lib/fetch";
import ReceiptModal from "@/components/ui/ReceiptModal";

interface RawOrderItem {
  id: number;
  user_id: number;
  customer_name: string | null;
  menu_id: number;
  qty?: number;
  quantity?: number;
  status: string;
  notes: string | null;
  created_at: string;
  menu?: { 
    name: string;
    price?: string | number;
  };
}

interface RawReceiptItem {
  id: number;
  receipt_code: string;
  customer_name: string | null;
  total_price?: number | string;
  created_at: string;
  items_detail?: any;
}

function formatCurrency(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

// Helper aman untuk membandingkan string tanggal YYYY-MM-DD
function getCleanDateString(dateInput: string) {
  if (!dateInput) return null;
  return dateInput.split(" ")[0]; // Mengambil bagian YYYY-MM-DD saja
}

export default function AdminReports() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [orders, setOrders] = useState<RawOrderItem[]>([]);
  const [receipts, setReceipts] = useState<RawReceiptItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedArchivedReceipt, setSelectedArchivedReceipt] = useState<any | null>(null);
  const [showArchivedReceipt, setShowArchivedReceipt] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [customAlertVisible, setCustomAlertVisible] = useState(false);
  const [customAlertMessage, setCustomAlertMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [ordersRes, receiptsRes] = await Promise.all([apiFetch("/orders"), apiFetch("/receipts")]);
        const orderList = Array.isArray(ordersRes) ? ordersRes : ordersRes.data || [];
        const receiptList = Array.isArray(receiptsRes) ? receiptsRes : receiptsRes.data || [];
        setOrders(orderList);
        setReceipts(receiptList);
      } catch (error) {
        console.error("Gagal memuat data laporan bisnis:", error);
        setCustomAlertMessage("Gagal mengambil data transaksi atau receipts dari server backend Laravel.");
        setCustomAlertVisible(true);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Memfilter order berdasarkan jangkauan tanggal input user
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderDateStr = getCleanDateString(order.created_at);
      if (!orderDateStr) return true;

      if (startDate && orderDateStr < startDate) return false;
      if (endDate && orderDateStr > endDate) return false;
      return true;
    });
  }, [orders, startDate, endDate]);

  const filteredReceipts = useMemo(() => {
    return receipts.filter((receipt) => {
      const receiptDateStr = getCleanDateString(receipt.created_at);
      if (!receiptDateStr) return true;

      if (startDate && receiptDateStr < startDate) return false;
      if (endDate && receiptDateStr > endDate) return false;
      return true;
    });
  }, [receipts, startDate, endDate]);

  function openArchivedReceipt(receipt: RawReceiptItem) {
    let items: any[] = [];
    if (receipt.items_detail) {
      if (typeof receipt.items_detail === "string") {
        try {
          items = JSON.parse(receipt.items_detail);
        } catch (e) {
          items = [];
        }
      } else if (Array.isArray(receipt.items_detail)) {
        items = receipt.items_detail;
      } else {
        items = [receipt.items_detail];
      }
    }

    const modalData = {
      order_code: receipt.receipt_code,
      created_at: receipt.created_at,
      status: "completed",
      totalPrice: Number(receipt.total_price || 0),
      items,
    };

    setSelectedArchivedReceipt(modalData);
    setShowArchivedReceipt(true);
  }

  // Melakukan kalkulasi metrik bisnis secara dinamis berdasarkan data terfilter
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    const statusCounts: Record<string, number> = {};
    const menuRevenue: Record<string, number> = {};
    
    // Grouping unik untuk menghitung total pesanan riil (bukan total baris item mentah)
    const uniqueOrders = new Set<string>();

    filteredOrders.forEach((item) => {
      // Kelompokkan key order unik berdasarkan tanggal + user_id seperti pada halaman transaksi
      const rawDate = item.created_at ? item.created_at.split(' ')[0] : "unknown";
      const groupOrderKey = `${rawDate}_US${item.user_id}`;
      uniqueOrders.add(groupOrderKey);

      // Kalkulasi pendapatan item saat ini
      const price = Number(item.menu?.price || (item as any).price || 0);
      const qty = item.qty || item.quantity || 1;
      const itemRevenue = price * qty;

      // Tambahkan ke total pendapatan jika statusnya valid/bukan cancelled
      if (item.status?.toLowerCase() !== "cancelled") {
        totalRevenue += itemRevenue;
      }

      // Hitung persebaran status item
      const statusLabel = item.status || "pending";
      statusCounts[statusLabel] = (statusCounts[statusLabel] || 0) + 1;

      // Hitung total pendapatan per produk (Best Seller)
      const menuName = item.menu?.name || `Custom Item (ID: ${item.menu_id})`;
      menuRevenue[menuName] = (menuRevenue[menuName] || 0) + itemRevenue;
    });

    const totalOrders = uniqueOrders.size;
    const avgOrder = totalOrders ? totalRevenue / totalOrders : 0;
    const bestSeller = Object.entries(menuRevenue)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return { totalRevenue, totalOrders, avgOrder, statusCounts, bestSeller };
  }, [filteredOrders]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Menghasilkan data laporan...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Laporan</Text>
        <Text style={styles.subtitle}>Buat laporan bisnis dari transaksi dan gunakan untuk mendorong keputusan operasional.</Text>
      </View>

      <Card style={styles.reportCard}>
        <CardContent style={{ padding: 20 }}>
          <Text style={styles.sectionHeading}>Jangkauan Laporan</Text>
          <Text style={styles.fieldLabel}>Tanggal Mulai</Text>
          <Input placeholder="YYYY-MM-DD" value={startDate} onChangeText={setStartDate} />
          <Text style={styles.fieldLabel}>Tanggal Akhir</Text>
          <Input placeholder="YYYY-MM-DD" value={endDate} onChangeText={setEndDate} />
          <Button
            title="Buat Laporan"
            onPress={() => setReportGenerated(true)}
            style={[styles.generateButton, !isDesktop && { width: '100%' }]}
          />
        </CardContent>
      </Card>

      {reportGenerated ? (
        <>
          <View style={[styles.metricsGrid, !isDesktop && { flexDirection: 'column' }]}>
            <Card style={styles.metricCard}>
              <CardContent style={{ padding: 16 }}>
                <Text style={styles.metricLabel}>Pendapatan</Text>
                <Text style={styles.metricNumber}>{formatCurrency(metrics.totalRevenue)}</Text>
              </CardContent>
            </Card>
            <Card style={styles.metricCard}>
              <CardContent style={{ padding: 16 }}>
                <Text style={styles.metricLabel}>Total Pesanan</Text>
                <Text style={styles.metricNumber}>{metrics.totalOrders}</Text>
              </CardContent>
            </Card>
            <Card style={styles.metricCard}>
              <CardContent style={{ padding: 16 }}>
                <Text style={styles.metricLabel}>Pesanan Rata-rata</Text>
                <Text style={styles.metricNumber}>{formatCurrency(Math.round(metrics.avgOrder))}</Text>
              </CardContent>
            </Card>
          </View>

          <Card style={styles.reportSummaryCard}>
            <CardContent style={{ padding: 20 }}>
              <Text style={styles.sectionHeading}>Ringkasan Bisnis</Text>
              <Text style={styles.summaryText}>
                Untuk periode yang dipilih, dasbor admin Anda menemukan <Text style={{ fontWeight: "700" }}>{metrics.totalOrders}</Text> pesanan tersegmentasi aktif dan menghasilkan <Text style={{ fontWeight: "700", color: theme.colors.primary }}>{formatCurrency(metrics.totalRevenue)}</Text> pendapatan.
              </Text>
              <Text style={[styles.summaryText, { marginTop: 10, fontWeight: "600" }]}>Distribusi status pesanan (total item):</Text>
              {Object.entries(metrics.statusCounts).map(([status, count]) => (
                <Text key={status} style={styles.summaryText}>• {status.toUpperCase()}: {count} row(s)</Text>
              ))}
            </CardContent>
          </Card>

          <Card style={styles.reportSummaryCard}>
            <CardContent style={{ padding: 20 }}>
              <Text style={styles.sectionHeading}>Item dengan Penjualan Tertinggi</Text>
              {metrics.bestSeller.length === 0 ? (
                <Text style={styles.summaryText}>Tidak ada penjualan item yang tercatat untuk periode ini.</Text>
              ) : (
                metrics.bestSeller.map(([name, revenue], index) => (
                  <View key={name} style={styles.topItemRow}>
                    <Text style={styles.topItemName}>{index + 1}. {name}</Text>
                    <Text style={styles.topItemRevenue}>{formatCurrency(revenue)}</Text>
                  </View>
                ))
              )}
            </CardContent>
          </Card>

          <Card style={styles.reportSummaryCard}>
            <CardContent style={{ padding: 20 }}>
              <Text style={styles.sectionHeading}>Daftar Receipts</Text>
              {filteredReceipts.length === 0 ? (
                <Text style={styles.summaryText}>Tidak ada receipts untuk periode ini.</Text>
              ) : (
                filteredReceipts.map((r) => (
                  <TouchableOpacity key={r.id} style={styles.receiptRow} onPress={() => openArchivedReceipt(r)}>
                    <Text style={styles.receiptCode}>{r.receipt_code} — {r.customer_name || 'Tamu'}</Text>
                    <Text style={styles.receiptMeta}>{formatCurrency(Number(r.total_price || 0))} • {getCleanDateString(r.created_at)}</Text>
                    <Text style={styles.viewReceiptText}>Lihat Struk ❯</Text>
                  </TouchableOpacity>
                ))
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card style={styles.sampleCard}>
          <CardContent style={{ padding: 20 }}>
            <Text style={styles.sampleText}>Use the date range above to build an accurate sales report for your restaurant.</Text>
          </CardContent>
        </Card>
      )}

      {/* CUSTOM ALERT MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={customAlertVisible}
        onRequestClose={() => setCustomAlertVisible(false)}
      >
        <Pressable
          style={styles.customAlertOverlay}
          onPress={() => setCustomAlertVisible(false)}
        >
          <View style={styles.customAlertBox}>
            <Text style={styles.customAlertText}>{customAlertMessage}</Text>
            <Button
              title="OK"
              onPress={() => setCustomAlertVisible(false)}
              style={styles.customAlertButton}
              variant="default"
            />
          </View>
        </Pressable>
      </Modal>

      <ReceiptModal
        order={selectedArchivedReceipt}
        visible={showArchivedReceipt}
        onClose={() => setShowArchivedReceipt(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: spacing.xl, width: "100%", maxWidth: 1280, alignSelf: "center" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background },
  loadingText: { marginTop: 16, color: theme.colors.mutedForeground },
  header: { marginBottom: spacing.xl },
  title: { fontSize: 32, fontWeight: "800", color: theme.colors.foreground },
  subtitle: { fontSize: 15, marginTop: 6, color: theme.colors.mutedForeground },
  reportCard: { borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, marginBottom: spacing.xl },
  sectionHeading: { fontSize: 18, fontWeight: "800", color: theme.colors.foreground, marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: theme.colors.mutedForeground, marginBottom: 8, marginTop: 10 },
  generateButton: { minHeight: 44, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginTop: 20, justifyContent: 'center', alignItems: 'center' },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginBottom: spacing.xl },
  metricCard: { flex: 1, minWidth: 150, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border },
  metricLabel: { color: theme.colors.mutedForeground, fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
  metricNumber: { marginTop: 14, fontSize: 24, fontWeight: "800", color: theme.colors.foreground },
  reportSummaryCard: { borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 16 },
  summaryText: { color: theme.colors.foreground, lineHeight: 22 },
  sampleCard: { borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border },
  sampleText: { color: theme.colors.mutedForeground, lineHeight: 22 },
  topItemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  topItemName: { fontWeight: "700", color: theme.colors.foreground },
  topItemRevenue: { color: theme.colors.primary, fontWeight: "600" },
  receiptRow: { borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingVertical: 10 },
  receiptCode: { fontWeight: "700", color: theme.colors.foreground },
  receiptMeta: { color: theme.colors.mutedForeground, marginTop: 6 },
  viewReceiptText: { color: theme.colors.primary, marginTop: 6, fontWeight: "600" },

  // CUSTOM ALERT STYLES
  customAlertOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  customAlertBox: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxWidth: 400,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  customAlertText: {
    fontSize: 16,
    color: theme.colors.foreground,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 24,
  },
  customAlertButton: {
    minWidth: 100,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
});