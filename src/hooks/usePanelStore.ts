import { create } from "zustand";

type PanelStore = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

export const usePanelStore = create<PanelStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));