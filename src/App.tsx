import { BookForm } from './components/BookForm'
import { BookList } from './components/BookList'
import { BookRecommendations } from './components/BookRecommendations';
import { NotesSidebar } from './components/NotesSidebar';
import { ReviewNotesSidebar } from './components/ReviewNotesSidebar';
import { ReadingStats } from './components/ReadingStat';
import { ReadingStreak } from './components/ReadingStreak';
import { ReviewModal } from './components/ReviewModal';
import { SyncStatus } from './components/SyncStatus';
import { TooltipProvider } from './components/ui/tooltip';
import { useSyncWorker } from './hooks/useSyncWorker';
import { Toaster } from "sonner";

const App = () => {
  useSyncWorker();
  return (
    <main className="max-w-2xl mx-auto p-8">
      <TooltipProvider>
      <ReadingStreak />
      <SyncStatus />
      <h1 className="text-3xl font-black tracking-tighter text-slate-100 mb-8">
        Reading Log
      </h1>
      <BookForm />
      <ReadingStats/>
      <BookList />
      <BookRecommendations />
      <NotesSidebar />
      <ReviewNotesSidebar />
      <Toaster richColors position="bottom-right" />
      <ReviewModal />
      </TooltipProvider>
    </main>
  )
}

export default App
