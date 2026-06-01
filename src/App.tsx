import { BookForm } from './components/BookForm'
import { BookList } from './components/BookList'
import { SyncStatus } from './components/SyncStatus';
import { useSyncWorker } from './hooks/useSyncWorker';

const App = () => {
  useSyncWorker();
  return (
    <main className="max-w-2xl mx-auto p-8">
      <SyncStatus />
      <h1 className="text-3xl font-black tracking-tighter text-slate-100 mb-8">
        Reading Log
      </h1>
      <BookForm />
      <BookList />
    </main>
  )
}

export default App
