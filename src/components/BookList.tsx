import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { useState, useMemo, useEffect } from 'react';
import { ProgressBar } from './ProgressBar';
import { useDeleteBook } from '../hooks/useDeleteBook';
import useUpdateBookStatus  from '../hooks/useUpdateBookStatus';
import { ArchiveIcon, BookOpen, Check, PencilIcon, Trash2, Search, ListFilter, Bookmark, CheckCircle } from 'lucide-react';
import { useUpdateProgress } from '../hooks/useUpdateProgress';
import { BookSkeleton } from './BookSkeleton';
import type { Book, ReviewProps } from '../types';
import { useNotesStore } from '../hooks/useNotesStore';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useReviewStore } from '../hooks/useReviewStore';
import { usePanelStore } from '../hooks/usePanelStore';

const STATUS_STYLES: Record<string, { label: string; classes: string }> = {
  'to-read': {
    label: 'To Read',
    classes: 'bg-green-500/10 text-green-400 border border-green-500/20'
  },
  'reading': {
    label: 'Reading',
    classes: 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
  },
  'finished': {
    label: 'Finished',
    classes: 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
  }
};

export const BookList = () => {
    const { deleteBook } = useDeleteBook()
    const { updateBookStatus } = useUpdateBookStatus();
    const { updatePages } = useUpdateProgress();
    const { open: openNotesPanel } = useNotesStore();
    const [searchStatus, setSearchStatus] = useState('all');
    const { open: openReviewPanel } = useReviewStore();
    // This hook automatically subscribes to the 'books' table
    // and re-runs the query whenever the database changes.
    const books = useLiveQuery(() => db.books.toArray());
    const notes = useLiveQuery(() => db.bookNotes.toArray());
    const { open: openPanel } = usePanelStore();

  const [reviews, setReviews] = useState<ReviewProps[]>([]);
  const [panel, setPanel] = useState<'notes' | 'reviews' | 'none'>('reviews');

  useEffect(() => {
   if  (!books) return;
    const allReviews: ReviewProps[] = books.map(book => {
      if (book.review && book.review.length > 0) {
        return {title: book.title, author: book.author, review: book.review};
      }
    }).filter(review => review !== undefined);
    setReviews(allReviews);
  }, [books]);

  const [searchTerm, setSearchTerm] = useState('');

  const counts = useMemo(() => {
    const result = { all: 0, 'to-read': 0, reading: 0, finished: 0 };
    if (!books) return result;
    const activeBooks = books.filter(b => !b.deleted);
    result.all = activeBooks.length;
    activeBooks.forEach(b => {
      if (b.status === 'to-read') result['to-read']++;
      else if (b.status === 'reading') result['reading']++;
      else if (b.status === 'finished') result['finished']++;
    });
    return result;
  }, [books]);

  const filteredBooks = useMemo(() => {
    if (!books) return [];
    return books.filter(book => {
      // Don't show deleted books
      if (book.deleted) return false;

      // Filter by status
      const matchesStatus = searchStatus === "all" || book.status === searchStatus;

      // Filter by search term
      const matchesSearch = 
        book.title.toLocaleLowerCase().includes(searchTerm.toLocaleLowerCase()) || 
        book.author.toLocaleLowerCase().includes(searchTerm.toLocaleLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [books, searchTerm, searchStatus]);

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

  const handleOpenPanel = (panel: 'notes' | 'reviews') => {
    openPanel();
    setPanel(panel);
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

      {/* Search and Status Filters */}
      <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 mb-8 space-y-4 shadow-xl">
        <div className="flex flex-col gap-4 items-stretch lg:items-center justify-between">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search by title or author..."
              className="w-full pl-11 pr-10 py-3.5 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold px-1.5 py-0.5 bg-slate-800 rounded transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 lg:mr-1">
              <ListFilter size={14} className="text-slate-500" />
              Status:
            </span>
            <div className="flex flex-wrap gap-1 p-1 bg-slate-900/40 rounded-xl border border-slate-700/30">
              {/* All */}
              <button 
                onClick={() => setSearchStatus('all')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  searchStatus === 'all' 
                    ? 'bg-slate-700 text-white shadow' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                All
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  searchStatus === 'all' ? 'bg-slate-850 text-slate-300 font-extrabold' : 'bg-slate-800/60 text-slate-500'
                }`}>
                  {counts.all}
                </span>
              </button>

              {/* To Read */}
              <button 
                onClick={() => setSearchStatus('to-read')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  searchStatus === 'to-read' 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 border border-transparent'
                }`}
              >
                <Bookmark size={12} />
                To Read
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  searchStatus === 'to-read' ? 'bg-green-500/20 text-green-400' : 'bg-slate-800/60 text-slate-500'
                }`}>
                  {counts['to-read']}
                </span>
              </button>

              {/* Reading */}
              <button 
                onClick={() => setSearchStatus('reading')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  searchStatus === 'reading' 
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 border border-transparent'
                }`}
              >
                <BookOpen size={12} />
                Reading
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  searchStatus === 'reading' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800/60 text-slate-500'
                }`}>
                  {counts.reading}
                </span>
              </button>

              {/* Finished */}
              <button 
                onClick={() => setSearchStatus('finished')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  searchStatus === 'finished' 
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 border border-transparent'
                }`}
              >
                <CheckCircle size={12} />
                Finished
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  searchStatus === 'finished' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800/60 text-slate-500'
                }`}>
                  {counts.finished}
                </span>
              </button>
            </div>
          </div>
          
        </div>
        <div className="flex flex-col gap-4 items-stretch lg:items-center justify-between">

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 lg:mr-1">
              <ListFilter size={14} className="text-slate-500" />
              My Stuff:
            </span>
            <div className="flex flex-wrap gap-1 p-1 bg-slate-900/40 rounded-xl border border-slate-700/30">
              {/* All Reviews */}
              <button 
                onClick={() => handleOpenPanel('reviews')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  panel === 'reviews'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 border border-transparent'
                }`}
              >
                <Bookmark size={12} />
                My Reviews
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  true ? 'bg-green-500/20 text-green-400' : 'bg-slate-800/60 text-slate-500'
                }`}>
                  {reviews.length}
                </span>
              </button>
              <button 
                onClick={() => handleOpenPanel('notes')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  panel === 'notes'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 border border-transparent'
                }`}
              >
                <Bookmark size={12} />
                My Notes
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  true ? 'bg-green-500/20 text-green-400' : 'bg-slate-800/60 text-slate-500'
                }`}>
                  {notes ? notes.length : 0}
                </span>
              </button>
            </div>
          </div>
          
        </div>
      </div>

      <div className="space-y-4">
        {filteredBooks.length === 0 && (
          <div className="text-center py-16 border border-dashed border-slate-700/60 bg-slate-800/10 rounded-2xl">
            <p className="text-slate-400 font-medium">No books found matching your criteria.</p>
            <p className="text-sm text-slate-500 mt-1">
              Try adjusting your search terms, filter status, or adding a new book.
            </p>
            {(searchTerm !== '' || searchStatus !== 'all') && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setSearchStatus('all');
                }}
                className="mt-5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}

        {filteredBooks?.map((book) => (
          <div key={book.id} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 shadow-lg hover:border-slate-600 transition-all flex flex-col sm:flex-row gap-6">
            
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
                        onClick={() => updateBookStatus(book.id, 'to-read')}
                        className="text-slate-500 hover:text-cyan-500 p-2 transition-colors"
                        aria-label="Archive Book"
                      >
                        <ArchiveIcon size={18} className="cursor-pointer"/>
                      </TooltipTrigger>
                      <TooltipContent className="bg-cyan-500 text-white rounded-md p-2">
                        Archive Book
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger            
                        onClick={() => updatePages(book.id, book.totalPages)}
                        className="text-slate-500 hover:text-green-400 p-2 transition-colors"
                        aria-label="Finish Reading Book"
                      >
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
                        aria-label="Delete Book"
                      >
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
                        aria-label="Add Notes"
                      >
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
                  <p className="text-sm text-slate-400 text-left italic border-l-2 border-blue-500/30 pl-3 mb-3">
                    {book.summary}
                  </p>
                )}
              </div>

              {/* Progress Section */}
              <div className="space-y-3">
                <div className="flex items-end text-xs uppercase tracking-widest font-bold text-slate-500 justify-end">
                  <span>{book.pagesRead} / {book.totalPages} pages</span>
                </div>
                
                <ProgressBar current={book.pagesRead} total={book.totalPages} />
              </div>

              {/* Footer Controls */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-700/50">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-400">
                    Currently on:{" "}
                    <input
                      type="number"
                      className="w-16 p-1 bg-slate-900 border border-slate-700 rounded text-center text-sm text-white"
                      value={book.pagesRead}
                      onChange={(e) => checkPageValue(e.target.value, book)}
                    />
                    {" "} of {book.totalPages}
                  </p>
                </div>
                {book.status === 'finished' && (<button onClick={() => openReviewPanel(book.id)} className="bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide transition-colors cursor-pointer items-center gap-2">
                  <span>
                  Write Review
                  </span>
                </button>)}
                <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wide ${STATUS_STYLES[book.status]?.classes || 'bg-slate-700 text-slate-300'}`}>
                  {STATUS_STYLES[book.status]?.label || book.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};