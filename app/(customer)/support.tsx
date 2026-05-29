import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  Linking,
  TouchableOpacity,
} from "react-native";
import { Card, CardContent } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { theme } from "@/constants/theme";
import { spacing, radius, typography } from "@/components/system";
import { apiFetch } from "@/lib/fetch";

interface Contact {
  id: number;
  name: string;
  phone_number: string;
  is_active: boolean;
}

export default function CustomerSupport() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setIsLoading(true);
      const data = await apiFetch("/public/contacts");
      const activeContacts = (Array.isArray(data) ? data : data.data || []).filter(
        (c: Contact) => c.is_active
      );
      setContacts(activeContacts);
    } catch (error) {
      console.error("Gagal memuat kontak CS:", error);
      Alert.alert("Kesalahan", "Gagal memuat informasi kontak CS");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhatsApp = (phoneNumber: string) => {
    const message = encodeURIComponent("Halo Ricebowland, saya memerlukan bantuan");
    const url = `https://wa.me/${phoneNumber}?text=${message}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Kesalahan", "Tidak dapat membuka WhatsApp. Pastikan aplikasi sudah terinstal.");
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: isDesktop ? spacing.xl : spacing.lg }]}>
        <Text style={styles.title}>Hubungi Customer Service</Text>
        <Text style={styles.subtitle}>Kami siap membantu Anda 24/7 melalui WhatsApp</Text>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        >
          <View style={[styles.mainContent, { paddingHorizontal: isDesktop ? spacing.xl : spacing.lg }]}>
            {contacts.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon
                  name="help-circle-outline"
                  size={64}
                  color={theme.colors.mutedForeground}
                />
                <Text style={styles.emptyTitle}>Belum ada informasi kontak</Text>
                <Text style={styles.emptyDesc}>
                  Silakan coba lagi nanti atau hubungi administrator
                </Text>
              </View>
            ) : (
              <View
                style={[
                  styles.contactGrid,
                  isDesktop && { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg },
                ]}
              >
                {contacts.map((contact) => (
                  <SupportCard
                    key={contact.id}
                    contact={contact}
                    onWhatsApp={handleWhatsApp}
                    isDesktop={isDesktop}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// ============ SUPPORT CARD COMPONENT ============
interface SupportCardProps {
  contact: Contact;
  onWhatsApp: (phoneNumber: string) => void;
  isDesktop: boolean;
}

function SupportCard({ contact, onWhatsApp, isDesktop }: SupportCardProps) {
  const cardStyle = isDesktop
    ? { flex: 0.5 }
    : { flex: 1 };

  return (
    <Card style={[styles.supportCard, cardStyle]}>
      <CardContent>
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <Icon name="person-circle" size={32} color={theme.colors.primary} />
          </View>
          <View style={styles.nameSection}>
            <Text style={styles.contactName}>{contact.name}</Text>
            <View style={styles.activeBadge}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>Nomor Aktif</Text>
            </View>
          </View>
        </View>

        {/* Phone Display */}
        <View style={styles.phoneSection}>
          <Icon name="call" size={16} color={theme.colors.primary} />
          <Text style={styles.phoneText}>{contact.phone_number}</Text>
        </View>

        {/* WhatsApp Button */}
        <TouchableOpacity
          style={styles.whatsappBtn}
          onPress={() => onWhatsApp(contact.phone_number)}
          activeOpacity={0.7}
        >
          <Icon name="logo-whatsapp" size={18} color="#ffffff" />
          <Text style={styles.whatsappBtnText}>Hubungi via WhatsApp</Text>
        </TouchableOpacity>

      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingVertical: spacing.xl,
  },
  title: {
    ...typography.h2,
    color: theme.colors.foreground,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: theme.colors.mutedForeground,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: {
    flex: 1,
  },
  mainContent: {
    maxWidth: 1280,
    alignSelf: "center",
    width: "100%",
  },
  contactGrid: {
    gap: spacing.lg,
  },

  // ===== SUPPORT CARD =====
  supportCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
    alignItems: "center",
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    backgroundColor: theme.colors.muted,
    justifyContent: "center",
    alignItems: "center",
  },
  nameSection: {
    flex: 1,
    gap: spacing.xs,
  },
  contactName: {
    ...typography.body,
    fontWeight: "700",
    color: theme.colors.foreground,
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: "rgba(22, 163, 74, 0.1)",
    borderRadius: radius.md,
    alignSelf: "flex-start",
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: theme.colors.success,
  },
  activeText: {
    ...typography.small,
    fontWeight: "500",
    color: theme.colors.success,
  },

  // Phone Section
  phoneSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: theme.colors.muted,
    borderRadius: radius.md,
  },
  phoneText: {
    ...typography.body,
    fontWeight: "600",
    color: theme.colors.foreground,
  },

  // WhatsApp Button
  whatsappBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: "#25D366",
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  whatsappBtnText: {
    ...typography.body,
    fontWeight: "600",
    color: "#ffffff",
  },

  // Info Row
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  infoText: {
    ...typography.small,
    color: theme.colors.mutedForeground,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    color: theme.colors.foreground,
  },
  emptyDesc: {
    ...typography.body,
    color: theme.colors.mutedForeground,
    textAlign: "center",
  },
});
