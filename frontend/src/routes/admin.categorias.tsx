import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertCircle, Loader2, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { AdminCategory } from "@/lib/types";
import {
  useAdminCategoriesList,
  useCreateAdminCategory,
  useDeleteAdminCategory,
  useUpdateAdminCategory,
} from "@/lib/admin-category-queries";
import { DEFAULT_CATEGORY_NAME } from "@/lib/default-category";
import { DEFAULT_CATEGORY_EMOJI, resolveCategoryEmoji } from "@/lib/category-emojis";
import { ApiError } from "@/lib/api";
import { CategoryEmojiPicker } from "@/components/admin/CategoryEmojiPicker";
import { SortableTableHead } from "@/components/admin/SortableTableHead";
import { useSortedItems, type SortAccessors } from "@/lib/use-table-sort";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/categorias")({
  head: () => ({ meta: [{ title: "Categorías — Stylos Admin" }] }),
  component: CategoriesAdmin,
});

const categorySortAccessors: SortAccessors<AdminCategory> = {
  name: { getValue: (c) => c.name, type: "string" },
  productCount: { getValue: (c) => c.productCount, type: "number" },
};

function CategoriesAdmin() {
  const { data: categories = [], isLoading, error } = useAdminCategoriesList();
  const createCategory = useCreateAdminCategory();
  const updateCategory = useUpdateAdminCategory();
  const deleteCategory = useDeleteAdminCategory();

  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(DEFAULT_CATEGORY_EMOJI);

  const { sort, toggleSort, sortedItems: sortedCategories } = useSortedItems(
    categories,
    categorySortAccessors,
    "name",
    "asc",
  );

  const openCreate = () => {
    setEditingCategory(null);
    setName("");
    setEmoji(DEFAULT_CATEGORY_EMOJI);
    setFormMode("create");
  };

  const openEdit = (category: AdminCategory) => {
    setEditingCategory(category);
    setName(category.name);
    setEmoji(resolveCategoryEmoji(category));
    setFormMode("edit");
  };

  const closeForm = () => {
    setFormMode(null);
    setEditingCategory(null);
    setName("");
    setEmoji(DEFAULT_CATEGORY_EMOJI);
  };

  const editingIsDefault =
    editingCategory?.isDefault || editingCategory?.name === DEFAULT_CATEGORY_NAME;

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      if (formMode === "create") {
        const trimmed = name.trim();
        if (!trimmed) return;
        await createCategory.mutateAsync({ name: trimmed, emoji });
        toast.success("Categoría creada");
      } else if (formMode === "edit" && editingCategory) {
        if (editingIsDefault) {
          await updateCategory.mutateAsync({ id: editingCategory.id, emoji });
        } else {
          const trimmed = name.trim();
          if (!trimmed) return;
          await updateCategory.mutateAsync({ id: editingCategory.id, name: trimmed, emoji });
        }
        toast.success("Categoría actualizada");
      }
      closeForm();
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 409
          ? "Ya existe una categoría con ese nombre."
          : err instanceof Error
            ? err.message
            : "No se pudo guardar la categoría";
      toast.error(message);
    }
  };

  const handleDelete = async (category: AdminCategory) => {
    if (category.isDefault || category.name === DEFAULT_CATEGORY_NAME) return;
    if (!window.confirm(`¿Eliminar la categoría "${category.name}"?`)) return;

    try {
      await deleteCategory.mutateAsync(category.id);
      toast.success("Categoría eliminada");
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 409
          ? category.productCount > 0
            ? "No se puede eliminar: tiene productos asignados. Reasígnalos o elimínalos primero."
            : "No se puede eliminar la categoría por defecto."
          : err instanceof Error
            ? err.message
            : "No se pudo eliminar la categoría";
      toast.error(message);
    }
  };

  const saving = createCategory.isPending || updateCategory.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Categorías</h1>
          <p className="text-sm text-muted-foreground">
            Organiza el catálogo con categorías para tus productos.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-pop hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Nueva categoría
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 p-16 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-16 text-center">
            <Tags className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No hay categorías configuradas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 w-14">Emoji</th>
                  <SortableTableHead
                    label="Nombre"
                    sortKey="name"
                    activeKey={sort.key}
                    direction={sort.direction}
                    onSort={toggleSort}
                  />
                  <SortableTableHead
                    label="Productos"
                    sortKey="productCount"
                    activeKey={sort.key}
                    direction={sort.direction}
                    onSort={toggleSort}
                    align="right"
                    className="text-right"
                  />
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedCategories.map((category) => {
                  const isDefault =
                    category.isDefault || category.name === DEFAULT_CATEGORY_NAME;

                  return (
                    <tr key={category.id} className="border-t border-border hover:bg-secondary/20">
                      <td className="px-5 py-3 text-2xl leading-none">
                        {resolveCategoryEmoji(category)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{category.name}</span>
                          {isDefault && (
                            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Por defecto
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">{category.productCount}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <IconBtn
                            icon={Pencil}
                            label={isDefault ? "Editar emoji" : "Editar"}
                            onClick={() => openEdit(category)}
                          />
                          {!isDefault && (
                            <IconBtn
                              icon={Trash2}
                              label="Eliminar"
                              danger
                              onClick={() => void handleDelete(category)}
                              disabled={deleteCategory.isPending}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={formMode !== null} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">
              {formMode === "create" ? "Nueva categoría" : "Editar categoría"}
            </DialogTitle>
            <DialogDescription>
              {formMode === "create"
                ? "Crea una categoría para agrupar productos en el catálogo."
                : editingIsDefault
                  ? "Puedes cambiar el emoji de la categoría por defecto."
                  : "Actualiza el nombre y el emoji de la categoría."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Nombre</Label>
              <Input
                id="category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                placeholder="Ej. Accesorios"
                required={!editingIsDefault}
                disabled={editingIsDefault}
                autoFocus={!editingIsDefault}
                className={editingIsDefault ? "bg-muted/50" : undefined}
              />
            </div>
            <div className="space-y-2">
              <Label>Emoji</Label>
              <CategoryEmojiPicker value={emoji} onChange={setEmoji} />
              <p className="text-xs text-muted-foreground">
                Por defecto para nuevas categorías: {DEFAULT_CATEGORY_EMOJI}
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeForm}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving || (!editingIsDefault && !name.trim())}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
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
  icon: typeof Pencil;
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
      aria-label={label}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-full transition",
        danger
          ? "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
        disabled && "opacity-50",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
