import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "..";

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
