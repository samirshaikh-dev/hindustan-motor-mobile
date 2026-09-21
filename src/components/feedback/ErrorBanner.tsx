import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/common/Button';

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.box}>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? <Button title="Retry" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 12,
  },
  message: { color: '#991b1b', fontSize: 15 },
});
