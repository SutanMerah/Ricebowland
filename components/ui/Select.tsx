import { View, StyleSheet, Platform } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { theme } from "../../constants/theme";
import { radius, spacing } from "../system";

type Props = {
  value: string;
  onValueChange: (val: string) => void;
  items: { label: string; value: string }[];
  style?: any;
};

export function Select({ value, onValueChange, items, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <Picker
        selectedValue={value}
        onValueChange={onValueChange}
        style={styles.picker}
      >
        <Picker.Item label="Pilih opsi" value="" />
        {items.map((item) => (
          <Picker.Item
            key={item.value}
            label={item.label}
            value={item.value}
          />
        ))}
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    backgroundColor: theme.colors.inputBackground, 
    justifyContent: 'center', // Memastikan alignment vertikal aman
  },
  picker: {
    color: theme.colors.foreground,
    ...Platform.select({
      web: {
        outlineStyle: 'none', 
        borderWidth: 0,
        backgroundColor: 'transparent',
        
        // --- 💊 RAMUAN OBAT UNTUK WEB ---
        height: 44,            // Memberikan tinggi yang ideal dan seragam dengan input/button
        paddingHorizontal: 14, // Memberikan space di kiri agar teks tidak menempel ke border
        cursor: 'pointer',     // Mengubah kursor panah biasa menjadi kursor link/tangan saat di-hover
        fontSize: 14,          // Menyesuaikan ukuran font agar pas dengan tema admin dashboard
        width: '100%',
      } as any,
      default: {},
    }),
  },
});