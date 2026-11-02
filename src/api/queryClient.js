import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { dispatchApiError } from "./errorHandler";
import { ApiError } from "./errors";
import { STATUS } from "./statusCodes";

const isClientError = (error) =>
  error instanceof ApiError && error.status >= 400 && error.status < 500;

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: dispatchApiError }),
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) => {
      dispatchApiError(error);
      if (mutation.meta?.silent) {
        return;
      }

      if (error instanceof ApiError && error.status === STATUS.UNAUTHORIZED) {
        return;
      }

      notifications.show({
        message:
          error?.data?.message ??
          "Não foi possível concluir a ação. Tente de novo.",
        color: "red",
        withBorder: true,
      });
    },
  }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => !isClientError(error) && failureCount < 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});
