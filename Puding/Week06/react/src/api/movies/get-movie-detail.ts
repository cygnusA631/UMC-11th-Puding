import { getTmdbConfig } from "../../config/env";
import { tmdbClient } from "../tmdb-client";
import type { TmdbMovieDetail } from "./models";

export type GetMovieDetailResponse = TmdbMovieDetail;

export async function getMovieDetail(movieId: number, { signal }: { signal?: AbortSignal } = {}) {
  if (!Number.isSafeInteger(movieId) || movieId <= 0) {
    throw new RangeError("올바르지 않은 영화 번호예요.");
  }
  getTmdbConfig();
  return tmdbClient.get(`movie/${movieId}`, {
    searchParams: { language: "ko-KR" },
    signal,
  }).json<GetMovieDetailResponse>();
}
