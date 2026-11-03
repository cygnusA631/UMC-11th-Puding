import type { Movie } from "../../types/movie";
import { MovieCard } from "./movie-card";

interface MovieGridProps {
  movies: Movie[];
}

export function MovieGrid({ movies }: MovieGridProps) {
  return (
    <ul className="grid grid-cols-1 gap-x-[18px] gap-y-6 max-[767px]:gap-x-4 max-[479px]:gap-y-7 min-[480px]:grid-cols-2 min-[768px]:grid-cols-3 min-[1200px]:grid-cols-5">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </ul>
  );
}
