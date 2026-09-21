import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, StatusColors } from '@/constants/theme';

export function StatusBadge({ status }: { status: string }) {
  const token = StatusColors[status] ?? {
    bg: '#f8fafc',
    text: '#64748b',
    border: '#e2e8f0',
  };

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: token.bg, borderColor: token.border },
      ]}>
      <Text style={[styles.text, { color: token.text }]}>
        {status.replace(/_/g, ' ')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
});
