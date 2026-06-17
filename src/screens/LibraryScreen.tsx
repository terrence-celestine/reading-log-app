// src/screens/LibraryScreen.tsx
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import BookCard from '../components/BookCard';

type StatusFilter = 'all' | 'reading' | 'finished' | 'to-read';

const FILTERS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Reading', value: 'reading' },
  { label: 'Finished', value: 'finished' },
  { label: 'Want to read', value: 'to-read' },
];

const LibraryScreen = ({ onBookSelect }: { onBookSelect: (id: string) => void }) => {
  const books = useLiveQuery(() => db.books.toArray());
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    if (!books) return [];
    return books.filter(b => {
      if (b.deleted) return false;
      if (activeFilter !== 'all' && b.status !== activeFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return b.title.toLowerCase().includes(term) || b.author.toLowerCase().includes(term);
      }
      return true;
    });
  }, [books, activeFilter, searchTerm]);

  const counts = useMemo(() => {
    if (!books) return { all: 0, reading: 0, finished: 0, 'to-read': 0 };
    const active = books.filter(b => !b.deleted);
    return {
      all: active.length,
      reading: active.filter(b => b.status === 'reading').length,
      finished: active.filter(b => b.status === 'finished').length,
      'to-read': active.filter(b => b.status === 'to-read').length,
    };
  }, [books]);

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B4B2A9]" />
        <input
          type="text"
          placeholder="Filter by book title or author…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-8 py-2.5 bg-[#FDFCF9] border border-[#E8E5DE] rounded-xl text-[13px] text-[#2C2C2A] placeholder:text-[#B4B2A9] outline-none focus:border-[#C8C5BE]"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X size={14} className="text-[#B4B2A9]" />
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors hover:cursor-pointer
              ${activeFilter === f.value
                ? 'bg-[#2C2C2A] text-[#F7F5F0] border-[#2C2C2A]'
                : 'bg-[#FDFCF9] text-[#888780] border-[#E8E5DE]'
              }`}
          >
            {f.label}
            <span className={`text-[10px] w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0
              ${activeFilter === f.value ? 'bg-white/20 text-white' : 'bg-[#EDEAE2] text-[#888780]'}`}>
              {counts[f.value]}
            </span>
          </button>
        ))}
      </div>

      {/* Book list */}
      <div className="flex flex-col gap-3">
        {!books && (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#FDFCF9] border border-[#E8E5DE] rounded-2xl h-24 animate-pulse" />
          ))
        )}

        {books && filtered.length === 0 && (
          <div className="text-center py-12 border border-dashed border-[#E8E5DE] rounded-2xl">
            <p className="text-sm text-[#888780]">No books found</p>
            <p className="text-xs text-[#B4B2A9] mt-1">
              {searchTerm ? 'Try a different search' : 'Tap + to add your first book'}
            </p>
          </div>
        )}

        {filtered.map(book => (
          <BookCard
            key={book.id}
            book={book}
            onClick={() => onBookSelect(book.id)}
          />
        ))}
      </div>

    </div>
  );
};

export default LibraryScreen;