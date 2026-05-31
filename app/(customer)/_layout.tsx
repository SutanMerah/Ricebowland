import { Slot, useRouter, useRootNavigationState } from "expo-router";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useEffect } from "react";
import { useAuth } from "@/components/system/AuthContext"; 
import { useNotifications } from "@/components/system/useNotifications";
import CustomerNavbar from "@/components/layout/CustomerNavbar";
import { theme } from "@/constants/theme";

// 🌟 IMPORT UTK PUSH NOTIFICATION
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { apiFetch } from "@/lib/fetch"; // 👈 Pastikan path apiFetch Anda benar

// 🌟 KONFIGURASI AGAR NOTIFIKASI MUNCUL SAAT APLIKASI DIBUKA (FOREGROUND)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, // 👈 Gantikan shouldShowAlert dengan ini
    shouldShowList: true,   // 👈 Dan tambahkan ini    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function CustomerLayout() {
  const router = useRouter();
  const { role, loading } = useAuth(); 
  const rootNavigationState = useRootNavigationState();

  // 1. useEffect Bawaan Anda (Proteksi halaman)
  useEffect(() => {
    if (loading || !rootNavigationState?.key) return;

    if (role !== "customer") {
      setTimeout(() => router.replace("/login"), 0);
    }
  }, [role, loading, rootNavigationState?.key]);

  // 🌟 2. useEffect BARU: Berjalan otomatis saat user terkonfirmasi sebagai customer
  useEffect(() => {
    if (loading || role !== "customer") return;

    const setupPushNotification = async () => {
      const tokenPerangkat = await registerForPushNotificationsAsync();
      if (tokenPerangkat) {
        try {
          // Setor ke Laravel lewat API Anda
          await apiFetch('/api/save-device-token', {
            method: 'POST',
            body: JSON.stringify({ device_token: tokenPerangkat }),
          });
          console.log("✅ [Customer] Token perangkat berhasil diperbarui di Laravel");
        } catch (error) {
          console.error("❌ [Customer] Gagal kirim token ke server:", error);
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

  if (role !== "customer") return null;

  return (
    <View style={styles.container}>
      <CustomerNavbar unreadCount={unreadCount} />
      <Slot />
    </View>
  );
}

// 🌟 FUNGSI PENDUKUNG (Diletakkan di paling bawah, di luar komponen utama)
async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    console.log('⚠️ Harus menggunakan HP fisik untuk mencoba Push Notification');
    return null;
  }

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
    projectId: '70f5cfa9-f134-4581-96bf-831bfa36f0ed' // 👈 Lihat catatan di bawah cara mengambilnya
  });
  
  return tokenData.data;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
});