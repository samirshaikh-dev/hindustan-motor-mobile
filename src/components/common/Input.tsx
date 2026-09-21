import { type ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

type Props = TextInputProps & {
  label: string;
  error?: string;
  rightAccessory?: ReactNode;
};

export function Input({ label, error, style, rightAccessory, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={[styles.input, error ? styles.inputError : null, style]}
          placeholderTextColor={Colors.light.textMuted}
          {...rest}
        />
        {rightAccessory ? (
          <View style={styles.accessory}>{rightAccessory}</View>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.subhead,
    fontWeight: '500',
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
  },
  inputWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    borderCurve: 'continuous',
    height: 44,
    paddingHorizontal: Spacing.md,
    paddingRight: 44,
    fontSize: 15,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundSubtle,
  },
  accessory: {
    position: 'absolute',
    right: Spacing.xs,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  inputError: {
    borderColor: Colors.light.destructive,
  },
  error: {
    ...Typography.caption,
    color: Colors.light.destructive,
    marginTop: Spacing.xs,
  },
});
