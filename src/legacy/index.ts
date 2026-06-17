import type {
  PhysicsModule,
  AudioManagerModule,
  DataDisplayModule,
  RendererModule,
  AnimationModule,
  TimelineModule,
  EvacuationModule,
  UiModule,
  AppModule
} from '@/types/index'

import './physics'
import './audio'
import './data-display'
import './renderer'
import './animation'
import './timeline'
import './evacuation'
import './ui'
import './app'

const global = (typeof window !== 'undefined' ? window : globalThis) as any

export const Physics: PhysicsModule = global.Physics
export const AudioManager: AudioManagerModule = global.AudioManager
export const DataDisplay: DataDisplayModule = global.DataDisplay
export const Renderer: RendererModule = global.Renderer
export const Animation: AnimationModule = global.Animation
export const Timeline: TimelineModule = global.Timeline
export const Evacuation: EvacuationModule = global.Evacuation
export const UI: UiModule = global.UI
export const App: AppModule = global.App

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
