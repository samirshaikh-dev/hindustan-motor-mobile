import { StyleSheet, Text, View } from 'react-native';

import { formatDateTime } from '@/utils/formatters';
import type { HistoryItem } from '@/types/domain';

export function TimelineItem({ item }: { item: HistoryItem }) {
  return (
    <View style={styles.row}>
      <View style={styles.dot} />
      <View style={styles.body}>
        <Text style={styles.action}>{item.action.replace(/_/g, ' ')}</Text>
        {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
        <Text style={styles.meta}>
          {item.actorEmployee?.name ?? 'Unknown'} · {formatDateTime(item.createdAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: 16 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0284c7',
    marginTop: 6,
    marginRight: 12,
  },
  body: { flex: 1 },
  action: { fontWeight: '700', color: '#0f172a' },
  desc: { color: '#475569', marginTop: 4 },
  meta: { color: '#94a3b8', fontSize: 12, marginTop: 6 },
});
