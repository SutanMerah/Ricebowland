import { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

import { theme } from "@/constants/theme";
import { spacing, radius } from "@/components/system";
import { useAuth } from "@/components/system/AuthContext"; // 👈 1. Import Autentikasi
import { API_BASE_URL } from "@/lib/api";

export default function CustomerDashboardCombined() {
  const { user } = useAuth(); // 👈 2. Ambil data user yang sedang aktif login
  const params = useLocalSearchParams();
  
  const [hasOrder, setHasOrder] = useState(false);
  const [groupedOrders, setGroupedOrders] = useState<any[]>([]); 
  const [loading, setLoading] = useState(false);
  const [menuMap, setMenuMap] = useState<Record<number, { name: string; price: number }>>({});

  const formatFigmaDate = (dateString: string) => {
    if (!dateString) return "Hari Ini";
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
    const formattedDate = date.toLocaleDateString("en-US", options); 
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${formattedDate} at ${hours}:${minutes}`;
  };

  const isWithinLastDays = (dateString: string, days: number) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return false;

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    return diffMs >= 0 && diffMs <= days * 24 * 60 * 60 * 1000;
  };

  const groupLaravelOrders = (rawOrders: any[]) => {
    const groups: Record<string, any> = {};

    rawOrders.forEach((item) => {
      const groupKey = item.created_at || "unknown";

      if (!groups[groupKey]) {
        groups[groupKey] = {
          displayId: `ORD-${new Date(groupKey).getFullYear()}-${String(item.user_id).padStart(2, '0')}${new Date(groupKey).getMonth() + 1}-${item.id}`,
          created_at: groupKey,
          status: item.status || "pending",
          items: [],
          totalPrice: 0
        };
      }

      const menuDetail = menuMap[item.menu_id] || { name: `Menu ID: ${item.menu_id}`, price: 0 };
      const itemQty = item.qty || item.quantity || 1;
      const itemSubtotal = menuDetail.price * itemQty;

      groups[groupKey].items.push({
        menuId: item.menu_id,
        name: menuDetail.name,
        price: menuDetail.price,
        qty: itemQty,
        subtotal: itemSubtotal
      });

      groups[groupKey].totalPrice += itemSubtotal;
    });

    return Object.values(groups).reverse(); 
  };

const fetchOrdersFromLaravel = async (showSpinner = true) => {
    // Jika user belum termuat (masih proses re-hydrate session), tunggu sebentar
    if (!user || !user.id) return; 

    if (showSpinner) {
      setLoading(true);
    }
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const result = await response.json();
        // Antisipasi jika data dibungkus dalam bentuk array langsung atau properti .data
        const orderList = Array.isArray(result) ? result : (result.data || []);
        
        // 🔒 PERBAIKAN LOGIKA: Paksa kedua ID menjadi tipe Number agar sinkron!
        const myOrders = orderList.filter((order: any) => Number(order.user_id) === Number(user.id));
        const filteredOrders = myOrders.filter((order: any) => {
          const status = String(order.status || "").toLowerCase();
          if (status !== "completed") return true;
          return isWithinLastDays(order.created_at, 3);
        });

        if (filteredOrders.length > 0) {
          const dynamicGrouped = groupLaravelOrders(filteredOrders);
          setGroupedOrders(dynamicGrouped);
          setHasOrder(true);
        } else {
          setGroupedOrders([]);
          setHasOrder(false);
        }
      } else {
        console.error("Respons server tidak oke:", response.status);
      }
    } catch (error) {
      console.error("Gagal mengambil data dari Laravel:", error);
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  };

  const loadMenuMap = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/menus`);
      if (!response.ok) return;

      const data = await response.json();
      const parsedMenus = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];

      const mapping = parsedMenus.reduce((acc: Record<number, { name: string; price: number }>, item: any) => {
        if (item?.id != null) {
          acc[Number(item.id)] = {
            name: item.name ?? `Menu ID: ${item.id}`,
            price: typeof item.price === "number" ? item.price : Number(item.price) || 0,
          };
        }
        return acc;
      }, {});

      setMenuMap(mapping);
    } catch (error) {
      console.warn("Gagal memuat daftar menu untuk dashboard:", error);
    }
  };

  useEffect(() => {
    loadMenuMap();

    const menuInterval = setInterval(() => {
      loadMenuMap();
    }, 30000);

    return () => clearInterval(menuInterval);
  }, []);

  // 🚀 Jalankan fetch ulang jika ada parameter order baru ATAU saat data user selesai dimuat ulang (anti-refresh)
  useEffect(() => {
    fetchOrdersFromLaravel(true);

    const orderInterval = setInterval(() => {
      fetchOrdersFromLaravel(false);
    }, 30000);

    return () => clearInterval(orderInterval);
  }, [params.hasOrder, user?.id, menuMap]); 

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case "processing":
      case "pending":
        return { backgroundColor: theme.colors.secondary };
      case "ready":
      case "completed":
        return { backgroundColor: theme.colors.primary };
      default:
        return { backgroundColor: theme.colors.muted };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "processing":
      case "pending":
        return "time";
      case "ready":
      case "completed":
        return "checkmark-circle";
      default:
        return "bag";
    }
  };

  if (loading) {
    return (
      <View style={[styles.scrollView, { justifyContent: 'center', alignItems: 'center', flex: 1 }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 10, color: theme.colors.mutedForeground }}>Memuat data pesanan...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      {/* HEADER SECTION */}
      <View style={styles.header}>
        {/* 🚀 4. DINAMIS: Sapa pelanggan berdasarkan nama akun asli di database */}
        <Text style={[styles.title, { color: theme.colors.foreground }]}>
          Hello, {user?.name || "Customer"}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.mutedForeground }]}>Welcome back to BowlHub</Text>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>Order Status</Text>

      {!hasOrder ? (
        <View style={styles.emptyCard}>
          <View style={styles.iconCircle}>
            <Icon name="bag-handle-outline" size={40} color={theme.colors.primary} />
          </View>
          <Text style={styles.cardTitle}>No orders yet</Text>
          <Text style={styles.cardSub}>Start ordering your favorite meals</Text>
          <Button title="Order Now" onPress={() => router.push("/(customer)/menu")} style={styles.buttonEmpty} />
        </View>
      ) : (
        groupedOrders.map((order: any, index: number) => (
          <Card key={order.created_at || index} style={{ marginBottom: 16 }}>
            <CardContent>
              {/* ORDER HEADER */}
              <View style={[styles.orderHeader, { borderBottomColor: theme.colors.border }]}>
                <View style={{ flex: 1 }}>
                  <View style={styles.row}>
                    <Icon name="bag" size={18} color={theme.colors.primary} />
                    <Text style={[styles.orderId, { color: theme.colors.foreground }]}>
                      Order #{order.displayId}
                    </Text>
                  </View>
                  <Text style={[styles.meta, { color: theme.colors.mutedForeground, marginTop: 4 }]}>
                    {formatFigmaDate(order.created_at)}
                  </Text>
                  <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
                    Dine In
                  </Text>
                </View>

                {/* BADGE STATUS */}
                <View style={[styles.statusBase, getStatusStyle(order.status)]}>
                  <Icon name={getStatusIcon(order.status)} size={16} color={theme.colors.primaryForeground} />
                  <Text style={[styles.statusText, { color: theme.colors.primaryForeground, textTransform: 'capitalize' }]}>
                    {order.status}
                  </Text>
                </View>
              </View>

              {/* ITEMS LIST */}
              <Text style={[styles.subTitle, { color: theme.colors.foreground, marginBottom: 8 }]}>
                Order Items
              </Text>

              <View style={styles.items}>
                {order.items.map((subItem: any, subIndex: number) => (
                  <View key={subIndex} style={[styles.itemRow, { backgroundColor: theme.colors.muted, marginBottom: 6, borderRadius: 8 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemName, { color: theme.colors.foreground, fontWeight: '600' }]}>
                        {subItem.name}
                      </Text>
                      <Text style={[styles.itemMeta, { color: theme.colors.mutedForeground }]}>
                        Rp {subItem.price.toLocaleString("id-ID")} × {subItem.qty} pcs
                      </Text>
                    </View>
                    <Text style={{ fontWeight: '700', color: theme.colors.foreground, alignSelf: 'center', marginRight: 10 }}>
                      Rp {subItem.subtotal.toLocaleString("id-ID")}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: theme.colors.border, marginTop: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.foreground }}>Total</Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: theme.colors.primary }}>
                  Rp {order.totalPrice.toLocaleString("id-ID")}
                </Text>
              </View>

              <View style={styles.actions}>
                <Button title="Order Again" onPress={() => router.push("/(customer)/menu")} style={{ flex: 1 }} />
                <Button title="Refresh Status" variant="outline" onPress={fetchOrdersFromLaravel} style={{ flex: 1 }} />
              </View>
            </CardContent>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#FDFCF8", 
  },
  container: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.xl,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  emptyCard: {
    backgroundColor: theme.colors.background,
    borderRadius: radius.lg,
    padding: spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    marginTop: 20,
    width: '100%',
    minHeight: 350, 
    borderWidth: 1,
    borderColor: theme.colors.border, 
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFF5ED",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.foreground,
  },
  cardSub: {
    fontSize: 14,
    color: theme.colors.mutedForeground,
    textAlign: "center",
    marginTop: 8,
    marginBottom: spacing.xl,
  },
  buttonEmpty: {
    paddingHorizontal: 40,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  orderId: {
    fontWeight: "700",
  },
  meta: {
    fontSize: 12,
  },
  statusBase: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    height: 32,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  subTitle: {
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  items: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  itemName: {
    fontWeight: "600",
  },
  itemMeta: {
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
});