import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { movies } from "../data/movies";
import type { Movie } from "../types/movie";
import { safeLocalStorage } from "../utils/storage";

export const BOOKMARK_STORAGE_KEY = "umcine-bookmark-store";

const knownMovieIds = new Set(movies.map((movie) => movie.id));

interface BookmarkState {
  bookmarkedIds: Movie["id"][];
  toggleBookmark: (movieId: Movie["id"]) => void;
}

interface PersistedBookmarks {
  bookmarkedIds: Movie["id"][];
}

function readBookmarkedIds(value: unknown): Movie["id"][] {
  if (typeof value !== "object" || value === null || !("bookmarkedIds" in value)) {
    return [];
  }

  const ids = value.bookmarkedIds;
  if (!Array.isArray(ids)) return [];

  return [...new Set(ids.filter((id): id is number =>
    typeof id === "number" && Number.isInteger(id) && knownMovieIds.has(id),
  ))];
}

export const useBookmarkStore = create<BookmarkState>()(
  persist<BookmarkState, [], [], PersistedBookmarks>(
    (set) => ({
      bookmarkedIds: [],
      toggleBookmark: (movieId) => {
        if (!knownMovieIds.has(movieId)) return;

        set((state) => ({
          bookmarkedIds: state.bookmarkedIds.includes(movieId)
            ? state.bookmarkedIds.filter((id) => id !== movieId)
            : [...state.bookmarkedIds, movieId],
        }));
      },
    }),
    {
      name: BOOKMARK_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({ bookmarkedIds: state.bookmarkedIds }),
      // Persisted JSON is untrusted: restore only valid IDs and retain actions.
      merge: (persistedState, currentState) => ({
        ...currentState,
        bookmarkedIds: readBookmarkedIds(persistedState),
      }),
    },
  ),
);
