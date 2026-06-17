import { db } from '../lib/db';

export const useUpdateProgress = () => {
  const updatePages = async (id: string, delta: number) => {
    const book = await db.books.get(id);
    if (!book) return;

    const newPages = Math.max(0, Math.min(book.totalPages, book.pagesRead + delta));
    
    await db.books.update(id, { 
      pagesRead: newPages,
      status: newPages >= book.totalPages ? 'finished' : 'reading'
    });

    // 3. Log the "Sprint" in the Sessions table (for history/sync)
    if (delta > 0) {
      await db.sessions.add({
        bookId: id,
        pagesRead: delta,
        date: new Date().toISOString(),
        syncedToCloud: 0
      });
    }
  };

  return { updatePages };
};