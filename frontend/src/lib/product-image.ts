import placeholder from "@/assets/p1.jpg";

export function productPrimaryImage(images: string[]): string {
  return images[0] ?? placeholder;
}

export function productImages(images: string[]): string[] {
  return images.length > 0 ? images : [placeholder];
}
