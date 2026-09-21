import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { systemClient } from '@/api/client';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { ENV } from '@/config/env';
import { queryKeys } from '@/config/queryKeys';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';

export default function SettingsScreen() {
  const { activeActorName, activeActorRole, accessToken, logout, clearActiveActor } =
    useAuthStore();

  const healthQuery = useQuery({
    queryKey: queryKeys.system.health,
    queryFn: async () => {
      const res = await systemClient.get('/health');
      return res.data.data;
    },
  });

  const signOut = async () => {
    if (accessToken) {
      await authService.logout();
    }
    await logout();
    router.replace('/(auth)/select-actor');
  };

  return (
    <ScreenWrapper>
      {/* Profile Section */}
      <Text style={styles.sectionHeader}>Active Profile</Text>
      <View style={styles.group}>
        <View style={styles.row}>
          <View style={styles.rowMain}>
            <Text style={styles.rowLabel}>Signed In As</Text>
            <Text style={styles.rowValue}>{activeActorName ?? 'Technician'}</Text>
          </View>
          <StatusBadge status={activeActorRole} />
        </View>

        <Pressable
          style={({ pressed }) => [styles.actionRow, styles.rowBorder, pressed && styles.rowPressed]}
          onPress={async () => {
            await clearActiveActor();
            router.replace('/(auth)/select-actor');
          }}>
          <Text style={styles.actionText}>Switch Shop-Floor Profile</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        {!accessToken ? (
          <Pressable
            style={({ pressed }) => [styles.actionRow, styles.rowBorder, pressed && styles.rowPressed]}
            onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.actionText}>Sign In as Workshop Owner</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Workshop Contact */}
      <Text style={styles.sectionHeader}>Workshop Support</Text>
      <View style={styles.group}>
        <Pressable
          style={({ pressed }) => [styles.actionRow, pressed && styles.rowPressed]}
          onPress={() => Linking.openURL(`tel:${ENV.CONTACT_PHONE}`)}>
          <View>
            <Text style={styles.actionText}>Call Workshop</Text>
            <Text style={styles.metaText}>{ENV.CONTACT_PHONE}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.actionRow, styles.rowBorder, pressed && styles.rowPressed]}
          onPress={() => Linking.openURL(ENV.WHATSAPP_URL)}>
          <View>
            <Text style={styles.actionText}>WhatsApp Workshop</Text>
            <Text style={styles.metaText}>Send message</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </View>

      {/* System & Audit */}
      <Text style={styles.sectionHeader}>System & Audit</Text>
      <View style={styles.group}>
        <Pressable
          style={({ pressed }) => [styles.actionRow, pressed && styles.rowPressed]}
          onPress={() => router.push('/(app)/history')}>
          <Text style={styles.actionText}>View Workshop Audit Log</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        <View style={[styles.row, styles.rowBorder]}>
          <View style={styles.rowMain}>
            <Text style={styles.rowLabel}>Backend Status</Text>
            <Text style={styles.metaText}>{ENV.API_BASE_URL}</Text>
          </View>
          <Text
            style={[
              styles.statusTag,
              healthQuery.data?.status === 'healthy'
                ? styles.statusOnline
                : styles.statusOffline,
            ]}>
            {healthQuery.data?.status === 'healthy' ? 'Online' : 'Unavailable'}
          </Text>
        </View>
      </View>

      {/* Account Section */}
      <Text style={styles.sectionHeader}>Session</Text>
      <View style={styles.group}>
        <Pressable
          style={({ pressed }) => [styles.actionRow, pressed && styles.rowPressed]}
          onPress={signOut}>
          <Text style={styles.destructiveText}>Sign Out</Text>
        </Pressable>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    ...Typography.headline,
    fontSize: 13,
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  group: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
  },
  rowPressed: {
    backgroundColor: Colors.light.secondary,
  },
  rowMain: {
    flex: 1,
    marginRight: Spacing.md,
  },
  rowLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  rowValue: {
    ...Typography.headline,
    fontSize: 16,
    color: Colors.light.text,
    marginTop: 2,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  actionText: {
    ...Typography.body,
    fontSize: 15,
    color: Colors.light.text,
  },
  chevron: {
    fontSize: 20,
    color: Colors.light.textMuted,
  },
  destructiveText: {
    ...Typography.body,
    fontSize: 15,
    color: Colors.light.destructive,
    fontWeight: '500',
  },
  statusTag: {
    ...Typography.caption,
    fontWeight: '600',
  },
  statusOnline: {
    color: Colors.light.success,
  },
  statusOffline: {
    color: Colors.light.destructive,
  },
});
