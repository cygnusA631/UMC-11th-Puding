import { QueryClient } from "@tanstack/react-query";
import { isHTTPError } from "ky";
import { TmdbConfigError } from "./env";

export const QUERY_STALE_TIME = 60_000;
export const QUERY_GC_TIME = 300_000;

// One shared cache survives route changes. Only TanStack Query retries requests.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIME,
      gcTime: QUERY_GC_TIME,
      retry: (failureCount, error) => {
        if (error instanceof TmdbConfigError || error instanceof RangeError) return false;
        if (isHTTPError(error) && error.response.status < 500 && error.response.status !== 429) return false;
        return failureCount < 1;
      },
    },
  },
});
