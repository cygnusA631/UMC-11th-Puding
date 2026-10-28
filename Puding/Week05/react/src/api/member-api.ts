import { useState } from "react";

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080").replace(/\/+$/, "");

export interface AvailabilityResponse {
  available: boolean;
}

export interface RatingResponse {
  ratingId: number;
  movieId: number;
  score: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResult<T> {
  url: string;
  status: number | null;
  ok: boolean;
  data?: T;
  body: unknown;
  error?: string;
}

export function useApiRequest<T>() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult<T> | null>(null);

  async function request(path: string) {
    const url = `${API_BASE_URL}${path}`;
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch(url);
      const text = await response.text();
      let body: unknown = text;
      try {
        body = JSON.parse(text);
      } catch {
        // Preserve non-JSON error responses for the request details.
      }
      setResult({
        url,
        status: response.status,
        ok: response.ok,
        data: response.ok ? body as T : undefined,
        body,
        error: response.ok ? undefined : `요청에 실패했어요. (HTTP ${response.status})`,
      });
    } catch (error) {
      console.error("API 요청 실패", url, error);
      setResult({
        url,
        status: null,
        ok: false,
        body: null,
        error: "서버 연결을 확인해 주세요. 브라우저 콘솔에서 오류의 자세한 내용을 확인할 수 있어요.",
      });
    } finally {
      setLoading(false);
    }
  }

  return { loading, result, request };
}
