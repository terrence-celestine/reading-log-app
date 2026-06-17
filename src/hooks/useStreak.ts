// src/hooks/useStreak.ts
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { useMemo } from 'react';

export const useStreak = () => {
  const sessions = useLiveQuery(() => db.sessions.toArray());

  const streak = useMemo(() => {
    if (!sessions || sessions.length === 0) return 0;

    // Get unique days with sessions — normalize to YYYY-MM-DD
    const days = new Set(
      sessions.map(s => new Date(s.date).toISOString().split('T')[0])
    );

    const sortedDays = Array.from(days).sort().reverse(); // most recent first

    if (sortedDays.length === 0) return 0;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Streak must start from today or yesterday
    if (sortedDays[0] !== today && sortedDays[0] !== yesterday) return 0;

    let count = 1;
    for (let i = 1; i < sortedDays.length; i++) {
      const prev = new Date(sortedDays[i - 1]);
      const curr = new Date(sortedDays[i]);
      const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);
      if (diffDays === 1) {
        count++;
      } else {
        break;
      }
    }

    return count;
  }, [sessions]);

  return streak;
};