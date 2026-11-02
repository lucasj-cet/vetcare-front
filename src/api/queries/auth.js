import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "..";
import { ApiError } from "../errors";
import { tokenStore } from "../http";
import { STATUS } from "../statusCodes";

export const authKeys = { me: ["auth", "me"] };

async function fetchMe() {
  try {
    return await api.auth.me();
  } catch (e) {
    if (e instanceof ApiError && e.status === STATUS.UNAUTHORIZED) {
      tokenStore.set(null);
      return null;
    }
    throw e;
  }
}

export const useMe = () =>
  useQuery({
    queryKey: authKeys.me,
    queryFn: fetchMe,
    enabled: !!tokenStore.get(),
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { silent: true },
    mutationFn: api.auth.login,
    onSuccess: ({ token, user }) => {
      tokenStore.set(token);
      queryClient.setQueryData(authKeys.me, user);
    },
  });
};
