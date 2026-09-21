import { create } from 'zustand';

import { storageService } from '@/services/storage.service';
import type { Role } from '@/types/domain';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  activeActorId: string | null;
  activeActorName: string | null;
  activeActorRole: Role;
  isAdmin: boolean;
  isLoading: boolean;

  setAdminSession: (
    accessToken: string,
    refreshToken?: string,
    ownerEmployee?: { id: string; name: string },
  ) => Promise<void>;
  setActiveActor: (id: string, name: string, role: Role) => Promise<void>;
  restoreSession: () => Promise<void>;
  clearActiveActor: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  activeActorId: null,
  activeActorName: null,
  activeActorRole: 'EMPLOYEE',
  isAdmin: false,
  isLoading: true,

  setAdminSession: async (accessToken, refreshToken, ownerEmployee) => {
    await storageService.setAccessToken(accessToken);
    if (refreshToken) {
      await storageService.setRefreshToken(refreshToken);
    }
    const id = ownerEmployee?.id ?? 'admin';
    const name = ownerEmployee?.name ?? 'Workshop Owner';
    await storageService.setActiveActor(id, name, 'OWNER');
    set({
      accessToken,
      refreshToken: refreshToken || get().refreshToken,
      activeActorId: id,
      activeActorName: name,
      activeActorRole: 'OWNER',
      isAdmin: true,
      isLoading: false,
    });
  },

  setActiveActor: async (id, name, role) => {
    await storageService.setActiveActor(id, name, role);
    set({
      activeActorId: id,
      activeActorName: name,
      activeActorRole: role,
      isAdmin: role === 'OWNER' || !!get().accessToken,
    });
  },

  restoreSession: async () => {
    try {
      const accessToken = await storageService.getAccessToken();
      const refreshToken = await storageService.getRefreshToken();
      const actor = await storageService.getActiveActor();

      set({
        accessToken,
        refreshToken,
        activeActorId: actor?.id || null,
        activeActorName: actor?.name || null,
        activeActorRole: (actor?.role as Role) || 'EMPLOYEE',
        isAdmin: actor?.role === 'OWNER' || !!accessToken,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  clearActiveActor: async () => {
    await storageService.clearActor();
    set({
      activeActorId: null,
      activeActorName: null,
      activeActorRole: 'EMPLOYEE',
      isAdmin: !!get().accessToken,
    });
  },

  logout: async () => {
    await storageService.clearAll();
    set({
      accessToken: null,
      refreshToken: null,
      activeActorId: null,
      activeActorName: null,
      activeActorRole: 'EMPLOYEE',
      isAdmin: false,
      isLoading: false,
    });
  },
}));
