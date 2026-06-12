import { db } from '../lib/db';
import type { Book } from '../types';

const useUpdateBookStatus = () => {
    const updateBookStatus = async (id: string, status: 'to-read' | 'reading' | 'finished') => {
        const book: Book | undefined = await db.books.get(id);
        if (!book) return;
        await db.books.update(id, { status: status });
        return book;
    }
    return { updateBookStatus }
}

export default useUpdateBookStatus;