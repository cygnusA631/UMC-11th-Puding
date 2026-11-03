const defaultTmdbApiBaseUrl = "https://api.themoviedb.org/3";

export const env = {
  tmdbApiBaseUrl: (import.meta.env.VITE_TMDB_API_BASE_URL?.trim() || defaultTmdbApiBaseUrl).replace(/\/+$/, ""),
  tmdbAccessToken: import.meta.env.VITE_TMDB_ACCESS_TOKEN?.trim() || "",
};

export class TmdbConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TmdbConfigError";
  }
}

// Check only when a movie request starts, so the Spring Boot member screen still works.
export function getTmdbConfig() {
  if (!env.tmdbAccessToken) {
    throw new TmdbConfigError(
      "TMDB 토큰이 필요해요. .env.local에 VITE_TMDB_ACCESS_TOKEN을 설정하고 개발 서버를 다시 시작해 주세요.",
    );
  }

  let url: URL;
  try {
    url = new URL(env.tmdbApiBaseUrl);
  } catch {
    throw new TmdbConfigError("TMDB API 주소가 올바르지 않아요. VITE_TMDB_API_BASE_URL을 확인해 주세요.");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new TmdbConfigError("TMDB API 주소에는 http 또는 https를 사용해 주세요.");
  }

  return env;
}
