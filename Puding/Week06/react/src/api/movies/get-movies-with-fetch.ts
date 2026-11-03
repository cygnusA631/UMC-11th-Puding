import { getTmdbConfig } from "../../config/env";
import { TmdbHttpError, validatePage } from "./errors";
import type { TmdbMovieListResponse } from "./models";

export type GetMoviesWithFetchResponse = TmdbMovieListResponse;

export async function getMoviesWithFetch(
  page = 1,
  { signal }: { signal?: AbortSignal } = {},
): Promise<GetMoviesWithFetchResponse> {
  validatePage(page);
  const config = getTmdbConfig();
  const url = new URL("movie/popular", `${config.tmdbApiBaseUrl}/`);
  url.search = new URLSearchParams({ language: "ko-KR", page: String(page) }).toString();

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${config.tmdbAccessToken}` },
    signal,
  });

  if (!response.ok) {
    throw new TmdbHttpError(response.status);
  }

  return response.json();
}
