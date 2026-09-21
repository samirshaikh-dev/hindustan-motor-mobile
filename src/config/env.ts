import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getDevApiUrl = (): string => {
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:5000/api/v1`;
  }
  return Platform.OS === 'android'
    ? 'http://10.0.2.2:5000/api/v1'
    : 'http://localhost:5000/api/v1';
};

const normalizeApiUrl = (url: string): string => {
  const trimmed = url.trim().replace(/\/+$/, '');
  if (!trimmed.endsWith('/api/v1')) {
    return `${trimmed}/api/v1`;
  }
  return trimmed;
};

const rawUrl = process.env.EXPO_PUBLIC_API_URL || getDevApiUrl();
const apiBase = normalizeApiUrl(rawUrl);

export const ENV = {
  API_BASE_URL: apiBase,
  API_ROOT: apiBase.replace(/\/api\/v1\/?$/, ''),
  TIMEOUT_MS: 15000,
  APP_VERSION: '1.0.0',
  CONTACT_PHONE: '+919825272547',
  WHATSAPP_URL: 'https://wa.me/919825272547',
};
