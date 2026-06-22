import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search, Pencil, Trash2, Eye, EyeOff, FileText, Loader2, AlertCircle, PackageOpen } from "lucide-react";
import { formatCOP, formatDate } from "@/lib/format";
import { productPrimaryImage } from "@/lib/product-image";
import type { AdminProduct, Product } from "@/lib/types";
import {
  useAdminCategories,
  useAdminProducts,
  useDeleteAdminProduct,
  useSaveAdminProduct,
  useToggleAdminProductActive,
} from "@/lib/admin-queries";
import { fetchAdminProduct } from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { ProductFormModal, ProductViewModal } from "@/components/admin/ProductFormModal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/productos")({
  head: () => ({ meta: [{ title: "Productos — Stylos Admin" }] }),
  component: ProductsAdmin,
});

function ProductsAdmin() {
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | undefined>();
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const { data: categories = [] } = useAdminCategories();
  const { data, isLoading, error } = useAdminProducts({ q, category: categoryFilter || undefined });
  const saveProduct = useSaveAdminProduct();
  const deleteProduct = useDeleteAdminProduct();
  const toggleActive = useToggleAdminProductActive();

  const products = data?.items ?? [];

  const openCreate = () => {
    setEditingProduct(undefined);
    setFormMode("create");
  };

  const openEdit = async (product: Product) => {
    setLoadingEdit(true);
    try {
      const full = await fetchAdminProduct(product.id);
      setEditingProduct(full);
      setFormMode("edit");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo cargar el producto");
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`¿Eliminar "${product.name}" del catálogo?`)) return;

    try {
      await deleteProduct.mutateAsync(product.id);
      toast.success("Producto eliminado");
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 409
          ? "No se puede eliminar porque tiene pedidos. Puedes desactivarlo para ocultarlo del catálogo."
          : err instanceof Error
            ? err.message
            : "No se pudo eliminar el producto";
      toast.error(message);
    }
  };

  const handleToggleActive = async (product: Product) => {
    const next = !product.active;
    try {
      await toggleActive.mutateAsync({ id: product.id, active: next });
      toast.success(next ? "Producto activado" : "Producto desactivado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo cambiar el estado");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Productos</h1>
          <p className="text-sm text-muted-foreground">Gestiona tu inventario y precios.</p>
        </div>
        <button
          onClick={openCreate}
          disabled={categories.length === 0}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-pop hover:opacity-90 disabled:opacity-60"
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
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-full border border-border bg-background px-3 py-1.5 text-sm"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 p-16 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-16 text-center">
            <PackageOpen className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No hay productos que coincidan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Producto</th>
                  <th className="px-5 py-3">Categoría</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3 text-right">Detal</th>
                  <th className="px-5 py-3 text-right">Mayor</th>
                  <th className="px-5 py-3 hidden md:table-cell">Creado</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className={cn(
                      "border-t border-border hover:bg-secondary/20",
                      !p.active && "opacity-60",
                    )}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={productPrimaryImage(p.images)}
                          alt=""
                          className="h-12 w-12 rounded-xl object-cover"
                        />
                        <div>
                          <div className="font-semibold">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.codigo}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">{p.category}</td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          p.active
                            ? "bg-emerald-500/15 text-emerald-700"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {p.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-primary">
                      {formatCOP(p.priceRetail)}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold">{formatCOP(p.priceWholesale)}</td>
                    <td className="px-5 py-3 hidden md:table-cell text-muted-foreground">
                      {formatDate(p.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <IconBtn icon={FileText} label="Ver" onClick={() => setViewProduct(p)} />
                        <IconBtn
                          icon={p.active ? EyeOff : Eye}
                          label={p.active ? "Desactivar" : "Activar"}
                          onClick={() => void handleToggleActive(p)}
                          disabled={toggleActive.isPending}
                        />
                        <IconBtn
                          icon={Pencil}
                          label="Editar"
                          onClick={() => void openEdit(p)}
                          disabled={loadingEdit}
                        />
                        <IconBtn
                          icon={Trash2}
                          label="Eliminar"
                          danger
                          onClick={() => void handleDelete(p)}
                          disabled={deleteProduct.isPending}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {formMode && (
        <ProductFormModal
          mode={formMode}
          product={editingProduct}
          categories={categories}
          saving={saveProduct.isPending}
          onClose={() => setFormMode(null)}
          onSave={async (payload) => {
            await saveProduct.mutateAsync({
              id: formMode === "edit" ? editingProduct?.id : undefined,
              payload,
            });
            toast.success(formMode === "edit" ? "Producto actualizado" : "Producto creado");
          }}
        />
      )}

      {viewProduct && <ProductViewModal product={viewProduct} onClose={() => setViewProduct(null)} />}
    </div>
  );
}

function IconBtn({
  icon: Icon,
  label,
  danger,
  onClick,
  disabled,
}: {
  icon: typeof Eye;
  label: string;
  danger?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-full transition disabled:opacity-40",
        danger
          ? "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
