import type { TmdbMovieDetail, TmdbMovieListItem } from "../../api/movies/models";
import type { Movie } from "../../types/movie";
import { getTmdbBackdropUrl, getTmdbPosterUrl } from "./tmdb-image";

export function formatRuntime(runtime: number | null) {
  if (runtime === null) return "상영 시간 정보가 없어요.";
  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;
  return hours > 0 ? `${hours}시간${minutes ? ` ${minutes}분` : ""}` : `${minutes}분`;
}

export function toMovieListItem(movie: TmdbMovieListItem): Movie {
  return {
    id: movie.id,
    title: movie.title,
    originalTitle: movie.original_title,
    releaseDate: movie.release_date ? movie.release_date.replaceAll("-", ".") : "개봉일 정보 없음",
    posterPath: getTmdbPosterUrl(movie.poster_path),
    backdropPath: getTmdbBackdropUrl(movie.backdrop_path),
    genres: [],
    runtime: "상영 시간 정보가 없어요.",
    tagline: "",
    overview: movie.overview || "줄거리 정보가 없어요.",
  };
}

export function toMovieDetail(movie: TmdbMovieDetail): Movie {
  return {
    id: movie.id,
    title: movie.title,
    originalTitle: movie.original_title,
    releaseDate: movie.release_date ? movie.release_date.replaceAll("-", ".") : "개봉일 정보 없음",
    posterPath: getTmdbPosterUrl(movie.poster_path),
    backdropPath: getTmdbBackdropUrl(movie.backdrop_path),
    genres: movie.genres.map((genre) => genre.name),
    runtime: formatRuntime(movie.runtime),
    tagline: movie.tagline,
    overview: movie.overview || "줄거리 정보가 없어요.",
  };
}
