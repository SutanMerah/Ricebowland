import { TextStyle } from "react-native";
import { theme } from "../../constants/theme";

export const typography = {
  h1: {
    fontSize: 28,
    fontWeight: theme.font.weightMedium,
  } as TextStyle,

  h2: {
    fontSize: 24,
    fontWeight: theme.font.weightMedium,
  } as TextStyle,

  h3: {
    fontSize: 20,
    fontWeight: theme.font.weightMedium,
  } as TextStyle,

  body: {
    fontSize: 16,
    fontWeight: theme.font.weightNormal,
  } as TextStyle,

  small: {
    fontSize: 12,
    fontWeight: theme.font.weightNormal,
  } as TextStyle,
};