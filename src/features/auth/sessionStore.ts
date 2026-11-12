/**
 * C2 Session (mock auth) — persists only the user id under `itsm.session` (no personal data copied).
 */
import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { dataStore } from '@/data/repositories';
import type { Role, User } from '@/domain/types';
import { logger } from '@/shared/logger';

interface SessionState {
  currentUserId: string | null;
  setUserId: (id: string | null) => void;
}

export const useSessionStore = create<SessionState>()(
  persist((set) => ({ currentUserId: null, setUserId: (id) => set({ currentUserId: id }) }), {
    name: 'itsm.session',
    partialize: (s) => ({ currentUserId: s.currentUserId }),
  }),
);

export const ROLE_LABELS: Record<Role, string> = {
  requestor: 'ผู้แจ้ง',
  approver: 'ผู้อนุมัติ',
  agent: 'เจ้าหน้าที่',
  admin: 'ผู้ดูแลระบบ',
};

export function login(userId: string): boolean {
  if (!dataStore.repository('users').findById(userId)) return false;
  useSessionStore.getState().setUserId(userId);
  logger.info('session.login', { userId });
  return true;
}

export function logout(): void {
  const userId = useSessionStore.getState().currentUserId;
  useSessionStore.getState().setUserId(null);
  logger.info('session.logout', { userId });
}

/** Current user resolved from the dataset; a stale id (user no longer exists) logs out automatically. */
export function useSession(): { user: User | null; login: typeof login; logout: typeof logout } {
  const id = useSessionStore((s) => s.currentUserId);
  const user = id ? (dataStore.repository('users').findById(id) ?? null) : null;

  useEffect(() => {
    if (id && !user) {
      logger.warn('session.userMissing', { userId: id });
      logout();
    }
  }, [id, user]);

  return { user, login, logout };
}
