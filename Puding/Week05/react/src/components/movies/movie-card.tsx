import { Link } from "@tanstack/react-router";
import type { Movie } from "../../types/movie";
import { BookmarkButton } from "./bookmark-button";

interface MovieCardProps {
  movie: Movie;
}

export function MovieCard({ movie }: MovieCardProps) {
  const detailParams = { movieId: String(movie.id) };

  return (
    <li className="min-w-0">
      <div className="relative">
        <Link
          to="/movies/$movieId"
          params={detailParams}
          className="block overflow-hidden rounded-[9px] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#153cc5]"
          aria-label={`${movie.title} 상세 보기`}
        >
          <img
            className="aspect-[4/5] w-full bg-[#e6e8ed] object-cover transition-transform duration-200 hover:scale-[1.03] min-[480px]:aspect-[240/274]"
            src={movie.posterPath}
            alt={`${movie.title} 포스터`}
            width={240}
            height={274}
          />
        </Link>
        <BookmarkButton movie={movie} variant="card" />
      </div>
      <div className="pt-[9px]">
        <h2 className="break-words text-base leading-[1.4] font-bold tracking-[-0.4px] min-[480px]:text-sm">
          <Link
            to="/movies/$movieId"
            params={detailParams}
            className="hover:underline focus-visible:rounded focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#153cc5]"
          >
            {movie.title}
          </Link>
        </h2>
        <time className="mt-1 block text-[13px] leading-[1.4] text-[#72767e] min-[480px]:text-xs" dateTime={movie.releaseDate.replaceAll(".", "-")}>
          {movie.releaseDate}
        </time>
      </div>
    </li>
  );
}
