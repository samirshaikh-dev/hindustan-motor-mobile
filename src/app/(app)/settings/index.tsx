import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { ENV } from '@/config/env';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';

const DEVELOPER_INFO = {
  name: 'Samir Shaikh',
  phone: '+918320927182',
  phoneDisplay: '+91 83209 27182',
  email: 'shaikh.samir.work@gmail.com',
};

export default function SettingsScreen() {
  const {
    activeActorId,
    activeActorName,
    activeActorRole,
    accessToken,
    logout,
    setActiveActor,
  } = useAuthStore();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [profileName, setProfileName] = useState(activeActorName ?? 'Workshop Owner');
  const [profilePhone, setProfilePhone] = useState(ENV.CONTACT_PHONE);
  const [isSaving, setIsSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const ownerName = activeActorName?.trim() || 'Workshop Owner';
  const ownerInitial = ownerName.charAt(0).toUpperCase();

  const handleOpenEdit = () => {
    setProfileName(ownerName);
    setNameError(null);
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    const trimmed = profileName.trim();
    if (!trimmed) {
      setNameError('Name cannot be empty');
      return;
    }
    setIsSaving(true);
    try {
      if (activeActorId) {
        await setActiveActor(activeActorId, trimmed, activeActorRole);
      }
      setEditModalVisible(false);
    } catch {
      setNameError('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const executeSignOut = async () => {
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
      const confirmed = window.confirm('Are you sure you want to sign out of your account?');
      if (confirmed) {
        executeSignOut();
      }
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out of your account?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: executeSignOut,
          },
        ],
      );
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.contentWrapper}>
        {/* ACCOUNT SECTION */}
        <Text style={styles.sectionHeader}>ACCOUNT</Text>
        <View style={styles.group}>
          <View style={styles.profileRow}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarText}>{ownerInitial}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{ownerName}</Text>
              <Text style={styles.profileRole}>Shop Owner</Text>
            </View>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>OWNER</Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit Profile"
            style={({ pressed }) => [
              styles.actionRow,
              styles.rowBorder,
              pressed && styles.rowPressed,
            ]}
            onPress={handleOpenEdit}>
            <Text style={styles.actionText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.light.textMuted} />
          </Pressable>
        </View>

        {/* SUPPORT SECTION */}
        <Text style={styles.sectionHeader}>SUPPORT</Text>
        <View style={styles.group}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Call Workshop Support"
            style={({ pressed }) => [styles.actionRow, pressed && styles.rowPressed]}
            onPress={() => Linking.openURL(`tel:${ENV.CONTACT_PHONE}`)}>
            <View style={styles.rowLabelGroup}>
              <View style={styles.iconCircle}>
                <Ionicons name="call-outline" size={18} color={Colors.light.primary} />
              </View>
              <View>
                <Text style={styles.actionText}>Call Support</Text>
                <Text style={styles.metaText}>{ENV.CONTACT_PHONE}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.light.textMuted} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="WhatsApp Support"
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
                <Text style={styles.actionText}>WhatsApp Support</Text>
                <Text style={styles.metaText}>Chat with support</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.light.textMuted} />
          </Pressable>
        </View>

        {/* DEVELOPER SECTION */}
        <Text style={styles.sectionHeader}>APP DEVELOPER</Text>
        <View style={styles.developerCard}>
          <Text style={styles.developerName}>{DEVELOPER_INFO.name}</Text>

          <View style={styles.developerContactList}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Call developer ${DEVELOPER_INFO.phoneDisplay}`}
              style={({ pressed }) => [
                styles.developerContactRow,
                pressed && styles.contactPressed,
              ]}
              onPress={() => Linking.openURL(`tel:${DEVELOPER_INFO.phone}`)}>
              <Ionicons name="call-outline" size={14} color={Colors.light.textSecondary} />
              <Text style={styles.developerContactText}>{DEVELOPER_INFO.phoneDisplay}</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Email developer ${DEVELOPER_INFO.email}`}
              style={({ pressed }) => [
                styles.developerContactRow,
                pressed && styles.contactPressed,
              ]}
              onPress={() => Linking.openURL(`mailto:${DEVELOPER_INFO.email}`)}>
              <Ionicons name="mail-outline" size={14} color={Colors.light.textSecondary} />
              <Text style={styles.developerContactText}>{DEVELOPER_INFO.email}</Text>
            </Pressable>
          </View>
        </View>

        {/* ACCOUNT ACTION SECTION */}
        <View style={styles.logoutSection}>
          <Button
            title="Sign Out of Account"
            variant="destructive"
            onPress={handleSignOut}
          />
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerVersion}>App Version {ENV.APP_VERSION}</Text>
        </View>
      </View>

      {/* EDIT PROFILE MODAL */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={8}
                onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={22} color={Colors.light.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <Input
                label="Owner Name"
                value={profileName}
                onChangeText={(text) => {
                  setProfileName(text);
                  if (nameError) setNameError(null);
                }}
                error={nameError ?? undefined}
                placeholder="Enter your name"
                autoCapitalize="words"
              />

              <Input
                label="Phone Number"
                value={profilePhone}
                onChangeText={setProfilePhone}
                placeholder="+91 XXXXX XXXXX"
                keyboardType="phone-pad"
              />

              <View style={styles.modalRoleRow}>
                <Text style={styles.modalRoleLabel}>Role</Text>
                <Text style={styles.modalRoleValue}>Shop Owner (Admin)</Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="ghost"
                style={styles.modalBtn}
                onPress={() => setEditModalVisible(false)}
              />
              <Button
                title="Save Changes"
                variant="primary"
                loading={isSaving}
                style={styles.modalBtn}
                onPress={handleSaveProfile}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  contentWrapper: {
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
    paddingBottom: Spacing.xxl,
  },
  sectionHeader: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: Spacing.xl,
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
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.headline,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...Typography.headline,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  profileRole: {
    ...Typography.subhead,
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: Colors.light.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  roleBadgeText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: 0.5,
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
  developerCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.lg,
  },
  developerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  developerHeading: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  developerName: {
    ...Typography.headline,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  developerContactList: {
    gap: Spacing.xs,
  },
  developerContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  contactPressed: {
    opacity: 0.6,
  },
  developerContactText: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  logoutSection: {
    marginTop: Spacing.xxl,
    marginBottom: Spacing.md,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    ...Typography.headline,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  modalBody: {
    marginBottom: Spacing.md,
  },
  modalRoleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  modalRoleLabel: {
    ...Typography.subhead,
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  modalRoleValue: {
    ...Typography.subhead,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  modalBtn: {
    minWidth: 90,
  },
});
