// api/friends/respond.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../../src/lib/schema';
import { eq, and } from 'drizzle-orm';

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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const { friendshipId, action } = req.body;

  if (!friendshipId || !action) {
    return res.status(400).json({ error: 'friendshipId and action required' });
  }

  if (!['accepted', 'declined'].includes(action)) {
    return res.status(400).json({ error: 'Action must be accepted or declined' });
  }

  try {
    // Make sure this request was sent to the current user
    const friendships = await db
      .select()
      .from(schema.friendships)
      .where(
        and(
          eq(schema.friendships.id, friendshipId),
          eq(schema.friendships.addresseeId, user.userId)
        )
      )
      .limit(1);

    if (friendships.length === 0) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    if (friendships[0].status !== 'pending') {
      return res.status(409).json({ error: 'Request already responded to' });
    }

    // Update the status
    await db
      .update(schema.friendships)
      .set({ status: action })
      .where(eq(schema.friendships.id, friendshipId));

    return res.status(200).json({ message: `Friend request ${action}` });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}