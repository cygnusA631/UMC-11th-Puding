import { isHTTPError } from "ky";
import { TmdbHttpError } from "../../api/movies/errors";
import { getMovieErrorMessage } from "./get-movie-error-message";

export function getMovieDetailErrorMessage(error: unknown) {
  if ((isHTTPError(error) && error.response.status === 404)
    || (error instanceof TmdbHttpError && error.status === 404)) {
    return "영화를 찾을 수 없어요.";
  }
  return getMovieErrorMessage(error);
}
