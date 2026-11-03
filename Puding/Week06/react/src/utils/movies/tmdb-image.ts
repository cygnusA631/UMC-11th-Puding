const posterBaseUrl = "https://image.tmdb.org/t/p/w500";
const backdropBaseUrl = "https://image.tmdb.org/t/p/w1280";

export function getTmdbPosterUrl(posterPath: string | null) {
  return posterPath ? `${posterBaseUrl}${posterPath}` : null;
}

export function getTmdbBackdropUrl(backdropPath: string | null) {
  return backdropPath ? `${backdropBaseUrl}${backdropPath}` : null;
}
