import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'danger';

type Props = PressableProps & {
  title: string;
  loading?: boolean;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  loading,
  variant = 'primary',
  disabled,
  style,
  ...rest
}: Props) {
  const normalizedVariant = variant === 'danger' ? 'destructive' : variant;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        styles[normalizedVariant],
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator
          color={
            normalizedVariant === 'primary'
              ? Colors.light.primaryForeground
              : Colors.light.text
          }
          size="small"
        />
      ) : (
        <Text style={[styles.text, styles[`${normalizedVariant}Text`]]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 44,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: Colors.light.primary,
  },
  secondary: {
    backgroundColor: Colors.light.secondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  destructive: {
    backgroundColor: Colors.light.destructiveSubtle,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.8,
  },
  text: {
    ...Typography.headline,
    fontSize: 14,
    fontWeight: '600',
  },
  primaryText: {
    color: Colors.light.primaryForeground,
  },
  secondaryText: {
    color: Colors.light.secondaryForeground,
  },
  ghostText: {
    color: Colors.light.textSecondary,
  },
  destructiveText: {
    color: Colors.light.destructive,
  },
});
