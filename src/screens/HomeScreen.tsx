// src/screens/HomeScreen.tsx
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { useMemo } from 'react';
import { BookOpen } from 'lucide-react';
import BookCard from '@/components/BookCard';

const HomeScreen = ({ onBookSelect }: { onBookSelect: (id: string) => void }) => {
  const books = useLiveQuery(() => db.books.toArray());

  const { total, finished, reading, nowReading } = useMemo(() => {
    if (!books) return { total: 0, finished: 0, reading: 0, nowReading: null };
    const active = books.filter(b => !b.deleted);
    return {
      total: active.length,
      finished: active.filter(b => b.status === 'finished').length,
      reading: active.filter(b => b.status === 'reading').length,
      nowReading: active.find(b => b.status === 'reading') ?? null,
    };
  }, [books]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* Greeting */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-[15px] font-medium text-[#2C2C2A]">{getGreeting()} 👋</h1>
        <span className="flex items-center gap-1 bg-[#FAEEDA] text-[#633806] text-[11px] font-medium px-3 py-1 rounded-full">
          🔥 1 day streak
        </span>
      </div>

      {/* Now Reading Card */}
      {nowReading ? (
        <div className="bg-[#2C2C2A] rounded-2xl p-4 flex gap-3">
          <div className="w-12 h-16 rounded-lg bg-[#EEEDFE] flex-shrink-0 flex items-center justify-center overflow-hidden">
            {nowReading.coverUrl ? (
              <img src={nowReading.coverUrl} alt={nowReading.title} className="w-full h-full object-cover" />
            ) : (
              <BookOpen size={20} color="#534AB7" />
            )}
          </div>
          <div className="flex flex-col justify-between flex-1 min-w-0">
            <div>
              <p className="text-[10px] text-[#888780] uppercase tracking-wider mb-1">Now reading</p>
              <p className="text-sm font-medium text-[#F7F5F0] truncate">{nowReading.title}</p>
              <p className="text-xs text-[#888780]">{nowReading.author}</p>
            </div>
            <div>
              <div className="h-1 bg-[#444441] rounded-full mt-2">
                <div
                  className="h-1 bg-[#F7F5F0] rounded-full"
                  style={{ width: nowReading.totalPages > 0 ? `${Math.min((nowReading.pagesRead / nowReading.totalPages) * 100, 100)}%` : '0%' }}
                />
              </div>
              <p className="text-[10px] text-[#888780] mt-1">{nowReading.pagesRead} of {nowReading.totalPages} pages</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#EDEAE2] border border-dashed border-[#C8C5BE] rounded-2xl p-6 text-center">
          <p className="text-sm text-[#888780]">No book in progress</p>
          <p className="text-xs text-[#B4B2A9] mt-1">Tap + to add one</p>
        </div>
      )}

      {/* Stats Strip */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#FDFCF9] border border-[#E8E5DE] rounded-xl p-3">
          <p className="text-[10px] text-[#888780]">Total books</p>
          <p className="text-2xl font-medium text-[#2C2C2A]">{total}</p>
          <p className="text-[10px] text-[#B4B2A9]">all time</p>
        </div>
        <div className="bg-[#FDFCF9] border border-[#E8E5DE] rounded-xl p-3">
          <p className="text-[10px] text-[#888780]">Finished</p>
          <p className="text-2xl font-medium text-[#2C2C2A]">{finished}</p>
          <p className="text-[10px] text-[#B4B2A9]">
            {total > 0 ? `${Math.round((finished / total) * 100)}% completion` : 'no books yet'}
          </p>
        </div>
      </div>
    {/* Library Section */}
    <div className="flex flex-col gap-3">
    <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-[#2C2C2A]">Your library</p>
        <p className="text-[11px] text-[#888780]">See all →</p>
    </div>

    {books && books.filter(b => !b.deleted).map(book => (
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

export default HomeScreen;