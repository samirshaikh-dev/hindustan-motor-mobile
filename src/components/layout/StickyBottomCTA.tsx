import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ENV } from '@/config/env';

export function StickyBottomCTA() {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, styles.callButton]}
        onPress={() => Linking.openURL(`tel:${ENV.CONTACT_PHONE}`)}>
        <Text style={styles.buttonText}>Call Workshop</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.whatsappButton]}
        onPress={() => Linking.openURL(ENV.WHATSAPP_URL)}>
        <Text style={styles.buttonText}>WhatsApp</Text>
      </TouchableOpacity>
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
    padding: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    elevation: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  callButton: { backgroundColor: '#0284c7' },
  whatsappButton: { backgroundColor: '#16a34a' },
  buttonText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
});
