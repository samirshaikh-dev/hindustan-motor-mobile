const ACCESS_TOKEN_KEY = 'hww_access_token';
const REFRESH_TOKEN_KEY = 'hww_refresh_token';
const ACTOR_ID_KEY = 'hww_actor_id';
const ACTOR_NAME_KEY = 'hww_actor_name';
const ACTOR_ROLE_KEY = 'hww_actor_role';

const memory = new Map<string, string | null>();

const read = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
};

const write = (key: string, value: string): void => {
  memory.set(key, value);
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // keep the value in memory if Storage is unavailable (private mode, quota)
  }
};

const remove = (key: string): void => {
  memory.delete(key);
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
};

export const storageService = {
  async setAccessToken(token: string): Promise<void> {
    write(ACCESS_TOKEN_KEY, token);
  },

  async getAccessToken(): Promise<string | null> {
    return read(ACCESS_TOKEN_KEY);
  },

  async setRefreshToken(token: string): Promise<void> {
    write(REFRESH_TOKEN_KEY, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return read(REFRESH_TOKEN_KEY);
  },

  async setActiveActor(id: string, name: string, role: string): Promise<void> {
    write(ACTOR_ID_KEY, id);
    write(ACTOR_NAME_KEY, name);
    write(ACTOR_ROLE_KEY, role);
  },

  async getActiveActor(): Promise<{ id: string; name: string; role: string } | null> {
    const id = read(ACTOR_ID_KEY);
    if (!id) return null;
    const name = read(ACTOR_NAME_KEY) || 'Technician';
    const role = read(ACTOR_ROLE_KEY) || 'EMPLOYEE';
    return { id, name, role };
  },

  async clearActor(): Promise<void> {
    remove(ACTOR_ID_KEY);
    remove(ACTOR_NAME_KEY);
    remove(ACTOR_ROLE_KEY);
  },

  async clearAll(): Promise<void> {
    remove(ACCESS_TOKEN_KEY);
    remove(REFRESH_TOKEN_KEY);
    remove(ACTOR_ID_KEY);
    remove(ACTOR_NAME_KEY);
    remove(ACTOR_ROLE_KEY);
  },
};