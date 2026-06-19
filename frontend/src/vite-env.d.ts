/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CATALOG_MODE?: "detal" | "mayor";
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_WHATSAPP_NUMBER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
