import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, useWindowDimensions } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { theme } from "@/constants/theme";
import { spacing } from "@/components/system";

  const API_BASE_URL = "https://backend-ricebowland.fly.dev/api";

interface MenuItem {
  id: number | string;
  name: string;
  price?: number;
}

function formatCurrency(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

export default function AdminMenuManagement() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadMenus() {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/menus`);
        const data = await response.json();
        setMenus(Array.isArray(data) ? data : data.data || []);
      } catch (error) {
        console.error("Gagal memuat menu:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadMenus();
  }, []);

  const createMenuItem = async () => {
    if (!name.trim()) return;
    const parsedPrice = Number(price.replace(/[^0-9]/g, "")) || 0;
    setIsSubmitting(true);

    const payload = { name: name.trim(), price: parsedPrice };
    const newMenu: MenuItem = { id: Date.now(), name: payload.name, price: parsedPrice };

    setMenus((current) => [newMenu, ...current]);
    setName("");
    setPrice("");

    try {
      await fetch(`${API_BASE_URL}/menus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("Gagal membuat menu baru:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeMenu = async (menuId: number | string) => {
    setMenus((current) => current.filter((item) => item.id !== menuId));

    try {
      await fetch(`${API_BASE_URL}/menus/${menuId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Gagal menghapus menu:", error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Memuat daftar menu...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Manajemen Menu</Text>
        <Text style={styles.subtitle}>Tambahkan item menu baru, sesuaikan penawaran, dan hapus hidangan yang sudah ketinggalan jaman.</Text>
      </View>

      <Card style={styles.formCard}>
        <CardContent>
          <Text style={styles.formTitle}>Tambahkan Item Menu Baru</Text>
          <Input
            placeholder="Nama Menu"
            value={name}
            onChangeText={setName}
          />
          <Input
            placeholder="Harga (contoh 15000)"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />
          <Button
            title={isSubmitting ? "Menambahkan..." : "Tambah Menu"}
            onPress={createMenuItem}
            style={[styles.addButton, !isDesktop && { width: '100%' }]}
          />
        </CardContent>
      </Card>

      <Text style={styles.sectionTitle}>Item Menu Tersedia</Text>
      {menus.length === 0 ? (
        <Card style={styles.emptyCard}>
          <CardContent>
            <Text style={styles.emptyTitle}>Belum ada item menu</Text>
            <Text style={styles.emptySubtitle}>Buat item menu pertama untuk mulai menjual.</Text>
          </CardContent>
        </Card>
      ) : (
        menus.map((menu) => (
          <Card key={menu.id} style={styles.menuCard}>
            <CardContent>
              <View style={[styles.menuHeader, !isDesktop && { flexDirection: 'column', alignItems: 'flex-start', gap: 8 }]}>
                <View>
                  <Text style={styles.menuName}>{menu.name}</Text>
                  <Text style={styles.menuPrice}>{formatCurrency(menu.price || 0)}</Text>
                </View>
                <Button
                  title="Hapus"
                  variant="outline"
                  onPress={() => removeMenu(menu.id)}
                  style={[styles.deleteButton, !isDesktop && { width: '100%' }]}
                />
              </View>
            </CardContent>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: spacing.xl, width: "100%", maxWidth: 1280, alignSelf: "center" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background },
  loadingText: { marginTop: 16, color: theme.colors.mutedForeground },
  header: { marginBottom: spacing.xl },
  title: { fontSize: 32, fontWeight: "800", color: theme.colors.foreground },
  subtitle: { fontSize: 15, marginTop: 6, color: theme.colors.mutedForeground },
  formCard: { marginBottom: spacing.xl, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border },
  formTitle: { fontSize: 18, fontWeight: "800", marginBottom: 16, color: theme.colors.foreground },
  addButton: { height: 48, borderRadius: 12 },
  sectionTitle: { fontSize: 20, fontWeight: "800", marginBottom: 16, color: theme.colors.foreground },
  emptyCard: { borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: theme.colors.foreground, marginBottom: 8 },
  emptySubtitle: { color: theme.colors.mutedForeground },
  menuCard: { borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 14 },
  menuHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  menuName: { fontSize: 16, fontWeight: "800", color: theme.colors.foreground },
  menuPrice: { marginTop: 6, color: theme.colors.mutedForeground },
  deleteButton: { height: 40, borderRadius: 10, borderColor: theme.colors.border },
});
