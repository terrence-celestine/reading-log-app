import Dexie from "dexie";
import type {Book, ReadingSession, Recommendation, BookNote} from "../types";
import type { Table } from "dexie";

export class ReadingLogDB extends Dexie {
    // Use the '!' (definite assignment assertion)
    books!: Table<Book>;
    sessions!: Table<ReadingSession>;
    recommendations!: Table<Recommendation>;
    bookNotes!: Table<BookNote>;

    constructor() {
        super('reading-log');
        this.version(9).stores({
            books: 'id, title, status, totalPages',
            sessions: '++id, bookId, date, syncedToCloud, pagesRead',
            recommendations: '++id, bookId, date, syncedToCloud, pagesRead, title, author, isbn, totalPages, summary',
            bookNotes: '++id, bookId, note, date, syncedToCloud, type',
        })
    }
}

export const db = new ReadingLogDB();
