/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_WC_STORE_URL?: string;
  readonly WP_URL?: string;
  readonly PUBLIC_CONTACT_EMAIL?: string;
  readonly PUBLIC_WHATSAPP?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
