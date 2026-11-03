import { isHTTPError, isTimeoutError } from "ky";
import { TmdbHttpError } from "../../api/movies/errors";
import { TmdbConfigError } from "../../config/env";

export function getMovieErrorMessage(error: unknown): string {
  if (error instanceof TmdbConfigError || error instanceof RangeError) return error.message;

  const status = isHTTPError(error)
    ? error.response.status
    : error instanceof TmdbHttpError ? error.status : undefined;

  if (status === 401) return "TMDB 인증에 실패했어요. API Read Access Token을 확인해 주세요.";
  if (status === 403) return "영화 정보를 조회할 권한이 없어요.";
  if (status === 429) return "요청이 많아요. 잠시 후 다시 시도해 주세요.";
  if (isTimeoutError(error)) return "응답 시간이 길어지고 있어요. 잠시 후 다시 시도해 주세요.";
  if (status) return `영화 정보를 불러오지 못했어요. (HTTP ${status})`;
  return "영화 정보를 불러오지 못했어요. 네트워크 연결을 확인하고 다시 시도해 주세요.";
}
