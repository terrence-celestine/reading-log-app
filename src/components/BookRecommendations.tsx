import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { BookOpen, Plus, RefreshCcw } from 'lucide-react';
import { BookSkeleton } from './BookSkeleton';
import type { Recommendation } from "../types";
import { getBookRecommendations } from '../lib/getBookRecommendations';
import { useState } from 'react';
import { toast } from 'sonner';

export const BookRecommendations = () => {
  const [_, setBookRecommendations] = useState<{ recommendations: Recommendation[] }>({ recommendations: [] });
  const [isLoading, setIsLoading] = useState(false);
  // This hook automatically subscribes to the 'books' table
  // and re-runs the query whenever the database changes.

  const finishedBooks = useLiveQuery(() => db.books.filter(b => !b.deleted && b.status === 'finished').toArray());
  const recommendations = useLiveQuery(() => db.recommendations.toArray());

  const getRecommendations = async () => {
    if (isLoading) return;
    if (!finishedBooks || finishedBooks.length === 0) {
      toast.error('You have no finished books to get recommendations from!');
      return;
    }

    toast.loading('Getting recommendations...');
    setIsLoading(true);
    
    try {
      const bookRecommendations = await getBookRecommendations(finishedBooks);
      setBookRecommendations({ recommendations: bookRecommendations.recommendations });
      await db.recommendations.clear();
      await db.recommendations.bulkAdd(bookRecommendations.recommendations.map(recommendation => ({
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
      toast.success('Recommendations refreshed!');
    } catch (error) {
      console.log(error);
      toast.error('Failed to get recommendations!');
    } finally {
      toast.dismiss()
      setIsLoading(false);
    }
  }

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

  if (recommendations === undefined || finishedBooks === undefined) return (
    <div className="space-y-3">
    {[...Array(4)].map((_, i) => <BookSkeleton key={i} />)}
  </div>
  );

  if (finishedBooks.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg mt-8">
        <p className="text-gray-400">You have no finished books to get recommendations from!</p>
      </div>
    );
  }

  if (finishedBooks.length > 0 && recommendations.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg mt-8">
        <p className="text-gray-400">Ready for some recommendations?</p>
        <p className="text-sm text-gray-400">
          Click the button below to get recommendations.
        </p>
          <button 
            onClick={() => getRecommendations()}
            disabled={isLoading}
            className="m-auto w-full sm:w-auto px-6 py-3.5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 hover:border-blue-500/50 text-blue-400 hover:text-blue-300 rounded-xl transition-all duration-200 active:scale-[0.98] cursor-pointer mt-6 flex items-center gap-2.5 justify-center font-semibold text-sm shadow-lg shadow-blue-500/5"
          >
            {isLoading ? <RefreshCcw size={16} className="animate-spin-slow group-hover:rotate-180 transition-transform duration-500" /> : <RefreshCcw size={16} />}
            {isLoading ? 'Getting recommendations...' : 'Refresh Recommendations'}
          </button>
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
      {recommendations.map((book) => (
    <li key={book.title + book.author} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 shadow-lg hover:border-slate-600 transition-all flex flex-col sm:flex-row gap-6">
      
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
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-left">
                <p className="text-sm text-slate-400 font-medium">{book.author}</p>
                {book.totalPages && (
                  <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md border border-slate-700/50 font-semibold">
                    {book.totalPages} pages
                  </span>
                )}
              </div>
            </div>
            {!isLoading && (
              <div className="flex gap-1">
              <button 
                onClick={() => addBook(book)}
                className="text-slate-500 hover:text-red-400 p-2 transition-colors cursor-pointer"
                aria-label="Add book to library"
              >
                <Plus size={18} />
              </button>
            </div>
            )}
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
    <button 
  onClick={() => getRecommendations()}
  disabled={isLoading}
  className="m-auto w-full sm:w-auto px-6 py-3.5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 hover:border-blue-500/50 text-blue-400 hover:text-blue-300 rounded-xl transition-all duration-200 active:scale-[0.98] cursor-pointer mt-6 flex items-center gap-2.5 justify-center font-semibold text-sm shadow-lg shadow-blue-500/5"
>
  {isLoading ? <RefreshCcw size={16} className="animate-spin-slow group-hover:rotate-180 transition-transform duration-500" /> : <RefreshCcw size={16} />}
  {isLoading ? 'Getting recommendations...' : 'Refresh Recommendations'}
</button>
    </div>
  );
};