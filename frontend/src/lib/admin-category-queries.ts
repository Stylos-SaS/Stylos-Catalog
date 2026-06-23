import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAdminCategory,
  deleteAdminCategory,
  fetchAdminCategories,
  updateAdminCategory,
} from "./admin-api";
import { categoryKeys } from "./queries";
import type { Category } from "./types";

export const adminCategoryKeys = {
  all: ["admin", "categories"] as const,
};

export function adminCategoriesQueryOptions() {
  return queryOptions({
    queryKey: adminCategoryKeys.all,
    queryFn: fetchAdminCategories,
  });
}

export function useAdminCategoriesList() {
  return useQuery(adminCategoriesQueryOptions());
}

export function useAdminCategoriesAsOptions() {
  return useQuery({
    ...adminCategoriesQueryOptions(),
    select: (data): Category[] => data.map(({ id, name }) => ({ id, name })),
  });
}

export function useCreateAdminCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { name: string; emoji?: string }) => createAdminCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCategoryKeys.all });
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useUpdateAdminCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name, emoji }: { id: string; name?: string; emoji?: string }) =>
      updateAdminCategory(id, { name, emoji }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCategoryKeys.all });
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteAdminCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAdminCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCategoryKeys.all });
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}
