// src/lib/neon.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(import.meta.env.VITE_DATABASE_URL!);
export const neonDb = drizzle(sql, { schema });