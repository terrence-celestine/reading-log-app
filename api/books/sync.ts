// api/books/sync.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../../src/lib/schema';
import { eq } from 'drizzle-orm';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });
const JWT_SECRET = process.env.JWT_SECRET!;

function getUserFromRequest(req: VercelRequest) {
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies.token;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  // GET — fetch all books for this user from Neon
  if (req.method === 'GET') {
    try {
      const books = await db
        .select()
        .from(schema.books)
        .where(eq(schema.books.userId, user.userId));
      return res.status(200).json(books);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to fetch books' });
    }
  }

  // POST — upsert a batch of books from Dexie to Neon
  if (req.method === 'POST') {
    try {
      const { books } = req.body;
      if (!books || !Array.isArray(books)) {
        return res.status(400).json({ error: 'Books array required' });
      }

      for (const book of books) {
        await db
          .insert(schema.books)
          .values({
            id: book.id,
            userId: user.userId,
            title: book.title,
            author: book.author,
            status: book.status,
            pagesRead: book.pagesRead ?? 0,
            totalPages: book.totalPages ?? 0,
            coverUrl: book.coverUrl ?? null,
            summary: book.summary ?? null,
            isbn: book.isbn ?? null,
            metadataStatus: book.metadataStatus ?? 'pending',
            deleted: book.deleted ?? false,
            createdAt: book.createdAt ? new Date(book.createdAt) : new Date(),
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: schema.books.id,
            set: {
              status: book.status,
              pagesRead: book.pagesRead ?? 0,
              totalPages: book.totalPages ?? 0,
              coverUrl: book.coverUrl ?? null,
              summary: book.summary ?? null,
              metadataStatus: book.metadataStatus ?? 'pending',
              deleted: book.deleted ?? false,
              updatedAt: new Date(),
            },
          });
      }

      return res.status(200).json({ synced: books.length });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to sync books' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}