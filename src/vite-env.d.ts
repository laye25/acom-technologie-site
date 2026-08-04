/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}


interface Window {
  __BRIDGE_STATS?: any;
  __SENTINEL_HASHES?: any;
  __SENTINEL_STATE_HASH?: any;
  __SENTINEL_RENDER_HASH?: any;
  __SENTINEL_EMBROIDERY_HASH?: any;
}