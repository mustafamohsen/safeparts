declare module 'react'
declare module 'react-dom/client'
declare module 'react/jsx-runtime'
declare module 'vite'
declare module '@vitejs/plugin-react'

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any
  }
}
