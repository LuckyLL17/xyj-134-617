/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface Window {
  Physics: any
  Renderer: any
  UI: any
  DataDisplay: any
  Animation: any
  Timeline: any
  Evacuation: any
  Audio: any
  App: any
}
