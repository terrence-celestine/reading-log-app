// src/hooks/useAddBook.ts
import { db } from '../lib/db';
import { enrichBook } from '../lib/enrichBook';
import { toast } from 'sonner';
import type { Book } from '../types';

type Status = 'to-read' | 'reading' | 'finished';

export const useAddBook = () => {
  const addBook = async (title: string, author: string, status: Status = 'to-read') => {
    const newBook: Book = {
      id: crypto.randomUUID(),
      title,
      author,
      status,
      progressPercentage: 0,
      pagesRead: 0,
      createdAt: new Date().toISOString(),
      totalPages: 0,
      metadataStatus: 'pending',
    };

    try {
      const existingBook = await db.books
        .filter(b => b.title.toLowerCase() === newBook.title.toLowerCase() && !b.deleted)
        .first();

      if (existingBook) {
        toast.error(`${newBook.title} is already in your library!`);
        return;
      }

      await db.books.add(newBook);

      enrichBook(newBook.title, newBook.author)
        .then(async (enrichmentData) => {
          await db.books.update(newBook.id, {
            coverUrl: enrichmentData.coverUrl || undefined,
            totalPages: enrichmentData.pageCount || 0,
            metadataStatus: 'success',
            isbn: enrichmentData.isbn,
            summary: enrichmentData.summary,
          });
        })
        .catch(async () => {
          await db.books.update(newBook.id, { metadataStatus: 'failed' });
        });

      toast.success(`Added "${newBook.title}" to your library!`, {
        description: 'Cover art and summary loading in the background.',
      });
    } catch {
      toast.error('Failed to add book. It might already be in your library.');
    }
  };

  return { addBook };
};