import { View, Text, StyleSheet, Image, useWindowDimensions } from "react-native";
import { Link } from "expo-router";
import { Button } from "@/components/ui/Button";
import { theme } from "@/constants/theme";
import { spacing, radius, typography } from "@/components/system";

export function Hero() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <View style={styles.section}>
      {/* Container sekarang fleksibel mengikuti lebar layar hingga 1400px */}
      <View style={[styles.container, { maxWidth: isDesktop ? 1400 : '100%' }]}>
        <View style={[styles.grid, !isDesktop && styles.gridMobile]}>
          
          {/* LEFT CONTENT */}
          <View style={[styles.left, !isDesktop && styles.fullWidth]}>
            <Text style={[styles.title, !isDesktop && styles.titleMobile]}>
              Rice Bowl Lezat,{"\n"}
              <Text style={styles.primary}>Cepat</Text> dan{" "}
              <Text style={styles.primary}>Terjangkau</Text>
            </Text>

            <Text style={[styles.subtitle, !isDesktop && styles.subtitleMobile]}>
              Cocok untuk mahasiswa dan pekerja sibuk yang menginginkan makanan lezat dan bergizi tanpa harus menunggu lama.
            </Text>

            <View style={[styles.buttonRow, !isDesktop && styles.buttonRowMobile]}>
              <View style={isDesktop ? { flex: 0, minWidth: 160 } : { flex: 1 }}>
                <Button title="Lihat Menu" onPress={() => {}} />
              </View>

              <View style={isDesktop ? { flex: 0, minWidth: 160 } : { flex: 1 }}>
                <Link href="/login" asChild>
                  <Button title="Masuk" variant="outline" />
                </Link>
              </View>
            </View>
          </View>

          {/* RIGHT CONTENT (IMAGE) */}
          <View style={[styles.right, !isDesktop && styles.fullWidth]}>
            <View style={[styles.imageWrapper, !isDesktop && styles.imageWrapperMobile]}>
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1771384552858-feb0574f958d?auto=format&fit=crop&w=1080",
                }}
                style={styles.image}
              />
              <View style={styles.overlay} />
            </View>

            {/* Badge Price */}
            <View style={styles.badge}>
              <Text style={styles.badgeSmall}>Cukup Dengan</Text>
              <Text style={styles.badgePrice}>Rp.12K</Text>
            </View>
          </View>

        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: spacing["xxxl"] || 80,
    backgroundColor: theme.colors.muted,
    width: '100%',
  },

  container: {
    width: '100%',
    alignSelf: "center",
    paddingHorizontal: spacing.xl,
  },

  grid: {
    flexDirection: "row",
    alignItems: "center",
    gap: 60, // Jarak lebih lebar antar kolom di desktop
  },

  gridMobile: {
    flexDirection: "column",
    gap: 40,
  },

  left: {
    flex: 1.2, // Memberi ruang lebih besar untuk teks di desktop
    gap: spacing.xl,
  },

  right: {
    flex: 1,
    position: "relative",
  },

  fullWidth: {
    width: '100%',
  },

  title: {
    ...typography.h1,
    fontSize: 56, // Ukuran lebih besar untuk desktop agar mirip Figma
    color: theme.colors.foreground,
    lineHeight: 64,
    fontWeight: "800",
  },

  titleMobile: {
    fontSize: 36,
    lineHeight: 42,
    textAlign: 'center',
  },

  primary: {
    color: theme.colors.primary,
  },

  subtitle: {
    ...typography.body,
    fontSize: 18,
    color: theme.colors.mutedForeground,
    lineHeight: 28,
    maxWidth: 500,
  },

  subtitleMobile: {
    textAlign: 'center',
    alignSelf: 'center',
  },

  buttonRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },

  buttonRowMobile: {
    justifyContent: 'center',
  },

  imageWrapper: {
    borderRadius: 30, // Lebih melengkung seperti di Figma
    overflow: "hidden",
    height: 500, // Lebih tinggi di desktop
    width: '100%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },

  imageWrapperMobile: {
    height: 350,
  },

  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.05)",
  },

  badge: {
    position: "absolute",
    bottom: 20,
    left: -20,
    backgroundColor: theme.colors.secondary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    elevation: 5,
  },

  badgeSmall: {
    fontSize: 14,
    color: theme.colors.foreground,
  },

  badgePrice: {
    fontSize: 32,
    fontWeight: "800",
    color: theme.colors.foreground,
  },
});