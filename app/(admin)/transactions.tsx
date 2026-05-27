import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, useWindowDimensions, Modal, Image, TouchableOpacity, Platform } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Select } from "@/components/ui/Select";
import { theme } from "@/constants/theme";
import { spacing } from "@/components/system/spacing";
import { API_BASE_URL } from "@/lib/api";

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
  phone_number?: string | null;
  metode_pembayaran?: string | null;
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

interface Invoice {
  id: number;
  invoice_code: string;
  user_id: number;
  user?: {
    id: number;
    name: string;
    email?: string;
  };
  customer_name: string;
  phone_number: string;
  subtotal: string | number;
  cart_data: string;
  status: string;
  payment_proof: string;
  created_at: string;
}

interface ParsedCartItem {
  name: string;
  qty?: number;
  quantity?: number;
  price?: number;
}

interface GroupedOrder {
  id: number; 
  user_id: number;
  customer_name: string | null;
  phone_number?: string | null;
  metode_pembayaran?: string | null;
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
  const [activeTab, setActiveTab] = useState<"orders" | "payments">("orders");
  const [rawOrders, setRawOrders] = useState<RawOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPaymentProof, setSelectedPaymentProof] = useState<string | null>(null);
  const isOrdersTab = activeTab === "orders";
  const isPaymentsTab = activeTab === "payments";

  async function loadOrders(showSpinner = true) {
    try {
      if (showSpinner) {
        setIsLoading(true);
      }
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
      if (showSpinner) {
        setIsLoading(false);
      }
    }
  }

  async function loadInvoices() {
    try {
      const response = await fetch(`${API_BASE_URL}/invoices/pending`, {
        mode: 'cors',
        headers: {
          "Accept": "application/json"
        }
      });
      const data = await response.json();
      const invoiceList = Array.isArray(data) ? data : data.data || [];
      setInvoices(invoiceList);
    } catch (error) {
      console.error("[DEBUG ERROR] Gagal memuat data invoice:", error);
    }
  }

  useEffect(() => {
    loadOrders(true);
    loadInvoices();

    const interval = setInterval(() => {
      loadOrders(false);
      loadInvoices();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const parseCartData = (cartDataString: string): ParsedCartItem[] => {
    try {
      const parsed = JSON.parse(cartDataString);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

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
          phone_number: item.phone_number ?? null,
          metode_pembayaran: item.metode_pembayaran ?? null,
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

  const ordersSummary = useMemo(() => {
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

  const paymentsSummary = useMemo(() => {
    const totalPending = invoices.length;
    const totalPendingValue = invoices.reduce((sum, inv) => {
      const subtotal = typeof inv.subtotal === 'string' ? parseFloat(inv.subtotal) : inv.subtotal;
      return sum + (isNaN(subtotal) ? 0 : subtotal);
    }, 0);
    
    return { totalPending, totalPendingValue };
  }, [invoices]);

  const updateStatus = async (orderGroup: GroupedOrder) => {
    const target = selectedStatus[orderGroup.id.toString()];

    if (!target) return;

    setIsUpdating(true);
    const previousRawOrders = [...rawOrders];

    try {
      for (const rawId of orderGroup.raw_ids) {
        const response = await fetch(`${API_BASE_URL}/orders/${rawId}`, {
          method: 'PUT',
          mode: 'cors',
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: target }),
        });

        if (!response.ok) throw new Error("Gagal memperbarui status pesanan.");
      }

      setRawOrders((current) =>
        current.map((order) => (orderGroup.raw_ids.includes(order.id) ? { ...order, status: target } : order))
      );

      Alert.alert("Sukses", "Status pesanan telah diperbarui.");
      setSelectedStatus((prev) => {
        const newState = { ...prev };
        delete newState[orderGroup.id.toString()];
        return newState;
      });
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Gagal memperbarui status pesanan.");
      setRawOrders(previousRawOrders);
    } finally {
      setIsUpdating(false);
    }
  };

  const approveInvoice = async (invoiceId: number) => {
    setIsUpdating(true);

    try {
      const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}/approve`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Gagal menyetujui invoice.");

      setInvoices((current) => current.filter((inv) => inv.id !== invoiceId));
      Alert.alert("Sukses", "Invoice telah disetujui.");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Gagal menyetujui invoice.");
    } finally {
      setIsUpdating(false);
    }
  };

  const cancelInvoice = async (invoiceId: number) => {
    setIsUpdating(true);

    try {
      const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}/cancel`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Gagal membatalkan invoice.");

      setInvoices((current) => current.filter((inv) => inv.id !== invoiceId));
      Alert.alert("Sukses", "Invoice telah dibatalkan.");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Gagal membatalkan invoice.");
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
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, !isDesktop && { paddingHorizontal: spacing.lg }]}>
      <View style={[styles.headerRow, isDesktop && styles.headerRowDesktop]}>
        <View style={styles.header}>
          <Text style={styles.title}>Manajemen Transaksi</Text>
          <Text style={styles.subtitle}>Kelola pesanan, perbarui status, dan tinjau informasi akun khusus yang aktif.</Text>
        </View>

        {isDesktop && (
          <View style={styles.tabContainerDesktop}>
            <TouchableOpacity
              style={[styles.tabButton, isOrdersTab ? styles.tabActiveButton : styles.tabInactiveButton]}
              onPress={() => setActiveTab("orders")}
            >
              <Text style={[styles.tabButtonText, isOrdersTab && styles.tabButtonTextActive]}>Pesanan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, isPaymentsTab ? styles.tabActiveButton : styles.tabInactiveButton]}
              onPress={() => setActiveTab("payments")}
            >
              <Text style={[styles.tabButtonText, isPaymentsTab && styles.tabButtonTextActive]}>Pembayaran</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {apiError && (
        <Card style={styles.errorCard}>
          <CardContent style={{ padding: 16 }}>
            <Text style={styles.errorText}>{apiError}</Text>
            <Button title="Coba Lagi" onPress={loadOrders} style={{ marginTop: 10, alignSelf: 'flex-start' }} />
          </CardContent>
        </Card>
      )}

      {/* TAB NAVIGATION */}
      {!isDesktop && (
        <View style={[styles.tabContainer, { marginBottom: spacing.lg }]}> 
          <TouchableOpacity 
            style={[styles.tabButton, isOrdersTab ? styles.tabActiveButton : styles.tabInactiveButton]}
            onPress={() => setActiveTab("orders")}
          >
            <Text style={[styles.tabButtonText, isOrdersTab && styles.tabButtonTextActive]}>Pesanan</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, isPaymentsTab ? styles.tabActiveButton : styles.tabInactiveButton]}
            onPress={() => setActiveTab("payments")}
          >
            <Text style={[styles.tabButtonText, isPaymentsTab && styles.tabButtonTextActive]}>Pembayaran</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === "orders" ? (
        // ===== PESANAN TAB =====
        <>
          {/* SUMMARY GRID - ORDERS TAB */}
          <View style={styles.summaryGrid}>
            <Card style={styles.summaryCard}>
              <CardContent>
                <Text style={styles.summaryLabel}>Total Pesanan</Text>
                <Text style={styles.summaryValue}>{ordersSummary.totalOrders}</Text>
              </CardContent>
            </Card>
            <Card style={styles.summaryCard}>
              <CardContent>
                <Text style={styles.summaryLabel}>Tertunda</Text>
                <Text style={styles.summaryValue}>{ordersSummary.pending}</Text>
              </CardContent>
            </Card>
            <Card style={styles.summaryCard}>
              <CardContent>
                <Text style={styles.summaryLabel}>Diproses</Text>
                <Text style={styles.summaryValue}>{ordersSummary.processing}</Text>
              </CardContent>
            </Card>
            <Card style={styles.summaryCard}>
              <CardContent>
                <Text style={styles.summaryLabel}>Transaksi Terverifikasi</Text>
                <Text style={styles.summaryValue}>{ordersSummary.completed}</Text>
              </CardContent>
            </Card>
          </View>

          <View style={[styles.mainSection, !isDesktop && { flexDirection: 'column' }]}>
            {/* KOLOM KIRI: ORDER CARDS LIST */}
            <View style={[styles.leftColumn, !isDesktop && styles.leftColumnMobile]}>
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
                          <View style={styles.infoRow}>
                            <Icon name="call-outline" size={16} color={theme.colors.mutedForeground} />
                            <Text style={styles.infoText}>
                            Nomor Telepon: <Text style={styles.boldText}>{order.phone_number || "-"}</Text>
                            </Text>
                          </View>
                          <View style={styles.infoRow}>
                            <Icon name="card-outline" size={16} color={theme.colors.mutedForeground} />
                            <Text style={styles.infoText}>
                            Metode Pembayaran: <Text style={styles.boldText}>{order.metode_pembayaran || "COD"}</Text>
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

                        <View style={[styles.orderDetailRow, !isDesktop && { flexDirection: 'column', alignItems: 'flex-start', gap: 12 }]}>
                          <View style={{ justifyContent: "center" }}>
                            <Text style={styles.priceLabel}>Total Transaksi</Text>
                            <Text style={styles.orderTotal}>{formatCurrency(orderTotalAmount)}</Text>
                          </View>
                          
                          <View style={[{ flex: 1, marginLeft: 24, flexDirection: 'row', gap: 10, alignItems: 'center' }, !isDesktop && { flexDirection: 'column', marginLeft: 0, gap: 8, width: '100%' }]}>
                            <View style={[{ flex: 1 }, !isDesktop && { width: '100%' }]}>
                              {Platform.OS === 'web' ? (
                                <View style={styles.selectWrapperWeb}>
                                  <Select
                                    value={currentStatus}
                                    onValueChange={(value) => {
                                      setSelectedStatus((prev) => ({ ...prev, [order.id.toString()]: value }));
                                    }}
                                    items={orderStatusOptions}
                                  />
                                </View>
                              ) : (
                                <Select
                                  value={currentStatus}
                                  onValueChange={(value) => {
                                    setSelectedStatus((prev) => ({ ...prev, [order.id.toString()]: value }));
                                  }}
                                  items={orderStatusOptions}
                                />
                              )}
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

            {/* KOLOM KANAN: VERIFIED TRANSACTIONS */}
            <View style={styles.rightColumn}>
              <Card style={styles.recentCard}>
                <CardContent style={{ padding: 20 }}>
                  <View style={styles.recentHeader}>
                    <Text style={styles.sectionTitle}>Transaksi Terverifikasi</Text>
                    <Text style={styles.recentMeta}>{groupedOrders.length} total</Text>
                  </View>

                  {groupedOrders.length === 0 ? (
                    <Text style={styles.emptyMessageSmall}>Tidak ada transaksi terverifikasi</Text>
                  ) : (
                    groupedOrders.slice(0, 10).map((item) => {
                      const statusStyle = getStatusStyle(item.status);
                      const itemTotal = item.items.reduce((sum, i) => sum + (i.price * i.qty), 0);
                      return (
                        <View key={item.id.toString()} style={styles.transactionRow}>
                          <View style={styles.transactionText}> 
                            <Text style={styles.transactionId}>
                              {generateOrderCode(item.id, item.user_id, item.created_at)}
                            </Text>
                            <Text style={styles.transactionDate}>{formatDate(item.created_at)}</Text>
                          </View>
                          <View style={{ alignItems: "flex-end" }}>
                            <Text style={styles.recentRowPrice}>{formatCurrency(itemTotal)}</Text>
                            <View style={[styles.transactionBadge, { backgroundColor: statusStyle.backgroundColor, marginTop: 4 }]}> 
                              <Text style={[styles.transactionBadgeText, { color: statusStyle.color }]}>{item.status}</Text>
                            </View>
                          </View>
                        </View>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </View>
          </View>
        </>
      ) : (
        // ===== PEMBAYARAN TAB =====
        <>
          {/* SUMMARY GRID - PAYMENTS TAB */}
          <View style={styles.summaryGrid}>
            <Card style={styles.summaryCard}>
              <CardContent>
                <Text style={styles.summaryLabel}>Verifikasi Tertunda</Text>
                <Text style={styles.summaryValue}>{paymentsSummary.totalPending}</Text>
              </CardContent>
            </Card>
            <Card style={styles.summaryCard}>
              <CardContent>
                <Text style={styles.summaryLabel}>Nilai Tertunda</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.primary, fontSize: 18 }]}>
                  {formatCurrency(paymentsSummary.totalPendingValue)}
                </Text>
              </CardContent>
            </Card>
          </View>

          <View style={[styles.mainSection, !isDesktop && { flexDirection: 'column' }]}>
            {/* KOLOM KIRI: INVOICE CARDS */}
            <View style={[styles.leftColumn, !isDesktop && styles.leftColumnMobile]}>
              {invoices.length === 0 ? (
                <Card style={styles.emptyCard}>
                  <CardContent>
                    <Text style={styles.emptyTitle}>Tidak ada pembayaran yang tertunda</Text>
                    <Text style={styles.emptySubtitle}>Semua invoice QRIS telah diverifikasi atau tidak ada pembayaran menunggu konfirmasi.</Text>
                  </CardContent>
                </Card>
              ) : (
                invoices.map((invoice) => {
                  const cartItems = parseCartData(invoice.cart_data);
                  const cartText = cartItems
                    .map((item) => `${item.quantity ?? item.qty ?? 1}x ${item.name}`)
                    .join(", ");
                  const subtotal = typeof invoice.subtotal === 'string' ? parseFloat(invoice.subtotal) : invoice.subtotal;

                  return (
                    <Card key={invoice.id.toString()} style={styles.invoiceCard}>
                      <CardContent style={{ padding: 20 }}>
                        
                        <View style={styles.invoiceHeaderRow}>
                          <View>
                            <Text style={styles.invoiceTitle}>
                              {invoice.invoice_code}
                            </Text>
                            <Text style={styles.invoiceMeta}>{formatDate(invoice.created_at)}</Text>
                          </View>
                          <View style={[styles.statusBadge, { backgroundColor: "#fef7e0" }]}> 
                            <Text style={[styles.statusText, { color: "#b06000" }]}>Menunggu</Text>
                          </View>
                        </View>

                        <View style={styles.invoiceInfoBlock}>
                          <View style={styles.infoRow}>
                            <Icon name="person-circle-outline" size={16} color={theme.colors.mutedForeground} />
                            <Text style={styles.infoText}>
                            Pemilik Akun: <Text style={styles.boldText}>{invoice.user?.name || "Tidak Diketahui"}</Text>
                            </Text>
                          </View>
                          
                          <View style={styles.infoRow}>
                            <Icon name="person-outline" size={16} color={theme.colors.mutedForeground} />
                            <Text style={styles.infoText}>
                            Nama Pelanggan: <Text style={styles.boldText}>{invoice.customer_name}</Text>
                            </Text>
                          </View>

                          <View style={styles.infoRow}>
                            <Icon name="phone-portrait-outline" size={16} color={theme.colors.mutedForeground} />
                            <Text style={styles.infoText}>
                            Nomor Telepon: <Text style={styles.boldText}>{invoice.phone_number}</Text>
                            </Text>
                          </View>
                        </View>

                        <View style={styles.itemsWrapper}>
                          <Text style={styles.sectionSubTitle}>Item yang Dipesan:</Text>
                          <Text style={styles.orderItems}>{cartText}</Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={[styles.invoiceDetailRow, !isDesktop && { flexDirection: 'column', alignItems: 'flex-start', gap: 12 }]}>
                          <View style={{ justifyContent: "center" }}>
                            <Text style={styles.priceLabel}>Subtotal</Text>
                            <Text style={styles.orderTotal}>{formatCurrency(subtotal)}</Text>
                          </View>
                          
                          <View style={[{ flex: 1, marginLeft: 24, flexDirection: 'row', gap: 10, alignItems: 'center' }, !isDesktop && { flexDirection: 'column', marginLeft: 0, gap: 8, width: '100%' }]}>
                            <Button
                              title="Lihat Bukti"
                              variant="outline"
                              onPress={() => {
                                setSelectedPaymentProof(invoice.payment_proof);
                                setPaymentModalVisible(true);
                              }}
                              style={[styles.updateButton, !isDesktop && { width: '100%' }]}
                            />
                            <Button
                              title="Setujui"
                              onPress={() => approveInvoice(invoice.id)}
                              style={[styles.approveButton, !isDesktop && { width: '100%' }]}
                              variant="default"
                            />
                            <Button
                              title="Batalkan"
                              variant="outline"
                              onPress={() => cancelInvoice(invoice.id)}
                              style={[styles.cancelButton, !isDesktop && { width: '100%' }]}
                            />
                          </View>
                        </View>

                      </CardContent>
                    </Card>
                  );
                })
              )}
            </View>

            {/* KOLOM KANAN: PENDING INVOICES SUMMARY */}
            <View style={styles.rightColumn}>
              <Card style={styles.recentCard}>
                <CardContent style={{ padding: 20 }}>
                  <View style={styles.recentHeader}>
                    <Text style={styles.sectionTitle}>Ringkasan Pembayaran</Text>
                  </View>

                  <View style={styles.summaryInfoBlock}>
                    <View style={styles.summaryInfoRow}>
                      <Text style={styles.summaryInfoLabel}>Total Verifikasi Tertunda:</Text>
                      <Text style={styles.summaryInfoValue}>{paymentsSummary.totalPending}</Text>
                    </View>
                    <View style={styles.summaryInfoRow}>
                      <Text style={styles.summaryInfoLabel}>Nilai Total Tertunda:</Text>
                      <Text style={[styles.summaryInfoValue, { color: theme.colors.primary }]}>
                        {formatCurrency(paymentsSummary.totalPendingValue)}
                      </Text>
                    </View>
                  </View>

                  {invoices.length > 0 && (
                    <>
                      <View style={styles.divider} />
                      <Text style={[styles.sectionSubTitle, { marginTop: 12, marginBottom: 12 }]}>Invoice Menunggu Verifikasi:</Text>
                      {invoices.slice(0, 5).map((item) => (
                        <View key={item.id.toString()} style={styles.transactionRow}>
                          <View style={styles.transactionText}> 
                            <Text style={styles.transactionId}>{item.invoice_code}</Text>
                            <Text style={styles.transactionDate}>{item.customer_name}</Text>
                          </View>
                          <Text style={styles.recentRowPrice}>{formatCurrency(typeof item.subtotal === 'string' ? parseFloat(item.subtotal) : item.subtotal)}</Text>
                        </View>
                      ))}
                    </>
                  )}
                </CardContent>
              </Card>
            </View>
          </View>
        </>
      )}

      {/* PAYMENT PROOF MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={paymentModalVisible}
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bukti Pembayaran</Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <Icon name="close" size={24} color={theme.colors.foreground} />
              </TouchableOpacity>
            </View>
            {selectedPaymentProof && (
              <Image
                source={{ uri: selectedPaymentProof }}
                style={styles.paymentProofImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  root: { ...(Platform.OS === 'web' ? { flex: 1 } : {}), backgroundColor: theme.colors.background },
  content: { padding: spacing.xl, width: "100%", maxWidth: 1280, alignSelf: "center" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background },
  loadingText: { marginTop: 16, color: theme.colors.mutedForeground, fontWeight: "500" },
  header: { marginBottom: spacing.lg },
  title: { fontSize: 32, fontWeight: "800", color: theme.colors.foreground, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, marginTop: 6, color: theme.colors.mutedForeground, marginBottom: spacing.lg },
  
  // TAB NAVIGATION
  tabContainer: { 
    flexDirection: "row", 
    gap: 8, 
  },
  tabContainerDesktop: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 0,
    marginLeft: 'auto',
    alignItems: 'center',
  },
  headerRow: { marginBottom: spacing.lg },
  headerRowDesktop: { flexDirection: 'row', alignItems: 'center' },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  tabActiveButton: {
    backgroundColor: "#f97316",
    borderColor: "#fb923c",
  },
  tabInactiveButton: {
    backgroundColor: "#ffffff",
    borderColor: "#fb923c",
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fb923c",
  },
  tabButtonTextActive: {
    color: "#ffffff",
  },

  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginBottom: spacing.xl },
  summaryCard: { flex: 1, minWidth: 150, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.card },
  summaryLabel: { fontSize: 12, fontWeight: "700", color: theme.colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.8 },
  summaryValue: { marginTop: 10, fontSize: 24, fontWeight: "800", color: theme.colors.foreground, letterSpacing: -0.5 },
  mainSection: { flexDirection: "row", flexWrap: "wrap", gap: 24, alignItems: "stretch" },
  leftColumn: { flex: 2.3, minWidth: 280 },
  leftColumnMobile: { width: "100%", alignSelf: "stretch", minWidth: 0, flex: 0 },
  rightColumn: { flex: 1, minWidth: 260 },
  rightColumnMobile: { width: "100%", alignSelf: "stretch", minWidth: 0, flex: 0 },
  orderCard: { width: "100%", alignSelf: "stretch", marginBottom: 18, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.card },
  invoiceCard: { width: "100%", alignSelf: "stretch", marginBottom: 18, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.card },
  emptyCard: { borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, padding: spacing.lg },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: theme.colors.foreground, marginBottom: 6 },
  emptySubtitle: { color: theme.colors.mutedForeground, lineHeight: 20 },
  emptyMessageSmall: { textAlign: 'center', paddingVertical: 16, color: theme.colors.mutedForeground, fontSize: 13 },
  orderHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  invoiceHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  orderTitle: { fontSize: 18, fontWeight: "800", color: theme.colors.foreground },
  invoiceTitle: { fontSize: 18, fontWeight: "800", color: theme.colors.foreground },
  orderMeta: { color: theme.colors.mutedForeground, marginTop: 4, fontSize: 13 },
  invoiceMeta: { color: theme.colors.mutedForeground, marginTop: 4, fontSize: 13 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, minWidth: 90, alignItems: "center" },
  statusText: { fontWeight: "700", textTransform: "capitalize", fontSize: 12 },
  customerInfoBlock: { backgroundColor: "#fcfcfc", padding: 12, borderRadius: 8, gap: 6, marginBottom: 14, borderWidth: 1, borderColor: "#f1f3f4" },
  invoiceInfoBlock: { backgroundColor: "#fcfcfc", padding: 12, borderRadius: 8, gap: 6, marginBottom: 14, borderWidth: 1, borderColor: "#f1f3f4" },
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
  invoiceDetailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  selectWrapperWeb: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, backgroundColor: "#fff" },
  priceLabel: { fontSize: 12, color: theme.colors.mutedForeground, fontWeight: "500" },
  orderTotal: { fontWeight: "800", color: theme.colors.primary, fontSize: 18, marginTop: 2 },
  updateButton: { minHeight: 44, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, justifyContent: 'center', alignItems: 'center' },
  approveButton: { minHeight: 44, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  cancelButton: { minHeight: 44, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, justifyContent: 'center', alignItems: 'center' },
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
  
  // SUMMARY INFO BLOCK FOR PAYMENTS TAB
  summaryInfoBlock: { backgroundColor: "#fcfcfc", padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#f1f3f4", marginBottom: 12 },
  summaryInfoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  summaryInfoLabel: { fontSize: 13, color: theme.colors.mutedForeground, fontWeight: "500" },
  summaryInfoValue: { fontSize: 14, fontWeight: "700", color: theme.colors.foreground },

  // MODAL STYLES
  modalOverlay: { 
    flex: 1, 
    backgroundColor: "rgba(0, 0, 0, 0.8)", 
    justifyContent: "center", 
    alignItems: "center",
    padding: 16,
  },
  modalContent: { 
    backgroundColor: theme.colors.card, 
    borderRadius: 16, 
    width: "100%",
    maxWidth: 500,
    maxHeight: "80%",
  },
  modalHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.colors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: theme.colors.foreground },
  paymentProofImage: { width: "100%", height: "100%", borderRadius: 16 },

  errorCard: { marginBottom: spacing.lg, borderColor: theme.colors.destructive },
  errorText: { color: theme.colors.destructive, fontWeight: "600" },
});
