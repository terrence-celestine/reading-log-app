import { TooltipProvider } from './components/ui/tooltip';
import AppLayout from './components/AppLayout';
import { useSyncWorker } from './hooks/useSyncWorker';
import { Toaster } from 'sonner';
import { NotesSidebar } from './components/NotesSidebar';
import { ReviewModal } from './components/ReviewModal';
import { ReviewNotesSidebar } from './components/ReviewNotesSidebar';

const App = () => {
  useSyncWorker();
  return (
    <TooltipProvider>
      <AppLayout/>
      <NotesSidebar />
      <ReviewNotesSidebar />
      <ReviewModal />
      <Toaster richColors position="bottom-right" />
    </TooltipProvider>
  );
};

export default App;