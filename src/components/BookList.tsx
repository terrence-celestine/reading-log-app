import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { useState, useMemo } from 'react';
import { ProgressBar } from './ProgressBar';
import { useDeleteBook } from '../hooks/useDeleteBook';
import { BookOpen, Check, PencilIcon, Trash2 } from 'lucide-react';
import { useUpdateProgress } from '../hooks/useUpdateProgress';
import { BookSkeleton } from './BookSkeleton';
import type { Book } from '../types';
import { useNotesStore } from '../hooks/useNotesStore';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export const BookList = () => {
    const { deleteBook } = useDeleteBook()
    const { updatePages } = useUpdateProgress();
    const { open: openNotesPanel } = useNotesStore();
    
  // This hook automatically subscribes to the 'books' table
  // and re-runs the query whenever the database changes.
  const books = useLiveQuery(() => db.books.toArray());

  const [searchTerm, setSearchTerm] = useState('');
  const filteredBooks = useMemo(() => {
    if (!books) return [];
    return books.filter(book => 
        !book.deleted && (
        book.title.toLocaleLowerCase().includes(searchTerm.toLocaleLowerCase()) || 
        book.author.toLocaleLowerCase().includes(searchTerm.toLocaleLowerCase()))
)
  }, [books, searchTerm])

  const checkPageValue = (value: string, book: Book) => {
    const num = parseFloat(value as string);

    // 1. It is NaN
    // 2. Or if the string was empty/whitespace
    if (isNaN(num) || value.toString().trim() === "") {
      return;
    }
    if (!isNaN(num) && value.trim() !== ""){
      updatePages(book.id, parseInt(value) - book.pagesRead)
    }
    return
  }

  if (!books) return (
    <div className="space-y-3">
    {[...Array(4)].map((_, i) => <BookSkeleton key={i} />)}
  </div>
  );

  if (books?.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg mt-8">
        <p className="text-gray-400">Your library is empty.</p>
        <p className="text-sm text-gray-400">Add your first book above!</p>
      </div>
    );
  }

  return (
    <div className="mt-8">
        <h2 className="text-2xl font-bold text-white my-8 flex items-center gap-3 title">
        <BookOpen className="text-blue-500" />
        My Library
        </h2>
      {/* Search Input */}
      <div className="mb-8">
    <div className="relative">
        <input
        type="text"
        placeholder="Search by title or author..."
        className="w-full pl-6 pr-4 py-4 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-500"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        />
        {/* Optional: Add a simple search icon here if using an icon library */}
        <div className="absolute right-4 top-4 text-slate-500">
        <span className="text-xs font-bold uppercase tracking-widest">Filter</span>
        </div>
    </div>
    </div>
      <ul className="space-y-3 mt-4">
      {filteredBooks.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
        <p className="text-gray-500 font-medium">No books found.</p>
        <p className="text-sm text-gray-400">
          Try adjusting your search terms or adding a new book.
        </p>
        <button 
          onClick={() => setSearchTerm('')}
          className="mt-4 text-blue-600 hover:underline text-sm cursor-pointer"
        >
          Clear search
        </button>
      </div>
      )}
      
      {filteredBooks?.map((book) => (
    <li key={book.id} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 shadow-lg hover:border-slate-600 transition-all flex flex-col sm:flex-row gap-6">
      
      {/* Left Side: Cover Image */}
      <div className="w-24 h-36 bg-slate-900 rounded-xl border border-slate-700/50 shrink-0 flex items-center justify-center overflow-hidden relative group">
        {book.metadataStatus === 'pending' && (
          <div className="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">AI Loading...</span>
          </div>
        )}
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
              <Tooltip>
                  <TooltipTrigger            
                  onClick={() => updatePages(book.id, book.totalPages)}
                  className="text-slate-500 hover:text-green-400 p-2 transition-colors"
                  aria-label="Add Notes">
                    <Check size={18} className="cursor-pointer"/>
                  </TooltipTrigger>
                  <TooltipContent className="bg-green-500 text-white rounded-md p-2">
                    Finish Reading Book
                  </TooltipContent>
                </Tooltip>
              <Tooltip>
                  <TooltipTrigger            
                  onClick={() => deleteBook(book.id)}
                  className="text-slate-500 hover:text-red-400 p-2 transition-colors"
                  aria-label="Add Notes">
                    <Trash2 size={18} className="cursor-pointer"/>
                  </TooltipTrigger>
                  <TooltipContent className="bg-red-500 text-white rounded-md p-2">
                    Delete Book
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger            
                  onClick={() => openNotesPanel(book.id)}
                  className="text-slate-500 hover:text-purple-400 p-2 transition-colors"
                  aria-label="Add Notes">
                    <PencilIcon size={18} className="cursor-pointer"/>
                  </TooltipTrigger>
                  <TooltipContent className="bg-purple-500 text-white rounded-md p-2">
                    Add Notes
                  </TooltipContent>
                </Tooltip>
            </div>
          </div>

          {/* Book Summary */}
          {book.summary && (
            <p className="text-sm text-slate-400 text-left mb-4 line-clamp-3 italic border-l-2 border-blue-500/30 pl-3">
              {book.summary}
            </p>
          )}
        </div>

        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-end text-xs uppercase tracking-widest font-bold text-slate-500">
            <span>Progress</span>
            <span>{book.pagesRead} / {book.totalPages} pages</span>
          </div>
          
          <ProgressBar current={book.pagesRead} total={book.totalPages} />
        </div>

        {/* Footer Controls */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-700/50">
          <div className="flex items-center gap-2">
            <p className="text-sm text-slate-400">Currently on:{" "}
              <input
                type="number"
                className="w-16 p-1 bg-slate-900 border border-slate-700 rounded text-center text-sm text-white"
                value={book.pagesRead}
                onChange={(e) => checkPageValue(e.target.value, book)}
              />
              {" "} of {book.totalPages}
            </p>
          </div>
          <span className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-[10px] uppercase font-bold tracking-wide">
            {book.status}
          </span>
        </div>
      </div>
    </li>
      ))}
    </ul>
    </div>
  );
};