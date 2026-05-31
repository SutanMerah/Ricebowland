import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, useWindowDimensions, TouchableOpacity, Platform, Alert, Modal } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { theme } from "@/constants/theme";
import { spacing } from "@/components/system";
import { apiFetch } from "@/lib/fetch";

interface MenuItem {
  id: number | string;
  name: string;
  description?: string;
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
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | string | null>(null);

  useEffect(() => {
    async function loadMenus(showSpinner = true) {
      try {
        if (showSpinner) {
          setIsLoading(true);
        }
        const data = await apiFetch("/menus");
        setMenus(Array.isArray(data) ? data : data.data || []);
      } catch (error) {
        console.error("Gagal memuat menu:", error);
      } finally {
        if (showSpinner) {
          setIsLoading(false);
        }
      }
    }

    loadMenus(true);

    const interval = setInterval(() => {
      loadMenus(false);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setImageFileName(asset.fileName || `image_${Date.now()}.jpg`);
    }
  };

const createMenuItem = async () => {
    if (!name.trim() || !description.trim() || !imageUri) {
      setCreateError("Mohon isi nama, deskripsi, dan pilih gambar.");
      return;
    }
    const parsedPrice = Number(price.replace(/[^0-9]/g, "")) || 0;
    setIsSubmitting(true);
    setCreateError(null);

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("description", description.trim());
    formData.append("price", parsedPrice.toString());

    if (imageUri && imageFileName) {
      const imageType = imageFileName.endsWith(".png") ? "image/png" : "image/jpeg";

      if (Platform.OS === "web") {
        // --- PERBAIKAN DI SINI ---
        const response = await fetch(imageUri);
        const blob = await response.blob();
        
        // Bungkus blob menjadi File untuk memaksa tipe MIME terbaca oleh Laravel
        const imageFile = new File([blob], imageFileName, { type: imageType });
        formData.append("image", imageFile);
        // -------------------------
      } else {
        // Khusus Mobile
        formData.append("image", {
          uri: imageUri,
          name: imageFileName,
          type: imageType,
        } as any);
      }
    }

    try {
      const result = await apiFetch("/menus", {
        method: "POST",
        body: formData,
      });

      const createdMenu = result && (result as any).id
        ? result
        : { id: Date.now(), name: name.trim(), description: description.trim(), price: parsedPrice };
      setMenus((current) => [createdMenu, ...current]);
      setName("");
      setDescription("");
      setPrice("");
      setImageUri(null);
      setImageFileName(null);
    } catch (error: any) {
      console.error("Gagal membuat menu baru:", error);
      setCreateError(error?.message || "Gagal membuat menu baru. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMenu = (menuId: number | string) => {
    setDeleteConfirmId(menuId);
  };

  const confirmDeleteMenu = async (menuId: number | string) => {
    try {
      await apiFetch(`/menus/${menuId}`, {
        method: "DELETE",
      });
      setMenus((current) => current.filter((item) => item.id !== menuId));
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Gagal menghapus menu:", error);
      Alert.alert("Error", "Gagal menghapus menu");
      setDeleteConfirmId(null);
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
            placeholder="Deskripsi Menu"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />
          <Input
            placeholder="Harga (contoh 15000)"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />
          <TouchableOpacity
            style={[styles.imagePickerButton, imageUri && styles.imagePickerButtonSelected]}
            onPress={pickImage}
          >
            <Text style={styles.imagePickerText}>
              {imageFileName ? `✓ ${imageFileName}` : "📷 Pilih Gambar Menu"}
            </Text>
          </TouchableOpacity>
          {createError ? <Text style={styles.errorText}>{createError}</Text> : null}
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
                  onPress={() => handleDeleteMenu(menu.id)}
                  style={[styles.deleteButton, !isDesktop && { width: '100%' }]}
                />
              </View>
            </CardContent>
          </Card>
        ))
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteConfirmId !== null}
        onRequestClose={() => setDeleteConfirmId(null)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Hapus Menu?</Text>
            <Text style={styles.confirmMessage}>
              Apakah Anda yakin ingin menghapus menu ini? Tindakan ini tidak dapat dibatalkan.
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => setDeleteConfirmId(null)}
              >
                <Text style={styles.confirmCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmActionBtn, { backgroundColor: theme.colors.destructive }]}
                onPress={() => {
                  if (deleteConfirmId !== null) {
                    confirmDeleteMenu(deleteConfirmId);
                  }
                }}
              >
                <Text style={styles.confirmActionText}>Hapus</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addButton: { minHeight: 44, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: "800", marginBottom: 16, color: theme.colors.foreground },
  emptyCard: { borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: theme.colors.foreground, marginBottom: 8 },
  emptySubtitle: { color: theme.colors.mutedForeground },
  menuCard: { borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 14 },
  menuHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  menuName: { fontSize: 16, fontWeight: "800", color: theme.colors.foreground },
  menuPrice: { marginTop: 6, color: theme.colors.mutedForeground },
  deleteButton: { minHeight: 44, borderRadius: 10, borderColor: theme.colors.border, paddingHorizontal: 16, paddingVertical: 10, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: theme.colors.destructive, marginBottom: spacing.sm },
  imagePickerButton: {
    padding: spacing.md,
    marginVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: "dashed" as any,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9f9f9",
  },
  imagePickerButtonSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: "#e8f5e9",
  },
  imagePickerText: {
    fontSize: 14,
    fontWeight: "600" as any,
    color: theme.colors.foreground,
  },

  // ===== DELETE CONFIRMATION MODAL =====
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmBox: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.foreground,
    marginBottom: 12,
  },
  confirmMessage: {
    fontSize: 14,
    color: theme.colors.mutedForeground,
    lineHeight: 20,
    marginBottom: 24,
  },
  confirmActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  confirmCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  confirmCancelText: {
    fontWeight: "600",
    color: theme.colors.foreground,
  },
  confirmActionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  confirmActionText: {
    fontWeight: "600",
    color: "#fff",
  },
});
