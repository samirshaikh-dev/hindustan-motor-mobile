import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'hww_access_token';
const REFRESH_TOKEN_KEY = 'hww_refresh_token';
const ACTOR_ID_KEY = 'hww_actor_id';
const ACTOR_NAME_KEY = 'hww_actor_name';
const ACTOR_ROLE_KEY = 'hww_actor_role';

export const storageService = {
  async setAccessToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  },

  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },

  async setRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async setActiveActor(id: string, name: string, role: string): Promise<void> {
    await SecureStore.setItemAsync(ACTOR_ID_KEY, id);
    await SecureStore.setItemAsync(ACTOR_NAME_KEY, name);
    await SecureStore.setItemAsync(ACTOR_ROLE_KEY, role);
  },

  async getActiveActor(): Promise<{ id: string; name: string; role: string } | null> {
    const id = await SecureStore.getItemAsync(ACTOR_ID_KEY);
    if (!id) return null;
    const name = (await SecureStore.getItemAsync(ACTOR_NAME_KEY)) || 'Technician';
    const role = (await SecureStore.getItemAsync(ACTOR_ROLE_KEY)) || 'EMPLOYEE';
    return { id, name, role };
  },

  async clearActor(): Promise<void> {
    await SecureStore.deleteItemAsync(ACTOR_ID_KEY);
    await SecureStore.deleteItemAsync(ACTOR_NAME_KEY);
    await SecureStore.deleteItemAsync(ACTOR_ROLE_KEY);
  },

  async clearAll(): Promise<void> {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(ACTOR_ID_KEY);
    await SecureStore.deleteItemAsync(ACTOR_NAME_KEY);
    await SecureStore.deleteItemAsync(ACTOR_ROLE_KEY);
  },
};
