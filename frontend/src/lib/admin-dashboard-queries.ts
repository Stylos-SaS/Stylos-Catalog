import { useQuery } from "@tanstack/react-query";
import { fetchAdminDashboard } from "./admin-api";

export const adminDashboardKeys = {
  all: ["admin", "dashboard"] as const,
};

export function adminDashboardQueryOptions() {
  return {
    queryKey: adminDashboardKeys.all,
    queryFn: fetchAdminDashboard,
  };
}

export function useAdminDashboard() {
  return useQuery(adminDashboardQueryOptions());
}
