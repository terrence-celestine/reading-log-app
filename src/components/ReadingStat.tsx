import { useLiveQuery } from "dexie-react-hooks";
import { db } from '../lib/db';

export const ReadingStats = () => {
    const books = useLiveQuery(() => db.books.toArray());
  
    const totalBooks = books?.length ? books.filter((b) => !b.deleted).length : 0;
    const finishedBooks = books?.filter((b) => b.status === 'finished').length || 0;
  
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg">
          <h4 className="text-zinc-400">Total Books</h4>
          <p className="text-2xl font-bold">{totalBooks}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <h4 className="text-zinc-400">Finished</h4>
          <p className="text-2xl font-bold">{finishedBooks}</p>
        </div>
      </div>
    );
  };
