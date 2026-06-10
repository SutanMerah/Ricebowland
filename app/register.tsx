import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Modal,
  Pressable,
  Image,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { Icon } from "@/components/ui/Icon";

const iconSrc = require("../assets/icon.jpg");

import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";

import { theme } from "@/constants/theme";
import { spacing, radius, typography } from "@/components/system";
import { useAuth } from "@/components/system/AuthContext";
import { apiFetch } from "@/lib/fetch";

export default function Register() {
  const { login } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [customAlertVisible, setCustomAlertVisible] = useState(false);
  const [customAlertMessage, setCustomAlertMessage] = useState("");





    const handleSubmit = async () => {

  // 1. Validasi Input Frontend

  if (!name || !email || !password || !confirmPassword) {

    setCustomAlertMessage("Harap isi semua kolom!");
    setCustomAlertVisible(true);

    return;

  }



  if (password !== confirmPassword) {

    setCustomAlertMessage("Konfirmasi password tidak cocok!");
    setCustomAlertVisible(true);

    return;

  }



  try {

    // 2. Tembak data ke API Register Laravel kelompokmu

    const result = await apiFetch("/register", {

      method: "POST",

      body: JSON.stringify({

        name: name,

        email: email,

        password: password,

      }),

    });



    if (!result) {

      // Tangkap jika email sudah terdaftar atau validasi Laravel gagal

      throw new Error("Gagal melakukan registrasi ke server.");

    }



    setCustomAlertMessage("Registrasi Berhasil! Akun disimpan ke database Laravel.");
    setCustomAlertVisible(true);

    // 3. Set state login lokal di frontend agar aplikasi tahu kamu sudah masuk
    const selectedRole = "customer" as const;
    const responseUser =
      (result && typeof result === "object" && "id" in result && "name" in result)
        ? result
        : result.user ||
          result.data ||
          result.data?.user ||
          result.data?.data ||
          result.data?.result ||
          {};

    const userId = responseUser?.id || responseUser?.user?.id || 1; // ID dari server
    const userName = responseUser?.name || responseUser?.user?.name || "Pengguna Baru";
    const userEmail = responseUser?.email || email;
    
    const token = result?.token || result?.access_token || result?.data?.token || result?.data?.access_token || responseUser?.token;
    await login(selectedRole, userEmail, userId, userName, token);



    // 4. Alihkan halaman langsung ke dashboard customer

    // Delay replace so navigator can initialize
    setTimeout(() => router.replace("/(customer)/dashboard"), 0);



  } catch (error: any) {

    console.error("Error Register:", error);

    const errorMessage = error.body?.message || error.body?.error || error.message || "Terjadi kesalahan pada server";
    setCustomAlertMessage("Gagal Membuat Akun: " + errorMessage);
    setCustomAlertVisible(true);

  }

};

  return (
    <LinearGradient
      colors={["#FDF6F0", "#FFFFFF", "#FDF6F0"]}
      style={styles.container}
    >
      <View style={styles.bgLayer}>
        <Image source={iconSrc} style={[styles.bgIcon, styles.bg1]} resizeMode="contain" />
        <Image source={iconSrc} style={[styles.bgIcon, styles.bg2]} resizeMode="contain" />
        <Image source={iconSrc} style={[styles.bgIcon, styles.bg3]} resizeMode="contain" />
        <Image source={iconSrc} style={[styles.bgIcon, styles.bg4]} resizeMode="contain" />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={[styles.loginCard, { width: isDesktop ? 450 : "100%" }]}>
          <CardHeader style={styles.header}>
            <View style={styles.logoWrap}>
              <View style={[styles.logoBox, { backgroundColor: theme.colors.primary }]}>
                <Image source={iconSrc} style={styles.logoImage} resizeMode="contain" />
              </View>
            </View>

            <CardTitle>
              <Text style={styles.mainTitle}>
                Buat akun <Text style={{ color: theme.colors.primary }}>Ricebowland</Text> Anda
              </Text>
            </CardTitle>

            <CardDescription>
              <Text style={styles.subTitle}>Daftar dan mulai memesan hari ini</Text>
            </CardDescription>
          </CardHeader>

          <CardContent style={styles.formContainer}>
            <View style={styles.field}>
              <View style={{ marginBottom: 8 }}>
                <Label>Nama Lengkap</Label>
              </View>
              <Input
                value={name}
                onChangeText={setName}
                placeholder="Masukkan nama lengkap Anda"
                icon={<Icon name="person" size={18} color={theme.colors.mutedForeground} />}
                style={styles.inputContainer}
              />
            </View>

            <View style={styles.field}>
              <View style={{ marginBottom: 8 }}>
                <Label>Email atau Nama Pengguna</Label>
              </View>
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="Masukkan email atau nama pengguna Anda"
                icon={<Icon name="mail" size={18} color={theme.colors.mutedForeground} />}
                style={styles.inputContainer}
              />
            </View>

            <View style={styles.field}>
              <View style={{ marginBottom: 8 }}>
                <Label>Kata Sandi</Label>
              </View>
              <Input
                value={password}
                onChangeText={setPassword}
                placeholder="Buat kata sandi"
                secureTextEntry
                icon={<Icon name="lock-closed" size={18} color={theme.colors.mutedForeground} />}
                style={styles.inputContainer}
              />
            </View>

            <View style={styles.field}>
              <View style={{ marginBottom: 8 }}>
                <Label>Konfirmasi Kata Sandi</Label>
              </View>
              <Input
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Ulangi kata sandi"
                secureTextEntry
                icon={<Icon name="lock-closed" size={18} color={theme.colors.mutedForeground} />}
                style={styles.inputContainer}
              />
            </View>

            <Button
              title="Buat Akun"
              onPress={handleSubmit}
              style={styles.signInButton}
            />

            <View style={styles.divider}>
              <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
              <Text style={styles.dividerText}>Sudah punya akun?</Text>
              <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
            </View>

            <TouchableOpacity onPress={() => router.push("/login")}> 
              <Text style={styles.createAccountText}>Masuk saja</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/")} style={styles.backHome}>
              <Text style={styles.backText}>← Kembali ke beranda</Text>
            </TouchableOpacity>
          </CardContent>
        </Card>
      </ScrollView>

      {/* CUSTOM ALERT MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={customAlertVisible}
        onRequestClose={() => setCustomAlertVisible(false)}
      >
        <Pressable
          style={styles.customAlertOverlay}
          onPress={() => setCustomAlertVisible(false)}
        >
          <View style={styles.customAlertBox}>
            <Text style={styles.customAlertText}>{customAlertMessage}</Text>
            <Button
              title="OK"
              onPress={() => setCustomAlertVisible(false)}
              style={styles.customAlertButton}
              variant="default"
            />
          </View>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  bgLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  bgIcon: {
    width: 120,
    height: 120,
    position: "absolute",
    opacity: 0.5,
  },
  bg1: { position: "absolute", top: 80, left: -20, opacity: 0.5, transform: [{ rotate: "15deg" }] },
  bg2: { position: "absolute", bottom: 80, right: -20, opacity: 0.5, transform: [{ rotate: "-15deg" }] },
  bg3: { position: "absolute", top: "50%", left: "10%", opacity: 0.3, transform: [{ rotate: "-45deg" }] },
  bg4: { position: "absolute", top: "20%", right: "10%", opacity: 0.3, transform: [{ rotate: "45deg" }] },
  loginCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: spacing.md,
    elevation: 4,
    boxShadow: "0px 10px 20px rgba(0,0,0,0.05)",
    borderWidth: 0,
  },
  header: {
    alignItems: "center",
    paddingBottom: spacing.sm,
  },
  logoWrap: {
    marginBottom: spacing.md,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoImage: {
    width: 40,
    height: 40,
  },
  mainTitle: {
    ...typography.h2,
    fontSize: 28,
    textAlign: "center",
  },
  subTitle: {
    ...typography.body,
    textAlign: "center",
    marginTop: 4,
  },
  formContainer: {
    paddingHorizontal: spacing.sm,
  },
  field: {
    marginBottom: spacing.lg,
  },
  inputContainer: {
    backgroundColor: "#FEF9F5",
    borderRadius: 12,
  },
  signInButton: {
    height: 50,
    borderRadius: 12,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  line: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    color: theme.colors.mutedForeground,
    fontSize: 14,
  },
  createAccountText: {
    textAlign: "center",
    color: theme.colors.primary,
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 20,
  },
  backHome: {
    marginTop: 10,
  },
  backText: {
    textAlign: "center",
    color: theme.colors.mutedForeground,
    fontSize: 14,
  },

  // CUSTOM ALERT STYLES
  customAlertOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  customAlertBox: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxWidth: 400,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  customAlertText: {
    fontSize: 16,
    color: theme.colors.foreground,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 24,
  },
  customAlertButton: {
    minWidth: 100,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
});
