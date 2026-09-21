import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';

type Props = Omit<TextInputProps, 'style'> & {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
};

export function SearchInput({ value, onChangeText, placeholder = 'Search...', onClear, ...rest }: Props) {
  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View style={styles.container}>
      <Ionicons name="search" size={16} color={Colors.light.textMuted} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={Colors.light.textMuted}
        value={value}
        onChangeText={onChangeText}
        autoCorrect={false}
        autoCapitalize="none"
        {...rest}
      />
      {value.length > 0 ? (
        <Pressable onPress={handleClear} hitSlop={8} style={styles.clearBtn} accessibilityLabel="Clear search">
          <Ionicons name="close-circle" size={16} color={Colors.light.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    backgroundColor: Colors.light.backgroundSubtle,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  searchIcon: {
    fontSize: 14,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: Colors.light.text,
  },
  clearBtn: {
    padding: Spacing.xs,
  },
  clearText: {
    fontSize: 12,
    color: Colors.light.textMuted,
    fontWeight: '600',
  },
});
