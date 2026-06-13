export type Book = {
    id: string;
    title: string;
    author: string;
    isbn?: string;
    totalPages: number;
    pagesRead: number;    
    status: 'to-read' | 'reading' | 'finished';
    progressPercentage: number;
    createdAt: string;
    deleted?: boolean;
    summary?: string;
    coverUrl?: string;
    metadataStatus?: 'pending' | 'success' | 'failed';
    rating?: number;
    review?: string;
};

export interface ReadingSession {
    id?: string;
    bookId: string;
    pagesRead: number;
    date: string;
    syncedToCloud: number;
}

export interface Recommendation {
    id?: string;
    bookId: string;
    date: string;
    syncedToCloud: number;
    pagesRead: number;
    title: string;
    author: string;
    isbn: string;
    totalPages: number;
    summary: string;
    coverUrl?: string
}

export type BookNote = {
    id?: number; // Dexie's ++id is an auto-incremented number
    bookId: string;
    note: string;
    pageNumber?: number;
    type: 'note' | 'quote';
    date: string;
    syncedToCloud: number;
};

export interface ReviewProps {
    id?: string;
    bookId?: string;
    title: string;
    author: string;
    review: string;
}

export type FeedItem = {
    id?: string | number;
    bookId?: string;
    review?: string;
    note?: string;
    title?: string;
    author?: string;
}