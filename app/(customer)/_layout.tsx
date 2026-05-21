import { Slot, useRouter } from "expo-router";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useEffect } from "react";
import { useAuth } from "@/components/system/AuthContext"; // 👈 Gunakan AuthContext
import CustomerNavbar from "@/components/layout/CustomerNavbar";
import { theme } from "@/constants/theme";

export default function CustomerLayout() {
  const router = useRouter();
  const { role, loading } = useAuth(); // 👈 Ambil status loading global

  useEffect(() => {
    // ✋ TAHAN: Jika AuthContext masih memuat sesi dari storage, jangan lakukan redirect!
    if (loading) return;

    // Jika pemuatan selesai dan ternyata perannya bukan customer, lempar ke login
    if (role !== "customer") {
      router.replace("/login");
    }
  }, [role, loading]);

  // Tampilkan indikator pemuatan data selama browser melakukan refresh halaman
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Jika peran tidak sesuai setelah pemuatan selesai, kunci tampilan agar tidak bocor
  if (role !== "customer") return null;

  return (
    <View style={styles.container}>
      <CustomerNavbar />
      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
});