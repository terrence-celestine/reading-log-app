import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { BookOpen, Plus } from 'lucide-react';
import { BookSkeleton } from './BookSkeleton';
import type { Recommendation } from "../types";
import { getBookRecommendations } from '../lib/getBookRecommendations';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export const BookRecommendations = () => {
  const [bookRecommendations, setBookRecommendations] = useState<{ recommendations: Recommendation[] }>({ recommendations: [] });
  // This hook automatically subscribes to the 'books' table
  // and re-runs the query whenever the database changes.

  const books = useLiveQuery(() => db.books.filter(b => !b.deleted && b.status === 'finished').toArray());
  const recommendations = useLiveQuery(() => db.recommendations.toArray());

  useEffect(() => {
    const getRecommendations = async () => {
      const bookRecommendations = await getBookRecommendations(books);
      setBookRecommendations({ recommendations: bookRecommendations.recommendations });
      db.recommendations.clear();
      db.recommendations.bulkAdd(bookRecommendations.recommendations.map(recommendation => ({
        bookId: recommendation.bookId,
        date: new Date().toISOString(),
        syncedToCloud: 0,
        pagesRead: recommendation.pagesRead,
        title: recommendation.title,
        author: recommendation.author,
        isbn: recommendation.isbn,
        totalPages: recommendation.totalPages,
        summary: recommendation.summary,
        coverUrl: recommendation.coverUrl
      })));
    }
    if (recommendations && recommendations.length) {
      setBookRecommendations({ recommendations: recommendations });
    }
    if (books && books.length && !recommendations.length) {
        getRecommendations();
    }
  }, [books, recommendations]);

  const addBook = async (book: Recommendation) => {
    const foundBook = await db.books.filter(b => b.title.toLowerCase() === book.title.toLowerCase() && !b.deleted).first();
    if (foundBook) {
      toast.error(`"${book.title}" is already in your library!`);
      return;
    } else {
      await db.books.add({
            id: crypto.randomUUID(),
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            pagesRead: 0,
            coverUrl: book.coverUrl,
            totalPages: book.totalPages,
            summary: book.summary,
            metadataStatus: 'success',
            status: 'to-read',
            progressPercentage: 0,
            createdAt: new Date().toISOString(),
        }).then(() => {
          db.recommendations.where('title').equals(book.title).delete();
        }).then(() => {
          toast.success(`Added "${book.title}" to your library!`);
        }).catch((error) => {
          console.log(error);
          toast.error(`Failed to add "${book.title}" to your library!`);
        });
    }
  }

  if (!bookRecommendations) return (
    <div className="space-y-3">
    {[...Array(4)].map((_, i) => <BookSkeleton key={i} />)}
  </div>
  );

  if (bookRecommendations?.recommendations.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg mt-8">
        <p className="text-gray-400">We found no books to recommends.</p>
        <p className="text-sm text-gray-400">Add your first book to get recommendations.</p>
      </div>
    );
  }

  return (
    <div className="mt-8">
        <h2 className="text-2xl font-bold text-white my-8 flex items-center gap-3 title">
        <BookOpen className="text-blue-500" />
        Book Recommendations
        </h2>
        <p className="text-sm text-gray-400">Based on your reading history, here are some books we think you might enjoy:</p>
      <ul className="space-y-3 mt-4">
      {bookRecommendations.recommendations.map((book) => (
    <li key={book.id} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 shadow-lg hover:border-slate-600 transition-all flex flex-col sm:flex-row gap-6">
      
      {/* Left Side: Cover Image */}
      <div className="w-24 h-36 bg-slate-900 rounded-xl border border-slate-700/50 shrink-0 flex items-center justify-center overflow-hidden relative group">
        {book.coverUrl ? (
          <img 
            src={book.coverUrl} 
            alt={`${book.title} cover`} 
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback if image fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="text-slate-600 flex flex-col items-center gap-1">
            <BookOpen size={24} />
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">No Cover</span>
          </div>
        )}
      </div>

      {/* Right Side: Book Details & Progress */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-xl font-bold text-white mb-1 text-left">{book.title}</h3>
              <p className="text-sm text-slate-400 font-medium text-left">{book.author}</p>
            </div>
            <div className="flex gap-1">
              <button 
                onClick={() => addBook(book)}
                className="text-slate-500 hover:text-red-400 p-2 transition-colors cursor-pointer"
                aria-label="Delete book"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Book Summary */}
          {book.summary && (
            <p className="text-sm text-slate-400 text-left mb-4 line-clamp-3 italic border-l-2 border-blue-500/30 pl-3">
              {book.summary}
            </p>
          )}
        </div>
      </div>
    </li>
      ))}
    </ul>
    </div>
  );
};