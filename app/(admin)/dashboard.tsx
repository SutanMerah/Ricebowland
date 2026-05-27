import { View, Text, StyleSheet, ScrollView, ActivityIndicator, useWindowDimensions, Platform, Modal, Image, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { useState, useEffect } from "react"; 

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Card, CardContent } from "@/components/ui/Card";

import { theme } from "@/constants/theme";
import { spacing } from "@/components/system";
import { API_BASE_URL } from "@/lib/api";

// Interface disesuaikan dengan skema flat database Laravel kamu
interface Order {
  id: number;
  user_id: number;
  customer_name: string;
  menu_id: number;
  qty: number; 
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Menu {
  id: number;
  name: string;
  price: string | number;
}

interface Invoice {
  id: number;
  invoice_code: string;
  user_id: number;
  customer_name: string;
  phone_number: string;
  subtotal: string | number;
  cart_data: string;
  status: string;
  payment_proof: string;
  created_at: string;
  user?: {
    id: number;
    name: string;
  };
}

// Interface hasil grouping transaksional
interface GroupedTransaction {
  displayId: string;
  created_at: string;
  status: string;
  itemsString: string;
  totalPrice: number;
  timeLabel: string;
}

export default function AdminDashboard() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [orders, setOrders] = useState<Order[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPaymentProof, setSelectedPaymentProof] = useState<string | null>(null);

