import './physics.js'
import './audio.js'
import './data-display.js'
import './renderer.js'
import './animation.js'
import './timeline.js'
import './evacuation.js'
import './ui.js'
import './app.js'

export function initLegacyApp() {
  if (window.App && typeof window.App.bootstrap === 'function') {
    return window.App.bootstrap()
  }
  return null
}

export const legacyModules = {
  get Physics() {
    return window.Physics
  },
  get Renderer() {
    return window.Renderer
  },
  get UI() {
    return window.UI
  },
  get DataDisplay() {
    return window.DataDisplay
  },
  get Animation() {
    return window.Animation
  },
  get Timeline() {
    return window.Timeline
  },
  get Evacuation() {
    return window.Evacuation
  },
  get Audio() {
    return window.Audio
  },
  get App() {
    return window.App
  }
}

export default legacyModules
