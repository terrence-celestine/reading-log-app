// src/lib/schema.ts
import { pgTable, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    username: text('username').notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const books = pgTable('books', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  author: text('author').notNull(),
  status: text('status').notNull().default('to-read'), // to-read | reading | finished
  pagesRead: integer('pages_read').notNull().default(0),
  totalPages: integer('total_pages').notNull().default(0),
  coverUrl: text('cover_url'),
  summary: text('summary'),
  isbn: text('isbn'),
  metadataStatus: text('metadata_status').default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deleted: boolean('deleted').notNull().default(false),
});

export const friendships = pgTable('friendships', {
  id: text('id').primaryKey(),
  requesterId: text('requester_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  addresseeId: text('addressee_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('pending'), // pending | accepted | declined
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const bookRecommendations = pgTable('book_recommendations', {
  id: text('id').primaryKey(),
  fromUserId: text('from_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  toUserId: text('to_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  bookId: text('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
  message: text('message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});