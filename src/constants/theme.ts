import '@/global.css';

import { Platform, type TextStyle } from 'react-native';
import { Colors, StatusColors, type ThemeColors } from './colors';

export { Colors, StatusColors, type ThemeColors };

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  full: 9999,
} as const;

export const Typography = {
  largeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: -0.4,
  } as TextStyle,
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
    letterSpacing: -0.3,
  } as TextStyle,
  headline: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  } as TextStyle,
  body: {
    fontSize: 15,
    fontWeight: '400',
    color: Colors.light.text,
    lineHeight: 21,
  } as TextStyle,
  subhead: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.light.textSecondary,
    lineHeight: 18,
  } as TextStyle,
  caption: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.light.textMuted,
  } as TextStyle,
  tabular: {
    fontVariant: ['tabular-nums'],
  } as TextStyle,
};

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
