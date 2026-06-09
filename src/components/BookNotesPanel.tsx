// src/components/BookNotesPanel.tsx
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import { Trash2, MessageSquare, Quote, FileText } from "lucide-react";

export const BookNotesPanel = ({ bookId }: { bookId: string }) => {
  // 1. Reactive Dexie queries
  const book = useLiveQuery(() => db.books.get(bookId), [bookId]);
  const notes = useLiveQuery(
    () => db.bookNotes.where("bookId").equals(bookId).toArray(),
    [bookId]
  );

  // 2. Component states
  const [noteText, setNoteText] = useState("");
  const [pageNumber, setPageNumber] = useState("");
  const [noteType, setNoteType] = useState<"note" | "quote">("note");
  const [activeTab, setActiveTab] = useState<"all" | "note" | "quote">("all");

  if (!book) {
    return <div className="text-slate-400 text-sm mt-8">Loading book details...</div>;
  }

  // 3. Handlers
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    await db.bookNotes.add({
      bookId,
      note: noteText,
      pageNumber: pageNumber ? parseInt(pageNumber, 10) : undefined,
      type: noteType,
      date: new Date().toISOString(),
      syncedToCloud: 0,
    });

    setNoteText("");
    setPageNumber("");
  };

  const handleDeleteNote = async (id?: number) => {
    if (id === undefined) return;
    await db.bookNotes.delete(id);
  };

  // 4. Filtering notes
  const filteredNotes = (notes || []).filter((note) => {
    if (activeTab === "all") return true;
    return note.type === activeTab;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Reverse-chronological

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header */}
      <div className="pr-10 text-left">
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
          Book Notes
        </span>
        <h2 className="text-xl font-bold text-white leading-tight truncate">
          {book.title}
        </h2>
        <p className="text-sm text-slate-400 font-medium truncate">{book.author}</p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleAddNote} className="space-y-3 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          className="w-full min-h-[80px] bg-slate-900 text-white rounded-lg border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none p-3 transition-all placeholder:text-slate-500 text-sm"
          placeholder={noteType === "quote" ? "Type or paste the quote..." : "Write a note..."}
          required
        />
        
        <div className="grid grid-cols-2 gap-2">
          {/* Note/Quote Select */}
          <select
            value={noteType}
            onChange={(e) => setNoteType(e.target.value as "note" | "quote")}
            className="bg-slate-900 text-white rounded-lg border border-slate-700 focus:border-blue-500 outline-none px-3 py-2 text-xs"
          >
            <option value="note">✍️ Thought/Note</option>
            <option value="quote">💬 Favorite Quote</option>
          </select>

          {/* Page number */}
          <input
            type="number"
            value={pageNumber}
            onChange={(e) => setPageNumber(e.target.value)}
            placeholder="Page (optional)"
            className="bg-slate-900 text-white rounded-lg border border-slate-700 focus:border-blue-500 outline-none px-3 py-2 text-xs text-center"
            min="1"
            max={book.totalPages}
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
        >
          Add {noteType === "quote" ? "Quote" : "Note"}
        </button>
      </form>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 text-xs">
        {(["all", "note", "quote"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 pb-2 font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
              activeTab === tab
                ? "text-blue-400 border-blue-500"
                : "text-slate-500 border-transparent hover:text-slate-300"
            }`}
          >
            {tab === "all" ? "All" : tab === "note" ? "Notes" : "Quotes"}
          </button>
        ))}
      </div>

      {/* List feed */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs flex flex-col items-center gap-2">
            {activeTab === "quote" ? <Quote size={20} /> : <FileText size={20} />}
            No {activeTab === "all" ? "notes or quotes" : activeTab + "s"} yet.
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              className={`p-4 rounded-xl border relative group transition-all text-left ${
                note.type === "quote"
                  ? "bg-emerald-950/10 border-emerald-500/20 hover:border-emerald-500/40"
                  : "bg-slate-800/20 border-slate-800/80 hover:border-slate-700"
              }`}
            >
              {/* Type and Page tag */}
              <div className="flex justify-between items-center mb-2">
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    note.type === "quote"
                      ? "text-emerald-400 bg-emerald-500/10"
                      : "text-blue-400 bg-blue-500/10"
                  }`}
                >
                  {note.type === "quote" ? <Quote size={8} /> : <MessageSquare size={8} />}
                  {note.type}
                </span>
                {note.pageNumber && (
                  <span className="text-[10px] text-slate-500 font-bold">
                    Page {note.pageNumber}
                  </span>
                )}
              </div>

              {/* Note Content */}
              {note.type === "quote" ? (
                <blockquote className="text-sm text-slate-200 font-medium italic border-l-2 border-emerald-500/30 pl-2 leading-relaxed">
                  "{note.note}"
                </blockquote>
              ) : (
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {note.note}
                </p>
              )}

              {/* Delete Trigger */}
              <button
                type="button"
                onClick={() => handleDeleteNote(note.id)}
                className="absolute top-3 right-3 text-slate-600 hover:text-red-400 p-1 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer hover:bg-slate-800"
                title="Delete note"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};