import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { Clock, DollarSign, Sparkles, Leaf } from "lucide-react-native";

import { Card, CardContent } from "@/components/ui/Card";
import { theme } from "@/constants/theme";
import { spacing, typography, radius } from "@/components/system";

const features = [
  {
    icon: Clock,
    title: "Layanan Cepat",
    description: "Pesanan siap dalam waktu kurang dari 10 menit",
  },
  {
    icon: DollarSign,
    title: "Harga Terjangkau",
    description: "Nikmati rice bowl lezat hanya seharga Rp 12.000",
  },
  {
    icon: Sparkles,
    title: "Banyak Pilihan",
    description: "Kustomisasi bowl dengan berbagai pilihan menu favorit",
  },
  {
    icon: Leaf,
    title: "Bahan Segar",
    description: "Kami menggunakan bahan lokal yang disiapkan setiap hari",
  },
];

export function WhyChooseUs() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;

  // Menghitung lebar card secara dinamis
  // Desktop: 4 kolom, Tablet: 2 kolom, Mobile: 1 kolom
  const getCardWidth = () => {
    if (isDesktop) return (Math.min(width, 1200) - 100) / 4;
    if (isTablet) return (width - 80) / 2;
    return "100%";
  };

  return (
    <View style={styles.section}>
      <View style={[styles.container, { maxWidth: 1200 }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Kenapa Pilih <Text style={{ color: theme.colors.primary }}>Ricebowland</Text>
          </Text>
          <Text style={styles.subtitle}>
            Kami berkomitmen memberikan pengalaman rice bowl terbaik untuk setiap pelanggan
          </Text>
        </View>

        {/* Grid System */}
        <View style={[styles.grid, (isDesktop || isTablet) && styles.gridHorizontal]}>
          {features.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card 
                key={index} 
                style={[
                  styles.card, 
                  { width: getCardWidth() }
                ]}
              >
                <CardContent style={styles.cardContent}>
                  <View style={styles.iconWrap}>
                    <Icon size={28} color={theme.colors.primary} />
                  </View>

                  <Text style={styles.featureTitle}>{item.title}</Text>
                  <Text style={styles.desc}>{item.description}</Text>
                </CardContent>
              </Card>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: 100, // Lebih lega seperti di Figma
    backgroundColor: theme.colors.muted,
    alignItems: 'center',
    width: '100%',
  },
  container: {
    width: '100%',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 60,
  },
  title: {
    ...typography.h2,
    fontSize: 36,
    color: theme.colors.foreground,
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    ...typography.body,
    textAlign: "center",
    color: theme.colors.mutedForeground,
    maxWidth: 600,
    lineHeight: 24,
  },
  grid: {
    gap: 20,
    width: '100%',
  },
  gridHorizontal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.xl || 24,
    borderWidth: 0, // Menghilangkan border agar clean seperti Figma
    elevation: 0,
    boxShadow: 'none',
    padding: 10,
  },
  cardContent: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  iconWrap: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFF5F0', // Warna background icon soft orange
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.foreground,
    marginBottom: 12,
    textAlign: "center",
  },
  desc: {
    textAlign: "center",
    fontSize: 15,
    color: theme.colors.mutedForeground,
    lineHeight: 22,
  },
});