// api/notifications/list.ts
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
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const [pendingRequests, acceptedRequests, recs] = await Promise.all([
      // Friend requests I received that are still pending
      db.select().from(schema.friendships).where(
        and(
          eq(schema.friendships.addresseeId, user.userId),
          eq(schema.friendships.status, 'pending')
        )
      ),
      // Friend requests I sent that were recently accepted
      db.select().from(schema.friendships).where(
        and(
          eq(schema.friendships.requesterId, user.userId),
          eq(schema.friendships.status, 'accepted')
        )
      ),
      // Book recommendations sent to me
      db.select().from(schema.bookRecommendations).where(
        eq(schema.bookRecommendations.toUserId, user.userId)
      ),
    ]);

    // Enrich pending requests with sender username
    const pendingNotifications = await Promise.all(
      pendingRequests.map(async (f) => {
        const users = await db.select().from(schema.users).where(eq(schema.users.id, f.requesterId)).limit(1);
        return {
          id: `friend-request-${f.id}`,
          type: 'friend_request' as const,
          message: `${users[0]?.username ?? 'Someone'} sent you a friend request`,
          createdAt: f.createdAt,
          meta: { friendshipId: f.id, username: users[0]?.username },
        };
      })
    );

    // Enrich accepted requests with acceptee username
    const acceptedNotifications = await Promise.all(
      acceptedRequests.map(async (f) => {
        const users = await db.select().from(schema.users).where(eq(schema.users.id, f.addresseeId)).limit(1);
        return {
          id: `friend-accepted-${f.id}`,
          type: 'friend_accepted' as const,
          message: `${users[0]?.username ?? 'Someone'} accepted your friend request`,
          createdAt: f.createdAt,
          meta: { username: users[0]?.username },
        };
      })
    );

    // Enrich recs with sender username and book title
    const recNotifications = await Promise.all(
      recs.map(async (r) => {
        const [users, books] = await Promise.all([
          db.select().from(schema.users).where(eq(schema.users.id, r.fromUserId)).limit(1),
          db.select().from(schema.books).where(eq(schema.books.id, r.bookId)).limit(1),
        ]);
        return {
          id: `rec-${r.id}`,
          type: 'recommendation' as const,
          message: `${users[0]?.username ?? 'Someone'} recommended "${books[0]?.title ?? 'a book'}"`,
          createdAt: r.createdAt,
          meta: { username: users[0]?.username, bookTitle: books[0]?.title },
        };
      })
    );

    // Merge and sort by date descending
    const all = [...pendingNotifications, ...acceptedNotifications, ...recNotifications]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.status(200).json(all);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}