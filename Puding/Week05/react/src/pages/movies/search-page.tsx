import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState, type SubmitEvent } from "react";
import { movies } from "../../data/movies";
import { BookmarkButton } from "../../components/movies/bookmark-button";

export function SearchPage() {
  const { query } = useSearch({ from: "/search" });
  const navigate = useNavigate({ from: "/search" });
  const [searchText, setSearchText] = useState(query ?? "");

  useEffect(() => {
    setSearchText(query ?? "");
  }, [query]);

  const normalizedQuery = query?.trim().toLowerCase() ?? "";
  const searchResults = normalizedQuery
    ? movies.filter(
        (movie) =>
          movie.title.toLowerCase().includes(normalizedQuery) ||
          movie.originalTitle.toLowerCase().includes(normalizedQuery),
      )
    : [];

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
        <input
          id="movie-search"
          type="search"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="영화 제목을 검색해 보세요"
          className="min-w-0 flex-1 rounded-lg border border-[#d5d9e2] bg-white px-4 py-3 text-sm outline-none placeholder:text-[#8b909b] focus:border-[#3861e9] focus:ring-2 focus:ring-[#3861e9]/20"
        />
        <button type="submit" className="rounded-lg bg-[#3861e9] px-5 text-sm font-semibold text-white hover:bg-[#2047cd] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#153cc5]">
          검색
        </button>
      </form>

      {!normalizedQuery ? (
        <div className="mt-10 rounded-xl border border-[#e1e4e8] bg-white px-6 py-10 text-center text-[#72767e]">
          검색어를 입력해 주세요.
        </div>
      ) : (
        <section className="mt-10" aria-labelledby="search-results-title">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
            <h2 id="search-results-title" className="text-xl font-bold tracking-[-0.5px]">‘{query?.trim()}’ 검색 결과</h2>
            <p className="text-sm text-[#72767e]">영화 {searchResults.length}편</p>
          </div>
          {searchResults.length === 0 ? (
            <p className="rounded-xl border border-[#e1e4e8] bg-white px-6 py-10 text-center text-[#72767e]">
              검색 결과가 없어요.
            </p>
          ) : (
            <ul className="grid gap-4">
              {searchResults.map((movie) => (
                <li key={movie.id} className="relative">
                  <Link
                    to="/movies/$movieId"
                    params={{ movieId: String(movie.id) }}
                    className="flex gap-4 rounded-xl border border-[#e6e8ed] bg-white p-4 pb-[72px] transition-shadow hover:shadow-md focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#153cc5] sm:gap-6"
                    aria-label={`${movie.title} 상세 보기`}
                  >
                    <img className="h-[150px] w-[105px] shrink-0 rounded-md bg-[#e6e8ed] object-cover sm:h-[180px] sm:w-[130px]" src={movie.posterPath} alt={`${movie.title} 포스터`} />
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold tracking-[-0.4px] sm:text-xl">{movie.title}</h3>
                      <p className="mt-1 text-sm text-[#72767e]">{movie.originalTitle}</p>
                      <time className="mt-2 block text-xs text-[#72767e]" dateTime={movie.releaseDate.replaceAll(".", "-")}>{movie.releaseDate}</time>
                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#4b5058] sm:line-clamp-none">{movie.overview}</p>
                      <span className="mt-3 inline-block text-sm font-semibold text-[#3861e9]">상세 보기 →</span>
                    </div>
                  </Link>
                  <BookmarkButton movie={movie} className="absolute right-4 bottom-4" />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
