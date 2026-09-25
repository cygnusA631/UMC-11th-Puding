import type { Movie } from "../types/movie";

interface MovieCardProps {
  movie: Movie;
  onToggleBookmark: (movieId: Movie["id"]) => void;
}

export function MovieCard({ movie, onToggleBookmark }: MovieCardProps) {
  return (
    <li className="movie-card">
      <div className="poster-wrap">
        <img
          className="movie-poster"
          src={movie.posterPath}
          alt={`${movie.title} 포스터`}
          width={240}
          height={360}
        />
        <button
          type="button"
          className="bookmark-button"
          aria-label={`${movie.title} 북마크`}
          aria-pressed={movie.isBookmarked}
          onClick={() => onToggleBookmark(movie.id)}
        >
          <img
            src={
              movie.isBookmarked
                ? "/icons/bookmark.svg"
                : "/icons/bookmark-outline.svg"
            }
            alt=""
          />
        </button>
      </div>
      <div className="movie-info">
        <h2 className="movie-title">{movie.title}</h2>
        <time
          className="movie-date"
          dateTime={movie.releaseDate.replaceAll(".", "-")}
        >
          {movie.releaseDate}
        </time>
      </div>
    </li>
  );
}
