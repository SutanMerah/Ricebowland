import { View, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { theme } from "../../constants/theme";
import { radius, spacing } from "../system";

type Props = {
  value: string;
  onValueChange: (val: string) => void;
  items: { label: string; value: string }[];
};

export function Select({ value, onValueChange, items }: Props) {
  return (
    <View style={styles.container}>
      <Picker
        selectedValue={value}
        onValueChange={onValueChange}
        style={styles.picker}
      >
        <Picker.Item label="Select option" value="" />
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
  },

  picker: {
    color: theme.colors.foreground,
  },
});