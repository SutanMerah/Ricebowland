import { Text, StyleSheet } from "react-native";
import { theme } from "../../constants/theme";
import { spacing, typography } from "../system";

export function Label({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    ...typography.body,
    fontWeight: theme.font.weightMedium,
    color: theme.colors.foreground,
    marginBottom: spacing.xs,
  },
});