// src/screens/ExploreScreen.tsx
import { useState } from 'react';
import { Sparkles, BookOpen, Plus, Check, Compass } from 'lucide-react';
import { db } from '../lib/db';
import { enrichBook } from '../lib/enrichBook';
import { toast } from 'sonner';
import { useLiveQuery } from 'dexie-react-hooks';

const GENRES = [
  'Fiction', 'Sci-Fi', 'Fantasy', 'Mystery', 'Thriller',
  'Horror', 'Romance', 'Biography', 'History', 'Self-help',
  'Philosophy', 'Science', 'Poetry', 'Graphic Novel', 'Classic',
];

const COVER_COLORS = [
  { bg: '#EEEDFE', icon: '#534AB7' },
  { bg: '#E1F5EE', icon: '#0F6E56' },
  { bg: '#FAEEDA', icon: '#854F0B' },
  { bg: '#FBEAF0', icon: '#993556' },
];

interface BookResult {
  title: string;
  author: string;
  isbn: string | null;
  totalPages: number | null;
  summary: string;
  coverUrl?: string;
}

const ExploreScreen = () => {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [results, setResults] = useState<BookResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedBooks, setAddedBooks] = useState<Set<string>>(new Set());

  const books = useLiveQuery(() => db.books.toArray());

  const isInLibrary = (title: string) => {
    if (!books) return false;
    return books.some(b => b.title.toLowerCase() === title.toLowerCase() && !b.deleted);
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const handleExplore = async () => {
    if (selectedGenres.length === 0) return;
    setLoading(true);
    setResults([]);
    try {
      const res = await fetch('/api/recommend-books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genres: selectedGenres }),
      });
      const data = await res.json();
      setResults(data.recommendations ?? []);
    } catch {
      toast.error('Failed to get recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToLibrary = async (book: BookResult) => {
    const id = crypto.randomUUID();
    try {
      await db.books.add({
        id,
        title: book.title,
        author: book.author,
        status: 'to-read',
        pagesRead: 0,
        totalPages: book.totalPages ?? 0,
        coverUrl: book.coverUrl ?? undefined,
        progressPercentage: 0,
        createdAt: new Date().toISOString(),
        metadataStatus: 'pending',
      });

      enrichBook(book.title, book.author)
        .then(async (data) => {
          await db.books.update(id, {
            coverUrl: data.coverUrl || undefined,
            totalPages: data.pageCount || 0,
            metadataStatus: 'success',
            isbn: data.isbn,
            summary: data.summary,
          });
        })
        .catch(async () => {
          await db.books.update(id, { metadataStatus: 'failed' });
        });

      setAddedBooks(prev => new Set([...prev, book.title]));
      toast.success(`Added "${book.title}" to your library!`);
    } catch {
      toast.error('Failed to add book');
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-[15px] font-medium text-[#2C2C2A]">Explore</h1>
        <Compass size={16} className="text-[#888780]" />
      </div>

      {/* Genre selector */}
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-medium text-[#888780] uppercase tracking-wider">Pick a genre</p>
        <div className="flex flex-wrap gap-2">
          {GENRES.map(genre => (
            <button
              key={genre}
              onClick={() => toggleGenre(genre)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors
                ${selectedGenres.includes(genre)
                  ? 'bg-[#2C2C2A] text-[#F7F5F0] border-[#2C2C2A]'
                  : 'bg-[#FDFCF9] text-[#5F5E5A] border-[#E8E5DE]'
                }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Find books button */}
      <button
        onClick={handleExplore}
        disabled={selectedGenres.length === 0 || loading}
        className="w-full bg-[#2C2C2A] disabled:bg-[#C8C5BE] text-[#F7F5F0] text-[13px] font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
      >
        <Sparkles size={14} />
        {loading ? 'Finding books…' : 'Find books'}
      </button>

      {/* Loading skeletons */}
      {loading && (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#FDFCF9] border border-[#E8E5DE] rounded-2xl h-24 animate-pulse" />
          ))}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && !loading && (
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-medium text-[#888780] uppercase tracking-wider">
            Results — {selectedGenres.join(' & ')}
          </p>
          {results.map((book, i) => {
            const colorIndex = i % COVER_COLORS.length;
            const color = COVER_COLORS[colorIndex];
            const inLibrary = isInLibrary(book.title) || addedBooks.has(book.title);

            return (
              <div key={i} className="bg-[#FDFCF9] border border-[#E8E5DE] rounded-2xl p-3 flex gap-3">
            <div
                className="w-28 h-40 rounded-lg shrink-0 flex items-center justify-center overflow-hidden"
                style={{ background: color.bg }}
                >
                {book.coverUrl ? (
                    <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover rounded-lg" />
                ) : (
                    <BookOpen size={20} color={color.icon} />
                )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <p className="text-[12px] font-medium text-[#2C2C2A] truncate">{book.title}</p>
                  <p className="text-[11px] text-[#888780]">{book.author}</p>
                  {book.summary && (
                    <p className="text-[10px] text-[#5F5E5A] leading-relaxed line-clamp-2">{book.summary}</p>
                  )}
                  <button
                    onClick={() => !inLibrary && handleAddToLibrary(book)}
                    disabled={inLibrary}
                    className={`hover:cursor-pointer mt-1 self-start flex items-center gap-1 text-[10px] font-medium px-3 py-1.5 rounded-full border transition-colors
                      ${inLibrary
                        ? 'bg-[#EAF3DE] text-[#3B6D11] border-[#C5DFA8] cursor-default'
                        : 'bg-[#EDEAE2] text-[#2C2C2A] border-[#D3D1C7]'
                      }`}
                  >
                    {inLibrary ? <Check size={10} /> : <Plus size={10} />}
                    {inLibrary ? 'In library' : 'Add to library'}
                  </button>
                </div>
              </div>
            );
          })}

          {/* AI attribution */}
          <p className="text-center text-[10px] text-[#B4B2A9] flex items-center justify-center gap-1">
            <Sparkles size={10} />
            Powered by Gemini 2.5
          </p>
        </div>
      )}

    </div>
  );
};

export default ExploreScreen;