// src/screens/NotesScreen.tsx
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { useState, useMemo } from 'react';
import { BookOpen, Quote } from 'lucide-react';

type NoteFilter = 'all' | 'note' | 'quote';

const NotesScreen = () => {
  const notes = useLiveQuery(() => db.bookNotes.toArray());
  const books = useLiveQuery(() => db.books.toArray());
  const [filter, setFilter] = useState<NoteFilter>('all');

  const enrichedNotes = useMemo(() => {
    if (!notes || !books) return [];
    return notes
      .filter(n => filter === 'all' || n.type === filter)
      .map(note => {
        const book = books.find(b => b.id === note.bookId);
        return { ...note, bookTitle: book?.title ?? 'Unknown book', bookCoverUrl: book?.coverUrl };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [notes, books, filter]);

  const counts = useMemo(() => {
    if (!notes) return { all: 0, note: 0, quote: 0 };
    return {
      all: notes.length,
      note: notes.filter(n => n.type === 'note').length,
      quote: notes.filter(n => n.type === 'quote').length,
    };
  }, [notes]);

  const FILTERS: { label: string; value: NoteFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Notes', value: 'note' },
    { label: 'Quotes', value: 'quote' },
  ];

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-[15px] font-medium text-[#2C2C2A]">My notes</h1>
        <span className="text-[11px] text-[#888780]">{counts.all} total</span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors
              ${filter === f.value
                ? 'bg-[#2C2C2A] text-[#F7F5F0] border-[#2C2C2A]'
                : 'bg-[#FDFCF9] text-[#888780] border-[#E8E5DE]'
              }`}
          >
            {f.label}
            <span className={`text-[10px] w-5 h-5 rounded-full flex items-center justify-center shrink-0
              ${filter === f.value ? 'bg-white/20 text-white' : 'bg-[#EDEAE2] text-[#888780]'}`}>
              {counts[f.value]}
            </span>
          </button>
        ))}
      </div>

      {/* Empty state */}
      {!notes && (
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#FDFCF9] border border-[#E8E5DE] rounded-2xl h-24 animate-pulse" />
          ))}
        </div>
      )}

      {notes && enrichedNotes.length === 0 && (
        <div className="text-center py-12 border border-dashed border-[#E8E5DE] rounded-2xl">
          <p className="text-sm text-[#888780]">No {filter === 'all' ? '' : filter + 's'} yet</p>
          <p className="text-xs text-[#B4B2A9] mt-1">Notes you add to books will appear here</p>
        </div>
      )}

      {/* Notes list */}
      <div className="flex flex-col gap-3">
        {enrichedNotes.map(note => (
          <div key={note.id} className="bg-[#FDFCF9] border border-[#E8E5DE] rounded-2xl p-4 flex flex-col gap-2">

            {/* Book + type header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen size={12} className="text-[#888780]" />
                <span className="text-[11px] font-medium text-[#888780] truncate max-w-[180px]">
                  {note.bookTitle}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {note.pageNumber && (
                  <span className="text-[10px] text-[#B4B2A9]">p. {note.pageNumber}</span>
                )}
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1
                  ${note.type === 'quote'
                    ? 'bg-[#EEEDFE] text-[#534AB7]'
                    : 'bg-[#EDEAE2] text-[#5F5E5A]'
                  }`}>
                  {note.type === 'quote' ? <Quote size={9} /> : null}
                  {note.type}
                </span>
              </div>
            </div>

            {/* Note content */}
            <p className={`text-[13px] text-[#2C2C2A] leading-relaxed
              ${note.type === 'quote' ? 'italic border-l-2 border-[#534AB7] pl-3' : ''}`}>
              {note.note}
            </p>

            {/* Date */}
            <p className="text-[10px] text-[#B4B2A9]">
              {new Date(note.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>

          </div>
        ))}
      </div>

    </div>
  );
};

export default NotesScreen;