import Dexie from "dexie";
import type {Book, ReadingSession} from "../types";
import type { Table } from "dexie";

export class ReadingLogDB extends Dexie {
    // Use the '!' (definite assignment assertion)
    books!: Table<Book>;
    sessions!: Table<ReadingSession>;

    constructor() {
        super('reading-log');
        this.version(6).stores({
            books: 'id, title, status',
            sessions: '++id, bookId, date, syncedToCloud, pagesRead'
        })
    }
}

export const db = new ReadingLogDB();
