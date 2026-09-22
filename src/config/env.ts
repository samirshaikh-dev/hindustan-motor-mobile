const normalizeApiUrl = (url?: string): string => {
  if (!url) return '';
  const trimmed = url.trim().replace(/\/+$/, '');
  if (!trimmed.endsWith('/api/v1')) {
    return `${trimmed}/api/v1`;
  }
  return trimmed;
};

const PRODUCTION_API_URL = 'https://hindustan-motor-backend.onrender.com/api/v1';
const rawUrl = process.env.EXPO_PUBLIC_API_URL || PRODUCTION_API_URL;
const apiBase = normalizeApiUrl(rawUrl);

export const ENV = {
  API_BASE_URL: apiBase,
  API_ROOT: apiBase ? apiBase.replace(/\/api\/v1\/?$/, '') : '',
  TIMEOUT_MS: 30000,
  APP_VERSION: '1.0.0',
  CONTACT_PHONE: '+919825272547',
  WHATSAPP_URL: 'https://wa.me/919825272547',
};
