/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HELP_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module './wasm_pkg/safeparts_wasm' {
  const mod: any
  export default mod
}
