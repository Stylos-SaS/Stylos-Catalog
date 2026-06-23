import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { adminInitials } from "@/lib/auth-storage";
import { cn } from "@/lib/utils";

export function AdminProfileMenu() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const clearSession = useAuth((s) => s.clearSession);

  const displayName = user?.nombre ?? "Administrador";
  const username = user?.username ?? "admin";
  const initials = adminInitials(displayName);

  const logout = () => {
    clearSession();
    navigate({ to: "/admin/login" });
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-3 rounded-full bg-card border border-border px-2 py-1 pr-4 shadow-soft shrink-0",
            "hover:bg-secondary/40 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
          aria-label="Menú de perfil"
        >
          <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-brand text-xs font-bold text-primary-foreground">
            {initials}
          </div>
          <div className="hidden sm:block leading-tight text-left">
            <div className="text-xs font-semibold">{displayName}</div>
            <div className="text-[10px] text-muted-foreground">Administrador</div>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="font-semibold">{displayName}</div>
          <div className="text-xs font-normal text-muted-foreground">@{username}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/admin/perfil" className="cursor-pointer">
            <User className="h-4 w-4" />
            Mi perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
