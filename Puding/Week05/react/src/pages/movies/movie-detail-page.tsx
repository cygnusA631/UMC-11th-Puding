import { Link, useParams } from "@tanstack/react-router";
import { movies } from "../../data/movies";
import { BookmarkButton } from "../../components/movies/bookmark-button";

export function MovieDetailPage() {
  const { movieId } = useParams({ from: "/movies/$movieId" });
  const movie = movies.find((item) => item.id === Number(movieId));

  if (!movie) {
    return (
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-5 py-12 min-[768px]:px-10 min-[1200px]:px-20">
        <h1 className="text-2xl font-bold">영화를 찾을 수 없어요.</h1>
        <Link to="/" className="mt-6 inline-block text-[#3861e9] underline underline-offset-4">영화 목록으로 돌아가기</Link>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <section className="relative isolate overflow-hidden bg-[#20232c] text-white">
        <img className="absolute inset-0 -z-20 h-full w-full object-cover object-center" src={movie.backdropPath} alt="" aria-hidden="true" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#101218]/95 via-[#101218]/80 to-[#101218]/45" />
        <div className="mx-auto w-full max-w-[1440px] px-5 py-8 min-[768px]:px-10 min-[1200px]:px-20 sm:py-14">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/90 hover:underline focus-visible:rounded focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-white">
            <span aria-hidden="true">←</span> 영화 목록
          </Link>
          <div className="mt-8 grid items-center gap-8 sm:grid-cols-[minmax(180px,260px)_1fr] lg:gap-12">
            <img className="w-[180px] rounded-xl bg-[#2f323b] shadow-2xl sm:w-full" src={movie.posterPath} alt={`${movie.title} 포스터`} />
            <div>
              <h1 className="text-3xl leading-tight font-extrabold tracking-[-1px] sm:text-4xl lg:text-5xl">{movie.title}</h1>
              <p className="mt-2 text-base text-white/70 sm:text-lg">{movie.originalTitle}</p>
              <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-white/85">
                <time dateTime={movie.releaseDate.replaceAll(".", "-")}>{movie.releaseDate}</time>
                <span aria-hidden="true">·</span>
                <span>{movie.genres.join(" · ")}</span>
                <span aria-hidden="true">·</span>
                <span>{movie.runtime}</span>
              </div>
              <p className="mt-8 text-xl leading-snug font-semibold tracking-[-0.4px] sm:text-2xl">{movie.tagline}</p>
              <p className="mt-4 max-w-[650px] text-sm leading-7 text-white/85 sm:text-base">{movie.overview}</p>
              <BookmarkButton movie={movie} variant="detail" className="mt-6" />
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto w-full max-w-[1440px] px-5 py-10 min-[768px]:px-10 min-[1200px]:px-20 sm:py-12" aria-labelledby="story-title">
        <h2 id="story-title" className="text-2xl font-bold tracking-[-0.5px]">줄거리</h2>
        <p className="mt-4 max-w-[850px] text-base leading-8 text-[#4b5058]">{movie.overview}</p>
      </section>
    </main>
  );
}
