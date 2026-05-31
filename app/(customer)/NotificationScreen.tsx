import { useMemo } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Icon } from "@/components/ui/Icon";
import { theme } from "@/constants/theme";
import { useNotifications } from "@/components/system/useNotifications";

const NotificationScreen = () => {
  const router = useRouter();
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();

  const openNotification = async (item: any) => {
    if (!item) return;

    await markAsRead(item.id);

    const action = item.data?.action || item.data?.url;
    const referenceId = item.data?.reference_id ?? item.data?.reference?.id;
    const path = typeof action === "string" && action.length > 0
      ? action
      : referenceId
      ? `/(customer)/${referenceId}`
      : null;

    if (path) {
      router.push(path);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isUnread = item.read_at == null;
    const title = item.data?.title || item.data?.subject || "Notifikasi Baru";
    const message = item.data?.message || item.data?.body || item.data?.content || item.data?.description || "Klik untuk melihat detail.";
    const dateLabel = item.created_at ? new Date(item.created_at).toLocaleString() : "";

    return (
      <Pressable
        onPress={() => openNotification(item)}
        style={[styles.card, isUnread && styles.unreadCard]}
      >
        <View style={styles.rowTop}>
          <View>
            <Text style={[styles.cardTitle, isUnread && styles.unreadTitle]}>{title}</Text>
            <Text style={styles.cardDate}>{dateLabel}</Text>
          </View>
          {isUnread && (
            <View style={styles.unreadDot} />
          )}
        </View>
        <Text style={styles.cardBody}>{message}</Text>
      </Pressable>
    );
  };

  const notificationsList = useMemo(() => notifications || [], [notifications]);

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Notifikasi</Text>
          <Text style={styles.subtitle}>Lihat status dan perbarui semua notifikasi sebagai sudah dibaca.</Text>
        </View>
        <Pressable onPress={markAllAsRead} style={styles.markAllButton}>
          <Icon name="checkmark-done-outline" size={18} color={theme.colors.primaryForeground} />
          <Text style={styles.markAllText}>Tandai Semua Dibaca</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notificationsList}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="notifications-off-outline" size={44} color={theme.colors.mutedForeground} />
              <Text style={styles.emptyText}>Belum ada notifikasi.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default NotificationScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.foreground,
  },
  subtitle: {
    marginTop: 4,
    color: theme.colors.mutedForeground,
    fontSize: 14,
    maxWidth: 280,
  },
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  markAllText: {
    color: theme.colors.primaryForeground,
    fontSize: 14,
    fontWeight: "700",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#f1f3f4",
  },
  unreadCard: {
    backgroundColor: "#eef4ff",
    borderColor: "#dbe7ff",
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.foreground,
  },
  unreadTitle: {
    fontWeight: "800",
  },
  cardDate: {
    marginTop: 4,
    color: theme.colors.mutedForeground,
    fontSize: 12,
  },
  cardBody: {
    color: theme.colors.foreground,
    fontSize: 14,
    lineHeight: 20,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    marginTop: 16,
    color: theme.colors.mutedForeground,
    fontSize: 16,
    fontWeight: "600",
  },
});
