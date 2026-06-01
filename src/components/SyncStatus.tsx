import { useSyncStore } from '../lib/syncManager';
import { RefreshCw, CheckCircle2 } from 'lucide-react';

export const SyncStatus = () => {
  const { isSyncing } = useSyncStore();

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
        isSyncing ? 'bg-amber-500 text-white' : 'bg-green-600 text-white'
      }`}>
        {isSyncing ? (
          <>
            <RefreshCw size={14} className="animate-spin" />
            Syncing changes...
          </>
        ) : (
          <>
            <CheckCircle2 size={14} />
            All data synced
          </>
        )}
      </div>
    </div>
  );
};