import { getTmdbConfig } from "../../config/env";
import { tmdbClient } from "../tmdb-client";
import { validatePage } from "./errors";
import type { TmdbMovieListResponse } from "./models";

export interface GetMoviesRequest {
  page?: number;
  signal?: AbortSignal;
}

export type GetMoviesResponse = TmdbMovieListResponse;

export async function getMovies({ page = 1, signal }: GetMoviesRequest = {}) {
  validatePage(page);
  getTmdbConfig();
  return tmdbClient.get("movie/popular", {
    searchParams: { language: "ko-KR", page },
    signal,
  }).json<GetMoviesResponse>();
}
