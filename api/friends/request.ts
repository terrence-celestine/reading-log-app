// api/friends/request.ts
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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const { addresseeUsername } = req.body;
  if (!addresseeUsername) return res.status(400).json({ error: 'Username required' });

  try {
    // Find the user by username
    const addressees = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, addresseeUsername))
      .limit(1);

    if (addressees.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const addressee = addressees[0];

    if (addressee.id === user.userId) {
      return res.status(400).json({ error: 'You cannot add yourself' });
    }

    // Check if friendship already exists
    const existing = await db
      .select()
      .from(schema.friendships)
      .where(
        or(
          and(
            eq(schema.friendships.requesterId, user.userId),
            eq(schema.friendships.addresseeId, addressee.id)
          ),
          and(
            eq(schema.friendships.requesterId, addressee.id),
            eq(schema.friendships.addresseeId, user.userId)
          )
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Friend request already exists' });
    }

    // Create the friendship request
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