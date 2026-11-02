import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "..";

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
