import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ScrollViewProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing, Typography } from '@/constants/theme';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

type Props = ScrollViewProps & {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export function ScreenWrapper({
  children,
  refreshing,
  onRefresh,
  contentContainerStyle,
  ...rest
}: Props) {
  const { isConnected } = useNetworkStatus();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {!isConnected ? (
        <View style={styles.offline}>
          <Text style={styles.offlineText}>Offline mode — local changes will sync when connected</Text>
        </View>
      ) : null}
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, contentContainerStyle]}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={!!refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.light.textSecondary}
            />
          ) : undefined
        }
        keyboardShouldPersistTaps="handled"
        {...rest}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSubtle,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl * 2,
  },
  offline: {
    backgroundColor: Colors.light.warningSubtle,
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  offlineText: {
    ...Typography.caption,
    color: '#92400e',
    fontWeight: '600',
  },
});
