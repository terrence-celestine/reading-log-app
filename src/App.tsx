import { BookForm } from './components/BookForm'
import { BookList } from './components/BookList'
import { ReadingStats } from './components/ReadingStat';
import { SyncStatus } from './components/SyncStatus';
import { useSyncWorker } from './hooks/useSyncWorker';
import { Toaster } from "sonner";

const App = () => {
  useSyncWorker();
  return (
    <main className="max-w-2xl mx-auto p-8">
      <SyncStatus />
      <h1 className="text-3xl font-black tracking-tighter text-slate-100 mb-8">
        Reading Log
      </h1>
      <BookForm />
      <ReadingStats/>
      <BookList />
      <Toaster richColors position="bottom-right" />
    </main>
  )
}

export default App
