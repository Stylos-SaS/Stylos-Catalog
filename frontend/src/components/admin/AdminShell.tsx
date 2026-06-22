import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { Toaster } from "sonner";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  User,
  LogOut,
  Search,
  Bell,
  ChevronRight,
  Heart,
  Menu,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import logo from "@/assets/stylos-logo.jpeg";
import { cn } from "@/lib/utils";
import { adminInitials } from "@/lib/auth-storage";
import { useAuth } from "@/lib/auth";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";


const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/productos", label: "Productos", icon: Package },
  { to: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
  { to: "/admin/perfil", label: "Perfil", icon: User },
];

export function AdminShell({ children, breadcrumbs }: { children?: ReactNode; breadcrumbs?: { label: string; to?: string }[] }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const clearSession = useAuth((s) => s.clearSession);
  const displayName = user?.nombre ?? "Administrador";
  const initials = adminInitials(displayName);

  const logout = () => {
    clearSession();
    navigate({ to: "/admin/login" });
  };

  return (
    <div className="min-h-screen flex bg-blush/40">
      <Toaster position="top-right" theme="light" />
      {/* Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-sidebar transition-all duration-200",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        <div className="flex items-center gap-2 px-4 py-5 border-b border-border">
          <img src={logo} alt="" className="h-9 w-9 rounded-full shrink-0 shadow-soft" />
          {!collapsed && (
            <div className="leading-tight min-w-0">
              <div className="font-display font-semibold text-sm truncate">Stylos Admin</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground truncate">
                Panel de gestión
              </div>
            </div>
          )}
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((n) => {
            const active = n.exact ? path === n.to : path.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-foreground/70 hover:bg-sidebar-accent",
                )}
              >
                <n.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{n.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border space-y-2">
          {!collapsed && (
            <div className="rounded-2xl bg-gradient-soft p-3">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary fill-current" />
                <span className="text-xs font-semibold">Tip Stylos</span>
              </div>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                Mantén actualizadas las fotos para vender más rápido.
              </p>
            </div>
          )}
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="w-full text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            {collapsed ? "Expandir" : "Colapsar"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  className="md:hidden grid h-10 w-10 place-items-center rounded-full bg-secondary hover:bg-accent shrink-0"
                  aria-label="Abrir menú"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0 bg-sidebar border-r border-border">
                <SheetTitle className="sr-only">Menú de administración</SheetTitle>
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between gap-2 px-4 py-5 border-b border-border">
                    <div className="flex items-center gap-2 min-w-0">
                      <img src={logo} alt="" className="h-9 w-9 rounded-full shrink-0 shadow-soft" />
                      <div className="leading-tight min-w-0">
                        <div className="font-display font-semibold text-sm truncate">Stylos Admin</div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground truncate">
                          Panel de gestión
                        </div>
                      </div>
                    </div>
                    <SheetClose asChild>
                      <button className="grid h-8 w-8 place-items-center rounded-full hover:bg-sidebar-accent shrink-0" aria-label="Cerrar menú">
                        <X className="h-4 w-4" />
                      </button>
                    </SheetClose>
                  </div>
                  <nav className="flex-1 p-3 space-y-1">
                    {nav.map((n) => {
                      const active = n.exact ? path === n.to : path.startsWith(n.to);
                      return (
                        <SheetClose asChild key={n.to}>
                          <Link
                            to={n.to}
                            className={cn(
                              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                              active
                                ? "bg-primary text-primary-foreground shadow-soft"
                                : "text-foreground/70 hover:bg-sidebar-accent",
                            )}
                          >
                            <n.icon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{n.label}</span>
                          </Link>
                        </SheetClose>
                      );
                    })}
                  </nav>
                  <div className="p-3 border-t border-border space-y-2">
                    <div className="rounded-2xl bg-gradient-soft p-3">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-primary fill-current" />
                        <span className="text-xs font-semibold">Tip Stylos</span>
                      </div>
                      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                        Mantén actualizadas las fotos para vender más rápido.
                      </p>
                    </div>
                    <button
                      onClick={logout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-sidebar-accent"
                    >
                      <LogOut className="h-4 w-4 shrink-0" />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex flex-1 max-w-md items-center gap-2 rounded-full border border-border bg-secondary/40 px-4 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input placeholder="Buscar productos, pedidos..." className="w-full bg-transparent text-sm outline-none" />
            </div>
            <button className="relative grid h-10 w-10 place-items-center rounded-full bg-secondary hover:bg-accent shrink-0">
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-primary" />
            </button>
            <div className="hidden sm:flex items-center gap-3 rounded-full bg-card border border-border px-2 py-1 pr-4 shadow-soft shrink-0">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-brand text-xs font-bold text-primary-foreground">
                {initials}
              </div>
              <div className="leading-tight">
                <div className="text-xs font-semibold">{displayName}</div>
                <div className="text-[10px] text-muted-foreground">Administrador</div>
              </div>
            </div>
          </div>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="flex items-center gap-1 px-4 sm:px-6 pb-3 text-xs text-muted-foreground">
              <Link to="/admin" className="hover:text-foreground">Admin</Link>
              {breadcrumbs.map((b, i) => (
                <span key={i} className="flex items-center gap-1">
                  <ChevronRight className="h-3 w-3" />
                  {b.to ? (
                    <Link to={b.to} className="hover:text-foreground">{b.label}</Link>
                  ) : (
                    <span className="text-foreground">{b.label}</span>
                  )}
                </span>
              ))}
            </div>
          )}
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children ?? <Outlet />}</main>
      </div>
    </div>
  );
}
