import './physics.ts'
import './audio.ts'
import './data-display.ts'
import './renderer.ts'
import './animation.ts'
import './timeline.ts'
import './evacuation.ts'
import './ui.ts'
import './app.ts'

export function initLegacyApp(): void {
  if (window.App && typeof window.App.init === 'function') {
    window.App.init()
  }
}

export const legacyModules = {
  get Physics(): any {
    return window.Physics
  },
  get DataDisplay(): any {
    return window.DataDisplay
  },
  get Renderer(): any {
    return window.Renderer
  },
  get Animation(): any {
    return window.Animation
  },
  get Timeline(): any {
    return window.Timeline
  },
  get Evacuation(): any {
    return window.Evacuation
  },
  get UI(): any {
    return window.UI
  },
  get AudioManager(): any {
    return window.AudioManager
  },
  get App(): any {
    return window.App
  }
}

export default legacyModules
