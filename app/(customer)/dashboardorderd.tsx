import { View, Text, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

import { theme } from "@/constants/theme";
import { spacing, radius } from "@/components/system";

export default function CustomerDashboardOrdered() {
  const exampleOrder = {
    id: "ORD-2026-0414-001",
    status: "processing",
    timestamp: "April 14, 2026 at 2:30 PM",
    items: [
      { id: 1, name: "Teriyaki Chicken Bowl", price: 7.99, quantity: 2 },
      { id: 2, name: "Korean Bibimbap Bowl", price: 8.99, quantity: 1 },
    ],
    orderType: "Dine In",
    total: 24.97,
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "processing":
        return {
          backgroundColor: theme.colors.secondary,
        };
      case "ready":
        return {
          backgroundColor: theme.colors.primary,
        };
      case "completed":
        return {
          backgroundColor: theme.colors.primary, // idealnya success
        };
      default:
        return {
          backgroundColor: theme.colors.muted,
        };
    }
  };

  const getStatusTextColor = () => theme.colors.primaryForeground;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "processing":
        return "time";
      case "ready":
      case "completed":
        return "checkmark-circle";
      default:
        return "bag";
    }
  };

  return (
<ScrollView
    style={styles.scrollView}
    contentContainerStyle={styles.container} // Gaya kontainer diterapkan di sini
  >
      {/* HEADER */}
       <View style={styles.header}>
       <Text style={[styles.title, { color: theme.colors.foreground }]}>
         Hello, Customer
       </Text>
        <Text
          style={[styles.subtitle, { color: theme.colors.mutedForeground }]}
        >
          Selamat datang kembali di Ricebowland
        </Text>
      </View>

      {/* SECTION */}
      <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
        Order Status
      </Text>

      <Card>
        <CardContent>
          {/* HEADER */}
          <View
            style={[
              styles.orderHeader,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <View style={{ flex: 1 }}>
              <View style={styles.row}>
                <Icon
                  name="bag"
                  size={18}
                  color={theme.colors.primary}
                />
                <Text
                  style={[styles.orderId, { color: theme.colors.foreground }]}
                >
                  Order #{exampleOrder.id}
                </Text>
              </View>

              <Text
                style={[styles.meta, { color: theme.colors.mutedForeground }]}
              >
                {exampleOrder.timestamp}
              </Text>
              <Text
                style={[styles.meta, { color: theme.colors.mutedForeground }]}
              >
                {exampleOrder.orderType}
              </Text>
            </View>

            {/* STATUS */}
            <View
              style={[
                styles.statusBase,
                getStatusStyle(exampleOrder.status),
              ]}
            >
              <Icon
                name={getStatusIcon(exampleOrder.status)}
                size={16}
                color={getStatusTextColor()}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusTextColor() },
                ]}
              >
                {exampleOrder.status}
              </Text>
            </View>
          </View>

          {/* ITEMS */}
          <Text style={[styles.subTitle, { color: theme.colors.foreground }]}>
            Order Items
          </Text>

          <View style={styles.items}>
            {exampleOrder.items.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.itemRow,
                  { backgroundColor: theme.colors.muted },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.itemName,
                      { color: theme.colors.foreground },
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      styles.itemMeta,
                      { color: theme.colors.mutedForeground },
                    ]}
                  >
                    ${item.price.toFixed(2)} × {item.quantity}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.itemTotal,
                    { color: theme.colors.foreground },
                  ]}
                >
                  ${(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          {/* TOTAL */}
          <View
            style={[
              styles.totalBox,
              { backgroundColor: theme.colors.primary + "20" }, // opacity
            ]}
          >
            <Text
              style={[styles.totalLabel, { color: theme.colors.foreground }]}
            >
              Total
            </Text>
            <Text
              style={[
                styles.totalValue,
                { color: theme.colors.primary },
              ]}
            >
              ${exampleOrder.total.toFixed(2)}
            </Text>
          </View>

          {/* ACTIONS */}
          <View style={styles.actions}>
            <Button
              title="Order Again"
              onPress={() => router.push("/(customer)/menu")}
              style={{ flex: 1 }}
            />
            <Button
              title="View All Orders"
              variant="outline"
              onPress={() => router.push("/(customer)/my-orders")}
              style={{ flex: 1 }}
            />
          </View>
        </CardContent>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({

  scrollView: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

container: {
    width: '100%',
    maxWidth: 1200,      // Menyamakan dengan Navbar agar sejajar
    alignSelf: 'center', // Agar kontainer berada di tengah layar
    padding: spacing.xl, // Memberi ruang napas di kiri-kanan
    paddingBottom: spacing.xxl,
  },

  header: {
    marginBottom: spacing.xl,
    alignItems: 'flex-start', // Memastikan teks tetap di kiri
  },

  title: {
    fontSize: 32, // Ukuran sesuai Figma image_0273dd.png
    fontWeight: "700",
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 16,
    color: theme.colors.mutedForeground,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: spacing.md,
    marginTop: spacing.sm,
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

  itemTotal: {
    fontWeight: "700",
  },

  totalBox: {
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  totalLabel: {
    fontWeight: "700",
    fontSize: 16,
  },

  totalValue: {
    fontWeight: "700",
    fontSize: 20,
  },

  actions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
});