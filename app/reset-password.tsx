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
import { apiFetch } from "@/lib/fetch";

export default function ResetPassword() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setMessage("");
    setError("");

    if (!email.trim() || !token.trim() || !password || !passwordConfirmation) {
      setError("Semua kolom harus diisi.");
      return;
    }

    if (password !== passwordConfirmation) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);

    try {
      const result = await apiFetch("/reset-password", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          token: token.trim(),
          password,
          password_confirmation: passwordConfirmation,
        }),
      });

      setMessage(result?.message || "Password berhasil direset.");
      setEmail("");
      setToken("");
      setPassword("");
      setPasswordConfirmation("");
    } catch (err: any) {
      console.error("Reset Password Error:", err);
      setError(err?.message || "Terjadi kesalahan saat mereset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#FDF6F0", "#FFFFFF", "#FDF6F0"]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={[styles.card, { width: isDesktop ? 500 : "100%" }]}>
          <CardHeader style={styles.header}>
            <View style={styles.logoWrap}>
              <View style={[styles.logoBox, { backgroundColor: theme.colors.primary }]}>
                <Icon
                  name="key"
                  size={28}
                  color={theme.colors.primaryForeground}
                />
              </View>
            </View>

            <CardTitle>
              <Text style={styles.mainTitle}>Atur Ulang Kata Sandi</Text>
            </CardTitle>
            <CardDescription>
              <Text style={styles.subTitle}>
                Masukkan token, email, dan password baru Anda.
              </Text>
            </CardDescription>
          </CardHeader>

          <CardContent style={styles.formContainer}>
            <View style={styles.field}>
              <View style={{ marginBottom: 8 }}>
                <Label>Email</Label>
              </View>
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                icon={<Icon name="mail" size={18} color={theme.colors.mutedForeground} />}
                style={styles.inputContainer}
              />
            </View>

            <View style={styles.field}>
              <View style={{ marginBottom: 8 }}>
                <Label>Token</Label>
              </View>
              <Input
                value={token}
                onChangeText={setToken}
                placeholder="Masukkan token dari email"
                autoCapitalize="none"
                style={styles.inputContainer}
              />
            </View>

            <View style={styles.field}>
              <View style={{ marginBottom: 8 }}>
                <Label>Password Baru</Label>
              </View>
              <Input
                value={password}
                onChangeText={setPassword}
                placeholder="Password baru"
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
                value={passwordConfirmation}
                onChangeText={setPasswordConfirmation}
                placeholder="Ulangi password baru"
                secureTextEntry
                icon={<Icon name="lock-closed" size={18} color={theme.colors.mutedForeground} />}
                style={styles.inputContainer}
              />
            </View>

            {message ? <Text style={styles.successText}>{message}</Text> : null}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Button
              title={loading ? "Memproses..." : "Atur Ulang Kata Sandi"}
              onPress={handleSubmit}
              style={styles.actionButton}
            />

            <View style={styles.footerLinks}>
              <TouchableOpacity onPress={() => router.push("/login")}> 
                <Text style={styles.linkText}>Kembali ke Login</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/forgot-password")}> 
                <Text style={styles.linkText}>Minta ulang link reset</Text>
              </TouchableOpacity>
            </View>
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
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.xl,
    padding: spacing.md,
    elevation: 4,
    boxShadow: "0px 10px 20px rgba(0,0,0,0.05)",
  },
  header: {
    marginBottom: spacing.sm,
  },
  logoWrap: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  mainTitle: {
    ...typography.title2,
    fontWeight: "700",
    textAlign: "center",
    color: theme.colors.foreground,
  },
  subTitle: {
    ...typography.body,
    textAlign: "center",
    color: theme.colors.mutedForeground,
    marginTop: spacing.sm,
  },
  formContainer: {
    marginTop: spacing.sm,
  },
  field: {
    marginBottom: spacing.sm,
  },
  inputContainer: {
    minHeight: 54,
  },
  actionButton: {
    marginTop: spacing.sm,
  },
  footerLinks: {
    marginTop: spacing.lg,
    alignItems: "center",
  },
  linkText: {
    ...typography.body,
    color: theme.colors.primary,
    marginTop: spacing.sm,
  },
  successText: {
    color: theme.colors.success || "#228B22",
    marginBottom: spacing.sm,
    ...typography.body,
    textAlign: "center",
  },
  errorText: {
    color: theme.colors.destructive || "#B00020",
    marginBottom: spacing.sm,
    ...typography.body,
    textAlign: "center",
  },
});