  const fetchDashboardData = async (showSpinner = true) => {
    try {
      if (showSpinner) {
        setIsLoading(true);
      }

      const [ordersRes, menusRes, invoicesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/orders`),
        fetch(`${API_BASE_URL}/menus`),
        fetch(`${API_BASE_URL}/invoices/pending`)
      ]);

      const ordersData = await ordersRes.json();
      const menusData = await menusRes.json();
      const invoicesData = await invoicesRes.json();

      // Ambil array langsung atau fallback data jika terbungkus objek
      const orderList = Array.isArray(ordersData) ? ordersData : (ordersData.data || []);
      const menuList = Array.isArray(menusData) ? menusData : (menusData.data || []);
      const invoiceList = Array.isArray(invoicesData) ? invoicesData : (invoicesData.data || []);

      setOrders(orderList);
      setMenus(menuList);
      setInvoices(invoiceList);
    } catch (error) {
      console.error("Gagal mengambil data dari API backend:", error);
    } finally {
      if (showSpinner) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchDashboardData(true);

    const interval = setInterval(() => {
      fetchDashboardData(false);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Format penanggalan teks transaksi persis seperti di dashboard customer
  const formatFigmaDate = (dateString: string) => {
    if (!dateString || dateString === "unknown") return "Hari Ini";
    try {
      const date = new Date(dateString);
      const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
      const formattedDate = date.toLocaleDateString("en-US", options); 
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${formattedDate} at ${hours}:${minutes}`;
    } catch {
      return dateString;
    }
  };

// =========================================================================
  // 🌟 LOGIKA GROUPING TERBARU: SINKRON DENGAN CUSTOMER BLUEPRINT
  // =========================================================================
  const getGroupedTransactions = (): GroupedTransaction[] => {
    const groups: Record<string, any> = {};

    orders.forEach((item) => {
      // Kelompokkan berdasarkan tanggal murni (Y-m-d) + user_id agar keranjang belanja menyatu
      const rawDate = item.created_at ? item.created_at.split(' ')[0] : "unknown";
      const groupKey = `${rawDate}_US${item.user_id}`;

      if (!groups[groupKey]) {
        const year = item.created_at ? new Date(item.created_at).getFullYear() : 2026;
        const userCode = String(item.user_id || 0).padStart(2, '0');
        const month = item.created_at ? (new Date(item.created_at).getMonth() + 1) : 5;

        groups[groupKey] = {
          // Display ID dinamis yang rapi menyesuaikan dashboard customer
          displayId: `ORD-${year}-${userCode}${month}-${item.id}`,
          created_at: item.created_at,
          status: item.status || "pending",
          subItems: [],
          totalPrice: 0
        };
      }

      // Ambil detail menu dari backend
      const menuDetail = menus.find(m => m.id === item.menu_id) || { name: item.customer_name || `Menu ID: ${item.menu_id}`, price: 0 };
      const itemQty = item.qty || 1;
      
      // Deteksi jika harga bertipe string (misal dari Laravel), konversi ke angka aman
      const cleanPrice = typeof menuDetail.price === 'string' ? parseFloat(menuDetail.price) : (menuDetail.price || 0);
      const itemSubtotal = cleanPrice * itemQty;

      groups[groupKey].subItems.push({
        name: menuDetail.name,
        qty: itemQty
      });

      groups[groupKey].totalPrice += itemSubtotal;
      
      // Jika salah satu item sudah divalidasi, ikuti status terupdate
      if (item.status !== "pending") {
        groups[groupKey].status = item.status;
      }
    });

    const finalArray: GroupedTransaction[] = Object.values(groups).map((group: any) => {
      const itemsString = group.subItems
        .map((si: any) => `${si.qty}x ${si.name}`)
        .join(", ");

      let briefTime = "00:00";
      try {
        if (group.created_at) {
          const d = new Date(group.created_at);
          briefTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }
      } catch {}

      return {
        displayId: group.displayId,
        created_at: group.created_at,
        status: group.status,
        itemsString: itemsString,
        totalPrice: group.totalPrice,
        timeLabel: briefTime
      };
    });

    return finalArray.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const groupedTransactions = getGroupedTransactions();

  // 1. Kalkulasi Total Sales hari ini dari transaksi kelompok yang sukses
  const totalSalesToday = groupedTransactions
    .filter(t => t.status.toLowerCase() === "completed" || t.status.toLowerCase() === "success" || t.status.toLowerCase() === "ready")
    .reduce((sum, t) => sum + t.totalPrice, 0);

  // 2. Jumlah total nota transaksi unik
  const totalTransactions = groupedTransactions.length;

  // 3. Jumlah nota transaksi yang masih pending/belum diverifikasi admin
  const pendingOrdersCount = groupedTransactions.filter(
    t => t.status.toLowerCase() === "pending" || t.status.toLowerCase() === "processing"
  ).length;

  // 4. Jumlah pending QRIS verifications
  const pendingQRISCount = invoices.length;

  // 5. Cari menu terlaris berdasarkan kuantitas murni item yang terjual
  const getBestSellingMenu = (): string => {
    if (orders.length === 0 || menus.length === 0) return "No Data Available";
    
    const freqMap: { [key: string]: number } = {};
    orders.forEach(order => {
      const menuDetail = menus.find(m => m.id === order.menu_id);
      const name = menuDetail ? menuDetail.name : `Menu ID: ${order.menu_id}`;
      freqMap[name] = (freqMap[name] || 0) + Number(order.qty || 1);
    });

    const sorted = Object.entries(freqMap).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : "No Items Ordered"; 
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "success":
      case "ready":
        return { bg: "#e6f4ea", text: "#137333" };
      case "processing":
        return { bg: "#fef7e0", text: "#b06000" };
      case "pending":
        return { bg: "#fce8e6", text: "#c5221f" }; 
      default:
        return { bg: "#f1f3f4", text: "#3c4043" };
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 12, color: theme.colors.mutedForeground, fontWeight: "500" }}>Loading Dashboard Data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[styles.centerWrapper, { paddingHorizontal: isDesktop ? 40 : 16 }]}
    >
      <View style={styles.mainContentBlock}>
        {/* 1. HEADER SECTION */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.foreground }]}>
            Admin Dashboard
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.mutedForeground }]}>
            Welcome back, here's what's happening today
          </Text>
        </View>

        {/* 2. SUMMARY GRID - REORDERED WITH NEW QRIS CARD */}
        <View style={[styles.grid, !isDesktop && { justifyContent: 'space-between' }]}>
          {/* Card 1: Total Sales */}
          <Card style={[styles.summaryCard, !isDesktop && styles.summaryCardMobile]}>
            <CardContent style={styles.cardContentFlex}>
              <View style={[styles.iconCircle, { backgroundColor: "#fef3eb" }]}>
                <Icon name="cash" size={20} color={theme.colors.primary} />
              </View>
              <Text style={styles.cardTimeLabel}>Today</Text>
              <View style={styles.cardBottomTextGroup}>
                <Text style={[styles.cardNumber, { color: theme.colors.foreground }]}>
                  Rp {totalSalesToday.toLocaleString("id-ID")}
                </Text>
                <Text style={[styles.cardLabel, { color: theme.colors.mutedForeground }]}>
                  Total Sales
                </Text>
              </View>
            </CardContent>
          </Card>

          {/* Card 2: Best Seller */}
          <Card style={[styles.summaryCard, !isDesktop && styles.summaryCardMobile]}>
            <CardContent style={styles.cardContentFlex}>
              <View style={[styles.iconCircle, { backgroundColor: "#fef3eb" }]}>
                <Icon name="trending-up" size={20} color={theme.colors.primary} />
              </View>
              <Text style={styles.cardTimeLabel}>Top Item</Text>
              <View style={styles.cardBottomTextGroup}>
                <Text style={[styles.cardSmallTitle, { color: theme.colors.foreground }]} numberOfLines={1}>
                  {getBestSellingMenu()}
                </Text>
                <Text style={[styles.cardLabel, { color: theme.colors.mutedForeground }]}>
                  Best Seller
                </Text>
              </View>
            </CardContent>
          </Card>

          {/* Card 3: Pending Orders (renamed from Pending Confirmation) */}
          <Card style={[styles.summaryCard, !isDesktop && styles.summaryCardMobile]}>
            <CardContent style={styles.cardContentFlex}>
              <View style={[styles.iconCircle, { backgroundColor: "#fce8e6" }]}>
                <Icon name="time" size={20} color={theme.colors.destructive} />
              </View>
              <Text style={[styles.cardTimeLabel, { color: theme.colors.destructive }]}>Alert</Text>
              <View style={styles.cardBottomTextGroup}>
                <Text style={[styles.cardNumber, { color: theme.colors.foreground }]}>
                  {pendingOrdersCount}
                </Text>
                <Text style={[styles.cardLabel, { color: theme.colors.mutedForeground }]}>
                  Pending Orders
                </Text>
              </View>
            </CardContent>
          </Card>

          {/* Card 4: Pending QRIS Verification (NEW) */}
          <Card style={[styles.summaryCard, !isDesktop && styles.summaryCardMobile]}>
            <CardContent style={styles.cardContentFlex}>
              <View style={[styles.iconCircle, { backgroundColor: "#fbf6e3" }]}>
                <Icon name="document-text" size={20} color="#b06000" />
              </View>
              <Text style={[styles.cardTimeLabel, { color: "#b06000" }]}>Verifikasi</Text>
              <View style={styles.cardBottomTextGroup}>
                <Text style={[styles.cardNumber, { color: theme.colors.foreground }]}>
                  {pendingQRISCount}
                </Text>
                <Text style={[styles.cardLabel, { color: theme.colors.mutedForeground }]}>
                  Pending QRIS
                </Text>
              </View>
            </CardContent>
          </Card>
        </View>

        {/* 3. MAIN WORKSPACE SPLIT LAYOUT */}
        <View style={[styles.workspaceLayout, !isDesktop && { flexDirection: 'column' }] }>
          
          {/* KOLOM KIRI: RECENT TRANSACTIONS TABLE */}
          <View style={[styles.leftColumn, !isDesktop && { width: '100%' }]}>
            <Card style={styles.tableCardOuter}>
              <CardContent style={{ padding: 24 }}>
                <View style={styles.tableHeaderSection}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
                    Recent Transactions
                  </Text>
                  <Button title="View All" variant="outline" style={styles.viewAllButton} onPress={() => router.push("/(admin)/transactions")} />
                </View>

                {/* TABLE HEADERS */}
                <View style={[styles.tableRowHeader, { borderBottomColor: theme.colors.border }]}>
                  <Text style={[styles.thText, { flex: 2.2 }]}>Order ID</Text>
                  <Text style={[styles.thText, { flex: 3.3 }]}>Items</Text>
                  <Text style={[styles.thText, { flex: 1.5, textAlign: 'right' }]}>Total</Text>
                  <Text style={[styles.thText, { flex: 1.5, textAlign: 'center' }]}>Status</Text>
                  <Text style={[styles.thText, { flex: 1.2, textAlign: 'right' }]}>Time</Text>
                </View>

                {/* TABLE BODY ROWS */}
                {groupedTransactions.length === 0 ? (
                  <Text style={{ textAlign: 'center', paddingVertical: 24, color: theme.colors.mutedForeground }}>No transactions recorded today</Text>
                ) : (
                  groupedTransactions.slice(0, 5).map((item, idx) => {
                    const statusStyle = getStatusStyle(item.status);
                    // Desktop: tampilkan sebagai baris tabel
                    if (isDesktop) {
                      return (
                        <View key={item.displayId} style={[styles.tableDataRow, { borderBottomColor: idx === 4 || idx === groupedTransactions.length - 1 ? 'transparent' : '#f1f3f4' }]}>
                          <Text style={[styles.tdOrderId, { flex: 2.2, color: theme.colors.foreground }]}>
                            {item.displayId}
                          </Text>
                          <Text style={[styles.tdItemsText, { flex: 3.3, color: theme.colors.mutedForeground }]} numberOfLines={1}>
                            {item.itemsString}
                          </Text>
                          <Text style={[styles.tdTotalText, { flex: 1.5, textAlign: 'right', color: theme.colors.foreground }]}>
                            Rp {item.totalPrice.toLocaleString("id-ID")}
                          </Text>
                          <View style={{ flex: 1.5, alignItems: 'center' }}>
                            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}> 
                              <Text style={[styles.statusBadgeText, { color: statusStyle.text, textTransform: 'capitalize' }]}>{item.status}</Text>
                            </View>
                          </View>
                          <Text style={[styles.tdTimeText, { flex: 1.2, textAlign: 'right', color: theme.colors.mutedForeground }]}>
                            {item.timeLabel}
                          </Text>
                        </View>
                      );
                    }

                    // Mobile: tampilkan sebagai kartu ringkas agar badge tidak overlap
                    return (
                      <View key={item.displayId} style={[styles.transactionCardMobile, { borderBottomColor: idx === 4 || idx === groupedTransactions.length - 1 ? 'transparent' : '#f1f3f4' }]}>
                        <View style={styles.transactionCardTop}>
                          <Text style={styles.transactionIdMobile} numberOfLines={1}>{item.displayId}</Text>
                          <View style={[styles.transactionBadgeMobile, { backgroundColor: statusStyle.bg }]}>
                            <Text style={[styles.transactionBadgeTextMobile, { color: statusStyle.text }]}>{item.status}</Text>
                          </View>
                        </View>

                        <Text style={styles.transactionItemsMobile} numberOfLines={1}>{item.itemsString}</Text>

                        <View style={styles.transactionCardBottom}>
                          <Text style={styles.recentRowPriceMobile}>Rp {item.totalPrice.toLocaleString("id-ID")}</Text>
                          <Text style={styles.transactionDateMobile}>{item.timeLabel}</Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* RECENT QRIS SUBMISSIONS MOVED TO LEFT COLUMN */}
            {pendingQRISCount > 0 && (
              <Card style={[styles.invoicePreviewCard, { marginTop: 18 }]}> 
                <CardContent style={{ padding: 20 }}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.foreground, marginBottom: 14 }]}>Recent QRIS Submissions</Text>
                  {invoices.slice(0, 3).map((invoice, idx) => {
                    const subtotal = typeof invoice.subtotal === 'string' ? parseFloat(invoice.subtotal) : invoice.subtotal;
                    return (
                      <View 
                        key={invoice.id} 
                        style={[
                          styles.invoicePreviewItem,
                          { borderBottomWidth: idx === invoices.slice(0, 3).length - 1 ? 0 : 1 }
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.invoicePreviewCode}>{invoice.invoice_code}</Text>
                          <Text style={styles.invoicePreviewCustomer}>{invoice.customer_name}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.invoicePreviewAmount}>Rp {subtotal.toLocaleString("id-ID")}</Text>
                          <TouchableOpacity 
                            onPress={() => {
                              setSelectedPaymentProof(invoice.payment_proof);
                              setPaymentModalVisible(true);
                            }}
                            style={styles.previewPhotoButton}
                          >
                            <Text style={styles.previewPhotoText}>Lihat</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </View>

          {/* KOLOM KANAN: QUICK ACTIONS */}
          <View style={[styles.rightColumn, !isDesktop && { width: '100%', marginTop: 16 }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.foreground, marginBottom: 16 }]}>
              Quick Actions
            </Text>
            
            <View style={styles.actionsContainer}>
              <Button
                title="View Transactions"
                onPress={() => router.push("/(admin)/transactions")}
                style={[styles.primaryActionButton, !isDesktop && { width: '100%' }]}
              />
              <Button
                title="📊 View Reports"
                variant="outline"
                onPress={() => router.push("/(admin)/reports")}
                style={[styles.outlineActionButton, !isDesktop && { width: '100%' }]}
              />
              <Button
                title="🍔 Manage Menu"
                variant="outline"
                onPress={() => router.push("/(admin)/menu-management")}
                style={[styles.outlineActionButton, !isDesktop && { width: '100%' }]}
              />
            </View>

            {/* ALERT: PENDING ORDERS */}
            <Card style={[styles.alertCard, { backgroundColor: "#fff8f8", borderColor: "#fde8e8" }]}>
              <CardContent style={{ padding: 20 }}>
                <View style={styles.alertFlexContainer}>
                  <View style={[styles.iconCircle, { backgroundColor: "#fce8e6", alignSelf: 'flex-start' }]}>
                    <Icon name="time" size={20} color={theme.colors.destructive} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.alertTitle, { color: "#a51d24" }]}>
                      Pending Order Actions
                    </Text>
                    <Text style={[styles.alertText, { color: "#cb2431", marginTop: 4 }]}>
                      {pendingOrdersCount} orders waiting for verification
                    </Text>
                    <Button 
                      title="Konfirmasi Pesanan" 
                      variant="outline" 
                      style={[styles.alertViewButton, { borderColor: theme.colors.destructive }]}
                      onPress={() => router.push("/(admin)/transactions")} 
                    />
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* ALERT: PENDING QRIS VERIFICATIONS (NEW) */}
            {pendingQRISCount > 0 && (
              <Card style={[styles.alertCard, { backgroundColor: "#fffbf0", borderColor: "#ffe5cc" }]}>
                <CardContent style={{ padding: 20 }}>
                  <View style={styles.alertFlexContainer}>
                    <View style={[styles.iconCircle, { backgroundColor: "#fbf6e3", alignSelf: 'flex-start' }]}>
                      <Icon name="document-text" size={20} color="#b06000" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.alertTitle, { color: "#7a4200" }]}>
                        Pending QRIS Verifications
                      </Text>
                      <Text style={[styles.alertText, { color: "#b06000", marginTop: 4 }]}>
                        {pendingQRISCount} payment proof(s) waiting for review
                      </Text>
                      <Button 
                        title="Tinjau Pembayaran" 
                        variant="outline" 
                        style={[styles.alertViewButton, { borderColor: "#b06000" }]}
                        onPress={() => router.push("/(admin)/transactions")} 
                      />
                    </View>
                  </View>
                </CardContent>
              </Card>
            )}

