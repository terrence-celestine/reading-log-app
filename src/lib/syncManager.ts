import { db } from './db';
import { create } from 'zustand'; // Zustand is perfect for this "Senior-grade" global state

type SyncState = {
    isSyncing: boolean;
    setSyncing: (status: boolean) => void;
};

export const useSyncStore = create<SyncState>((set) => ({
  isSyncing: false,
  setSyncing: (status: boolean) => set({ isSyncing: status }),
}));

export const syncManager = {
  async processQueue() {
    // 1. Find all pending sessions
    const pendingSessions = await db.sessions
    .where('syncedToCloud')
    .equals(0)
    .toArray();

    if (pendingSessions.length === 0) return;

    useSyncStore.getState().setSyncing(true);

    for (const session of pendingSessions) {
      try {
        // 2. Simulate API Call
        // In a real app, you'd use fetch() here to hit your backend
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        // 3. Mark as synced
        await db.sessions.update(session.id, { syncedToCloud: 1 });
      } catch (error) {
        console.error(`Failed to sync session ${session.id}`, error);
        await db.sessions.update(session.id, { syncedToCloud: 0 });
      } finally {
        useSyncStore.getState().setSyncing(false);
      }
    }
  }
};