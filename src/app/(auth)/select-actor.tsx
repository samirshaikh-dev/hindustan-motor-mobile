import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/common/Button';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

export default function SelectActorScreen() {
  return (
    <ScreenWrapper contentContainerStyle={styles.container}>
      <View style={styles.contentWrapper}>
        <View style={styles.topSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoGlyph}>⚡</Text>
          </View>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>Select your profile</Text>
          </View>

          <Text style={styles.title}>Hindustan Electricals</Text>
          <Text style={styles.subtitle}>
            Choose how you want to access the app
          </Text>
        </View>

        <View style={styles.cardsSection}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconBox}>
                <Text style={styles.cardIcon}>👤</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>Workshop Owner</Text>
                <Text style={styles.cardSub}>Manage staff & jobs</Text>
              </View>
            </View>
            <Button
              title="Owner Sign In"
              variant="primary"
              onPress={() => router.push('/(auth)/login')}
            />
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconBox}>
                <Text style={styles.cardIcon}>👷</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>Staff Profile</Text>
                <Text style={styles.cardSub}>Choose your name to start work</Text>
              </View>
            </View>

            <Button
              title="Select Profile"
              variant="secondary"
              onPress={() => router.push('/(auth)/staff-select')}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>Hindustan Electricals</Text>
          <Text style={styles.footerVersion}>v1.0.0</Text>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingVertical: Spacing.xl,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    gap: Spacing.xxl,
  },
  topSection: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
  },
  logoContainer: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  logoGlyph: {
    fontSize: 26,
    lineHeight: 30,
  },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.sm,
  },
  badgeText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    ...Typography.largeTitle,
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subtitle: {
    ...Typography.subhead,
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  cardsSection: {
    gap: Spacing.lg,
    width: '100%',
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: {
    fontSize: 22,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    ...Typography.headline,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  cardSub: {
    ...Typography.subhead,
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
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
