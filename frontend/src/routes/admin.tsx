import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { getPersistedAuthToken } from "@/lib/auth-storage";

export const Route = createFileRoute("/admin")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/admin/login") return;

    if (!getPersistedAuthToken()) {
      throw redirect({ to: "/admin/login" });
    }
  },
  head: () => ({ meta: [{ title: "Admin — Stylos Variedades" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (pathname === "/admin/login") {
    return <Outlet />;
  }

  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
