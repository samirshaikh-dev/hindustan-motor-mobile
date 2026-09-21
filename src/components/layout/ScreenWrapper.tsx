import { RefreshControl, ScrollView, StyleSheet, Text, View, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StickyBottomCTA } from '@/components/layout/StickyBottomCTA';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

type Props = ScrollViewProps & {
  children: React.ReactNode;
  showContactCta?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export function ScreenWrapper({
  children,
  showContactCta = true,
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
          <Text style={styles.offlineText}>Offline — call/WhatsApp still work below</Text>
        </View>
      ) : null}
      <ScrollView
        contentContainerStyle={[styles.content, contentContainerStyle]}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor="#0284c7" />
          ) : undefined
        }
        {...rest}>
        {children}
      </ScrollView>
      {showContactCta ? <StickyBottomCTA /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 100 },
  offline: { backgroundColor: '#fef3c7', paddingVertical: 6, alignItems: 'center' },
  offlineText: { color: '#92400e', fontSize: 13, fontWeight: '600' },
});
