import { db } from '../lib/db';

export const useDeleteBook = () => {
  const deleteBook = async (id: string) => {
    // We mark as deleted instead of immediate removal 
    // to allow the sync engine to handle the remote deletion.
    await db.books.update(id, { deleted: true });
    
    // Trigger Sync Manager to process the deletion
    console.log("Book marked for deletion, queueing sync...");
  };

  return { deleteBook };
};