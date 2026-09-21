import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { ENV } from '@/config/env';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

export function StickyBottomCTA() {
  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [styles.button, styles.callButton, pressed && styles.pressed]}
        onPress={() => Linking.openURL(`tel:${ENV.CONTACT_PHONE}`)}>
        <Text style={styles.buttonText}>Call Workshop</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.button, styles.whatsappButton, pressed && styles.pressed]}
        onPress={() => Linking.openURL(ENV.WHATSAPP_URL)}>
        <Text style={styles.buttonText}>WhatsApp</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    gap: Spacing.sm,
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  callButton: {
    backgroundColor: Colors.light.primary,
  },
  whatsappButton: {
    backgroundColor: Colors.light.success,
  },
  buttonText: {
    ...Typography.headline,
    color: Colors.light.primaryForeground,
    fontSize: 14,
  },
});

