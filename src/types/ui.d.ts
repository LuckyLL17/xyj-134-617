export interface UiModule {
  getControlElements: () => Record<string, HTMLElement | null>
  setupEventListeners: (
    elements: Record<string, any>,
    dataElements: Record<string, any>,
    state: any,
    mapCanvas: HTMLCanvasElement,
    mapCtx: CanvasRenderingContext2D,
    effectCtx: CanvasRenderingContext2D,
    effectCanvas: HTMLCanvasElement,
    mapWrapper: HTMLElement,
    flashOverlay: HTMLElement,
    mapHint: HTMLElement
  ) => void
  refreshExplosionList: (state: any, elements: Record<string, any>) => void
  syncControlsFromSelected: (state: any, elements: Record<string, any>) => void
  syncTerrainControlsFromState: (state: any, elements: Record<string, any>) => void
  updateAllCalculations: (state: any) => void
  updateEvacuationDisplay: (state: any, elements: Record<string, any>) => void
}

declare const UI: UiModule
export default UI
