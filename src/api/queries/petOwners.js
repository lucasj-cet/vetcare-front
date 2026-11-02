import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "..";
import { petKeys } from "./pets";

export const petOwnerKeys = {
  all: ["pet-owners"],
  list: (params) => [...petOwnerKeys.all, "list", params],
  detail: (id) => [...petOwnerKeys.all, "detail", id],
};

export const usePetOwners = ({ search = "", page = 1, enabled = true } = {}) =>
  useQuery({
    enabled,
    queryKey: petOwnerKeys.list({ search, page }),
    queryFn: () => api.petOwners.list({ search, page }),
    placeholderData: keepPreviousData,
  });

export const usePetOwner = (id) =>
  useQuery({
    enabled: !!id,
    queryKey: petOwnerKeys.detail(id),
    queryFn: () => api.petOwners.get(id),
  });

export const useUpdatePetOwner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.petOwners.update(id, data),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: petOwnerKeys.all }),
        queryClient.invalidateQueries({ queryKey: petKeys.all }),
      ]),
  });
};

export const useCreatePetOwner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.petOwners.create,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: petOwnerKeys.all }),
        queryClient.invalidateQueries({ queryKey: petKeys.all }),
      ]),
  });
};
