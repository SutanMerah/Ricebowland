import { View, Text, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { router, usePathname } from "expo-router";
import { useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { theme } from "@/constants/theme";
import { useAuth } from "@/components/system/AuthContext";

const navItems = [
  { name: "Dashboard", path: "/(admin)/dashboard" },
  { name: "Transaksi", path: "/(admin)/transactions" },
  { name: "Menu", path: "/(admin)/menu-management" }, // Mengikuti teks Figma asli
  { name: "Laporan", path: "/(admin)/reports" },
  { name: "Kelola CS", path: "/(admin)/contacts" },
];

export default function AdminNavbar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      console.error("Gagal logout:", error);
      router.replace("/login");
    }
  };

  return (
    <View style={[styles.navContainer, { backgroundColor: "#ffffff", borderColor: "#f1f3f4" }]}>
      {/* Pembungkus Konten Utama agar sejajar dengan max-width Dashboard (1280px) */}
      <View style={[styles.mainNavBlock, { paddingHorizontal: isDesktop ? 40 : 16 }] }>
        
        {/* SISI KIRI: LOGO & MENU ITEMS */}
        <View style={styles.leftSection}>
          {/* LOGO GROUP */}
          <Pressable onPress={() => router.push("/(admin)/dashboard")} style={styles.logoGroup}>
            <View style={[styles.logoIcon, { backgroundColor: theme.colors.primary }]}>
              <Icon name="grid" color={theme.colors.primaryForeground} size={18} />
            </View>
            <View style={styles.logoTextWrapper}>
              <Text style={[styles.brandTitle, { color: "#111111" }]}>Ricebowland</Text>
              <Text style={[styles.brandSubtitle, { color: "#70757a" }]}>Admin</Text>
            </View>
          </Pressable>

          {/* MENU NAVIGATION ROW */}
          {isDesktop ? (
            <View style={styles.menuRow}>
              {navItems.map((item) => {
              const active = isActive(item.path);

              return (
                <Pressable
                  key={item.path}
                  onPress={() => router.push(item.path as any)}
                  style={[
                    styles.navItemButton,
                    active && { backgroundColor: theme.colors.primary }
                  ]}
                >
                  <Text
                    style={[
                      styles.navItemText,
                      {
                        color: active ? "#ffffff" : "#202124",
                        fontWeight: active ? "700" : "500",
                      },
                    ]}
                  >
                    {item.name}
                  </Text>
                </Pressable>
              );
            })}
            </View>
          ) : (
            <Pressable onPress={() => setMenuOpen((s) => !s)} style={styles.mobileMenuBtn}>
              <Icon name="menu" size={20} color={theme.colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        {/* SISI KANAN: PROFILE & LOGOUT */}
        <View style={styles.rightSection}>
          {/* PROFILE BUTTON */}
          <View style={[styles.profileBadge, { backgroundColor: "#fef3eb" }]}>
            <Icon name="person" size={16} color="#202124" style={styles.profileIcon} />
            {isDesktop && <Text style={styles.profileText}>Admin</Text>}
          </View>

          {/* LOGOUT BUTTON */}
          <Pressable onPress={handleLogout} style={styles.logoutButton}>
            <Icon name="log-out" size={18} color="#70757a" />
            {isDesktop && <Text style={styles.logoutText}>Logout</Text>}
          </Pressable>
        </View>

      </View>
      {/* Mobile dropdown menu */}
      {!isDesktop && menuOpen && (
        <View style={styles.mobileDropdown}>
          <View style={[styles.mainNavBlock, { paddingHorizontal: 16, flexDirection: 'column', gap: 8 }]}>
            {navItems.map((item) => (
              <Pressable
                key={item.path}
                onPress={() => { setMenuOpen(false); router.push(item.path as any); }}
                style={styles.mobileNavItem}
              >
                <Text style={styles.mobileNavText}>{item.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    width: "100%",
    borderBottomWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  // 🌟 Menyelaraskan lebar konten navbar agar simetris dengan isi konten dashboard bawah
  mainNavBlock: {
    width: "100%",
    maxWidth: 1280,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 40, // Padding luar sejajar dengan isi dashboard
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 32, // Jarak konstan antara logo dengan deretan menu navigasi
  },
  logoGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  logoTextWrapper: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    fontWeight: "500",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12, // Jarak antar tab menu sesuai rancangan Figma
  },
  mobileMenuBtn: {
    padding: 8,
    borderRadius: 8,
  },
  navItemButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12, // Kapsul membulat halus ala Figma asli
    justifyContent: "center",
    alignItems: "center",
  },
  navItemText: {
    fontSize: 14,
    letterSpacing: -0.1,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  profileBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  profileIcon: {
    marginRight: 8,
  },
  profileText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#202124",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#70757a",
  },
  mobileDropdown: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
    backgroundColor: '#fff',
  },
  mobileNavItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  mobileNavText: {
    fontSize: 16,
    fontWeight: '700',
  },
});