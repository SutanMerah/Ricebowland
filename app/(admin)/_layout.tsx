import { Slot, useRouter, useRootNavigationState } from "expo-router";
import { View, StyleSheet, ActivityIndicator, Platform } from "react-native";
import { useEffect } from "react";
import { useAuth } from "@/components/system/AuthContext"; 
import { useNotifications } from "@/components/system/useNotifications";
import AdminNavbar from "@/components/layout/AdminNavbar";
import { theme } from "@/constants/theme";

// 🌟 IMPORT UTK PUSH NOTIFICATION
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { apiFetch } from "@/lib/fetch"; 

// 🌟 KONFIGURASI FOREGROUND (Hanya dieksekusi jika bukan di Web)
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true, 
      shouldShowList: true,   
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export default function AdminLayout() {
  const router = useRouter();
  const { role, loading } = useAuth(); 
  const rootNavigationState = useRootNavigationState();

  // 1. Pengecekan Proteksi Halaman (Duplikasi sudah dibersihkan)
  useEffect(() => {
    if (loading || !rootNavigationState?.key) return;
    if (role !== "admin") {
      setTimeout(() => router.replace("/login"), 0);
    }
  }, [role, loading, rootNavigationState?.key]);

  // 2. Kunci Push Notification untuk Admin
  useEffect(() => {
    if (loading || role !== "admin") return;

    const setupPushNotification = async () => {
      const tokenPerangkat = await registerForPushNotificationsAsync();
      if (tokenPerangkat) {
        try {
          await apiFetch('/save-device-token', {
            method: 'POST',
            body: JSON.stringify({ device_token: tokenPerangkat }),
          });
          console.log("✅ [Admin] Token perangkat berhasil diperbarui di Laravel");
        } catch (error) {
          console.error("❌ [Admin] Gagal kirim token ke server:", error);
        }
      }
    };

    setupPushNotification();
  }, [loading, role]);

  const { unreadCount } = useNotifications();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (role !== "admin") return null;

  return (
    <View style={styles.container}>
      <AdminNavbar unreadCount={unreadCount} />
      <Slot />
    </View>
  );
}

// 🌟 FUNGSI PENDUKUNG (Diproteksi penuh dari Platform Web)
async function registerForPushNotificationsAsync() {
  // Gembok pertama: Jika platform terdeteksi Web, langsung batalkan eksekusi!
  if (Platform.OS === 'web') {
    console.log('ℹ️ Push Notification dilewati karena aplikasi dibuka di Web Browser.');
    return null;
  }

  if (!Device.isDevice) {
    console.log('⚠️ Harus menggunakan HP fisik untuk mencoba Push Notification');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('❌ Izin push notification ditolak user!');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '70f5cfa9-f134-4581-96bf-831bfa36f0ed' 
    });
    
    return tokenData.data;
  } catch (error) {
    console.warn("⚠️ Gagal inisialisasi push notification:", error);
    return null;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
});