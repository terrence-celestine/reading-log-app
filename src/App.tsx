import { TooltipProvider } from './components/ui/tooltip';
import AppLayout from './components/AppLayout';
import { useSyncWorker } from './hooks/useSyncWorker';
import { Toaster } from 'sonner';
import { NotesSidebar } from './components/NotesSidebar';
import { ReviewModal } from './components/ReviewModal';
import { ReviewNotesSidebar } from './components/ReviewNotesSidebar';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthScreen from './screens/AuthScreen';
import { useSyncToNeon } from './hooks/useSyncToNeon';

const AppContent = () => {
  const { user, loading } = useAuth();
  useSyncToNeon();
  
  if (loading) return (
    <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center">
      <p className="text-[13px] text-[#888780]">Loading…</p>
    </div>
  );

  if (!user) return <AuthScreen />;

  return <AppLayout />;
};

const App = () => {
  useSyncWorker();
  return (
    <TooltipProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
      <NotesSidebar />
      <ReviewNotesSidebar />
      <ReviewModal />
      <Toaster richColors position="bottom-right" />
    </TooltipProvider>
  );
};


export default App;