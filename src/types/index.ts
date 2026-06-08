export type Book = {
    id: string;
    title: string;
    author: string;
    isbn?: string;
    totalPages?: number;
    pagesRead: number;    
    status: 'to-read' | 'reading' | 'finished';
    progressPercentage: number;
    createdAt: string;
    deleted?: boolean;
    summary?: string;
    coverUrl?: string;
    metadataStatus?: 'pending' | 'success' | 'failed';
};

export interface ReadingSession {
    id?: string;
    bookId: string;
    pagesRead: number;
    date: string;
    syncedToCloud: number;
}

