// src/components/ReviewNotesSidebar.tsx
import { usePanelStore } from '../hooks/usePanelStore';
// import { BookNotesPanel } from './BookNotesPanel';
import { X } from 'lucide-react';
import { AllReviewNotesPanel } from './AllReviewNotesPanel';

export const ReviewNotesSidebar = () => {
  const { isOpen, close } = usePanelStore();

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
      <div className={`fixed inset-y-0 right-0 w-full sm:max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
          <div className="h-full flex flex-col p-6 overflow-y-auto relative">
            {/* Close Button */}
            <button 
              onClick={close} 
              className="absolute top-6 right-6 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
            <AllReviewNotesPanel />
          </div>
      </div>
    </>
  );
};