import { createFileRoute } from "@tanstack/react-router";
import { Mail, Save } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { adminInitials } from "@/lib/auth-storage";

export const Route = createFileRoute("/admin/perfil")({
  head: () => ({ meta: [{ title: "Perfil — Stylos Admin" }] }),
  component: Profile,
});

function Profile() {
  const user = useAuth((s) => s.user);
  const displayName = user?.nombre ?? "Administrador";
  const username = user?.username ?? "admin";

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Mi perfil</h1>
        <p className="text-sm text-muted-foreground">Información de tu cuenta de administrador.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center gap-5">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-brand text-2xl font-bold text-primary-foreground shadow-pop">
            {adminInitials(displayName)}
          </div>
          <div>
            <div className="font-display text-xl font-bold">{displayName}</div>
            <div className="text-sm text-muted-foreground">Administrador · Stylos Variedades</div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field icon={<Mail className="h-4 w-4" />} label="Usuario" value={username} />
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 rounded-full bg-primary/40 px-5 py-2.5 text-sm font-semibold text-primary-foreground cursor-not-allowed"
          >
            <Save className="h-4 w-4" /> Edición de perfil próximamente
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/60 px-4 py-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}
