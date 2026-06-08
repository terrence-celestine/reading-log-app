import { useState } from "react";
import { db } from "../lib/db";
import type { Book } from "../types";
import { toast } from "sonner";
import { enrichBook } from "../lib/enrichBook";

export const BookForm = () => {
    const [title, setTitle] = useState<string>('');
    const [author, setAuthor] = useState<string>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();


        let newBook: Book = {
            id: crypto.randomUUID(),
            title,
            author,
            status: 'to-read',
            progressPercentage: 0,
            pagesRead: 0,
            createdAt: new Date().toISOString()        }

        try {
          // 1. Query for the existing book by title
          const existingBook = await db.books
          .filter(b => b.title.toLowerCase() === newBook.title.toLowerCase() && !b.deleted)
          .first();

          // 2. If it exists, show the toast and stop
          if (existingBook) {
            toast.error(`${newBook.title} is already in your library!`);
            return;
          }

          newBook.metadataStatus = 'pending';
          await db.books.add(newBook);

          // Trigger AI enrichment in the background (non-blocking)
          enrichBook(newBook.title, newBook.author)
            .then(async (enrichmentData) => {
              await db.books.update(newBook.id, {
                coverUrl: enrichmentData.coverUrl || undefined,
                totalPages: enrichmentData.pageCount || 0,
                metadataStatus: 'success',
                isbn: enrichmentData.isbn,
                summary: enrichmentData.summary
              });
            })
            .catch(async (err) => {
              console.error("Failed to enrich book:", err);
              await db.books.update(newBook.id, {
                metadataStatus: 'failed'
              });
            });

          toast.success(`Added "${newBook.title}" to your library!`, {
            description: "You can track your progress in the dashboard."
          });
        } catch (error) {
          console.log("catch")
          toast.error("Failed to add book. It might already be in your library.");
        } finally {
          setTitle('');
          setAuthor('');
        }
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-2xl mb-12">
        <h2 className="text-2xl font-black text-black mb-6">Add a New Book</h2>
        <div className="space-y-4">
        <label htmlFor="title" className="text-sm font-semibold text-slate-600 text-left">
          Title
        </label>
          <input
          id="title"
            onChange={e => setTitle(e.target.value)}
            value={title}
            name="title"
            placeholder="Book Title"
            className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            required
          />
        <label htmlFor="author" className="text-sm font-semibold text-slate-600 text-left">
          Author
        </label>
          <input
          id="author"
          onChange={e => setAuthor(e.target.value)}
          value={author}
            name="author"
            placeholder="Author"
            className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            required
          />
          <button 
            type="submit"
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-transform active:scale-[0.98] cursor-pointer"
          >
            Add to Library
          </button>
        </div>
      </form>
      );
    }