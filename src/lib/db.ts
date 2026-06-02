import Dexie from "dexie";
import type {Book, ReadingSession} from "../types";
import type { Table } from "dexie";

export class ReadingLogDB extends Dexie {
    books: Table<Book>;
    sessions: Table<ReadingSession>;

    constructor() {
        super('reading-log');
        this.version(2).stores({
            books: 'id, title, status, syncedtoCloud',
            sessions: 'id, bookId, date, syncedToCloud'
        })
    }
}

export const db = new ReadingLogDB();
