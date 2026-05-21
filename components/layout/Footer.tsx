import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Icon } from "@/components/ui/Icon";

export function Footer() {
  return (
    <View style={styles.footer}>
      <View style={styles.container}>
        <View style={styles.grid}>
          {/* Brand */}
          <View style={styles.col}>
            <View style={styles.brandRow}>
              <View style={styles.logoBox}>
                <Icon name="restaurant" size={20} color="#fff" />
              </View>
              <Text style={styles.brandText}>
                <Text style={styles.brandAccent}>Ricebow</Text>land
              </Text>
            </View>

            <Text style={styles.description}>
              Mangkuk nasi lezat dibuat segar setiap hari untuk mahasiswa dan profesional yang sibuk.
            </Text>
          </View>

          {/* Tautan Cepat */}
          <View style={styles.col}>
            <Text style={styles.title}>Tautan Cepat</Text>

            <TouchableOpacity>
              <Text style={styles.link}>Beranda</Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text style={styles.link}>Menu</Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text style={styles.link}>Tentang Kami</Text>
            </TouchableOpacity>

          </View>

          {/* Hubungi Kami */}
          <View style={styles.col}>
            <Text style={styles.title}>Hubungi Kami</Text>

            <View style={styles.row}>
              <Icon name="call" size={16} color="#F97316" />
              <Text style={styles.text}>(555) 123-4567</Text>
            </View>

            <View style={styles.row}>
              <Icon name="mail" size={16} color="#F97316" />
              <Text style={styles.text}>hello@ricebowland.com</Text>
            </View>

            <View style={styles.row}>
              <Icon name="location" size={16} color="#F97316" />
              <Text style={styles.text}>
                Gedung N, Politeknik Negeri Medan
              </Text>
            </View>
          </View>

          {/* Ikuti Kami */}
          <View style={styles.col}>
            <Text style={styles.title}>Ikuti Kami</Text>

            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.iconBtn}>
                <Icon name="logo-facebook" size={18} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconBtn}>
                <Icon name="logo-instagram" size={18} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconBtn}>
                <Icon name="logo-twitter" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Bottom */}
        <View style={styles.bottom}>
          <Text style={styles.bottomText}>
            © 2026 Ricebowland. Semua hak dilindungi.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: "#2D1B0E", // foreground
    paddingVertical: 48,
  },

  container: {
    maxWidth: 1200,
    alignSelf: "center",
    paddingHorizontal: 16,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
    marginBottom: 32,
  },

  col: {
    flex: 1,
    minWidth: 160,
    gap: 12,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },

  logoBox: {
    backgroundColor: "#F97316",
    padding: 6,
    borderRadius: 8,
  },

  brandText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  brandAccent: {
    color: "#F97316",
  },

  description: {
    color: "rgba(255,255,255,0.7)",
    lineHeight: 18,
  },

  title: {
    color: "#fff",
    fontWeight: "600",
    marginBottom: 8,
  },

  link: {
    color: "rgba(255,255,255,0.7)",
    marginBottom: 6,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },

  text: {
    color: "rgba(255,255,255,0.7)",
  },

  socialRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },

  iconBtn: {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 8,
    borderRadius: 999,
  },

  bottom: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    paddingTop: 20,
    alignItems: "center",
  },

  bottomText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
});