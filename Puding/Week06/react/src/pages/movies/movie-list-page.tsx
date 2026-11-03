import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { movieQueries } from "../../api/movies/movie-query-options";
import { MovieGrid } from "../../components/movies/movie-grid";
import { Pagination } from "../../components/movies/pagination";
import { MovieStatus } from "../../components/movies/movie-status";
import { getMovieErrorMessage } from "../../utils/movies/get-movie-error-message";
import { toMovieListItem } from "../../utils/movies/movie-adapter";

export function MovieListPage() {
  const { page } = useSearch({ from: "/" });
  const navigate = useNavigate({ from: "/" });
  const currentPage = page ?? 1;
  const moviesQuery = useQuery(movieQueries.list(currentPage));
  const movies = (moviesQuery.data?.results ?? []).map(toMovieListItem);
  const totalPages = Math.min(500, moviesQuery.data?.total_pages ?? 0);
  const hasData = moviesQuery.data !== undefined;

  return (
    <main className="mx-auto w-full max-w-[1440px] flex-1 px-5 pt-7 pb-[72px] min-[768px]:px-10 min-[1200px]:px-20">
      <h1 className="mb-6 text-[28px] leading-tight font-bold tracking-[-1.1px] sm:text-[32px]">영화 목록</h1>
      {hasData && moviesQuery.isFetching && <p role="status" className="mb-4 text-sm text-[#72767e]">최신 영화 목록을 확인하고 있어요.</p>}
      {hasData && moviesQuery.isError && <div className="mb-4"><MovieStatus error message={getMovieErrorMessage(moviesQuery.error)} onRetry={() => { void moviesQuery.refetch(); }} /></div>}
      {moviesQuery.isPending ? <MovieStatus loading message="영화 목록을 불러오는 중이에요." />
        : moviesQuery.isError && !hasData ? <MovieStatus error message={getMovieErrorMessage(moviesQuery.error)} onRetry={() => { void moviesQuery.refetch(); }} />
        : movies.length === 0 ? <MovieStatus message="조건에 맞는 영화가 없어요." />
        : <><MovieGrid movies={movies} /><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(nextPage) => { void navigate({ search: nextPage === 1 ? {} : { page: nextPage } }); }} /></>}
    </main>
  );
}
