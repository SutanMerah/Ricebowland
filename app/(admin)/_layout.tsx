import { Slot, useRouter, useRootNavigationState } from "expo-router";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useEffect } from "react";
import { useAuth } from "@/components/system/AuthContext"; // 👈 Gunakan AuthContext
import AdminNavbar from "@/components/layout/AdminNavbar";
import { theme } from "@/constants/theme";

export default function AdminLayout() {
  const router = useRouter();
  const { role, loading } = useAuth(); // 👈 Ambil status loading global
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    // ✋ TAHAN: Jika AuthContext masih memuat sesi dari storage, jangan lakukan redirect!
    if (loading || !rootNavigationState?.key) return;

    // Jika pemuatan selesai dan ternyata perannya bukan admin, lempar ke login
    if (role !== "admin") {
      setTimeout(() => router.replace("/login"), 0);
    }
  }, [role, loading, rootNavigationState?.key]);

  // Tampilkan indikator pemuatan data selama browser melakukan refresh halaman
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Jika peran tidak sesuai setelah pemuatan selesai, kunci tampilan agar tidak bocor
  if (role !== "admin") return null;

  return (
    <View style={styles.container}>
      <AdminNavbar />
      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
});