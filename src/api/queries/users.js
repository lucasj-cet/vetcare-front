import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "..";
import { tokenStore } from "../http";
import { authKeys } from "./auth";

export const userKeys = {
  all: ["users"],
  list: (params) => [...userKeys.all, "list", params],
};

export const useUsers = ({ search = "", page = 1 } = {}) =>
  useQuery({
    queryKey: userKeys.list({ search, page }),
    queryFn: () => api.users.list({ search, page }),
    placeholderData: keepPreviousData,
  });

export const useInviteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.users.invite,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.users.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
};

export const useDeactivateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.users.deactivate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
};

// Accepting an invite signs the person in: the response carries a session token.
export const useAcceptInvite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ token, password }) => {
      const { token: sessionToken } = await api.users.acceptInvite(token, {
        password,
      });
      tokenStore.set(sessionToken);
      // drop whatever a previous session left behind, keeping the auth query
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== "auth" });
      const user = await api.auth.me();
      queryClient.setQueryData(authKeys.me, user);
      return user;
    },
  });
};
