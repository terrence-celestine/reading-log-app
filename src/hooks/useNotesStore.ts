import { create } from "zustand";

type NotesStore = {
  isOpen: boolean;
  selectedBookId: string | null;
  open: (bookId: string) => void;
  close: () => void;
};

export const useNotesStore = create<NotesStore>((set) => ({
  isOpen: false,
  selectedBookId: null,
  open: (bookId: string) => set({ isOpen: true, selectedBookId: bookId }),
  close: () => set({ isOpen: false, selectedBookId: null }),
}));