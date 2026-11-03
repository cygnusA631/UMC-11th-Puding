import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { getMoviesWithFetch } from "../api/movies/get-movies-with-fetch";
import type { TmdbMovieListResponse } from "../api/movies/models";

export function ApiPracticePage() {
  const [result, setResult] = useState<TmdbMovieListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadWithFetch() {
    setIsLoading(true);
    setResult(null);
    setErrorMessage(null);
    try { setResult(await getMoviesWithFetch(1)); }
    catch (error) { setErrorMessage(error instanceof Error ? error.message : "영화 요청에 실패했어요."); }
    finally { setIsLoading(false); }
  }

  return (
    <main className="mx-auto w-full max-w-[1200px] flex-1 px-5 py-10 sm:px-10">
      <Link to="/" className="text-sm text-[#3861e9] underline">영화 목록으로</Link>
      <h1 className="mt-6 text-3xl font-bold">fetch로 인기 영화 요청하기</h1>
      <p className="mt-3 text-sm leading-7 text-[#647084]">버튼을 누르면 순수 fetch 함수로 요청합니다. 개발자 도구 Network에서 요청 주소와 응답을 확인할 수 있어요. 인증 헤더의 토큰 값은 캡처에 포함하지 마세요.</p>
      <button onClick={() => void loadWithFetch()} disabled={isLoading} className="mt-6 rounded-lg bg-[#3861e9] px-5 py-3 font-semibold text-white disabled:opacity-60">{isLoading ? "불러오는 중…" : "인기 영화 불러오기 (fetch)"}</button>
      {errorMessage && <p role="alert" className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">{errorMessage}</p>}
      {result && <section className="mt-6"><h2 className="text-xl font-bold">응답: {result.results.length}편</h2><pre className="mt-4 max-h-[600px] overflow-auto rounded-xl bg-[#172239] p-5 text-sm text-white">{JSON.stringify(result, null, 2)}</pre></section>}
    </main>
  );
}
