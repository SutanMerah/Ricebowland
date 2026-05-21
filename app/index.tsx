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
      router.replace("/(public)/landing");
    } else if (role === "customer") {
      router.replace("/(customer)/dashboard");
    } else if (role === "admin") {
      router.replace("/(admin)/dashboard");
    }
  }, [role, loading, rootNavigationState?.key]);

  // Tampilkan loading screen sementara agar user tidak melihat layar putih kosong
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#0000ff" />
    </View>
  );
}