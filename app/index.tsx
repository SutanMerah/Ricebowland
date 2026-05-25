import { useEffect } from "react";
import { useRouter, useRootNavigationState } from "expo-router"; // Tambahkan useRootNavigationState
import { useAuth } from "../components/system/AuthContext";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const router = useRouter();
  const { role, loading } = useAuth(); // Ambil loading dari context
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    // 1. Jangan jalan kalau data auth masih loading
    // 2. Jangan jalan kalau root navigation belum siap (biar ga error "Attempted to navigate before mounting")
    if (loading || !rootNavigationState?.key) return;

    if (role === "guest") {
      setTimeout(() => router.replace("/(public)/landing"), 0);
    } else if (role === "customer") {
      setTimeout(() => router.replace("/(customer)/dashboard"), 0);
    } else if (role === "admin") {
      setTimeout(() => router.replace("/(admin)/dashboard"), 0);
    }
  }, [role, loading, rootNavigationState?.key]);

  // Tampilkan loading screen sementara agar user tidak melihat layar putih kosong
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#0000ff" />
    </View>
  );
}