// src/screens/RecsScreen.tsx
import { useState, useEffect } from 'react';
import { BookOpen, Send } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';

interface Rec {
  id: string;
  message: string | null;
  createdAt: string;
  book: {
    id: string;
    title: string;
    author: string;
    coverUrl?: string;
    totalPages: number;
  };
  from: {
    userId: string;
    username: string;
  };
}

const COVER_COLORS = [
  { bg: '#EEEDFE', icon: '#534AB7' },
  { bg: '#E1F5EE', icon: '#0F6E56' },
  { bg: '#FAEEDA', icon: '#854F0B' },
  { bg: '#FBEAF0', icon: '#993556' },
];

const RecsScreen = () => {
  const [recs, setRecs] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToLibrary, setAddingToLibrary] = useState<string | null>(null);
  const books = useLiveQuery(() => db.books.toArray());

  useEffect(() => {
    fetch('/api/recs')
      .then(res => res.ok ? res.json() : [])
      .then(data => setRecs(data))
      .finally(() => setLoading(false));
  }, []);

  const isInLibrary = (bookTitle: string) => {
    if (!books) return false;
    return books.some(b => b.title.toLowerCase() === bookTitle.toLowerCase() && !b.deleted);
  };

  const handleAddToLibrary = async (rec: Rec) => {
    setAddingToLibrary(rec.id);
    try {
      const { enrichBook } = await import('../lib/enrichBook');
      const { nanoid } = await import('nanoid');
      const id = nanoid();

      await db.books.add({
        id,
        title: rec.book.title,
        author: rec.book.author,
        status: 'to-read',
        pagesRead: 0,
        totalPages: rec.book.totalPages ?? 0,
        coverUrl: rec.book.coverUrl ?? undefined,
        progressPercentage: 0,
        createdAt: new Date().toISOString(),
        metadataStatus: 'pending',
      });

      enrichBook(rec.book.title, rec.book.author)
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

    } catch (err) {
      console.error(err);
    } finally {
      setAddingToLibrary(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-[15px] font-medium text-[#2C2C2A]">Recommendations</h1>
        <span className="text-[11px] text-[#888780]">From friends</span>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#FDFCF9] border border-[#E8E5DE] rounded-2xl h-28 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && recs.length === 0 && (
        <div className="text-center py-12 border border-dashed border-[#E8E5DE] rounded-2xl">
          <Send size={24} className="text-[#B4B2A9] mx-auto mb-3" />
          <p className="text-sm text-[#888780]">No recommendations yet</p>
          <p className="text-xs text-[#B4B2A9] mt-1">When friends recommend books they'll appear here</p>
        </div>
      )}

      {/* Recs list */}
      {recs.map(rec => {
        const colorIndex = rec.book.id.charCodeAt(0) % COVER_COLORS.length;
        const color = COVER_COLORS[colorIndex];
        const alreadyAdded = isInLibrary(rec.book.title);

        return (
          <div key={rec.id} className="bg-[#FDFCF9] border border-[#E8E5DE] rounded-2xl p-4 flex flex-col gap-3">

            {/* From */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#EDEAE2] flex items-center justify-center text-[10px] font-medium text-[#2C2C2A]">
                {rec.from.username.charAt(0).toUpperCase()}
              </div>
              <p className="text-[11px] text-[#888780]">
                <span className="text-[#2C2C2A] font-medium">{rec.from.username}</span> recommended a book
              </p>
            </div>

            {/* Book */}
            <div className="flex gap-3">
              <div
                className="w-12 h-16 rounded-lg shrink-0 flex items-center justify-center overflow-hidden"
                style={{ background: color.bg }}
              >
                {rec.book.coverUrl ? (
                  <img src={rec.book.coverUrl} alt={rec.book.title} className="w-full h-full object-cover" />
                ) : (
                  <BookOpen size={18} color={color.icon} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[#2C2C2A]">{rec.book.title}</p>
                <p className="text-[11px] text-[#888780] mt-0.5">{rec.book.author}</p>
                {rec.message && (
                  <p className="text-[11px] text-[#5F5E5A] mt-2 italic">"{rec.message}"</p>
                )}
              </div>
            </div>

            {/* Action */}
            <button
              onClick={() => !alreadyAdded && handleAddToLibrary(rec)}
              disabled={alreadyAdded || addingToLibrary === rec.id}
              className={`w-full py-2.5 rounded-xl text-[12px] font-medium transition-colors
                ${alreadyAdded
                  ? 'bg-[#EAF3DE] text-[#3B6D11] border border-[#C5DFA8] cursor-default'
                  : 'bg-[#2C2C2A] text-[#F7F5F0]'
                }`}
            >
              {alreadyAdded ? '✓ Already in your library' : addingToLibrary === rec.id ? 'Adding…' : 'Add to library'}
            </button>

          </div>
        );
      })}
    </div>
  );
};

export default RecsScreen;