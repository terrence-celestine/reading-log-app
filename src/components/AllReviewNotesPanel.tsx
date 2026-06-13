import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import { Quote, FileText, Book } from "lucide-react";
import type { ReviewProps, FeedItem, BookNote } from "@/types";

export const AllReviewNotesPanel = () => {
  // Reactive Dexie queries
  const books = useLiveQuery(() => db.books.toArray());
  const notes = useLiveQuery(() => db.bookNotes.toArray());

  const [reviews, setReviews] = useState<ReviewProps[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<BookNote[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "note" | "reviews">("all")

   // Filtering notes
   useEffect(() => {
    if (!books || !notes) return;

    let newReviews: ReviewProps[] = books.filter(book =>
      book.review && book.review.length > 0
    ).map(book => ({
      id: `review-${book.id}`,
      bookId: book.id,
      review: book.review,
      title: book.title,
      author: book.author
    } as ReviewProps));

    setReviews(newReviews);

    const newFilteredNotes: BookNote[] = notes.filter((note) => {
      if (activeTab === "all") return true;
      return note.type === activeTab;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Reverse-chronological

    setFilteredNotes(newFilteredNotes);
  }, [books, notes, activeTab]);



  const getItemTitleAndAuthor = (item: FeedItem) => {
    // return original note or review author
    if (!item?.bookId) return { title: item.title, author: item.author } 
    const book = books?.find(book => {
      return book.id === item.bookId;
    });
    return { title: book?.title, author: book?.author };
  }

  // Helper function to render notes and reviews
  const renderNotesAndReviews = (items: FeedItem[]) => items.map((item) => {
    const uniqueKey = item.note ? `note-${item.id}` : `review-${item.bookId}`;
    return (
      <div key={uniqueKey} className="my-4 p-4 rounded-xl border relative group transition-all text-left bg-slate-800/20 border-slate-800/80 hover:border-slate-700">
        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
          {item.review || item.note}
        </p>
        <span className="flex items-center gap-2">
          <Book size={12} /> 
          {getItemTitleAndAuthor(item).title}
          <span className="text-xs text-slate-500">
            {getItemTitleAndAuthor(item).author}
          </span>
        </span>
      </div>
    );
  });

    const renderPanel = () => {
      console.log("render panel")
      if (activeTab === "note") {
        {console.log("filteredNotes", renderNotesAndReviews(filteredNotes))}
        return (
          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {renderNotesAndReviews(filteredNotes)}
          </div>
        );
      } else if (activeTab === "reviews") {
        return (
          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {renderNotesAndReviews(reviews)}
          </div>
        );
      } else {
        return (
          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {renderNotesAndReviews(filteredNotes)}
            {renderNotesAndReviews(reviews)}
          </div>
        );
      }
    };

       // Ensure the renderPanel uses useMemo to avoid unnecessary re-renders
   const panelContent = useMemo(() => renderPanel(), [activeTab, filteredNotes, reviews]);

  if (!books) {
    return <div className="text-slate-400 text-sm mt-8">Loading book details...</div>;
  }
   
  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header */}
      <div className="pr-10 text-left">
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
          All Notes & Reviews
        </span>
        <h2 className="text-xl font-bold text-white leading-tight truncate">
          All Notes & Reviews
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 text-xs">
        {(["all", "note", "reviews"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 pb-2 font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
              activeTab === tab
                ? "text-blue-400 border-blue-500"
                : "text-slate-500 border-transparent hover:text-slate-300"
            }`}
          >
            {tab === "all" ? "All" : tab === "note" ? "Notes" : "Reviews"}
          </button>
        ))}
      </div>

      {/* List feed */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {filteredNotes.length === 0 && reviews.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs flex flex-col items-center gap-2">
            {activeTab === "note" ? <FileText size={20} /> : activeTab === "reviews" ? <Quote size={20} /> : <FileText size={20} />}
            No {activeTab === "all" ? "notes or quotes or reviews" : activeTab + "s"} yet.
          </div>
        ) : (
          panelContent
        )}
      </div>
    </div>
  );
};
