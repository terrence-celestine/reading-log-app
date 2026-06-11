import { useLiveQuery } from "dexie-react-hooks";
import { Flame } from "lucide-react";
import { db } from "../lib/db";
import type { ReadingSession } from "../types";

export const ReadingStreak = () => {
    // Assuming your session objects has pagesRead structure
    const calculateCurrentStreak = (sessions: ReadingSession[]): number => {
        const seenDates = new Set<string>();
        let streak = 0;
        // Sort sessions by date descending (newest first)
        const sorted = [...sessions].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    
        for (const session of sorted) {
            if (!seenDates.has(session.date.toString().split('T')[0])) {
                seenDates.add(session.date.toString().split('T')[0]);
                streak++;
            } else {
                // The streak is broken
                break;
            }
        }
        return streak;
    }

    const sessions = useLiveQuery(() => db.sessions.toArray());
    if (!sessions) return null;
    const streak = calculateCurrentStreak(sessions);

    return (
        <div className="fixed top-4 left-4 z-50">
        <div className={`flex items-center gap-2 ${streak > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
          <Flame className={streak > 0 ? 'fill-orange-500 animate-pulse' : ''} />
          <span className="font-bold text-lg">{streak} Day Streak</span>
        </div>
        </div>
      );
}