import { createFileRoute } from "@tanstack/react-router";
import { SearchPage } from "../pages/movies/search-page";

export const Route = createFileRoute("/search")({
  validateSearch: (search): { query?: string; page?: number } => {
    const page = Number(search.page ?? 1);
    return {
      query: typeof search.query === "string" ? search.query : undefined,
      page: Number.isInteger(page) && page > 1 && page <= 500 ? page : undefined,
    };
  },
  component: SearchPage,
});
