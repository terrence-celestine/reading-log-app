import { useState } from "react";
import { Star } from "lucide-react";
import { db } from "../lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { useReviewStore } from "../hooks/useReviewStore";

export const ReviewPanel = ({ bookId }: { bookId: string }) => {
  const { close } = useReviewStore();
  const book = useLiveQuery(() => db.books.get(bookId), [bookId]);

  // States for rating and review input
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoverHoveredRating] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState("");

  // Load existing reviews/ratings if they exist in Dexie
  useLiveQuery(async () => {
    if (!bookId) return;
    const existingBook = await db.books.get(bookId);
    if (existingBook) {
      setRating(existingBook.rating || 0);
      setReviewText(existingBook.review || "");
    }
  }, [bookId]);

  const handleSave = async () => {
    if (rating === 0) {
      toast.error("Please select a star rating!");
      return;
    }

    try {
      await db.books.update(bookId, {
        rating,
        review: reviewText,
      });
      toast.success("Review saved successfully!");
      close();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save review.");
    }
  };

  if (!book) return <div className="text-slate-400 text-sm">Loading...</div>;

  return (
    <div className="text-left space-y-6">
      {/* Header */}
      <div>
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
          Book Review
        </span>
        <h2 className="text-xl font-bold text-white leading-tight truncate">
          {book.title}
        </h2>
        <p className="text-sm text-slate-400 font-medium truncate">{book.author}</p>
      </div>

      {/* Inputs */}
      <div className="space-y-4">
        {/* Star Rating Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Rating
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="p-1 hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverHoveredRating(star)}
                onMouseLeave={() => setHoverHoveredRating(null)}
              >
                <Star
                  size={28}
                  className={`transition-colors duration-150 ${
                    star <= (hoveredRating ?? rating)
                      ? "text-amber-400 fill-amber-400 filter drop-shadow-[0_0_6px_rgba(251,191,36,0.3)]"
                      : "text-slate-700 hover:text-slate-500"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Written Review Text Area */}
        <div className="flex flex-col gap-2">
          <label htmlFor="review" className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Thoughts & Review
          </label>
          <textarea
            id="review"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="What did you think about this book? Write your thoughts here..."
            className="w-full min-h-[120px] bg-slate-950 text-white rounded-xl border border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none p-3.5 transition-all placeholder:text-slate-600 text-sm leading-relaxed"
          />
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Save Review
          </button>
        </div>
      </div>
    </div>
  );
};