import { QueryClient } from "@tanstack/react-query";

import { ApiRequestError } from "./api-client";

function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false;
  if (error instanceof ApiRequestError) {
    if (error.status === 401 || error.status === 403) return false;
    if (error.status >= 400 && error.status < 500) return false;
  }
  return true;
}

export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        retry: shouldRetryQuery,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
