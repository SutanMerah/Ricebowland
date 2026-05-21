import { View, TextInput, StyleSheet, TextInputProps } from "react-native";
import { ReactNode } from "react";
import { theme } from "../../constants/theme";
import { spacing, radius, typography } from "../system";

// 1. Kita ambil semua tipe bawaan dari TextInputProps
interface Props extends TextInputProps {
  icon?: ReactNode;
}

export function Input({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  icon,
  style, // Kita ambil style dari props agar bisa dicustom dari luar
  ...rest // 2. Ambil sisa properti lainnya (termasuk multiline)
}: Props) {
  return (
    <View style={styles.container}>
      {icon && <View style={styles.icon}>{icon}</View>}

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.mutedForeground}
        secureTextEntry={secureTextEntry}
        // 3. Gabungkan style bawaan dengan style tambahan jika multiline
        style={[
          styles.input,
          icon ? { paddingLeft: 40 } : undefined,
          rest.multiline ? { height: 100, textAlignVertical: "top" } : undefined,
          style,
        ]}
        {...rest} // 4. Spread sisa props ke sini agar multiline bekerja
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    position: "relative",
  },
  input: {
    ...typography.body,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.inputBackground,
    borderRadius: radius.md,
    padding: spacing.md,
    color: theme.colors.foreground,
  },
  icon: {
    position: "absolute",
    left: spacing.sm,
    top: spacing.md,
    zIndex: 1,
  },
});