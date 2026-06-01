export type Book = {
    id: string;
    title: string;
    author: string;
    isbn?: string;
    totalPages: number; // Added this
    pagesRead: number;   // Added this    
    status: 'to-read' | 'reading' | 'finished';
    progressPercentage: number;
    createdAt: string;
    deleted?: boolean;
};

export interface ReadingSession {
    id: string;
    bookId: string;
    durationMinutes: number;
    pagesRead: number;
    date: string;
    syncedToCloud: boolean;
}

