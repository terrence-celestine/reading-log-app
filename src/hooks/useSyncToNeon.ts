// src/hooks/useSyncToNeon.ts
import { useEffect } from 'react';
import { db } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';

export const useSyncToNeon = () => {
  const { user } = useAuth();
  const books = useLiveQuery(() => db.books.toArray());

  // Push local Dexie books to Neon whenever books change
  useEffect(() => {
    if (!user || !books || books.length === 0) return;

    const sync = async () => {
      try {
        await fetch('/api/books/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ books }),
        });
      } catch (err) {
        console.error('Sync to Neon failed:', err);
      }
    };

    // Debounce — wait 2 seconds after last change before syncing
    const timer = setTimeout(sync, 2000);
    return () => clearTimeout(timer);
  }, [books, user]);

  // On login — pull books from Neon and merge into Dexie
  useEffect(() => {
    if (!user) return;

    const pullFromNeon = async () => {
      try {
        const res = await fetch('/api/books/sync');
        if (!res.ok) return;
        const neonBooks = await res.json();

        if (neonBooks.length === 0) return;

        // Merge — upsert each Neon book into Dexie
        for (const book of neonBooks) {
          const existing = await db.books.get(book.id);
          if (!existing) {
            await db.books.add({
              ...book,
              syncedToCloud: true,
            });
          }
        }
      } catch (err) {
        console.error('Pull from Neon failed:', err);
      }
    };

    pullFromNeon();
  }, [user]);
};