// api/recs/list.ts
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
    return jwt.verify(token, JWT_SECRET) as unknown as { userId: string };
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const recs = await db
      .select()
      .from(schema.bookRecommendations)
      .where(eq(schema.bookRecommendations.toUserId, user.userId));

    if (recs.length === 0) return res.status(200).json([]);

    // Enrich with book and sender details
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