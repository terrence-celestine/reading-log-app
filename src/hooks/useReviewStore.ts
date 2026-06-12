import { create } from "zustand";

type ReviewStore = {
  isOpen: boolean;
  selectedBookId: string | null;
  open: (bookId: string) => void;
  close: () => void;
};

export const useReviewStore = create<ReviewStore>((set) => ({
  isOpen: false,
  selectedBookId: null,
  open: (bookId: string) => set({ isOpen: true, selectedBookId: bookId }),
  close: () => set({ isOpen: false, selectedBookId: null }),
}));