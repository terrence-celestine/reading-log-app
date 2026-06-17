// src/components/AddBookSheet.tsx
import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';

type Status = 'to-read' | 'reading' | 'finished';

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (title: string, author: string, status: Status) => void;
}

const STATUS_OPTIONS: { label: string; value: Status }[] = [
  { label: 'Want to read', value: 'to-read' },
  { label: 'Reading', value: 'reading' },
  { label: 'Finished', value: 'finished' },
];

const AddBookSheet = ({ open, onClose, onAdd }: Props) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState<Status>('to-read');

  const handleSubmit = () => {
    if (!title.trim() || !author.trim()) return;
    onAdd(title.trim(), author.trim(), status);
    setTitle('');
    setAuthor('');
    setStatus('to-read');
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-20"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#FDFCF9] rounded-t-2xl max-w-screen-sm mx-auto">
        
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 bg-[#D3D1C7] rounded-full" />
        </div>

        <div className="px-4 pb-8 pt-2 flex flex-col gap-4">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-medium text-[#2C2C2A]">Add a book</h2>
            <button onClick={onClose} className="text-[#B4B2A9]">
              <X size={18} />
            </button>
          </div>

          {/* Title field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-[#888780] uppercase tracking-wider">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Book title…"
              className="bg-[#F0EDE6] border border-[#E0DDD6] rounded-xl px-3 py-2.5 text-[13px] text-[#2C2C2A] placeholder:text-[#B4B2A9] outline-none focus:border-[#C8C5BE]"
            />
          </div>

          {/* Author field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-[#888780] uppercase tracking-wider">Author</label>
            <input
              type="text"
              value={author}
              onChange={e => setAuthor(e.target.value)}
              placeholder="Author name…"
              className="bg-[#F0EDE6] border border-[#E0DDD6] rounded-xl px-3 py-2.5 text-[13px] text-[#2C2C2A] placeholder:text-[#B4B2A9] outline-none focus:border-[#C8C5BE]"
            />
          </div>

          {/* Status selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-[#888780] uppercase tracking-wider">Status</label>
            <div className="grid grid-cols-3 gap-2">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className={`py-2 rounded-xl text-[11px] font-medium border transition-colors
                    ${status === opt.value
                      ? 'bg-[#2C2C2A] text-[#F7F5F0] border-[#2C2C2A]'
                      : 'bg-[#F0EDE6] text-[#5F5E5A] border-[#E0DDD6]'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !author.trim()}
            className="w-full bg-[#2C2C2A] disabled:bg-[#C8C5BE] text-[#F7F5F0] text-[13px] font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Sparkles size={14} />
            Add to library
          </button>

          {/* AI note */}
          <p className="text-center text-[11px] text-[#B4B2A9]">
            Cover art and summary fetched automatically
          </p>

        </div>
      </div>
    </>
  );
};

export default AddBookSheet;