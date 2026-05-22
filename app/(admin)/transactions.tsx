import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, useWindowDimensions } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Select } from "@/components/ui/Select";
import { theme } from "@/constants/theme";
import { spacing } from "@/components/system/spacing";

  const API_BASE_URL = "https://backend-ricebowland.fly.dev/api";

const orderStatusOptions = [
  { label: "Tertunda", value: "pending" },
  { label: "Diproses", value: "processing" },
  { label: "Selesai", value: "completed" },
  { label: "Dibatalkan", value: "cancelled" },
];

interface RawOrder {
  id: number;
  user_id: number;
  customer_name: string | null;
  menu_id: number;
  qty?: number;
  quantity?: number;
  status: string;
  notes: string | null;
  created_at: string;
  user?: {
    id: number;
    name: string;
    email?: string;
  };
  menu?: { 
    name: string;
    price?: string | number;
  };
}

interface GroupedOrder {
  id: number; 
  user_id: number;
  customer_name: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  account_name: string;
  raw_ids: number[];
  items: {
    menu_id: number;
    name: string;
    qty: number;
    price: number;
  }[];
}

function formatCurrency(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function formatDate(dateString: string) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return dateString;
  }
}

// Helper Generator Kode Unik: ORD-[Tahun]-[UserID][Bulan]-[ID]
function generateOrderCode(orderId: number, userId: number, dateString: string) {
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const monthFormatted = String(date.getMonth() + 1).padStart(2, '0');
    const midToken = `${String(userId).padStart(2, '0')}${monthFormatted.slice(-1)}`;
    
    return `ORD-${year}-${midToken}-${orderId}`;
  } catch {
    return `ORD-2026-015-${orderId}`; 
  }
}

function getStatusStyle(status: string) {
  switch (status?.toLowerCase()) {
    case "completed":
    case "success":
      return { backgroundColor: "#e6f4ea", color: "#137333" };
    case "processing":
      return { backgroundColor: "#fef7e0", color: "#b06000" };
    case "pending":
      return { backgroundColor: "#fce8e6", color: "#c5221f" };
    case "cancelled":
      return { backgroundColor: "#f5f5f5", color: "#5f6368" };
    default:
      return { backgroundColor: theme.colors.muted, color: theme.colors.foreground };
  }
}

