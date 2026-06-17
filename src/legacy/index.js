import './physics.js'
import './audio.js'
import './data-display.js'
import './renderer.js'
import './animation.js'
import './timeline.js'
import './evacuation.js'
import './ui.js'
import './app.js'

const global = typeof window !== 'undefined' ? window : globalThis

export const Physics = global.Physics
export const AudioManager = global.AudioManager
export const DataDisplay = global.DataDisplay
export const Renderer = global.Renderer
export const Animation = global.Animation
export const Timeline = global.Timeline
export const Evacuation = global.Evacuation
export const UI = global.UI
export const App = global.App

export default {
  Physics,
  AudioManager,
  DataDisplay,
  Renderer,
  Animation,
  Timeline,
  Evacuation,
  UI,
  App
}
