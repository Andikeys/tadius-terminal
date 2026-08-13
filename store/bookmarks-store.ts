import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Real, locally-persisted bookmarks — a plain set of Lab ids the learner
 * has starred, nothing fabricated. Playground cards stay deliberately
 * bookmark-free (see playground-card.tsx) so this lives on Labs only. */

interface BookmarksState {
  labIds: string[];
  isBookmarked: (labId: string) => boolean;
  toggleBookmark: (labId: string) => void;
  clearAll: () => void;
}

export const useBookmarksStore = create<BookmarksState>()(
  persist(
    (set, get) => ({
      labIds: [],
      isBookmarked: (labId) => get().labIds.includes(labId),
      toggleBookmark: (labId) =>
        set((state) => ({
          labIds: state.labIds.includes(labId)
            ? state.labIds.filter((id) => id !== labId)
            : [...state.labIds, labId],
        })),
      clearAll: () => set({ labIds: [] }),
    }),
    { name: "tadius:bookmarks" }
  )
);
