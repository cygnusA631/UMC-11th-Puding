import { getTmdbConfig } from "../../config/env";
import { tmdbClient } from "../tmdb-client";
import { validatePage } from "./errors";
import type { TmdbMovieListResponse } from "./models";

export interface SearchMoviesRequest {
  query: string;
  page?: number;
  signal?: AbortSignal;
}

export type SearchMoviesResponse = TmdbMovieListResponse;

export async function searchMovies({ query, page = 1, signal }: SearchMoviesRequest) {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) throw new RangeError("검색어를 입력해 주세요.");
  validatePage(page);
  getTmdbConfig();
  return tmdbClient.get("search/movie", {
    searchParams: { query: normalizedQuery, language: "ko-KR", include_adult: false, page },
    signal,
  }).json<SearchMoviesResponse>();
}
