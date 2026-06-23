export const DEFAULT_CATEGORY_NAME = "Sin Categoria";

export function resolveDefaultCategoryId(
  categories: { id: string; name: string }[],
): string {
  return (
    categories.find((c) => c.name === DEFAULT_CATEGORY_NAME)?.id ?? categories[0]?.id ?? ""
  );
}
