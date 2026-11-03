import { queryOptions } from "@tanstack/react-query";
import { getMovieDetail } from "./get-movie-detail";
import { getMovies } from "./get-movies";
import { searchMovies } from "./search-movies";

export const movieQueries = {
  list: (page = 1) => queryOptions({
    queryKey: ["movies", "list", { page }] as const,
    queryFn: ({ signal }) => getMovies({ page, signal }),
  }),

  search: (query: string, page = 1) => {
    const normalizedQuery = query.trim();
    return queryOptions({
      queryKey: ["movies", "search", { query: normalizedQuery, page }] as const,
      queryFn: ({ signal }) => searchMovies({ query: normalizedQuery, page, signal }),
      enabled: normalizedQuery.length > 0,
    });
  },

  detail: (movieId: number) => queryOptions({
    queryKey: ["movies", "detail", movieId] as const,
    queryFn: ({ signal }) => getMovieDetail(movieId, { signal }),
    enabled: Number.isSafeInteger(movieId) && movieId > 0,
    staleTime: 30_000,
  }),
};
