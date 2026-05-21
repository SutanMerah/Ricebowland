import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from "react-native";
import { Link, router } from "expo-router";
import { UtensilsCrossed, Menu, X } from "lucide-react-native";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/system/AuthContext";

// Import scrollRegistry dari file landing page
import { scrollRegistry } from "app/(public)/landing"; 

import { theme } from "@/constants/theme";
import { spacing, radius } from "@/components/system";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { role, logout } = useAuth();
  const { width } = useWindowDimensions();

  const isDesktop = width >= 768;
  const isLoggedIn = role !== "guest";

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  // Fungsi helper untuk handle navigasi ke section di Landing Page
  const navigateToSection = (section: string) => {
    // Tutup menu mobile jika sedang terbuka
    setIsMenuOpen(false);

    // Jika sedang tidak di Landing Page, arahkan ke landing dulu
    // canGoBack biasanya true jika kita berada di route selain index
    if (router.canGoBack()) {
      router.push("/landing");
    }
    
    // Beri sedikit delay agar transisi router selesai sebelum scroll dipicu
    setTimeout(() => {
      scrollRegistry.scrollToSection(section);
    }, 100);
  };

  return (
    <View style={styles.nav}>
      <View style={styles.container}>
        
        {/* TOP BAR */}
        <View style={styles.row}>
          
          {/* LOGO - Sekarang memicu scroll ke 'home' (paling atas) */}
          <TouchableOpacity style={styles.logo} onPress={() => navigateToSection("home")}>
            <View style={styles.logoBox}>
              <UtensilsCrossed
                size={18}
                color={theme.colors.primaryForeground}
              />
            </View>
            <Text style={styles.brand}>
              <Text style={styles.brandAccent}>Ricebow</Text>land
            </Text>
          </TouchableOpacity>

          {/* DESKTOP MENU */}
          {isDesktop && (
            <View style={styles.desktopNav}>
              <TouchableOpacity onPress={() => navigateToSection("home")}>
                <Text style={styles.navLink}>Beranda</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => navigateToSection("menu")}>
                <Text style={styles.navLink}>Menu</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => navigateToSection("about")}>
                <Text style={styles.navLink}>Tentang</Text>
              </TouchableOpacity>
              
              <View style={{ marginLeft: spacing.lg }}>
                {!isLoggedIn ? (
                  <Link href="/login" asChild>
                    <Button title="Masuk" size="sm" />
                  </Link>
                ) : (
                  <Button title="Keluar" size="sm" onPress={handleLogout} />
                )}
              </View>
            </View>
          )}

          {/* MOBILE MENU BTN */}
          {!isDesktop && (
            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => setIsMenuOpen((v) => !v)}
            >
              {isMenuOpen ? <X size={24} color={theme.colors.foreground} /> : <Menu size={24} color={theme.colors.foreground} />}
            </TouchableOpacity>
          )}
        </View>

        {/* MOBILE MENU DROPDOWN */}
        {(!isDesktop && isMenuOpen) && (
          <View style={styles.mobileMenu}>
            <TouchableOpacity onPress={() => navigateToSection("home")}>
              <Text style={styles.mobileLink}>Beranda</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => navigateToSection("menu")}>
              <Text style={styles.mobileLink}>Menu</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => navigateToSection("about")}>
              <Text style={styles.mobileLink}>Tentang</Text>
            </TouchableOpacity>

            <View style={{ marginTop: spacing.sm }}>
              {!isLoggedIn ? (
                <Link href="/login" asChild>
                  <Button title="Masuk" onPress={() => setIsMenuOpen(false)} />
                </Link>
              ) : (
                <Button title="Keluar" onPress={handleLogout} />
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    zIndex: 100,
  },
  container: {
    maxWidth: 1200,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 72,
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
    gap: spacing.xl,
  },
  navLink: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.mutedForeground,
  },
  menuBtn: {
    padding: spacing.sm,
  },
  mobileMenu: {
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  mobileLink: {
    fontSize: 16,
    color: theme.colors.foreground,
    paddingVertical: spacing.xs,
    fontWeight: "500",
  },
});