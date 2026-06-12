import { useReviewStore } from '../hooks/useReviewStore';
import { X } from 'lucide-react';
import { ReviewPanel } from './ReviewPanel';

export const ReviewModal = () => {
  const { isOpen, selectedBookId, close } = useReviewStore();

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={close}
      />

      {/* Slide-over sidebar container */}
      <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] sm:max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 transform transition-all duration-300 ease-out ${
        isOpen 
          ? 'opacity-100 scale-100 pointer-events-auto' 
          : 'opacity-0 scale-95 pointer-events-none'
      }`}>
        {selectedBookId && (
          <div className="h-full flex flex-col p-6 overflow-y-auto relative">
            {/* Close Button */}
            <button 
              onClick={close} 
              className="absolute top-6 right-6 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
            
            {/* Main Notes panel container */}
            <ReviewPanel bookId={selectedBookId} />
          </div>
        )}
      </div>
    </>
  );
};