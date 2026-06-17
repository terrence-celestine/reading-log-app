// api/recs/index.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../../src/lib/schema.js';
import { eq, and, or } from 'drizzle-orm';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });
const JWT_SECRET = process.env.JWT_SECRET!;

function getUserFromRequest(req: VercelRequest) {
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies.token;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as unknown as { userId: string };
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  // GET — list recommendations received
  if (req.method === 'GET') {
    try {
      const recs = await db
        .select()
        .from(schema.bookRecommendations)
        .where(eq(schema.bookRecommendations.toUserId, user.userId));

      if (recs.length === 0) return res.status(200).json([]);

      const enriched = await Promise.all(
        recs.map(async (rec) => {
          const [books, senders] = await Promise.all([
            db.select().from(schema.books).where(eq(schema.books.id, rec.bookId)).limit(1),
            db.select().from(schema.users).where(eq(schema.users.id, rec.fromUserId)).limit(1),
          ]);

          if (books.length === 0 || senders.length === 0) return null;

          return {
            id: rec.id,
            message: rec.message,
            createdAt: rec.createdAt,
            book: {
              id: books[0].id,
              title: books[0].title,
              author: books[0].author,
              coverUrl: books[0].coverUrl,
              totalPages: books[0].totalPages,
            },
            from: {
              userId: senders[0].id,
              username: senders[0].username,
            },
          };
        })
      );

      return res.status(200).json(enriched.filter(Boolean));

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST — send a recommendation
  if (req.method === 'POST') {
    const { toUserId, bookId, message } = req.body;

    if (!toUserId || !bookId) {
      return res.status(400).json({ error: 'toUserId and bookId are required' });
    }

    try {
      // Verify they are actually friends
      const friendship = await db
        .select()
        .from(schema.friendships)
        .where(
          and(
            or(
              and(
                eq(schema.friendships.requesterId, user.userId),
                eq(schema.friendships.addresseeId, toUserId)
              ),
              and(
                eq(schema.friendships.requesterId, toUserId),
                eq(schema.friendships.addresseeId, user.userId)
              )
            ),
            eq(schema.friendships.status, 'accepted')
          )
        )
        .limit(1);

      if (friendship.length === 0) {
        return res.status(403).json({ error: 'You can only recommend books to friends' });
      }

      const book = await db
        .select()
        .from(schema.books)
        .where(
          and(
            eq(schema.books.id, bookId),
            eq(schema.books.userId, user.userId)
          )
        )
        .limit(1);

      if (book.length === 0) {
        return res.status(404).json({ error: 'Book not found' });
      }

      await db.insert(schema.bookRecommendations).values({
        id: crypto.randomUUID(),
        fromUserId: user.userId,
        toUserId,
        bookId,
        message: message ?? null,
        createdAt: new Date(),
      });

      return res.status(201).json({ message: 'Recommendation sent!' });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}