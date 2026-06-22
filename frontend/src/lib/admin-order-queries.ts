import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAdminOrder,
  fetchAdminOrders,
  updateAdminOrder,
  updateAdminOrderStatus,
  type UpdateAdminOrderLinePayload,
} from "./admin-api";
import type { OrderStatus } from "./types";
import { adminDashboardKeys } from "./admin-dashboard-queries";

export const adminOrderKeys = {
  all: ["admin", "orders"] as const,
  list: (params: { q?: string; status?: OrderStatus }) =>
    [...adminOrderKeys.all, "list", params] as const,
  detail: (id: string) => [...adminOrderKeys.all, "detail", id] as const,
};

export function adminOrdersQueryOptions(params: { q?: string; status?: OrderStatus } = {}) {
  return {
    queryKey: adminOrderKeys.list(params),
    queryFn: () => fetchAdminOrders({ ...params, limit: 100, page: 1 }),
  };
}

export function adminOrderQueryOptions(id: string) {
  return {
    queryKey: adminOrderKeys.detail(id),
    queryFn: () => fetchAdminOrder(id),
  };
}

export function useAdminOrders(params: { q?: string; status?: OrderStatus } = {}) {
  return useQuery(adminOrdersQueryOptions(params));
}

export function useAdminOrder(id: string) {
  return useQuery({
    ...adminOrderQueryOptions(id),
    enabled: Boolean(id),
  });
}

export function useUpdateAdminOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      items,
    }: {
      id: string;
      items: UpdateAdminOrderLinePayload[];
    }) => updateAdminOrder(id, items),
    onSuccess: (order) => {
      queryClient.setQueryData(adminOrderKeys.detail(order.id), order);
      queryClient.invalidateQueries({ queryKey: adminOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: adminDashboardKeys.all });
    },
  });
}

export function useUpdateAdminOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: Exclude<OrderStatus, "pendiente">;
    }) => updateAdminOrderStatus(id, status),
    onSuccess: (order) => {
      queryClient.setQueryData(adminOrderKeys.detail(order.id), order);
      queryClient.invalidateQueries({ queryKey: adminOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: adminDashboardKeys.all });
    },
  });
}
