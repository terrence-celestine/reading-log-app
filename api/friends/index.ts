// api/friends/index.ts
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

  const { action } = req.query;

  // GET /api/friends — list friends + pending
  if (req.method === 'GET') {
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

  if (req.method === 'POST') {

    // POST /api/friends?action=request
    if (action === 'request') {
      const { addresseeUsername } = req.body;
      if (!addresseeUsername) return res.status(400).json({ error: 'Username required' });

      try {
        const addressees = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.username, addresseeUsername))
          .limit(1);

        if (addressees.length === 0) return res.status(404).json({ error: 'User not found' });

        const addressee = addressees[0];
        if (addressee.id === user.userId) return res.status(400).json({ error: 'You cannot add yourself' });

        const existing = await db
          .select()
          .from(schema.friendships)
          .where(
            or(
              and(eq(schema.friendships.requesterId, user.userId), eq(schema.friendships.addresseeId, addressee.id)),
              and(eq(schema.friendships.requesterId, addressee.id), eq(schema.friendships.addresseeId, user.userId))
            )
          )
          .limit(1);

        if (existing.length > 0) return res.status(409).json({ error: 'Friend request already exists' });

        await db.insert(schema.friendships).values({
          id: crypto.randomUUID(),
          requesterId: user.userId,
          addresseeId: addressee.id,
          status: 'pending',
          createdAt: new Date(),
        });

        return res.status(201).json({ message: 'Friend request sent' });

      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }

    // POST /api/friends?action=respond
    if (action === 'respond') {
      const { friendshipId, action: respondAction } = req.body;

      if (!friendshipId || !respondAction) return res.status(400).json({ error: 'friendshipId and action required' });
      if (!['accepted', 'declined'].includes(respondAction)) return res.status(400).json({ error: 'Action must be accepted or declined' });

      try {
        const friendships = await db
          .select()
          .from(schema.friendships)
          .where(and(eq(schema.friendships.id, friendshipId), eq(schema.friendships.addresseeId, user.userId)))
          .limit(1);

        if (friendships.length === 0) return res.status(404).json({ error: 'Friend request not found' });
        if (friendships[0].status !== 'pending') return res.status(409).json({ error: 'Request already responded to' });

        await db.update(schema.friendships).set({ status: respondAction }).where(eq(schema.friendships.id, friendshipId));

        return res.status(200).json({ message: `Friend request ${respondAction}` });

      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }

    return res.status(400).json({ error: 'Invalid action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}