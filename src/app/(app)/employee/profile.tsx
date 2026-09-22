import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button } from '@/components/common/Button';
import { DeveloperInfoCard } from '@/components/common/DeveloperInfoCard';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { ENV } from '@/config/env';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useEmployeeTasks } from '@/hooks/useEmployees';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';

export default function ProfileScreen() {
  const actorId = useAuthStore((s) => s.activeActorId);
  const actorName = useAuthStore((s) => s.activeActorName);
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);

  const [isSigningOut, setIsSigningOut] = useState(false);

  const { data } = useEmployeeTasks(actorId || '', { limit: 100 });

  const tasks = data?.tasks ?? [];
  const activeCount = tasks.filter(
    (t) => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS',
  ).length;
  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;

  const displayName = actorName?.trim() || 'Workshop Technician';
  const initial = displayName.charAt(0).toUpperCase();

  const executeSignOut = async () => {
    setIsSigningOut(true);
    try {
      if (accessToken) {
        await authService.logout().catch(() => {});
      }
    } finally {
      await logout();
      router.replace('/(auth)/select-actor');
    }
  };

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) {
        executeSignOut();
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: executeSignOut },
      ]);
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.contentWrapper}>
        <View style={styles.identityCard}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.identityInfo}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.role}>Technician</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{activeCount}</Text>
            <Text style={styles.statLabel}>In work</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{completedCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* CONTACT OWNER SECTION */}
        <Text style={styles.sectionHeader}>CONTACT OWNER</Text>
        <View style={styles.group}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Call Workshop Owner"
            style={({ pressed }) => [styles.actionRow, pressed && styles.rowPressed]}
            onPress={() => Linking.openURL(`tel:${ENV.CONTACT_PHONE}`)}>
            <View style={styles.rowLabelGroup}>
              <View style={styles.iconCircle}>
                <Ionicons name="call-outline" size={18} color={Colors.light.primary} />
              </View>
              <View>
                <Text style={styles.actionText}>Call Owner</Text>
                <Text style={styles.metaText}>{ENV.CONTACT_PHONE}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.light.textMuted} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="WhatsApp Workshop Owner"
            style={({ pressed }) => [
              styles.actionRow,
              styles.rowBorder,
              pressed && styles.rowPressed,
            ]}
            onPress={() => Linking.openURL(ENV.WHATSAPP_URL)}>
            <View style={styles.rowLabelGroup}>
              <View style={styles.iconCircle}>
                <Ionicons name="logo-whatsapp" size={18} color={Colors.light.success} />
              </View>
              <View>
                <Text style={styles.actionText}>WhatsApp Owner</Text>
                <Text style={styles.metaText}>Chat with the owner</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.light.textMuted} />
          </Pressable>
        </View>

        {/* DEVELOPER SECTION */}
        <Text style={styles.sectionHeader}>APP DEVELOPER</Text>
        <DeveloperInfoCard />

        <View style={styles.logoutSection}>
          <Button
            title="Sign Out"
            variant="destructive"
            loading={isSigningOut}
            onPress={handleSignOut}
          />
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerVersion}>App Version {ENV.APP_VERSION}</Text>
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
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  identityCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarBox: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.title,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  identityInfo: {
    flex: 1,
  },
  name: {
    ...Typography.title,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  role: {
    ...Typography.subhead,
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    ...Typography.title,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
  },
  statLabel: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sectionHeader: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  group: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: 52,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
  },
  rowPressed: {
    backgroundColor: Colors.light.surfaceSubtle,
  },
  rowLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    ...Typography.headline,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  metaText: {
    ...Typography.subhead,
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  logoutSection: {
    marginTop: Spacing.xxl,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  footerVersion: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textMuted,
  },
});