import { Image, ImageStyle, StyleProp } from "react-native";

type Props = {
  src: string;
  style?: StyleProp<ImageStyle>;
};

export function ImageWithFallback({ src, style }: Props) {
  return <Image source={{ uri: src }} style={style} />;
}
