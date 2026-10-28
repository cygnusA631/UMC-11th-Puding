import { useState } from "react";
import { MovieGrid } from "../../components/movies/movie-grid";
import { Pagination } from "../../components/movies/pagination";
import { movies } from "../../data/movies";

export function MovieListPage() {
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <main className="mx-auto w-full max-w-[1440px] flex-1 px-5 pt-7 pb-[72px] min-[768px]:px-10 min-[1200px]:px-20">
      <h1 className="mb-6 text-[28px] leading-tight font-bold tracking-[-1.1px] sm:text-[32px]">영화 목록</h1>
      <MovieGrid movies={movies} />
      <Pagination currentPage={currentPage} totalPages={5} onPageChange={setCurrentPage} />
    </main>
  );
}
