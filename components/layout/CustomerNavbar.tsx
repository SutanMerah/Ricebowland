import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/components/system/AuthContext";

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

import { theme } from "@/constants/theme";
import { spacing, radius } from "@/components/system";

export default function CustomerNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { width } = useWindowDimensions();

  const { logout } = useAuth();

  // Tentukan breakpoint untuk desktop (768px biasanya standar tablet/PC)
  const isDesktop = width >= 768;

const handleLogout = async () => {
    try {
      // 3. PANGGIL LOGOUT (Ini akan mengubah role menjadi 'guest' dan clear session)
      await logout(); 
      
      // 4. BARU PINDAH HALAMAN
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <View style={styles.navbar}>
      <View style={styles.container}>
        
        {/* LOGO - Ujung Kiri */}
        <TouchableOpacity
          onPress={() => router.push("/(customer)/dashboard")}
          style={styles.logo}
        >
          <View style={styles.logoBox}>
            <Icon name="restaurant" size={18} color={theme.colors.primaryForeground} />
          </View>
          <Text style={styles.brand}>
            <Text style={styles.brandAccent}>Ricebow</Text>land
          </Text>
        </TouchableOpacity>

        {/* DESKTOP NAV - Muncul hanya jika layar lebar */}
        {isDesktop ? (
          <View style={styles.desktopNav}>
            <TouchableOpacity onPress={() => router.push("/(customer)/menu")}> 
              <Text style={styles.link}>Menu</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(customer)/myorder")}
              style={styles.row}
            >
              <Icon name="bag-outline" size={18} color={theme.colors.foreground} />
              <Text style={styles.link}>My Orders</Text>
            </TouchableOpacity>

            <Button
              title="Logout"
              variant="outline"
              onPress={handleLogout}
              style={styles.logoutBtn}
            />
          </View>
        ) : (
          /* MOBILE TOGGLE - Muncul hanya jika layar kecil */
          <TouchableOpacity
            onPress={() => setIsMenuOpen(!isMenuOpen)}
            style={styles.menuBtn}
          >
            <Icon name={isMenuOpen ? "close" : "menu"} size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
        )}
      </View>

      {/* MOBILE MENU DROPDOWN */}
      {(!isDesktop && isMenuOpen) && (
        <View style={styles.mobileMenu}>
          <TouchableOpacity onPress={() => { router.push("/(customer)/menu"); setIsMenuOpen(false); }}>
            <Text style={styles.mobileLink}>Menu</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { router.push("/(customer)/myorder"); setIsMenuOpen(false); }}>
            <Text style={styles.mobileLink}>My Orders</Text>
          </TouchableOpacity>

          <Button
            title="Logout"
            variant="outline"
            onPress={handleLogout}
            style={styles.fullBtn}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    zIndex: 100, // Pastikan di atas konten
  },
  container: {
    height: 72, // Sedikit lebih tinggi agar lega
    maxWidth: 1200, // MENYAMAKAN DENGAN DASHBOARD
    alignSelf: "center",
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
  },
  logo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  logoBox: {
    backgroundColor: theme.colors.primary,
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  brand: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.foreground,
  },
  brandAccent: {
    color: theme.colors.primary,
  },
  desktopNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xl, // Jarak antar menu lebih lebar
  },
  link: {
    fontSize: 15,
    fontWeight: "500",
    color: theme.colors.foreground,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  menuBtn: {
    padding: spacing.sm,
  },
  logoutBtn: {
    marginLeft: spacing.md, // Memberi jarak tambahan dari menu lain
    minWidth: 100,
  },
  mobileMenu: {
    padding: spacing.lg,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: spacing.md,
  },
  mobileLink: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.foreground,
    paddingVertical: spacing.sm,
  },
  fullBtn: {
    width: "100%",
    marginTop: spacing.sm,
  },
});