import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "..";

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
