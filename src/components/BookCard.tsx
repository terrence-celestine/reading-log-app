// src/components/BookCard.tsx
import { BookOpen } from 'lucide-react';
import type { Book } from '../types';

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

interface BookCardProps {
  book: Book;
  onClick?: () => void;
}

const BookCard = ({ book, onClick }: BookCardProps) => {
  const status = STATUS_CONFIG[book.status] ?? STATUS_CONFIG['to-read'];
  const progress = book.totalPages > 0
    ? Math.min((book.pagesRead / book.totalPages) * 100, 100)
    : 0;

  // Deterministic color per book based on id
  const colorIndex = book.id.charCodeAt(0) % COVER_COLORS.length;
  const color = COVER_COLORS[colorIndex];

  return (
    <div
      onClick={onClick}
      className="bg-[#FDFCF9] border border-[#E8E5DE] rounded-2xl p-3 flex gap-3 cursor-pointer hover:border-[#C8C5BE] transition-colors"
    >
      {/* Cover */}
      <div
        className="w-28 h-40 rounded-lg shrink-0 flex items-center justify-center overflow-hidden"
        style={{ background: color.bg }}
      >
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <BookOpen size={22} color={color.icon} />
        )}
      </div>

      {/* Info */}
      <div className="book-info flex-1 min-w-0 flex flex-col justify-between">
  <div>
    <p className="text-[13px] font-medium text-[#2C2C2A] truncate">{book.title}</p>
    <p className="text-[11px] text-[#888780] mt-0.5">{book.author}</p>
    <div className="flex items-center gap-2 mt-2">
      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.classes}`}>
        {status.label}
      </span>
    </div>
    {book.summary && (
      <p className="text-[11px] text-[#5F5E5A] leading-relaxed mt-2 line-clamp-2">
        {book.summary}
      </p>
    )}
  </div>

  {book.totalPages > 0 && (
    <div className="mt-2">
      <div className="h-[3px] bg-[#E8E5DE] rounded-full">
        <div
          className="h-[3px] rounded-full"
          style={{
            width: `${progress}%`,
            background: book.status === 'finished' ? '#3B6D11' : '#2C2C2A'
          }}
        />
      </div>
      <p className="text-[10px] text-[#B4B2A9] mt-1">
        {book.pagesRead} / {book.totalPages} pp
      </p>
    </div>
  )}
</div>
    </div>
  );
};

export default BookCard;