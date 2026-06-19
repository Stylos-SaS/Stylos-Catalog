import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search, Pencil, Trash2, Eye, X, UploadCloud, Image as ImageIcon } from "lucide-react";
import { products, categories } from "@/lib/data";
import { formatCOP, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/productos")({
  head: () => ({ meta: [{ title: "Productos — Stylos Admin" }] }),
  component: ProductsAdmin,
});

function ProductsAdmin() {
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(false);
  const filtered = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Productos</h1>
          <p className="text-sm text-muted-foreground">Gestiona tu inventario y precios.</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-pop hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Agregar Producto
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="flex flex-1 max-w-sm items-center gap-2 rounded-full border border-border bg-secondary/40 px-4 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar producto..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          <select className="rounded-full border border-border bg-background px-3 py-1.5 text-sm">
            <option>Todas las categorías</option>
            {categories.map((c) => <option key={c.slug}>{c.name}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Producto</th>
                <th className="px-5 py-3">Categoría</th>
                <th className="px-5 py-3 text-right">Detal</th>
                <th className="px-5 py-3 text-right">Mayor</th>
                <th className="px-5 py-3 hidden md:table-cell">Creado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-secondary/20">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.images[0]} alt="" className="h-12 w-12 rounded-xl object-cover" />
                      <div>
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-xs text-muted-foreground">ID {p.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 capitalize">{p.category}</td>
                  <td className="px-5 py-3 text-right font-semibold text-primary">{formatCOP(p.priceRetail)}</td>
                  <td className="px-5 py-3 text-right font-semibold">{formatCOP(p.priceWholesale)}</td>
                  <td className="px-5 py-3 hidden md:table-cell text-muted-foreground">{formatDate(p.createdAt)}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <IconBtn icon={Eye} label="Ver" />
                      <IconBtn icon={Pencil} label="Editar" onClick={() => setModal(true)} />
                      <IconBtn icon={Trash2} label="Eliminar" danger />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && <ProductModal onClose={() => setModal(false)} />}
    </div>
  );
}

function IconBtn({
  icon: Icon,
  label,
  danger,
  onClick,
}: {
  icon: typeof Eye;
  label: string;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-full transition",
        danger ? "text-muted-foreground hover:bg-destructive/10 hover:text-destructive" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function ProductModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-2xl rounded-3xl bg-background shadow-pop overflow-hidden animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="font-display text-xl font-bold">Agregar producto</h2>
            <p className="text-xs text-muted-foreground">Completa la información del nuevo producto.</p>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-6 space-y-5">
          <Field label="Nombre del producto">
            <input className="input" placeholder="Ej: Set de velas aromáticas" />
          </Field>
          <Field label="Descripción">
            <textarea rows={3} className="input resize-none" placeholder="Describe tu producto..." />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Precio al detal">
              <input className="input" placeholder="$ 0" />
            </Field>
            <Field label="Precio al por mayor">
              <input className="input" placeholder="$ 0" />
            </Field>
          </div>
          <Field label="Categoría">
            <select className="input">
              {categories.map((c) => <option key={c.slug}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Imagen principal">
            <div className="rounded-2xl border-2 border-dashed border-border bg-secondary/30 p-8 text-center hover:border-primary/50 transition">
              <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground" />
              <div className="mt-2 text-sm font-medium">Arrastra y suelta una imagen</div>
              <div className="text-xs text-muted-foreground">PNG, JPG hasta 5 MB</div>
            </div>
          </Field>
          <Field label="Imágenes secundarias">
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="aspect-square rounded-xl border border-dashed border-border bg-secondary/30 grid place-items-center text-muted-foreground">
                  <ImageIcon className="h-5 w-5" />
                </div>
              ))}
            </div>
          </Field>
        </div>
        <div className="flex justify-end gap-2 border-t border-border bg-secondary/30 p-5">
          <button onClick={onClose} className="rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-secondary">
            Cancelar
          </button>
          <button className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-pop hover:opacity-90">
            Guardar producto
          </button>
        </div>
      </div>
      <style>{`.input{width:100%;border-radius:0.75rem;border:1px solid var(--border);background:var(--card);padding:0.625rem 0.875rem;font-size:0.875rem;outline:none;transition:box-shadow .15s;}.input:focus{box-shadow:0 0 0 4px oklch(0.78 0.18 5 / 0.15);border-color:var(--primary)}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
