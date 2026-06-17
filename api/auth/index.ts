// api/auth/index.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../../src/lib/schema.js';
import { eq } from 'drizzle-orm';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });
const JWT_SECRET = process.env.JWT_SECRET!;

function getUserFromRequest(req: VercelRequest) {
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies.token;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as unknown as { userId: string; email: string; username: string };
  } catch {
    return null;
  }
}

function setTokenCookie(res: VercelResponse, token: string) {
  res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action } = req.query;

  // GET /api/auth — me
  if (req.method === 'GET') {
    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    return res.status(200).json({
      userId: user.userId,
      email: user.email,
      username: user.username,
    });
  }

  if (req.method === 'POST') {

    // POST /api/auth?action=logout
    if (action === 'logout') {
      res.setHeader('Set-Cookie', 'token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict');
      return res.status(200).json({ success: true });
    }

    // POST /api/auth?action=register
    if (action === 'register') {
      const { email, username, password } = req.body;

      if (!email || !username || !password) {
        return res.status(400).json({ error: 'Email, username and password are required' });
      }
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }

      try {
        const existing = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.email, email))
          .limit(1);

        if (existing.length > 0) {
          return res.status(409).json({ error: 'An account with this email already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const userId = crypto.randomUUID();

        await db.insert(schema.users).values({
          id: userId,
          email,
          username,
          passwordHash,
          createdAt: new Date(),
        });

        const token = jwt.sign({ userId, email, username }, JWT_SECRET, { expiresIn: '7d' });
        setTokenCookie(res, token);

        return res.status(201).json({ userId, email, username });

      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }

    // POST /api/auth?action=login
    if (action === 'login') {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      try {
        const users = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.email, email))
          .limit(1);

        if (users.length === 0) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = users[0];
        const valid = await bcrypt.compare(password, user.passwordHash);

        if (!valid) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
          { userId: user.id, email: user.email, username: user.username },
          JWT_SECRET,
          { expiresIn: '7d' }
        );
        setTokenCookie(res, token);

        return res.status(200).json({
          userId: user.id,
          email: user.email,
          username: user.username,
        });

      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }

    return res.status(400).json({ error: 'Invalid action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}