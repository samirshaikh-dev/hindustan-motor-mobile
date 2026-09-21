import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { systemClient } from '@/api/client';
import { Button } from '@/components/common/Button';
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
      <View style={styles.contentWrapper}>
        <Text style={styles.sectionHeader}>Active Profile</Text>
        <View style={styles.group}>
          <View style={styles.profileRow}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarText}>
                {(activeActorName ?? 'T').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{activeActorName ?? 'Technician'}</Text>
              <Text style={styles.profileRole}>Shop-Floor Actor</Text>
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

        <Text style={styles.sectionHeader}>Workshop Support</Text>
        <View style={styles.group}>
          <Pressable
            style={({ pressed }) => [styles.actionRow, pressed && styles.rowPressed]}
            onPress={() => Linking.openURL(`tel:${ENV.CONTACT_PHONE}`)}>
            <View>
              <Text style={styles.actionText}>Call Workshop Line</Text>
              <Text style={styles.metaText}>{ENV.CONTACT_PHONE}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.actionRow, styles.rowBorder, pressed && styles.rowPressed]}
            onPress={() => Linking.openURL(ENV.WHATSAPP_URL)}>
            <View>
              <Text style={styles.actionText}>WhatsApp Support</Text>
              <Text style={styles.metaText}>Message workshop coordinator</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionHeader}>System Diagnostics & Audit</Text>
        <View style={styles.group}>
          <Pressable
            style={({ pressed }) => [styles.actionRow, pressed && styles.rowPressed]}
            onPress={() => router.push('/(app)/history')}>
            <Text style={styles.actionText}>View Workshop Audit Log</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <View style={[styles.infoRow, styles.rowBorder]}>
            <Text style={styles.infoLabel}>Backend API Status</Text>
            <Text
              style={[
                styles.infoValue,
                {
                  color:
                    healthQuery.data?.status === 'healthy'
                      ? Colors.light.success
                      : Colors.light.textSecondary,
                },
              ]}>
              {healthQuery.isLoading
                ? 'Checking...'
                : healthQuery.data?.status === 'healthy'
                  ? 'Healthy (Online)'
                  : 'Degraded / Offline'}
            </Text>
          </View>

          <View style={[styles.infoRow, styles.rowBorder]}>
            <Text style={styles.infoLabel}>API Server URL</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {ENV.API_BASE_URL}
            </Text>
          </View>
        </View>

        <View style={styles.logoutSection}>
          <Button
            title={accessToken ? 'Sign Out of Owner Account' : 'Exit Shop-Floor Profile'}
            variant="destructive"
            onPress={signOut}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>Hindustan Electricals Winding Works</Text>
          <Text style={styles.footerVersion}>v1.0.0 • Mobile Production Build</Text>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  contentWrapper: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    paddingBottom: Spacing.xl,
  },
  sectionHeader: {
    ...Typography.headline,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  group: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.headline,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...Typography.headline,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  profileRole: {
    ...Typography.subhead,
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  actionRow: {
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
  actionText: {
    ...Typography.headline,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  metaText: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 18,
    color: Colors.light.textMuted,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  infoLabel: {
    ...Typography.subhead,
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  infoValue: {
    ...Typography.headline,
    fontSize: 13,
    color: Colors.light.text,
    maxWidth: '60%',
    textAlign: 'right',
  },
  logoutSection: {
    marginTop: Spacing.xxl,
    marginBottom: Spacing.lg,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  footerBrand: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  footerVersion: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.light.textMuted,
  },
});
