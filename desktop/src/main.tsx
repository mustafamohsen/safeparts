// @ts-nocheck
import React from 'react'
import ReactDOM from 'react-dom/client'

import { App } from './App'
import './styles.css'
import { ensureWasm } from './wasm'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

const warmupWasm = () => {
  void ensureWasm().catch(() => {
    // Best-effort preload: first real action retries and surfaces errors.
  })
}

if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
  window.requestIdleCallback(warmupWasm, { timeout: 1500 })
} else {
  window.setTimeout(warmupWasm, 0)
}
