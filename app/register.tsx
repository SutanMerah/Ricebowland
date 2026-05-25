import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { Icon } from "@/components/ui/Icon";

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
import { API_BASE_URL } from "@/lib/api";

export default function Register() {
  const { login } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");





    const handleSubmit = async () => {

  // 1. Validasi Input Frontend

  if (!name || !email || !password || !confirmPassword) {

    alert("Harap isi semua kolom!");

    return;

  }



  if (password !== confirmPassword) {

    alert("Konfirmasi password tidak cocok!");

    return;

  }



  try {

    // 2. Tembak data ke API Register Laravel kelompokmu

    const response = await fetch(`${API_BASE_URL}/register`, {

      method: "POST",

      headers: {

        "Content-Type": "application/json",

        "Accept": "application/json",

      },

      body: JSON.stringify({

        name: name,

        email: email,

        password: password,

      }),

    });



    const result = await response.json();



    if (!response.ok) {

      // Tangkap jika email sudah terdaftar atau validasi Laravel gagal

      throw new Error(result.message || "Gagal melakukan registrasi ke server.");

    }



    alert("Registrasi Berhasil! Akun disimpan ke database Laravel.");

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

    alert("Gagal Membuat Akun: " + error.message);

  }

};

  return (
    <LinearGradient
      colors={["#FDF6F0", "#FFFFFF", "#FDF6F0"]}
      style={styles.container}
    >
      <View style={styles.bgLayer}>
        <Icon name="restaurant" size={120} color="#F5E8DF" style={styles.bg1} />
        <Icon name="restaurant" size={120} color="#F5E8DF" style={styles.bg2} />
        <Icon name="restaurant" size={90} color="#F5E8DF" style={styles.bg3} />
        <Icon name="restaurant" size={90} color="#F5E8DF" style={styles.bg4} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={[styles.loginCard, { width: isDesktop ? 450 : "100%" }]}>
          <CardHeader style={styles.header}>
            <View style={styles.logoWrap}>
              <View style={[styles.logoBox, { backgroundColor: theme.colors.primary }]}>
                <Icon
                  name="restaurant"
                  size={32}
                  color={theme.colors.primaryForeground}
                />
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
                <Label>Password</Label>
              </View>
              <Input
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                secureTextEntry
                icon={<Icon name="lock-closed" size={18} color={theme.colors.mutedForeground} />}
                style={styles.inputContainer}
              />
            </View>

            <View style={styles.field}>
              <View style={{ marginBottom: 8 }}>
                <Label>Confirm Password</Label>
              </View>
              <Input
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repeat your password"
                secureTextEntry
                icon={<Icon name="lock-closed" size={18} color={theme.colors.mutedForeground} />}
                style={styles.inputContainer}
              />
            </View>

            <Button
              title="Create Account"
              onPress={handleSubmit}
              style={styles.signInButton}
            />

            <View style={styles.divider}>
              <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
              <Text style={styles.dividerText}>Already have an account?</Text>
              <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
            </View>

            <TouchableOpacity onPress={() => router.push("/login")}> 
              <Text style={styles.createAccountText}>Sign in instead</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/")} style={styles.backHome}>
              <Text style={styles.backText}>← Back to home</Text>
            </TouchableOpacity>
          </CardContent>
        </Card>
      </ScrollView>
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
});
