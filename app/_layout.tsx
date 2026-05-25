import { Slot, useRouter, useSegments, useRootNavigationState } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "@/components/system/AuthContext";
import { theme } from "@/constants/theme";

function RootNavigation() {
  const { user, role, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  const safeReplace = (path: string) => setTimeout(() => router.replace(path), 0);

  useEffect(() => {
    // ✋ TAHAN: Jika sesi masih dimuat dari AsyncStorage, jangan lakukan redirect apapun!
    if (loading || !rootNavigationState?.key) return;

    const firstSegment = segments[0];

    // 🔒 SITUASI 1: USER BELUM LOGIN (role === "guest" atau user kosong)
    if (!user || role === "guest") {
      // Jika mencoba masuk ke area steril (customer / admin), hadang dan tendang ke login
      if (firstSegment === "(customer)" || firstSegment === "(admin)") {
        safeReplace("/login");
      }
      return; // Selesai, jangan jalankan logika di bawah
    }

    // 🔒 SITUASI 2: USER SUDAH LOGIN (Mencegah salah kamar rute)
    if (role === "customer") {
      // Jika customer berada di luar foldernya (misal nongkrong di /login atau /(admin))
      if (firstSegment !== "(customer)") {
        safeReplace("/(customer)/dashboard");
      }
    } else if (role === "admin") {
      // Jika admin berada di luar foldernya (misal nongkrong di /login atau /(customer))
      if (firstSegment !== "(admin)") {
        safeReplace("/(admin)/dashboard");
      }
    }
  }, [user, role, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#ffffff" }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigation />
    </AuthProvider>
  );
}