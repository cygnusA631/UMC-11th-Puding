import { getMoviesWithFetch } from "../api/movies/get-movies-with-fetch";

// Call explicitly from the API practice screen; importing this file sends no request.
export function runFetchMoviesExample(page = 1) {
  return getMoviesWithFetch(page);
}
