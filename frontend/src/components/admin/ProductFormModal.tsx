import { useEffect, useRef, useState } from "react";
import { Loader2, UploadCloud, X, Image as ImageIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { AdminProduct, Category, Product } from "@/lib/types";
import { formatCOP } from "@/lib/format";
import {
  uploadAdminProductImage,
  type ProductImagePayload,
  type UpsertAdminProductPayload,
} from "@/lib/admin-api";
import { productPrimaryImage } from "@/lib/product-image";
import { cn } from "@/lib/utils";

type FormImage =
  | { type: "existing"; url: string; path: string; preview: string }
  | { type: "pending"; file: File; preview: string };

type ProductFormModalProps = {
  mode: "create" | "edit";
  product?: AdminProduct;
  categories: Category[];
  onClose: () => void;
  onSave: (payload: UpsertAdminProductPayload) => Promise<void>;
  saving?: boolean;
};

export function ProductFormModal({
  mode,
  product,
  categories,
  onClose,
  onSave,
  saving,
}: ProductFormModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingPreviewsRef = useRef<string[]>([]);
  const [codigo, setCodigo] = useState(product?.codigo ?? "");
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? "");
  const [priceRetail, setPriceRetail] = useState(String(product?.priceRetail ?? ""));
  const [priceWholesale, setPriceWholesale] = useState(String(product?.priceWholesale ?? ""));
  const [active, setActive] = useState(product?.active ?? true);
  const [images, setImages] = useState<FormImage[]>(
    product?.imageAssets?.map((img) => ({
      type: "existing",
      url: img.url,
      path: img.path,
      preview: img.url,
    })) ?? [],
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const revokePendingPreviews = (items: FormImage[]) => {
    for (const img of items) {
      if (img.type === "pending") {
        URL.revokeObjectURL(img.preview);
        pendingPreviewsRef.current = pendingPreviewsRef.current.filter((url) => url !== img.preview);
      }
    }
  };

  useEffect(() => {
    return () => {
      for (const url of pendingPreviewsRef.current) URL.revokeObjectURL(url);
      pendingPreviewsRef.current = [];
    };
  }, []);

  const handleClose = () => {
    revokePendingPreviews(images);
    onClose();
  };

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);

    const pending = Array.from(files).map((file) => {
      const preview = URL.createObjectURL(file);
      pendingPreviewsRef.current.push(preview);
      return {
        type: "pending" as const,
        file,
        preview,
      };
    });
    setImages((prev) => [...prev, ...pending]);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const img = prev[index];
      if (img?.type === "pending") URL.revokeObjectURL(img.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const retail = Number.parseInt(priceRetail, 10);
    const wholesale = Number.parseInt(priceWholesale, 10);

    if (!codigo.trim() || !name.trim() || !description.trim() || !categoryId) {
      setError("Completa todos los campos obligatorios.");
      return;
    }
    if (!Number.isFinite(retail) || retail <= 0 || !Number.isFinite(wholesale) || wholesale <= 0) {
      setError("Los precios deben ser números enteros mayores a cero.");
      return;
    }

    try {
      setUploading(true);

      const resolvedImages: ProductImagePayload[] = [];
      for (const img of images) {
        if (img.type === "existing") {
          resolvedImages.push({ url: img.url, path: img.path });
        } else {
          const result = await uploadAdminProductImage(img.file, product?.id);
          URL.revokeObjectURL(img.preview);
          pendingPreviewsRef.current = pendingPreviewsRef.current.filter((url) => url !== img.preview);
          resolvedImages.push(result);
        }
      }

      const payload: UpsertAdminProductPayload = {
        codigo: codigo.trim(),
        name: name.trim(),
        description: description.trim(),
        categoryId,
        priceRetail: retail,
        priceWholesale: wholesale,
        active,
        images: resolvedImages.map((img, index) => ({
          url: img.url,
          path: img.path,
          esPrincipal: index === 0,
        })),
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el producto");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 backdrop-blur-sm p-4 animate-in fade-in">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl rounded-3xl bg-background shadow-pop overflow-hidden animate-in zoom-in-95"
      >
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="font-display text-xl font-bold">
              {mode === "create" ? "Agregar producto" : "Editar producto"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {mode === "create"
                ? "Completa la información del nuevo producto."
                : "Actualiza la información del producto."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Field label="Código">
            <input className="input" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="SET-001" />
          </Field>
          <Field label="Nombre del producto">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Set de velas aromáticas" />
          </Field>
          <Field label="Descripción">
            <textarea
              rows={3}
              className="input resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe tu producto..."
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Precio al detal">
              <input
                className="input"
                inputMode="numeric"
                value={priceRetail}
                onChange={(e) => setPriceRetail(e.target.value.replace(/\D/g, ""))}
                placeholder="38900"
              />
            </Field>
            <Field label="Precio al por mayor">
              <input
                className="input"
                inputMode="numeric"
                value={priceWholesale}
                onChange={(e) => setPriceWholesale(e.target.value.replace(/\D/g, ""))}
                placeholder="28500"
              />
            </Field>
          </div>
          <Field label="Categoría">
            <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
            <div>
              <div className="text-sm font-medium">Visible en catálogo</div>
              <div className="text-xs text-muted-foreground">
                {active
                  ? "Los clientes pueden ver y comprar este producto."
                  : "Oculto del catálogo. Sigue disponible en pedidos anteriores."}
              </div>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
          <Field label="Imágenes">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-2xl border-2 border-dashed border-border bg-secondary/30 p-8 text-center hover:border-primary/50 transition"
            >
              <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground" />
              <div className="mt-2 text-sm font-medium">Seleccionar imágenes</div>
              <div className="text-xs text-muted-foreground">PNG, JPG o WebP · máx. 5 MB</div>
            </button>
            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {images.map((img, i) => (
                  <div
                    key={img.type === "existing" ? img.path : `${img.preview}-${i}`}
                    className="relative aspect-square overflow-hidden rounded-xl border border-border"
                  >
                    <img src={img.preview} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90 text-foreground shadow"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                        Principal
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {images.length === 0 && (
              <div className="mt-2 grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-xl border border-dashed border-border bg-secondary/30 grid place-items-center text-muted-foreground"
                  >
                    <ImageIcon className="h-5 w-5" />
                  </div>
                ))}
              </div>
            )}
          </Field>
        </div>

        <div className="flex justify-end gap-2 border-t border-border bg-secondary/30 p-5">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || uploading}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-pop hover:opacity-90 disabled:opacity-60"
          >
            {(saving || uploading) && <Loader2 className="h-4 w-4 animate-spin" />}
            {uploading ? "Subiendo imágenes..." : "Guardar producto"}
          </button>
        </div>
        <style>{`.input{width:100%;border-radius:0.75rem;border:1px solid var(--border);background:var(--card);padding:0.625rem 0.875rem;font-size:0.875rem;outline:none;transition:box-shadow .15s;}.input:focus{box-shadow:0 0 0 4px oklch(0.78 0.18 5 / 0.15);border-color:var(--primary)}`}</style>
      </form>
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

export function ProductViewModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const image = productPrimaryImage(product.images);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-2xl rounded-3xl bg-background shadow-pop overflow-hidden animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="font-display text-xl font-bold">{product.name}</h2>
            <p className="text-xs text-muted-foreground">
              {product.codigo} · {product.category}
            </p>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6 space-y-5">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(product.images.length ? product.images : [image]).map((img, i) => (
              <img
                key={i}
                src={img}
                alt=""
                className={cn(
                  "h-24 w-24 shrink-0 rounded-2xl object-cover border-2",
                  i === 0 ? "border-primary" : "border-border",
                )}
              />
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <DetailField label="Categoría" value={product.category} />
            <DetailField label="Estado" value={product.active ? "Activo" : "Inactivo"} />
            <DetailField label="Fecha de creación" value={product.createdAt} />
            <DetailField label="Precio al detal" value={formatCOP(product.priceRetail)} />
            <DetailField label="Precio al por mayor" value={formatCOP(product.priceWholesale)} />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Descripción
            </span>
            <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
          </div>
        </div>

        <div className="flex justify-end border-t border-border bg-secondary/30 p-5">
          <button
            onClick={onClose}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-pop hover:opacity-90"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}
