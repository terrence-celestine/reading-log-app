// src/screens/BookDetailScreen.tsx
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, Trash2, Check } from 'lucide-react';
import { useUpdateProgress } from '../hooks/useUpdateProgress';
import { useDeleteBook } from '../hooks/useDeleteBook';
import { toast } from 'sonner';

interface Props {
  bookId: string;
  onBack: () => void;
}

const STATUS_CONFIG = {
  'to-read': { label: 'Want to read', classes: 'bg-[#EDEAE2] text-[#5F5E5A]' },
  'reading': { label: 'Reading', classes: 'bg-[#E6F1FB] text-[#185FA5]' },
  'finished': { label: 'Finished', classes: 'bg-[#EAF3DE] text-[#3B6D11]' },
};

const COVER_COLORS = [
  { bg: '#EEEDFE', icon: '#534AB7' },
  { bg: '#E1F5EE', icon: '#0F6E56' },
  { bg: '#FAEEDA', icon: '#854F0B' },
  { bg: '#FBEAF0', icon: '#993556' },
];

const BookDetailScreen = ({ bookId, onBack }: Props) => {
  const book = useLiveQuery(() => db.books.get(bookId), [bookId]);
  
  const notes = useLiveQuery(
    () => db.bookNotes.where('bookId').equals(bookId).toArray(),
    [bookId]
  );
  const { updatePages } = useUpdateProgress();
  const { deleteBook } = useDeleteBook();
  const [pageInput, setPageInput] = useState('');
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(0);
  const [saved, setSaved] = useState(false);
  // add these state variables after the existing ones
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState<'note' | 'quote'>('note');
  const [pageNumber, setPageNumber] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);

  useEffect(() => {
    if (book) {
      setReview(book.review ?? '');
      setRating(book.rating ?? 0);
    }
  }, [book]);
  
  
  if (!book) return (
    <div className="flex items-center justify-center h-48">
      <div className="text-sm text-[#888780]">Loading...</div>
    </div>
  );

  const status = STATUS_CONFIG[book.status] ?? STATUS_CONFIG['to-read'];
  const progress = book.totalPages > 0
    ? Math.min((book.pagesRead / book.totalPages) * 100, 100)
    : 0;
  const colorIndex = book.id.charCodeAt(0) % COVER_COLORS.length;
  const color = COVER_COLORS[colorIndex];

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    await db.bookNotes.add({
      bookId: book.id,
      note: noteText.trim(),
      type: noteType,
      pageNumber: pageNumber ? parseInt(pageNumber) : undefined,
      date: new Date().toISOString(),
      syncedToCloud: 0,
    });
    setNoteText('');
    setPageNumber('');
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
    toast.success(noteType === 'quote' ? 'Quote saved!' : 'Note saved!');
  };

  const handleDeleteNote = async (id: number) => {
    await db.bookNotes.delete(id);
    toast.success('Note deleted');
  };

  const handleUpdatePages = () => {
    const num = parseInt(pageInput);
    if (isNaN(num) || num < 0) return;
    const diff = num - book.pagesRead;
    updatePages(book.id, diff);
    setPageInput('');
  };

  const handleDelete = async () => {
    await deleteBook(book.id);
    onBack();
  };

  const handleSaveReview = async () => {
    await db.books.update(book.id, { review, rating });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col">

      {/* Back header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#FDFCF9] border-b border-[#E8E5DE]">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[13px] text-[#5F5E5A]"
        >
          <ArrowLeft size={16} />
          Library
        </button>
        <button onClick={handleDelete} className="text-[#B4B2A9] hover:text-red-400 transition-colors">
          <Trash2 size={17} />
        </button>
      </div>

      {/* Cover + title block */}
      <div className="bg-[#FDFCF9] border-b border-[#E8E5DE] px-4 py-5 flex gap-4">
        <div
          className="w-16 h-24 rounded-xl shrink-0 flex items-center justify-center overflow-hidden"
          style={{ background: color.bg }}
        >
          {book.coverUrl ? (
            <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
          ) : (
            <BookOpen size={24} color={color.icon} />
          )}
        </div>
        <div className="flex flex-col justify-center gap-1">
          <h1 className="text-[16px] font-medium text-[#2C2C2A] leading-tight">{book.title}</h1>
          <p className="text-[13px] text-[#888780]">{book.author}</p>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full w-fit mt-1 ${status.classes}`}>
            {status.label}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-px">

        {/* Progress section */}
        <div className="bg-[#FDFCF9] px-4 py-4 flex flex-col gap-3">
          <p className="text-[10px] font-medium text-[#888780] uppercase tracking-wider">Progress</p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={pageInput}
              onChange={e => setPageInput(e.target.value)}
              placeholder={String(book.pagesRead)}
              className="w-16 text-center bg-[#F0EDE6] border border-[#E0DDD6] rounded-lg py-2 text-[13px] font-medium text-[#2C2C2A] outline-none focus:border-[#C8C5BE]"
            />
            <span className="text-[13px] text-[#888780]">of {book.totalPages > 0 ? book.totalPages : '—'} pages</span>
            <button
              onClick={handleUpdatePages}
              className="ml-auto bg-[#2C2C2A] text-[#F7F5F0] text-[12px] font-medium px-4 py-2 rounded-lg flex items-center gap-1.5"
            >
              <Check size={13} />
              Update
            </button>
          </div>
          <div className="h-1 bg-[#E8E5DE] rounded-full">
            <div
              className="h-1 rounded-full transition-all"
              style={{
                width: `${progress}%`,
                background: book.status === 'finished' ? '#3B6D11' : '#2C2C2A'
              }}
            />
          </div>
          <p className="text-[11px] text-[#B4B2A9]">{Math.round(progress)}% complete</p>
        </div>

        {/* Summary */}
        {book.summary && (
          <div className="bg-[#FDFCF9] px-4 py-4 flex flex-col gap-2">
            <p className="text-[10px] font-medium text-[#888780] uppercase tracking-wider">About</p>
            <p className="text-[13px] text-[#5F5E5A] leading-relaxed">{book.summary}</p>
          </div>
        )}

        {/* Mark as finished */}
        {book.status === 'reading' && (
          <div className="bg-[#FDFCF9] px-4 py-4">
            <button
              onClick={() => updatePages(book.id, book.totalPages - book.pagesRead)}
              className="w-full bg-[#EAF3DE] text-[#3B6D11] text-[13px] font-medium py-3 rounded-xl border border-[#C5DFA8]"
            >
              Mark as finished ✓
            </button>
          </div>
        )}
      {/* Review & Rating — only show when finished */}
      {book.status === 'finished' && (
        <div className="bg-[#FDFCF9] px-4 py-4 flex flex-col gap-3">
          <p className="text-[10px] font-medium text-[#888780] uppercase tracking-wider">Your rating</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`text-2xl transition-colors ${
                  star <= rating ? 'text-[#BA7517]' : 'text-[#E8E5DE]'
                }`}
              >
                ★
              </button>
            ))}
          </div>

          <p className="text-[10px] font-medium text-[#888780] uppercase tracking-wider mt-1">Your review</p>
          <textarea
            value={review}
            onChange={e => setReview(e.target.value)}
            placeholder="What did you think of this book?"
            rows={4}
            className="bg-[#F0EDE6] border border-[#E0DDD6] rounded-xl px-3 py-2.5 text-[13px] text-[#2C2C2A] placeholder:text-[#B4B2A9] outline-none focus:border-[#C8C5BE] resize-none"
          />

          <button
            onClick={handleSaveReview}
            className="w-full bg-[#2C2C2A] text-[#F7F5F0] text-[13px] font-medium py-2.5 rounded-xl transition-colors"
          >
            {saved ? 'Saved ✓' : 'Save review'}
          </button>
        </div>
      )}

      {/* Notes & Quotes */}
  <div className="bg-[#FDFCF9] px-4 py-4 flex flex-col gap-3">
    <p className="text-[10px] font-medium text-[#888780] uppercase tracking-wider">Notes & Quotes</p>

    {/* Type toggle */}
    <div className="flex gap-2">
      {(['note', 'quote'] as const).map(t => (
        <button
          key={t}
          onClick={() => setNoteType(t)}
          className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-colors capitalize
            ${noteType === t
              ? 'bg-[#2C2C2A] text-[#F7F5F0] border-[#2C2C2A]'
              : 'bg-[#F0EDE6] text-[#5F5E5A] border-[#E0DDD6]'
            }`}
        >
          {t}
        </button>
      ))}
    </div>

    {/* Note input */}
    <textarea
      value={noteText}
      onChange={e => setNoteText(e.target.value)}
      placeholder={noteType === 'quote' ? 'Enter a quote…' : 'Write a note…'}
      rows={3}
      className="bg-[#F0EDE6] border border-[#E0DDD6] rounded-xl px-3 py-2.5 text-[13px] text-[#2C2C2A] placeholder:text-[#B4B2A9] outline-none focus:border-[#C8C5BE] resize-none"
    />

    {/* Page number */}
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={pageNumber}
        onChange={e => setPageNumber(e.target.value)}
        placeholder="Page number (optional)"
        className="flex-1 bg-[#F0EDE6] border border-[#E0DDD6] rounded-xl px-3 py-2 text-[12px] text-[#2C2C2A] placeholder:text-[#B4B2A9] outline-none focus:border-[#C8C5BE]"
      />
      <button
        onClick={handleSaveNote}
        disabled={!noteText.trim()}
        className="bg-[#2C2C2A] disabled:bg-[#C8C5BE] text-[#F7F5F0] text-[12px] font-medium px-4 py-2 rounded-xl transition-colors"
      >
        {noteSaved ? 'Saved ✓' : 'Save'}
      </button>
    </div>

    {/* Existing notes */}
    {notes && notes.length > 0 && (
      <div className="flex flex-col gap-2 mt-1">
        <p className="text-[10px] text-[#B4B2A9]">{notes.length} saved</p>
        {notes.map(note => (
          <div
            key={note.id}
            className={`p-3 rounded-xl text-[12px] text-[#2C2C2A] leading-relaxed
              ${note.type === 'quote'
                ? 'bg-[#EEEDFE] border-l-2 border-[#534AB7] italic'
                : 'bg-[#F0EDE6]'
              }`}
          >
            {/* Top row — date + delete */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {note.pageNumber && (
                  <span className="text-[10px] text-[#888780]">p. {note.pageNumber}</span>
                )}
                <span className="text-[10px] text-[#B4B2A9]">
                  {new Date(note.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <button
                onClick={() => handleDeleteNote(note.id!)}
                className="text-[#B4B2A9] hover:text-red-400 transition-colors p-1"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Note content */}
            {note.note}
          </div>
        ))}
      </div>
    )}
  </div>

      </div>
    </div>
  );
};

export default BookDetailScreen;