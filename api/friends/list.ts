// api/friends/list.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../../src/lib/schema';
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
    const [acceptedFriendships, pendingReceived, pendingSent] = await Promise.all([
      db.select().from(schema.friendships).where(
        and(
          or(
            eq(schema.friendships.requesterId, user.userId),
            eq(schema.friendships.addresseeId, user.userId)
          ),
          eq(schema.friendships.status, 'accepted')
        )
      ),
      db.select().from(schema.friendships).where(
        and(
          eq(schema.friendships.addresseeId, user.userId),
          eq(schema.friendships.status, 'pending')
        )
      ),
      db.select().from(schema.friendships).where(
        and(
          eq(schema.friendships.requesterId, user.userId),
          eq(schema.friendships.status, 'pending')
        )
      ),
    ]);

    const friendIds = acceptedFriendships.map(f =>
      f.requesterId === user.userId ? f.addresseeId : f.requesterId
    );

    const friendsActivity = await Promise.all(
      friendIds.map(async (friendId) => {
        const users = await db.select().from(schema.users).where(eq(schema.users.id, friendId)).limit(1);
        if (users.length === 0) return null;
        const friend = users[0];
        const [reading, finished] = await Promise.all([
          db.select().from(schema.books).where(and(eq(schema.books.userId, friendId), eq(schema.books.status, 'reading'), eq(schema.books.deleted, false))).limit(1),
          db.select().from(schema.books).where(and(eq(schema.books.userId, friendId), eq(schema.books.status, 'finished'), eq(schema.books.deleted, false))).limit(1),
        ]);
        return {
          userId: friend.id,
          username: friend.username,
          email: friend.email,
          currentlyReading: reading[0] ?? null,
          lastFinished: finished[0] ?? null,
        };
      })
    );

    const pendingReceivedWithUsers = await Promise.all(
      pendingReceived.map(async (f) => {
        const users = await db.select().from(schema.users).where(eq(schema.users.id, f.requesterId)).limit(1);
        return { friendshipId: f.id, username: users[0]?.username ?? 'Unknown' };
      })
    );

    const pendingSentWithUsers = await Promise.all(
      pendingSent.map(async (f) => {
        const users = await db.select().from(schema.users).where(eq(schema.users.id, f.addresseeId)).limit(1);
        return { friendshipId: f.id, username: users[0]?.username ?? 'Unknown' };
      })
    );

    return res.status(200).json({
      friends: friendsActivity.filter(Boolean),
      pendingReceived: pendingReceivedWithUsers,
      pendingSent: pendingSentWithUsers,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}