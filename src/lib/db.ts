import Dexie from "dexie";
import type {Book, ReadingSession, Recommendation} from "../types";
import type { Table } from "dexie";

export class ReadingLogDB extends Dexie {
    // Use the '!' (definite assignment assertion)
    books!: Table<Book>;
    sessions!: Table<ReadingSession>;
    recommendations!: Table<Recommendation>;

    constructor() {
        super('reading-log');
        this.version(6).stores({
            books: 'id, title, status',
            sessions: '++id, bookId, date, syncedToCloud, pagesRead',
            recommendations: '++id, bookId, date, syncedToCloud, pagesRead, title, author, isbn, totalPages, summary'
        })
    }
}

export const db = new ReadingLogDB();
