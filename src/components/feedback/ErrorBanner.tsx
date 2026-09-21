import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/common/Button';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.box}>
      <Text style={styles.message} selectable>
        {message}
      </Text>
      {onRetry ? (
        <View style={styles.btnRow}>
          <Button title="Retry" variant="secondary" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    padding: Spacing.md,
    backgroundColor: Colors.light.destructiveSubtle,
    borderRadius: Radius.md,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: Spacing.sm,
  },
  message: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.light.destructive,
  },
  btnRow: {
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
});
