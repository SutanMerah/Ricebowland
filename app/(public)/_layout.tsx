import { Slot } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/components/system/AuthContext";
import { theme } from "@/constants/theme";

export default function PublicLayout() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Navbar />
      <Slot />
    </View>
  );
}