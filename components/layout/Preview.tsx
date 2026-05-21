import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { Link } from "expo-router";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { theme } from "@/constants/theme";
import { spacing, typography } from "@/components/system";

const menuItems = [
  {
    id: 1,
    name: "Ayam Teriyaki",
    price: "Rp 12.000",
    image: "https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?q=80&w=1000&auto=format&fit=crop",
    description: "Irisan ayam lembut dengan saus teriyaki manis gurih khas Jepang.",
  },
  {
    id: 2,
    name: "Ayam Lada Hitam",
    price: "Rp 12.000",
    image: "https://images.unsplash.com/photo-1534939561126-755ecf15a19c?q=80&w=1000&auto=format&fit=crop",
    description: "Tumisan ayam dengan sensasi pedas hangat lada hitam dan paprika.",
  },
  {
    id: 3,
    name: "Ayam Asam Manis",
    price: "Rp 12.000",
    image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=1000&auto=format&fit=crop",
    description: "Ayam krispi yang disiram saus asam manis segar dengan potongan nanas.",
  },
];

export function MenuPreview() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Logika Grid: 3 kolom di desktop, 1 kolom di mobile
  const cardWidth = isDesktop ? (width - 120 - 64) / 3 : '100%';

  return (
    <View style={styles.section}>
      <View style={[styles.container, { maxWidth: isDesktop ? 1200 : '100%' }]}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
          <Text style={{ color: theme.colors.primary }}>Menu-Menu</Text> Kami
          </Text>
          <Text style={styles.subtitle}>
            Nikmati rice bowl lezat dengan bahan segar dan bumbu autentik setiap hari.
          </Text>
        </View>

        {/* Grid System */}
        <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
          {menuItems.map((item) => (
            <Card 
              key={item.id} 
              style={[
                styles.card, 
                { width: cardWidth }
              ]}
            >
              <ImageWithFallback src={item.image} style={styles.image} />

              <CardContent style={styles.content}>
                <View style={styles.row}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.price}>{item.price}</Text>
                </View>

                <Text style={styles.desc}>{item.description}</Text>
              </CardContent>
            </Card>
          ))}
        </View>

        {/* CTA */}
        <View style={styles.cta}>
          <Link href="/login" asChild>
            <Button title="Pesan Sekarang" />
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: 80,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    ...typography.h2,
    fontSize: 32,
    color: theme.colors.foreground,
    marginBottom: 12,
  },
  subtitle: {
    ...typography.body,
    color: theme.colors.mutedForeground,
    textAlign: "center",
    maxWidth: 500,
  },
  grid: {
    flexDirection: 'column',
    gap: 24,
  },
  gridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  image: {
    height: 220,
    width: "100%",
  },
  content: {
    padding: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.foreground,
  },
  price: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  desc: {
    fontSize: 14,
    color: theme.colors.mutedForeground,
    lineHeight: 20,
  },
  cta: {
    marginTop: 48,
    alignItems: "center",
  },
});