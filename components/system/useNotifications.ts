import { useState, useEffect } from 'react';
import { apiFetch } from "@/lib/fetch";
import { getSession } from "@/lib/auth";

// Definisikan tipe data agar TypeScript bekerja maksimal
interface NotificationResponse {
  success: boolean;
  unread_count: number;
  notifications: {
    data: any[]; // Data notifikasi hasil pagination Laravel
    current_page: number;
    last_page: number;
  };
}

export const useNotifications = () => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchNotifs = async () => {
    try {
        
    // 1. Ambil session
      const session = await getSession();
      
      // 2. 🔍 TARUH LOG DI SINI (Sebelum Guard)
      console.log("========================================");
      console.log("📂 [DEBUG HOOK] Sesi terbaca di useNotifications:", JSON.stringify(session));
      console.log("========================================");
      
      // 3. Pagar Guard
      if (!session?.token) {
        return; 
      }

      setLoading(true);
    // apiFetch otomatis mengurus base URL dan Token Bearer!
      const resData = await apiFetch("/notifications") as NotificationResponse;
    
      if (resData.success) {
        setNotifications(resData.notifications.data);
        setUnreadCount(resData.unread_count);
      }
    } catch (e) {
      console.error("Gagal fetch notif", e);
    } finally {
      setLoading(false);
    }
  };

    // FUNGSI BARU: Menandai SATU notifikasi sudah dibaca
  const markAsRead = async (id: string | number) => {
    try {

      const session = await getSession();
      if (!session?.token) return; // Guard

      // Optimistic Update: Ubah tampilan di UI secara instan tanpa menunggu respons server
      setNotifications(prev => 
        prev.map(notif => notif.id === id ? { ...notif, read_at: new Date().toISOString() } : notif)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

    // Kirim ke backend via apiFetch
      await apiFetch(`/notifications/${id}/mark-read`, { method: 'POST' });
    } catch (e) {
      console.error("Gagal menandai baca", e);
      fetchNotifs(); // Jika server error, rollback/ambil data ulang dari server
    }
  };

  // FUNGSI BARU: Menandai SEMUA notifikasi sudah dibaca
  const markAllAsRead = async () => {
    try {

      const session = await getSession();
      if (!session?.token) return; // Guard

      // Optimistic Update untuk semua data di UI
      setNotifications(prev => prev.map(notif => ({ ...notif, read_at: new Date().toISOString() })));
      setUnreadCount(0);

      // Kirim request ke backend Laravel
    await apiFetch("/notifications/mark-all-read", { method: 'POST' });
    } catch (e) {
      console.error("Gagal menandai semua baca", e);
      fetchNotifs(); // Rollback jika error
    }
  };

  useEffect(() => {
    fetchNotifs(); // Fetch saat komponen pertama kali dibuka
    
    // Polling tiap 30 detik
    const interval = setInterval(fetchNotifs, 30000); 
    
    return () => clearInterval(interval);
  }, []);

  return { notifications, unreadCount, loading, refresh: fetchNotifs, markAsRead, markAllAsRead };
};
