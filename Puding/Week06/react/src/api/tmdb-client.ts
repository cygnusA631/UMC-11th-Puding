import ky from "ky";
import { env, getTmdbConfig } from "../config/env";

export const tmdbClient = ky.create({
  baseUrl: `${env.tmdbApiBaseUrl}/`,
  timeout: 10_000,
  // TanStack Query owns retry state so one failure cannot multiply retry loops.
  retry: 0,
  hooks: {
    beforeRequest: [
      ({ request }) => {
        const config = getTmdbConfig();
        request.headers.set("Authorization", `Bearer ${config.tmdbAccessToken}`);
      },
    ],
  },
});
