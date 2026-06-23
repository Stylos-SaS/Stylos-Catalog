import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminDashboardKeys } from "./admin-dashboard-queries";
import { useAdminCategoriesAsOptions } from "./admin-category-queries";
import {
  createAdminProduct,
  deleteAdminProduct,
  fetchAdminProducts,
  updateAdminProduct,
  type UpsertAdminProductPayload,
} from "./admin-api";

export const adminProductKeys = {
  all: ["admin", "products"] as const,
  list: (params: { q?: string; category?: string }) =>
    [...adminProductKeys.all, "list", params] as const,
};

export function adminProductsQueryOptions(params: { q?: string; category?: string } = {}) {
  return {
    queryKey: adminProductKeys.list(params),
    queryFn: () => fetchAdminProducts({ ...params, limit: 100, page: 1 }),
  };
}

export function useAdminProducts(params: { q?: string; category?: string } = {}) {
  return useQuery(adminProductsQueryOptions(params));
}

export function useAdminCategories() {
  return useAdminCategoriesAsOptions();
}

export function useSaveAdminProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id?: string;
      payload: UpsertAdminProductPayload;
    }) => (id ? updateAdminProduct(id, payload) : createAdminProduct(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminProductKeys.all });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: adminDashboardKeys.all });
    },
  });
}

export function useDeleteAdminProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAdminProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminProductKeys.all });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: adminDashboardKeys.all });
    },
  });
}

export function useToggleAdminProductActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      updateAdminProduct(id, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminProductKeys.all });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: adminDashboardKeys.all });
    },
  });
}
