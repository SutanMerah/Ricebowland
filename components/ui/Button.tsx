import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from "react-native";
import { theme } from "../../constants/theme";
import { spacing, radius, typography } from "../system";

type Props = {
  title: string;
  onPress?: () => void;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg"; // Tambahkan tipe size di sini
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

export function Button({
  title,
  onPress,
  variant = "default",
  size = "md", // Default-nya tetap 'md'
  style,
  disabled,
}: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.base,
        // Logika varian
        variant === "default" && styles.default,
        variant === "outline" && styles.outline,
        variant === "ghost" && styles.ghost,
        // Logika ukuran
        styles[size], 
        style,
        disabled && styles.disabledButton
      ]}
    >
      <Text
        style={[
          styles.text,
          // Ukuran teks menyesuaikan tombol
          size === "sm" && styles.textSm,
          // Warna teks menyesuaikan varian
          variant === "outline" && styles.textOutline,
          variant === "ghost" && styles.textGhost,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },

  // UKURAN (SIZE)
  sm: {
    paddingVertical: spacing.xs || 6,
    paddingHorizontal: spacing.md || 12,
  },
  md: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  lg: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },

  // VARIAN
  default: {
    backgroundColor: theme.colors.primary,
  },
  outline: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "transparent",
  },
  ghost: {
    backgroundColor: "transparent",
  },

  // TEKS
  text: {
    ...typography.body,
    fontWeight: theme.font.weightMedium,
    color: theme.colors.primaryForeground,
  },
  textSm: {
    fontSize: 14, // Lebih kecil sedikit untuk tombol navbar
  },
  textOutline: {
    color: theme.colors.foreground,
  },
  textGhost: {
    color: theme.colors.primary,
  },
  disabledButton: { 
    backgroundColor: '#A9A9A9' 
  },
});