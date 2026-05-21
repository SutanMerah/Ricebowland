import { View, Text, StyleSheet, Image, useWindowDimensions } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card, CardContent } from "@/components/ui/Card";
import { theme } from "@/constants/theme";
import { spacing, typography, radius } from "@/components/system";

export function About() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.wrapper, { maxWidth: 1200, alignSelf: 'center' }]}>
        <View style={[styles.grid, isDesktop && { flexDirection: "row", alignItems: "center" }]}>
          
          {/* LEFT CONTENT: Teks Narasi */}
          <View style={[styles.left, isDesktop && { flex: 1.2, paddingRight: spacing.xl }]}>
            <Text style={[styles.title, { color: theme.colors.foreground }]}>
              Tentang <Text style={{ color: theme.colors.primary }}>Ricebowland</Text> 
            </Text> 

            <Text style={[styles.paragraph, { color: theme.colors.mutedForeground }]}> 
              Ricebowland didirikan pada tahun 2020 dengan misi sederhana: menyajikan 
              selalu berarti makanan tidak sehat.
            </Text>

            <Text style={[styles.paragraph, { color: theme.colors.mutedForeground }]}>
              Setiap mangkuk kami disiapkan segar setiap hari menggunakan bahan-bahan 
              lokal pilihan. Baik Anda menginginkan rasa gurih, pedas, atau pilihan sehat, 
              kami memiliki menu yang sempurna untuk Anda. Kunjungi kami hari ini dan 
              rasakan bedanya!
            </Text>
          </View>

          {/* RIGHT CONTENT: Kotak Lokasi & Jam */}
          <View style={[styles.right, isDesktop && { flex: 0.8 }]}>
            <View style={styles.cardGrid}>
              <Card style={styles.infoCard}>
                <CardContent>
                  <View style={styles.cardRow}>
                    <View style={[styles.iconBox, { backgroundColor: "#FFF5F0" }]}>
                      <Feather name="map-pin" size={22} color={theme.colors.primary} />
                    </View>
                    <View style={styles.cardText}>
                      <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>
                        Lokasi Kami
                      </Text>
                      <Text style={[styles.cardDesc, { color: theme.colors.mutedForeground }]}>
                        Gedung N{"\n"}
                        Politeknik Negeri Medan
                      </Text>
                    </View>
                  </View>
                </CardContent>
              </Card>

              <Card style={styles.infoCard}>
                <CardContent>
                  <View style={styles.cardRow}>
                    <View style={[styles.iconBox, { backgroundColor: "#FFF5F0" }]}>
                      <Feather name="clock" size={22} color={theme.colors.primary} />
                    </View>
                    <View style={styles.cardText}>
                      <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>
                        Jam Operasional
                      </Text>
                      <Text style={[styles.cardDesc, { color: theme.colors.mutedForeground }]}>
                        Senin - Jum'at: 12:00 - 17:00{"\n"}
                        Sabtu - Minggu: Tutup
                      </Text>
                    </View>
                  </View>
                </CardContent>
              </Card>
            </View>
          </View>

        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 100,
  },
  wrapper: {
    width: '100%',
    paddingHorizontal: spacing.lg,
  },
  grid: {
    flexDirection: "column",
    gap: 40,
  },
  left: {
    width: "100%",
  },
  right: {
    width: "100%",
  },
  title: {
    ...typography.h2,
    fontSize: 36,
    marginBottom: spacing.lg,
  },
  paragraph: {
    ...typography.body,
    fontSize: 16,
    lineHeight: 26,
    marginBottom: spacing.md,
  },
  cardGrid: {
    gap: spacing.lg,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardRow: {
    flexDirection: "row",
    padding: spacing.md,
    gap: spacing.md,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
});