import { View, Text, StyleSheet } from "react-native";
import { ReactNode } from "react";
import { theme } from "../../constants/theme";
import { spacing, radius, typography } from "../system";

import { StyleProp, ViewStyle } from "react-native";

type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

type TextProps = {
  children: ReactNode;
};

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function CardHeader({ children, style }: CardProps) {
  return <View style={[styles.header, style]}>{children}</View>;
}

export function CardContent({ children, style }: CardProps) {
  return <View style={[styles.content, style]}>{children}</View>;
}

export function CardTitle({ children }: TextProps) {
  return <Text style={styles.title}>{children}</Text>;
}

export function CardDescription({ children }: TextProps) {
  return <Text style={styles.description}>{children}</Text>;
}

export default Card;

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    elevation: 5,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },

  header: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },

  content: {
    paddingHorizontal: spacing.lg,
  },

  title: {
    ...typography.h3,
    color: theme.colors.cardForeground,
  },

  description: {
    ...typography.body,
    color: theme.colors.mutedForeground,
    marginTop: spacing.xs,
  },
});