</View>

        </View>
      </View>

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
  container: {
    flex: 1,
  },
  centerWrapper: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 40, 
  },
  mainContentBlock: {
    width: "100%",
    maxWidth: 1280, 
    gap: 28, 
  },
  header: {
    marginBottom: 4,
  },
  title: {
    fontSize: 32, 
    fontWeight: "800",
    letterSpacing: -0.75,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 6,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24, 
    justifyContent: "space-between",
  },
  summaryCard: {
    flex: 1,
    minHeight: 140, 
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1f3f4", 
    backgroundColor: "#ffffff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  cardContentFlex: {
    padding: 20,
    justifyContent: "space-between",
    ...Platform.select({ web: { height: "100%" }, default: {} }),
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTimeLabel: {
    position: "absolute",
    right: 20,
    top: 20,
    fontSize: 12,
    color: theme.colors.mutedForeground,
    fontWeight: "600",
  },
  cardBottomTextGroup: {
    marginTop: 16,
  },
  cardNumber: {
    fontSize: 26, 
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  cardSmallTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  cardLabel: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: "500",
  },
  summaryCardMobile: {
    width: '48%',
    minWidth: 140,
    marginBottom: spacing.md,
  },
  workspaceLayout: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 32, 
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginTop: 8,
  },
  leftColumn: {
    flex: 2.5, 
    minWidth: 280,
  },
  rightColumn: {
    flex: 1,  
    minWidth: 260,
    gap: 24,
  },
  tableCardOuter: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1f3f4",
    backgroundColor: "#ffffff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  tableHeaderSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20, 
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  viewAllButton: {
    paddingHorizontal: 16,
    minHeight: 40,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableRowHeader: {
    flexDirection: "row",
    paddingBottom: 12,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  thText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#70757a", 
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  tableDataRow: {
    flexDirection: "row",
    paddingVertical: 18, 
    borderBottomWidth: 1,
    alignItems: "center",
  },
  tdOrderId: {
    fontWeight: "700",
    fontSize: 14,
  },
  tdItemsText: {
    fontSize: 14,
    fontWeight: "500",
  },
  tdTotalText: {
    fontWeight: "700",
    fontSize: 14,
  },
  tdTimeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20, 
    minWidth: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  // Mobile transaction card styles
  transactionCardMobile: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    backgroundColor: "#ffffff",
  },
  transactionCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionIdMobile: { fontWeight: '700', fontSize: 14, flex: 1, marginRight: 8 },
  transactionBadgeMobile: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, alignSelf: 'flex-start' },
  transactionBadgeTextMobile: { fontWeight: '700', fontSize: 12 },
  transactionItemsMobile: { color: theme.colors.mutedForeground, marginBottom: 8 },
  transactionCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recentRowPriceMobile: { fontWeight: '700', color: theme.colors.foreground },
  transactionDateMobile: { color: theme.colors.mutedForeground, fontSize: 12 },
  actionsContainer: {
    gap: 12,
  },
  primaryActionButton: {
    backgroundColor: theme.colors.primary,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineActionButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderColor: "#e0e0e0",
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertCard: {
    borderRadius: 16,
    borderWidth: 1,
  },
  alertFlexContainer: {
    flexDirection: "row",
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  alertText: {
    fontSize: 13,
    fontWeight: "500",
  },
  alertViewButton: {
    marginTop: 14,
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderColor: "#fccbc7",
    backgroundColor: "#fff",
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // NEW STYLES FOR INVOICE PREVIEW
  invoicePreviewCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ffe5cc",
    backgroundColor: "#fffbf0",
  },
  invoicePreviewItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomColor: "#f1f3f4",
  },
  invoicePreviewCode: {
    fontWeight: "700",
    fontSize: 13,
    color: theme.colors.foreground,
  },
  invoicePreviewCustomer: {
    fontSize: 12,
    color: theme.colors.mutedForeground,
    marginTop: 2,
  },
  invoicePreviewAmount: {
    fontWeight: "700",
    fontSize: 13,
    color: "#b06000",
  },
  previewPhotoButton: {
    marginTop: 4,
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#b06000",
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewPhotoText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
  },

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
    overflow: "hidden",
  },
  modalHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: "800", 
    color: theme.colors.foreground 
  },
  paymentProofImage: { 
    width: "100%", 
    height: 400,
  },
});