import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, MapPin, Save } from "lucide-react";

export const Route = createFileRoute("/admin/perfil")({
  head: () => ({ meta: [{ title: "Perfil — Stylos Admin" }] }),
  component: Profile,
});

function Profile() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Mi perfil</h1>
        <p className="text-sm text-muted-foreground">Actualiza tu información de administradora.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center gap-5">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-brand text-2xl font-bold text-primary-foreground shadow-pop">
            SV
          </div>
          <div>
            <div className="font-display text-xl font-bold">Sofía Valencia</div>
            <div className="text-sm text-muted-foreground">Administradora · Stylos Variedades</div>
            <button className="mt-2 text-xs font-semibold text-primary hover:underline">Cambiar foto</button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field icon={<Mail className="h-4 w-4" />} label="Email" value="sofia@stylos.co" />
          <Field icon={<Phone className="h-4 w-4" />} label="WhatsApp" value="+57 301 403 9265" />
          <Field icon={<MapPin className="h-4 w-4" />} label="Ciudad" value="Bogotá, Colombia" />
          <Field icon={<MapPin className="h-4 w-4" />} label="Dirección tienda" value="Calle 100 # 15-20" />
        </div>

        <div className="mt-6 flex justify-end">
          <button className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-pop hover:opacity-90">
            <Save className="h-4 w-4" /> Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5">
        <span className="text-muted-foreground">{icon}</span>
        <input defaultValue={value} className="w-full bg-transparent text-sm outline-none" />
      </div>
    </label>
  );
}
