import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Plus, Minus, ShoppingCart, Trash2 } from "lucide-react-native";
import { API_BASE_URL } from "@/lib/api";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import { theme } from "@/constants/theme";
import { spacing, radius } from "@/components/system";

interface CartItem {
  id: number | string;
  name: string;
  price: number;
  quantity: number;
}

interface MenuItem {
  id: number | string;
  name: string;
  price: number;
  image?: string;
  description?: string;
}

export default function MenuPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const isDesktop = width >= 768;

  const loadMenuItems = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      const response = await fetch(`${API_BASE_URL}/menus`);
      if (!response.ok) {
        throw new Error(`Gagal memuat menu: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const parsedMenus = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];

      setMenuItems(parsedMenus);
    } catch (error: any) {
      console.error("Gagal memuat menu dari server:", error);
      setMenuItems([]);
      setLoadError(error?.message || "Gagal memuat menu. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMenuItems();
  }, []);

  const getItemQuantity = (id: number | string) =>
    cart.find((c) => c.id === id)?.quantity || 0;

  const addToCart = (item: (typeof menuItems)[0]) => {
    setCart((prev) => {
      const exist = prev.find((c) => c.id === item.id);
      if (exist) {
        return prev.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number | string) => {
    setCart((prev) => {
      const exist = prev.find((c) => c.id === id);
      if (exist && exist.quantity > 1) {
        return prev.map((c) =>
          c.id === id ? { ...c, quantity: c.quantity - 1 } : c
        );
      }
      return prev.filter((c) => c.id !== id);
    });
  };

  const removeItem = (id: number | string) =>
    setCart((prev) => prev.filter((c) => c.id !== id));

  const totalPrice = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Memuat menu Ricebowland...</Text>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{loadError}</Text>
        <Button title="Muat ulang menu" onPress={loadMenuItems} style={styles.orderBtn} />
      </View>
    );
  }

  if (menuItems.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Menu belum tersedia. Silakan coba lagi nanti atau hubungi admin.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen}>
{/* Kita tambahkan padding horizontal dinamis di sini */}
      <View style={[styles.mainContainer, { paddingHorizontal: width > 1024 ? 40 : 20 }]}>
        <Text style={styles.title}>Menu Kami</Text>
        <Text style={styles.subtitle}>Pilih mangkuk nasi favorit Anda</Text>

        <View style={[styles.grid, !isDesktop && styles.stack]}>
          <View style={styles.menuColumn}>
            <View style={[styles.menuList, !isDesktop && styles.menuListMobile]}>
              {menuItems.map((item) => {
                const qty = getItemQuantity(item.id);
                return (
                  <Card key={item.id} style={[styles.card, !isDesktop && styles.cardMobile]}>
                    <ImageWithFallback src={item.image ?? ""} style={styles.image} />
                    <CardContent style={styles.cardContent}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.desc}>{item.description ?? ""}</Text>

                      <View style={styles.cardFooter}>
                        <Text style={styles.price}>
                          Rp {item.price.toLocaleString("id-ID")}
                        </Text>

                        <View style={styles.qtyContainer}>
                          <TouchableOpacity
                            onPress={() => removeFromCart(item.id)}
                            style={styles.qtyBtn}
                          >
                            <Minus size={16} color={theme.colors.mutedForeground} />
                          </TouchableOpacity>
                          <Text style={styles.qtyText}>{qty}</Text>
                          <TouchableOpacity
                            onPress={() => addToCart(item)}
                            style={[styles.qtyBtn, styles.qtyBtnPlus]}
                          >
                            <Plus size={16} color="white" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </CardContent>
                  </Card>
                );
              })}
            </View>
          </View>

          {/* RIGHT: CART (Sticky-like) */}
          <View style={[
            styles.cartColumn, 
            isDesktop ? { position: 'sticky' as any, top: 20 } : styles.cartColumnMobile
          ]}>
            <View style={styles.cartCard}>
              <View style={styles.cartHeader}>
                <View style={styles.row}>
                  <ShoppingCart size={20} color={theme.colors.primary} />
                  <Text style={styles.cartTitle}>Your Cart</Text>
                </View>
                {totalItems > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{totalItems}</Text>
                  </View>
                )}
              </View>

              {cart.length === 0 ? (
                <View style={styles.emptyCart}>
                   <ShoppingCart size={40} color={theme.colors.border} />
                   <Text style={styles.emptyText}>No items selected</Text>
                   <Text style={styles.emptySubText}>Please choose your menu</Text>
                </View>
              ) : (
                <View style={styles.cartContent}>
                  {cart.map((item) => (
                    <View key={item.id} style={styles.cartItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cartItemName}>{item.name}</Text>
                        <Text style={styles.cartItemPrice}>
                          Rp {item.price.toLocaleString("id-ID")} × {item.quantity}
                        </Text>
                      </View>
                      <View style={styles.cartItemRight}>
                         <Text style={styles.cartItemTotal}>
                           Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                         </Text>
                         <TouchableOpacity onPress={() => removeItem(item.id)}>
                            <Trash2 size={16} color={theme.colors.destructive} />
                         </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                  <View style={styles.divider} />
                  
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Subtotal</Text>
                    <Text style={styles.totalPriceText}>Rp {totalPrice.toLocaleString("id-ID")}</Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabelBold}>Total</Text>
                    <Text style={styles.totalPriceBold}>Rp {totalPrice.toLocaleString("id-ID")}</Text>
                  </View>

                  <Button
                  title="Order Now"
                  onPress={() => {
                  // Kirim data cart ke halaman purchase
                  router.push({
                  pathname: "/purchase",
                  params: { cart: JSON.stringify(cart) }
                  });
                  }}
                  style={styles.orderBtn}
                  />
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { 
    flex: 1, 
    backgroundColor: "#fafafa",
  },
  mainContainer: {
    // Kita perkecil maxWidth dari 1200 ke 1050 agar lebih rapat ke tengah
    maxWidth: 1050, 
    width: "100%",
    alignSelf: "center",
    // Beri padding lebih besar di desktop agar tidak "mojok"
    paddingHorizontal: 40, 
    paddingVertical: spacing.xl,
  },
  title: { fontSize: 32, fontWeight: "800", color: theme.colors.foreground, marginBottom: 4 },
  subtitle: { fontSize: 16, color: theme.colors.mutedForeground, marginBottom: 32 },
  
  grid: { 
    flexDirection: "row", 
    gap: 32, // Gap antar kolom menu dan cart diperlebar sedikit agar bernapas
    alignItems: "flex-start" 
  },
  stack: { flexDirection: "column" },
  
  menuColumn: { 
    flex: 2.5, // Sedikit dikecilkan agar cart tidak terlalu jauh
  }, 
  menuList: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    gap: 16 // Gap antar card menu
  },
  menuListMobile: {
    justifyContent: "center",
  },
  
  card: { 
    // Menggunakan perhitungan agar 2 kolom di area menuColumn terlihat pas
    width: "48%", 
    minWidth: 260,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardMobile: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  image: { height: 160, width: "100%" },
  cardContent: { padding: spacing.md, flex: 1 },
  itemName: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  desc: { 
    fontSize: 13, 
    color: theme.colors.mutedForeground, 
    lineHeight: 18, 
    marginBottom: 16,
    height: 36, // Menjaga teks deskripsi tetap seragam (2 baris)
  },
  
  cardFooter: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center",
    marginTop: "auto" 
  },
  price: { fontSize: 18, fontWeight: "800", color: theme.colors.primary },
  
  qtyContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#F1F5F9", 
    borderRadius: radius.md,
    padding: 4
  },
  qtyBtn: { padding: 6 },
  qtyBtnPlus: { backgroundColor: theme.colors.primary, borderRadius: 6 },
  qtyText: { paddingHorizontal: 10, fontWeight: "700", fontSize: 14 },

  /* CART STYLING - Lebih Compact */
  cartColumn: { 
    flex: 1, 
    minWidth: 320,
  },
  cartColumnMobile: {
    width: "100%",
    marginTop: spacing.lg,
  },
  cartCard: {
    backgroundColor: "white",
    borderRadius: radius.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    boxShadow: "0px 4px 10px rgba(0,0,0,0.05)",
    elevation: 2,
  },
  cartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  cartTitle: { fontSize: 18, fontWeight: "800" },
  badge: { backgroundColor: theme.colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  badgeText: { color: "white", fontSize: 12, fontWeight: "700" },

  cartContent: { marginTop: 8, width: "100%" },
  cartItem: { flexDirection: "row", marginBottom: 16, gap: 12, alignItems: "center" },
  cartItemName: { fontWeight: "600", fontSize: 14 },
  cartItemPrice: { fontSize: 12, color: theme.colors.mutedForeground },
  cartItemRight: { alignItems: "flex-end", gap: 4 },
  cartItemTotal: { fontWeight: "700", fontSize: 14 },

  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 16 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  totalLabel: { color: theme.colors.mutedForeground },
  totalPriceText: { fontWeight: "600" },
  totalLabelBold: { fontWeight: "800", fontSize: 16 },
  totalPriceBold: { fontWeight: "800", fontSize: 20, color: theme.colors.primary },
  
  orderBtn: { marginTop: 16, height: 50, borderRadius: radius.lg },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    color: theme.colors.mutedForeground,
    fontSize: 16,
  },

  emptyCart: { alignItems: "center", paddingVertical: 40 },
  emptyText: { marginTop: 12, fontWeight: "700", color: theme.colors.foreground },
  emptySubText: { color: theme.colors.mutedForeground, fontSize: 12 },
});