export default function AdminTransactions() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [rawOrders, setRawOrders] = useState<RawOrder[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  async function loadOrders() {
    try {
      setIsLoading(true);
      setApiError(null);
      
      const response = await fetch(`${API_BASE_URL}/orders`, {
        mode: 'cors',
        headers: {
          "Accept": "application/json"
        }
      });
      const data = await response.json();
      const orderList = Array.isArray(data) ? data : data.data || [];
      
      setRawOrders(orderList);
    } catch (error) {
      console.error("[DEBUG ERROR] Gagal memuat data transaksi:", error);
      setApiError("Gagal terhubung ke server Laravel. Pastikan backend menyala dan CORS sudah dikonfigurasi.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const groupedOrders = useMemo(() => {
    const groups: Record<string, GroupedOrder> = {};

    rawOrders.forEach((item) => {
      const rawDate = item.created_at ? item.created_at.split(' ')[0] : "unknown";
      const groupKey = `${rawDate}_US${item.user_id}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          id: item.id,
          user_id: item.user_id,
          customer_name: item.customer_name || item.user?.name || "Customer",
          notes: item.notes,
          status: item.status || "pending",
          created_at: item.created_at,
          account_name: item.user?.name || `User ID: ${item.user_id}`,
          raw_ids: [],
          items: []
        };
      }

      const menuPrice = Number(item.menu?.price || (item as any).price || 0);
      const itemQty = item.qty || item.quantity || 1;
      const menuName = item.menu?.name || `Custom Item (ID: ${item.menu_id})`;

      groups[groupKey].items.push({
        menu_id: item.menu_id,
        name: menuName,
        qty: itemQty,
        price: menuPrice
      });

      groups[groupKey].raw_ids.push(item.id);

      if (item.status && item.status !== "pending") {
        groups[groupKey].status = item.status;
      }
    });

    return Object.values(groups).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [rawOrders]);

  const summary = useMemo(() => {
    const totalOrders = groupedOrders.length;
    const pending = groupedOrders.filter((order) => order.status?.toLowerCase() === "pending").length;
    const processing = groupedOrders.filter((order) => order.status?.toLowerCase() === "processing").length;
    const completed = groupedOrders.filter((order) => order.status?.toLowerCase() === "completed" || order.status?.toLowerCase() === "success").length;
    
    const totalRevenue = groupedOrders.reduce((sum, order) => {
      const orderTotal = order.items.reduce((s, i) => s + (i.price * i.qty), 0);
      return sum + orderTotal;
    }, 0);

    return { totalOrders, pending, processing, completed, totalRevenue };
  }, [groupedOrders]);

  // PERUBAHAN UTAMA 1: Menghapus .slice(0, 5) supaya mereturn seluruh baris transaksi hasil grouping
  const allTransactionsList = useMemo(() => {
    return groupedOrders.map((order) => ({
      id: order.id,
      user_id: order.user_id,
      status: order.status,
      created_at: order.created_at,
      formatted_date: formatDate(order.created_at),
      total: order.items.reduce((s, i) => s + (i.price * i.qty), 0),
    }));
  }, [groupedOrders]);

  const updateStatus = async (orderGroup: GroupedOrder) => {
    const target = selectedStatus[orderGroup.id.toString()];

    if (!target) return;

    setIsUpdating(true);
    const previousRawOrders = [...rawOrders];
    
    setRawOrders((current) =>
      current.map((item) =>
        orderGroup.raw_ids.includes(item.id) ? { ...item, status: target } : item
      )
    );

    try {
      const updatePromises = orderGroup.raw_ids.map((id) => {
        return fetch(`${API_BASE_URL}/orders/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({ status: target }),
        });
      });

      const responses = await Promise.all(updatePromises);
      const hasError = responses.some((res) => !res.ok);

      if (hasError) throw new Error("Gagal meng-update status.");

      setSelectedStatus((prev) => {
        const updated = { ...prev };
        delete updated[orderGroup.id.toString()];
        return updated;
      });

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Gagal menyimpan perubahan status ke server backend.");
      setRawOrders(previousRawOrders);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Memuat transaksi admin...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}> 
      <View style={styles.header}>
        <Text style={styles.title}>Manajemen Transaksi</Text>
        <Text style={styles.subtitle}>Kelola pesanan, perbarui status, dan tinjau informasi akun khusus yang aktif.</Text>
      </View>

      {apiError && (
        <Card style={styles.errorCard}>
          <CardContent style={{ padding: 16 }}>
            <Text style={styles.errorText}>{apiError}</Text>
            <Button title="Coba Lagi" onPress={loadOrders} style={{ marginTop: 10, alignSelf: 'flex-start' }} />
          </CardContent>
        </Card>
      )}

      {/* SUMMARY GRID */}
      <View style={styles.summaryGrid}>
        <Card style={styles.summaryCard}>
          <CardContent>
            <Text style={styles.summaryLabel}>Total Pesanan</Text>
            <Text style={styles.summaryValue}>{summary.totalOrders}</Text>
          </CardContent>
        </Card>
        <Card style={styles.summaryCard}>
          <CardContent>
            <Text style={styles.summaryLabel}>Tertunda</Text>
            <Text style={styles.summaryValue}>{summary.pending}</Text>
          </CardContent>
        </Card>
        <Card style={styles.summaryCard}>
          <CardContent>
            <Text style={styles.summaryLabel}>Diproses</Text>
            <Text style={styles.summaryValue}>{summary.processing}</Text>
          </CardContent>
        </Card>
        <Card style={styles.summaryCard}>
          <CardContent>
            <Text style={styles.summaryLabel}>Total Pendapatan</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>
              {formatCurrency(summary.totalRevenue)}
            </Text>
          </CardContent>
        </Card>
      </View>

      <View style={[styles.mainSection, !isDesktop && { flexDirection: 'column' }]}>
        {/* KOLOM KIRI: ORDER CARDS LIST */}
        <View style={styles.leftColumn}>
          {groupedOrders.length === 0 ? (
            <Card style={styles.emptyCard}>
              <CardContent>
                <Text style={styles.emptyTitle}>Tidak ada pesanan yang ditemukan</Text>
                <Text style={styles.emptySubtitle}>Daftar pesanan Anda masih kosong. Pesanan baru akan muncul di sini seiring masuk.</Text>
              </CardContent>
            </Card>
          ) : (
            groupedOrders.map((order) => {
              const itemText = order.items.map((item) => `${item.qty}x ${item.name}`).join(", ");
              const currentStatus = selectedStatus[order.id.toString()] || order.status;
              const statusStyle = getStatusStyle(order.status);
              const orderTotalAmount = order.items.reduce((sum, item) => sum + (item.price * item.qty), 0);

              return (
                <Card key={order.id.toString()} style={styles.orderCard}> 
                  <CardContent style={{ padding: 20 }}>
                    
                    <View style={styles.orderHeaderRow}>
                      <View>
                        <Text style={styles.orderTitle}>
                          Order #{generateOrderCode(order.id, order.user_id, order.created_at)}
                        </Text>
                        <Text style={styles.orderMeta}>{formatDate(order.created_at)}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}> 
                        <Text style={[styles.statusText, { color: statusStyle.color }]}>{order.status}</Text>
                      </View>
                    </View>

                    <View style={styles.customerInfoBlock}>
                      <View style={styles.infoRow}>
                        <Icon name="person-circle-outline" size={16} color={theme.colors.mutedForeground} />
                        <Text style={styles.infoText}>
                        Pemilik Akun: <Text style={styles.boldText}>{order.account_name}</Text>
                        </Text>
                      </View>
                      
                      <View style={styles.infoRow}>
                        <Icon name="person-outline" size={16} color={theme.colors.mutedForeground} />
                        <Text style={styles.infoText}>
                        Nama Pelanggan: <Text style={styles.boldText}>{order.customer_name || "-"}</Text>
                        </Text>
                      </View>
                    </View>

                    <View style={styles.itemsWrapper}>
                      <Text style={styles.sectionSubTitle}>Item yang Dipesan:</Text>
                      <Text style={styles.orderItems}>{itemText}</Text>
                    </View>

                    <View style={[styles.notesContainer, { backgroundColor: order.notes ? "#f9f9f9" : "transparent" }]}>
                      <Text style={styles.notesLabel}>Catatan:</Text>
                      <Text style={[styles.notesText, { color: order.notes ? theme.colors.foreground : theme.colors.mutedForeground }]}>
                        {order.notes || "Tidak ada permintaan atau instruksi khusus yang diberikan."}
                      </Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.orderDetailRow}>
                      <View style={{ justifyContent: "center" }}>
                        <Text style={styles.priceLabel}>Total Transaksi</Text>
                        <Text style={styles.orderTotal}>{formatCurrency(orderTotalAmount)}</Text>
                      </View>
                      
                      <View style={[{ flex: 1, marginLeft: 24, flexDirection: 'row', gap: 10, alignItems: 'center' }, !isDesktop && { flexDirection: 'column', marginLeft: 0, gap: 8 }]}>
                        <View style={[{ flex: 1 }, !isDesktop && { width: '100%' }]}>
                          <Select
                            value={currentStatus}
                            onValueChange={(value) => {
                              setSelectedStatus((prev) => ({ ...prev, [order.id.toString()]: value }));
                            }}
                            items={orderStatusOptions}
                          />
                        </View>
                        <Button
                          title={isUpdating ? "..." : "Simpan"}
                          onPress={() => updateStatus(order)}
                          style={[styles.updateButton, !isDesktop && { width: '100%' }]}
                          variant="default"
                        />
                      </View>
                    </View>

                  </CardContent>
                </Card>
              );
            })
          )}
        </View>

        {/* KOLOM KANAN: SEKARANG MENAMPILKAN SEMUA DATA */}
        <View style={styles.rightColumn}>
          <Card style={styles.recentCard}>
            <CardContent style={{ padding: 20 }}>
              <View style={styles.recentHeader}>
                {/* PERUBAHAN UTAMA 2: Mengubah string judul label kontekstual */}
                <Text style={styles.sectionTitle}>Semua Transaksi</Text>
                <Text style={styles.recentMeta}>{allTransactionsList.length} total</Text>
              </View>

              {allTransactionsList.map((item) => {
                const statusStyle = getStatusStyle(item.status);
                return (
                  <View key={item.id.toString()} style={styles.transactionRow}>
                    <View style={styles.transactionText}> 
                      <Text style={styles.transactionId}>
                        {generateOrderCode(item.id, item.user_id, item.created_at)}
                      </Text>
                      <Text style={styles.transactionDate}>{item.formatted_date}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.recentRowPrice}>{formatCurrency(item.total)}</Text>
                      <View style={[styles.transactionBadge, { backgroundColor: statusStyle.backgroundColor, marginTop: 4 }]}> 
                        <Text style={[styles.transactionBadgeText, { color: statusStyle.color }]}>{item.status}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </CardContent>
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: spacing.xl, width: "100%", maxWidth: 1280, alignSelf: "center" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background },
  loadingText: { marginTop: 16, color: theme.colors.mutedForeground, fontWeight: "500" },
  header: { marginBottom: spacing.xl },
  title: { fontSize: 32, fontWeight: "800", color: theme.colors.foreground, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, marginTop: 6, color: theme.colors.mutedForeground },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginBottom: spacing.xl },
  summaryCard: { flex: 1, minWidth: 150, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.card },
  summaryLabel: { fontSize: 12, fontWeight: "700", color: theme.colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.8 },
  summaryValue: { marginTop: 10, fontSize: 24, fontWeight: "800", color: theme.colors.foreground, letterSpacing: -0.5 },
  mainSection: { flexDirection: "row", flexWrap: "wrap", gap: 24 },
  leftColumn: { flex: 2.3, minWidth: 280 },
  rightColumn: { flex: 1, minWidth: 260 },
  orderCard: { marginBottom: 18, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.card },
  emptyCard: { borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, padding: spacing.lg },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: theme.colors.foreground, marginBottom: 6 },
  emptySubtitle: { color: theme.colors.mutedForeground, lineHeight: 20 },
  orderHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  orderTitle: { fontSize: 18, fontWeight: "800", color: theme.colors.foreground },
  orderMeta: { color: theme.colors.mutedForeground, marginTop: 4, fontSize: 13 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, minWidth: 90, alignItems: "center" },
  statusText: { fontWeight: "700", textTransform: "capitalize", fontSize: 12 },
  customerInfoBlock: { backgroundColor: "#fcfcfc", padding: 12, borderRadius: 8, gap: 6, marginBottom: 14, borderWidth: 1, borderColor: "#f1f3f4" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { fontSize: 14, color: "#444" },
  boldText: { fontWeight: "600", color: theme.colors.foreground },
  itemsWrapper: { marginBottom: 12 },
  sectionSubTitle: { fontSize: 13, fontWeight: "700", color: theme.colors.mutedForeground, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.4 },
  orderItems: { color: theme.colors.foreground, fontSize: 15, fontWeight: "500", lineHeight: 22 },
  notesContainer: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#f1f3f4", marginBottom: 16 },
  notesLabel: { fontSize: 12, fontWeight: "700", color: theme.colors.destructive, marginBottom: 2 },
  notesText: { fontSize: 13, fontStyle: "italic", lineHeight: 18 },
  divider: { height: 1, backgroundColor: theme.colors.border, marginBottom: 14 },
  orderDetailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  priceLabel: { fontSize: 12, color: theme.colors.mutedForeground, fontWeight: "500" },
  orderTotal: { fontWeight: "800", color: theme.colors.primary, fontSize: 18, marginTop: 2 },
  updateButton: { height: 40, borderRadius: 10, paddingHorizontal: 16 },
  recentCard: { borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border },
  recentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: theme.colors.foreground },
  recentMeta: { color: theme.colors.mutedForeground, fontSize: 13 },
  transactionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  transactionText: { flex: 1, marginRight: 12 },
  transactionId: { fontWeight: "700", color: theme.colors.foreground, fontSize: 14 },
  transactionDate: { color: theme.colors.mutedForeground, marginTop: 4, fontSize: 12 },
  recentRowPrice: { fontWeight: "700", fontSize: 13, color: theme.colors.foreground },
  transactionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  transactionBadgeText: { fontWeight: "700", textTransform: "capitalize", fontSize: 11 },
    errorCard: { marginBottom: 16, backgroundColor: "#fdf2f2", borderColor: "#f8b4b4", borderWidth: 1 },
  errorText: { color: "#9b1c1c", fontWeight: "500" },
});