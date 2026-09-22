import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { DEVELOPER_INFO } from '@/config/developerInfo';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

export function DeveloperInfoCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{DEVELOPER_INFO.name}</Text>

      <View style={styles.contactList}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Call developer ${DEVELOPER_INFO.phoneDisplay}`}
          style={({ pressed }) => [styles.contactRow, pressed && styles.contactPressed]}
          onPress={() => Linking.openURL(`tel:${DEVELOPER_INFO.phone}`)}>
          <Ionicons name="call-outline" size={14} color={Colors.light.textSecondary} />
          <Text style={styles.contactText}>{DEVELOPER_INFO.phoneDisplay}</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Email developer ${DEVELOPER_INFO.email}`}
          style={({ pressed }) => [styles.contactRow, pressed && styles.contactPressed]}
          onPress={() => Linking.openURL(`mailto:${DEVELOPER_INFO.email}`)}>
          <Ionicons name="mail-outline" size={14} color={Colors.light.textSecondary} />
          <Text style={styles.contactText}>{DEVELOPER_INFO.email}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.lg,
  },
  name: {
    ...Typography.headline,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  contactList: {
    gap: Spacing.xs,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  contactPressed: {
    opacity: 0.6,
  },
  contactText: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
});