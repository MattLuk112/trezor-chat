/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TREZOR_MANIFEST_EMAIL: string;
  readonly VITE_TREZOR_MANIFEST_URL: string;
  readonly VITE_PEER_SERVER_HOST: string;
  readonly VITE_PEER_SERVER_PORT: number;
  readonly VITE_PEER_SERVER_PATH: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
