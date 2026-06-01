import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { Link } from "expo-router";
import { ShoppingBag } from "lucide-react-native";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { theme } from "@/constants/theme";
import { useAuth } from "@/components/system/AuthContext";
import { apiFetch } from "@/lib/fetch";
import { spacing } from "@/components/system";


export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const groupOrders = (rawOrders: any[]) => {
    const groups: Record<string, any> = {};

    rawOrders.forEach((order) => {
      // 🚀 Group menggunakan order_code dari backend (bukan created_at)
      const groupKey = order.order_code || `order-${order.id}`;
      if (!groups[groupKey]) {
        groups[groupKey] = {
          order_code: order.order_code,  // 🚀 Gunakan order_code real dari database
          created_at: order.created_at,
          status: order.status || "completed",
          items: [],
          totalPrice: 0,
        };
      }

      const price = Number(order.menu?.price || order.price || 0);
      const qty = order.qty || order.quantity || 1;
      groups[groupKey].items.push({
        name: order.menu?.name || `Menu ID: ${order.menu_id}`,
        qty,
        price,
        subtotal: price * qty,
      });
      groups[groupKey].totalPrice += price * qty;
    });

    return Object.values(groups).reverse();
  };

  const isWithinLastDays = (dateString: string, days: number) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return false;

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    return diffMs >= 0 && diffMs <= days * 24 * 60 * 60 * 1000;
  };

  const fetchOrderHistory = async (showSpinner = true) => {
    if (!user?.id) {
      if (showSpinner) {
        setLoading(false);
      }
      return;
    }

    if (showSpinner) {
      setLoading(true);
    }
    try {
      const result = await apiFetch("/orders", {
        method: "GET",
      });
      const orderList = Array.isArray(result) ? result : result.data || [];
      const historyOrders = orderList.filter((order: any) => {
        const status = String(order.status || "").toLowerCase();
        if (Number(order.user_id) !== Number(user.id)) return false;
        if (status === "completed" || status === "success") {
          return !isWithinLastDays(order.created_at, 3);
        }
        if (status === "cancelled") {
          return !isWithinLastDays(order.created_at, 3);
        }
        return false;
      });

      setOrders(groupOrders(historyOrders));
    } catch (error) {
      console.error("Gagal memuat pesanan historis:", error);
      setOrders([]);
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchOrderHistory(true);

    const interval = setInterval(() => {
      fetchOrderHistory(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [user?.id]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}> 
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 12, color: theme.colors.mutedForeground }}>Memuat pesanan Anda...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.foreground }]}>Riwayat Pesanan</Text>
        <Text style={[styles.subtitle, { color: theme.colors.mutedForeground }]}>Menampilkan pesanan selesai dan batal yang sudah keluar dari dashboard utama.</Text>
      </View>

      {orders.length === 0 ? (
        <View style={styles.center}>
          <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}> 
            <View style={[styles.iconWrap, { backgroundColor: theme.colors.muted }]}> 
              <ShoppingBag size={48} color={theme.colors.primary} strokeWidth={1.5} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.foreground }]}>Belum ada pesanan selesai</Text>
            <Text style={[styles.emptyDesc, { color: theme.colors.mutedForeground }]}>Pesanan selesai akan muncul di halaman ini.</Text>
            <Link href="/menu" asChild>
              <Button title="Lihat Menu" />
            </Link>
          </View>
        </View>
      ) : (
        orders.map((order, index) => (
          <Card key={`${order.order_code}-${index}`} style={styles.orderCard}>
            <CardContent>
              <View style={styles.orderHeader}>
                {/* 🚀 Tampilkan order_code real dari database */}
                <Text style={[styles.orderId, { color: theme.colors.foreground }]}>{order.order_code || `Order #${order.id}`}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{order.status}</Text>
                </View>
              </View>

              <Text style={[styles.orderDate, { color: theme.colors.mutedForeground }]}>{new Date(order.created_at).toLocaleString("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</Text>

              <View style={styles.itemsContainer}>
                {order.items.map((item: any, idx: number) => (
                  <View key={`${order.order_code}-item-${idx}`} style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemName, { color: theme.colors.foreground }]}>{item.name}</Text>
                      <Text style={[styles.itemMeta, { color: theme.colors.mutedForeground }]}>Rp {item.price.toLocaleString("id-ID")} × {item.qty}</Text>
                    </View>
                    <Text style={[styles.itemTotal, { color: theme.colors.foreground }]}>Rp {item.subtotal.toLocaleString("id-ID")}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: theme.colors.mutedForeground }]}>Total</Text>
                <Text style={[styles.totalValue, { color: theme.colors.primary }]}>Rp {order.totalPrice.toLocaleString("id-ID")}</Text>
              </View>
            </CardContent>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 32,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  iconWrap: {
    padding: 20,
    borderRadius: 999,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
  },
  emptyDesc: {
    marginBottom: 20,
    textAlign: "center",
  },
  orderCard: {
    marginBottom: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "700",
  },
  statusBadge: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  statusText: {
    color: theme.colors.primaryForeground,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  orderDate: {
    marginBottom: 14,
    fontSize: 13,
  },
  itemsContainer: {
    marginBottom: 14,
    gap: 10,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    padding: 12,
    backgroundColor: theme.colors.muted,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 13,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: "700",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 14,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "700",
  },
});