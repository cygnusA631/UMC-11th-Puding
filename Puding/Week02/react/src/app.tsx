import { useState } from "react";
import { Header } from "./components/header";
import { MovieGrid } from "./components/movie-grid";
import { Pagination } from "./components/pagination";
import { movies } from "./data/movies";
import type { Movie } from "./types/movie";

export default function App() {
  const [movieList, setMovieList] = useState<Movie[]>(movies);
  const [currentPage, setCurrentPage] = useState(1);

  function handleToggleBookmark(movieId: Movie["id"]) {
    setMovieList((previousMovies) =>
      previousMovies.map((movie) =>
        movie.id === movieId
          ? { ...movie, isBookmarked: !movie.isBookmarked }
          : movie,
      ),
    );
  }

  return (
    <>
      <Header />
      <main id="movies" className="main-content">
        <h1>영화 목록</h1>
        <MovieGrid movies={movieList} onToggleBookmark={handleToggleBookmark} />
        <Pagination
          currentPage={currentPage}
          totalPages={5}
          onPageChange={setCurrentPage}
        />
      </main>
      <footer className="site-footer">
        <div className="footer-inner">
          <img className="tmdb-logo" src="/images/logos/tmdb-logo.svg" alt="TMDB" />
          <p>
            This product uses the TMDB API but is not endorsed or certified by
            TMDB.
          </p>
        </div>
      </footer>
    </>
  );
}
