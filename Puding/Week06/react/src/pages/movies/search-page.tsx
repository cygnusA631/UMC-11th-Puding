import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type SubmitEvent } from "react";
import { movieQueries } from "../../api/movies/movie-query-options";
import { BookmarkButton } from "../../components/movies/bookmark-button";
import { MovieImage } from "../../components/movies/movie-image";
import { MovieStatus } from "../../components/movies/movie-status";
import { Pagination } from "../../components/movies/pagination";
import { getMovieErrorMessage } from "../../utils/movies/get-movie-error-message";
import { toMovieListItem } from "../../utils/movies/movie-adapter";

export function SearchPage() {
  const { query, page } = useSearch({ from: "/search" });
  const navigate = useNavigate({ from: "/search" });
  const normalizedQuery = query?.trim() ?? "";
  const currentPage = page ?? 1;
  const [searchText, setSearchText] = useState(query ?? "");
  const searchQuery = useQuery(movieQueries.search(normalizedQuery, currentPage));
  const movies = (searchQuery.data?.results ?? []).map(toMovieListItem);
  const totalPages = Math.min(500, searchQuery.data?.total_pages ?? 0);
  const totalResults = searchQuery.data?.total_results ?? 0;
  const hasData = searchQuery.data !== undefined;
  useEffect(() => { setSearchText(query ?? ""); }, [query]);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = searchText.trim();
    void navigate({ search: nextQuery ? { query: nextQuery } : {} });
  }

  return (
    <main className="mx-auto w-full max-w-[1440px] flex-1 px-5 pt-7 pb-[72px] min-[768px]:px-10 min-[1200px]:px-20">
      <h1 className="mb-6 text-[28px] leading-tight font-bold tracking-[-1.1px] sm:text-[32px]">영화 검색</h1>
      <form onSubmit={handleSubmit} role="search" className="flex w-full max-w-[640px] gap-2">
        <label htmlFor="movie-search" className="sr-only">검색어</label>
        <input id="movie-search" type="search" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="영화 제목을 검색해 보세요" className="min-w-0 flex-1 rounded-lg border border-[#d5d9e2] bg-white px-4 py-3 text-sm outline-none placeholder:text-[#8b909b] focus:border-[#3861e9] focus:ring-2 focus:ring-[#3861e9]/20" />
        <button type="submit" className="rounded-lg bg-[#3861e9] px-5 text-sm font-semibold text-white hover:bg-[#2047cd] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#153cc5]">검색</button>
      </form>
      <section className="mt-10" aria-labelledby={normalizedQuery ? "search-results-title" : undefined}>
        {normalizedQuery && <div className="mb-5 flex flex-wrap items-end justify-between gap-2"><h2 id="search-results-title" className="text-xl font-bold tracking-[-0.5px]">‘{normalizedQuery}’ 검색 결과</h2>{hasData && <p className="text-sm text-[#72767e]">영화 {totalResults}편</p>}</div>}
        {normalizedQuery && hasData && searchQuery.isFetching && <p role="status" className="mb-4 text-sm text-[#72767e]">최신 검색 결과를 확인하고 있어요.</p>}
        {normalizedQuery && hasData && searchQuery.isError && <div className="mb-4"><MovieStatus error message={getMovieErrorMessage(searchQuery.error)} onRetry={() => { void searchQuery.refetch(); }} /></div>}
        {!normalizedQuery ? <MovieStatus message="검색어를 입력해 주세요." />
          : searchQuery.isLoading ? <MovieStatus loading message="검색 결과를 불러오는 중이에요." />
          : searchQuery.isPaused && !hasData ? <MovieStatus message="네트워크 연결을 기다리고 있어요." />
          : searchQuery.isError && !hasData ? <MovieStatus error message={getMovieErrorMessage(searchQuery.error)} onRetry={() => { void searchQuery.refetch(); }} />
          : movies.length === 0 ? <MovieStatus message="검색 결과가 없어요." />
          : <><ul className="grid gap-4">{movies.map((movie) => (
            <li key={movie.id} className="relative">
              <Link to="/movies/$movieId" params={{ movieId: String(movie.id) }} className="flex gap-4 rounded-xl border border-[#e6e8ed] bg-white p-4 pb-[72px] transition-shadow hover:shadow-md focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#153cc5] sm:gap-6" aria-label={`${movie.title} 상세 보기`}>
                <MovieImage className="h-[150px] w-[105px] shrink-0 rounded-md bg-[#e6e8ed] object-cover sm:h-[180px] sm:w-[130px]" src={movie.posterPath} alt={`${movie.title} 포스터`} />
                <div className="min-w-0"><h3 className="text-lg font-bold tracking-[-0.4px] sm:text-xl">{movie.title}</h3><p className="mt-1 text-sm text-[#72767e]">{movie.originalTitle}</p><p className="mt-2 text-xs text-[#72767e]">{movie.releaseDate}</p><p className="mt-4 line-clamp-3 text-sm leading-6 text-[#4b5058] sm:line-clamp-none">{movie.overview}</p><span className="mt-3 inline-block text-sm font-semibold text-[#3861e9]">상세 보기 →</span></div>
              </Link>
              <BookmarkButton movie={movie} className="absolute right-4 bottom-4" />
            </li>
          ))}</ul><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(nextPage) => { void navigate({ search: { query: normalizedQuery, page: nextPage === 1 ? undefined : nextPage } }); }} /></>}
      </section>
    </main>
  );
}
