import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "..";
import { petOwnerKeys } from "./petOwners";

export const petKeys = {
  all: ["pets"],
  list: (params) => [...petKeys.all, "list", params],
  detail: (id) => [...petKeys.all, "detail", id],
};

export const usePets = ({ search = "", page = 1, enabled = true } = {}) =>
  useQuery({
    enabled,
    queryKey: petKeys.list({ search, page }),
    queryFn: () => api.pets.list({ search, page }),
    placeholderData: keepPreviousData,
  });

export const usePet = (id) =>
  useQuery({
    enabled: !!id,
    queryKey: petKeys.detail(id),
    queryFn: () => api.pets.get(id),
  });

const useInvalidatePets = () => {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: petOwnerKeys.all }),
      queryClient.invalidateQueries({ queryKey: petKeys.all }),
    ]);
};

// `options.onSuccess` runs after the caches are invalidated
const usePetMutation = (mutationFn, { onSuccess, ...options } = {}) => {
  const invalidate = useInvalidatePets();
  return useMutation({
    ...options,
    mutationFn,
    onSuccess: async (...args) => {
      await invalidate();
      return onSuccess?.(...args);
    },
  });
};

export const useCreatePet = (options) =>
  usePetMutation(api.pets.create, options);

export const useUpdatePet = (options) =>
  usePetMutation(({ id, ...data }) => api.pets.update(id, data), options);
