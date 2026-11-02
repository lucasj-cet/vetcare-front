import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { dispatchApiError } from "./errorHandler";
import { ApiError } from "./errors";

const isClientError = (error) =>
  error instanceof ApiError && error.status >= 400 && error.status < 500;

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: dispatchApiError }),
  mutationCache: new MutationCache({ onError: dispatchApiError }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => !isClientError(error) && failureCount < 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});
