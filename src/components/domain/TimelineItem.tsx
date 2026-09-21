import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing, Typography } from '@/constants/theme';
import type { HistoryItem } from '@/types/domain';
import { formatDateTime } from '@/utils/formatters';

export function TimelineItem({ item }: { item: HistoryItem }) {
  return (
    <View style={styles.row}>
      <View style={styles.timelineCol}>
        <View style={styles.dot} />
        <View style={styles.line} />
      </View>
      <View style={styles.body}>
        <Text style={styles.action}>{item.action.replace(/_/g, ' ')}</Text>
        {item.description ? (
          <Text style={styles.desc}>{item.description}</Text>
        ) : null}
        <Text style={styles.meta}>
          {item.actorEmployee?.name ?? 'System'} · {formatDateTime(item.createdAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  timelineCol: {
    width: 20,
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.primary,
    marginTop: 6,
  },
  line: {
    flex: 1,
    width: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 4,
  },
  body: {
    flex: 1,
    paddingBottom: Spacing.lg,
  },
  action: {
    ...Typography.headline,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  desc: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  meta: {
    ...Typography.caption,
    marginTop: 4,
    color: Colors.light.textMuted,
  },
});
