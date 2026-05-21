import { Ionicons } from "@expo/vector-icons";
import { StyleProp, TextStyle } from "react-native";
import { theme } from "../../constants/theme";

type Props = {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
};

export function Icon({
  name,
  size = 20,
  color = theme.colors.mutedForeground,
  style,
}: Props) {
  return <Ionicons name={name} size={size} color={color} style={style} />;
}