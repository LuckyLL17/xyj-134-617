import type {
  Explosion,
  City,
  Shelter,
  TerrainData,
  ZoneDef,
  Point,
  Road,
  AppState,
  UiModule
} from '@/types/index'

interface EvacuationPlan {
  cityPlans: Array<{
    cityIndex: number
    evacuated: number
    path: Road[]
    travelTimeHours: number
    canEvacuate: boolean
  }>
  roadDensities: Array<{
    edge: Road
    density: number
  }>
  graph: {
    nodes: Array<{
      id: number
      type: 'city' | 'shelter'
      ref: City | Shelter
      refIndex: number
      x: number
      y: number
      population?: number
      capacity?: number
      edges: Road[]
    }>
  }
  totalEvacuated: number
  totalPopulation: number
  totalStranded: number
  evacuationRate: number
}

interface UiElements {
  [key: string]: HTMLElement | null
}

interface NearestShelterResult {
  shelter: Shelter
  index: number
}



const BOMB_TYPES: Record<string, { yield: number; name: string }> = window.Physics.BOMB_TYPES

const controlElementIds: string[] = [
  'bombType', 'yieldSlider', 'yieldValue', 'burstHeight',
  'scaleSlider', 'scaleValue', 'showLabels', 'showLegend',
  'legend', 'detonateBtn', 'resetBtn',
  'explosionList', 'addExplosionBtn', 'removeExplosionBtn',
  'explosionCount', 'paramTarget',
  'statExplosionCount', 'statCombinedArea', 'statTotalArea', 'statOverlapArea',
  'terrainEnabled', 'terrainPreset', 'terrainIntensity', 'terrainIntensityValue',
  'showTerrainHeatmap', 'showTerrainContours', 'regenerateTerrainBtn',
  'mountainCount', 'hillCount', 'basinCount', 'maxElevation',
  'evacuationEnabled', 'shelterCount', 'warningTimeSlider', 'warningTimeValue',
  'roadCapacity', 'vehicleSpeed', 'recalcEvacBtn', 'addShelterBtn',
  'evacStartBtn', 'evacPauseBtn', 'evacResetBtn', 'evacSpeed',
  'evacTotalPop', 'evacEvacuated', 'evacStranded', 'evacRate',
  'evacProgress', 'evacProgressFill', 'evacTime', 'evacWarningTime',
  'evacModeBadge', 'evacuationPanel',
  'buildingTotalPop', 'buildingDestroyedPop', 'buildingAvgStrength',
  'buildingSurvivalRate', 'maxOverpressure', 'overpressureBar',
  'buildingTypeList', 'damageBarChart', 'damageStatsList',
  'buildingCitySelect', 'buildingSummaryView', 'buildingByTypeView', 'buildingByDamageView',
  'buildingPanel',
  'addZoneBtn', 'resetZonesBtn', 'zoneList',
  'zoneEditorModal', 'zoneEditorOverlay', 'zoneEditorClose',
  'zoneEditorCancel', 'zoneEditorSave', 'zoneEditorTitle',
  'zoneKey', 'zoneLabel', 'zoneColor', 'zoneColorText',
  'zoneDescription', 'zoneMinRadius', 'zoneRadiusFormula',
  'zoneHeightFactor', 'zoneDash', 'zoneOverpressure',
  'zoneAltitudeSens', 'zoneAltitudeSensValue',
  'zoneDestroyed', 'zoneDeathRate', 'zoneDeathRateValue',
  'zoneInjuryRate', 'zoneInjuryRateValue'
]

export function getControlElements(): UiElements {
  const elements: UiElements = {}
  controlElementIds.forEach(function (id: string): void {
    elements[id] = document.getElementById(id)
  })
  return elements
}

function getSelectedExplosion(state: AppState): Explosion | null {
  if (!state.selectedExplosionId) return null
  return state.explosions.find(function (e: Explosion): boolean { return e.id === state.selectedExplosionId }) || null
}

export function updateCalculationsForExplosion(explosion: Explosion | null): void {
  if (!explosion) return
  explosion.radii = window.Physics.calculateRadii(explosion.yieldKilotons, explosion.burstHeight)
}

export function updateAllCalculations(state: AppState): void {
  state.explosions.forEach(updateCalculationsForExplosion)
}

function getBombTypeName(bombType: string, yieldKilotons: number): string {
  if (bombType === 'custom') return '自定义 ' + yieldKilotons.toLocaleString() + 'kt'
  const bomb = BOMB_TYPES[bombType]
  return bomb ? bomb.name : '自定义'
}

export function refreshExplosionList(state: AppState, elements: UiElements): void {
  const list = elements.explosionList as HTMLDivElement
  if (!list) return
  list.innerHTML = ''

  if (state.explosions.length === 0) {
    const tip = document.createElement('div')
    tip.className = 'empty-list-tip'
    tip.textContent = '点击「添加爆炸点」开始'
    list.appendChild(tip)
  } else {
    state.explosions.forEach(function (exp: Explosion, index: number): void {
      const item = document.createElement('div')
      item.className = 'explosion-item' + (exp.id === state.selectedExplosionId ? ' active' : '')
      item.dataset.id = String(exp.id)

      const left = document.createElement('div')
      left.className = 'explosion-item-left'

      const num = document.createElement('div')
      num.className = 'explosion-number'
      num.textContent = String(index + 1)

      const meta = document.createElement('div')
      meta.className = 'explosion-meta'
      const title = document.createElement('div')
      title.className = 'explosion-title'
      title.textContent = '爆炸点 #' + (index + 1)
      const sub = document.createElement('div')
      sub.className = 'explosion-sub'
      sub.textContent = getBombTypeName(exp.bombType, exp.yieldKilotons) + ' · ' + exp.burstHeight + 'm'
      meta.appendChild(title)
      meta.appendChild(sub)

      left.appendChild(num)
      left.appendChild(meta)

      const indicator = document.createElement('div')
      indicator.className = 'explosion-position-indicator ' + (exp.explosionCenter ? 'set' : 'unset')
      indicator.title = exp.explosionCenter ? '位置已设置' : '位置未设置'

      item.appendChild(left)
      item.appendChild(indicator)

      item.addEventListener('click', function (): void {
        selectExplosion(state, exp.id, elements)
      })

      list.appendChild(item)
    })
  }

  if (elements.explosionCount) {
    elements.explosionCount.textContent = String(state.explosions.length)
  }
  updateParamTargetLabel(state, elements)
}

function updateParamTargetLabel(state: AppState, elements: UiElements): void {
  const index = state.explosions.findIndex(function (e: Explosion): boolean { return e.id === state.selectedExplosionId })
  if (index >= 0) {
    if (elements.paramTarget) {
      elements.paramTarget.textContent = '（爆炸点 #' + (index + 1) + '）'
    }
  } else {
    if (elements.paramTarget) {
      elements.paramTarget.textContent = '（无选中）'
    }
  }
}

export function syncControlsFromSelected(state: AppState, elements: UiElements): void {
  const selected = getSelectedExplosion(state)
  if (!selected) return

  const bombTypeEl = elements.bombType as HTMLSelectElement
  const yieldSliderEl = elements.yieldSlider as HTMLInputElement
  const burstHeightEl = elements.burstHeight as HTMLInputElement

  if (bombTypeEl) bombTypeEl.value = selected.bombType
  if (yieldSliderEl) yieldSliderEl.value = String(selected.yieldKilotons)
  if (elements.yieldValue) elements.yieldValue.textContent = selected.yieldKilotons.toLocaleString()
  if (burstHeightEl) burstHeightEl.value = String(selected.burstHeight)
}

export function syncTerrainControlsFromState(state: AppState, elements: UiElements): void {
  const terrainEnabledEl = elements.terrainEnabled as HTMLInputElement
  const terrainPresetEl = elements.terrainPreset as HTMLSelectElement
  const terrainIntensityEl = elements.terrainIntensity as HTMLInputElement
  const showTerrainHeatmapEl = elements.showTerrainHeatmap as HTMLInputElement
  const showTerrainContoursEl = elements.showTerrainContours as HTMLInputElement

  if (terrainEnabledEl) terrainEnabledEl.checked = state.terrainEnabled
  if (terrainPresetEl) terrainPresetEl.value = state.terrainPreset
  if (terrainIntensityEl) terrainIntensityEl.value = String(state.terrainIntensity)
  if (elements.terrainIntensityValue) elements.terrainIntensityValue.textContent = state.terrainIntensity.toFixed(1)
  if (showTerrainHeatmapEl) showTerrainHeatmapEl.checked = state.showTerrainHeatmap
  if (showTerrainContoursEl) showTerrainContoursEl.checked = state.showTerrainContours
  updateTerrainInfo(state, elements)
}

export function syncStateFromTerrainControls(state: AppState, elements: UiElements): void {
  const terrainEnabledEl = elements.terrainEnabled as HTMLInputElement
  const terrainPresetEl = elements.terrainPreset as HTMLSelectElement
  const terrainIntensityEl = elements.terrainIntensity as HTMLInputElement
  const showTerrainHeatmapEl = elements.showTerrainHeatmap as HTMLInputElement
  const showTerrainContoursEl = elements.showTerrainContours as HTMLInputElement

  if (terrainEnabledEl) state.terrainEnabled = terrainEnabledEl.checked
  if (terrainPresetEl) state.terrainPreset = terrainPresetEl.value
  if (terrainIntensityEl) state.terrainIntensity = parseFloat(terrainIntensityEl.value)
  if (showTerrainHeatmapEl) state.showTerrainHeatmap = showTerrainHeatmapEl.checked
  if (showTerrainContoursEl) state.showTerrainContours = showTerrainContoursEl.checked
}

export function updateTerrainInfo(state: AppState, elements: UiElements): void {
  if (!state.terrainData || !state.terrainData.features) {
    if (elements.mountainCount) elements.mountainCount.textContent = '0'
    if (elements.hillCount) elements.hillCount.textContent = '0'
    if (elements.basinCount) elements.basinCount.textContent = '0'
    if (elements.maxElevation) elements.maxElevation.textContent = '0'
    return
  }

  const FEATURE_TYPES = window.Physics.TERRAIN_FEATURE_TYPES
  let mountainCount = 0, hillCount = 0, basinCount = 0, maxElev = 0

  state.terrainData.features.forEach(function (f): void {
    if (f.type === FEATURE_TYPES.MOUNTAIN) mountainCount++
    else if (f.type === FEATURE_TYPES.HILL) hillCount++
    else if (f.type === FEATURE_TYPES.BASIN) basinCount++
    if (f.heightPx > maxElev) maxElev = f.heightPx
  })

  if (elements.mountainCount) elements.mountainCount.textContent = String(mountainCount)
  if (elements.hillCount) elements.hillCount.textContent = String(hillCount)
  if (elements.basinCount) elements.basinCount.textContent = String(basinCount)
  if (elements.maxElevation) elements.maxElevation.textContent = Math.round(maxElev).toLocaleString()
}

export function regenerateTerrain(
  state: AppState,
  elements: UiElements,
  mapCtx: CanvasRenderingContext2D,
  mapWrapper: HTMLElement,
  dataElements: UiElements,
  forceNewSeed: boolean
): void {
  if (forceNewSeed) {
    state.terrainSeed = Math.floor(Math.random() * 100000)
  }
  window.App.regenerateTerrain()
  updateTerrainInfo(state, elements)
  window.DataDisplay.updateDataDisplay(dataElements, state)
  window.Renderer.drawMap(mapCtx, mapWrapper, state)
}

function syncSelectedFromControls(state: AppState, elements: UiElements): void {
  const selected = getSelectedExplosion(state)
  if (!selected) return

  const bombTypeEl = elements.bombType as HTMLSelectElement
  const yieldSliderEl = elements.yieldSlider as HTMLInputElement
  const burstHeightEl = elements.burstHeight as HTMLInputElement

  if (bombTypeEl) selected.bombType = bombTypeEl.value
  if (yieldSliderEl) selected.yieldKilotons = parseInt(yieldSliderEl.value, 10)
  if (burstHeightEl) selected.burstHeight = parseInt(burstHeightEl.value, 10)
}

function selectExplosion(state: AppState, id: number, elements: UiElements): void {
  state.selectedExplosionId = id
  syncControlsFromSelected(state, elements)
  refreshExplosionList(state, elements)
}

function addExplosion(state: AppState, elements: UiElements, mapWrapper: HTMLElement, position?: Point): Explosion {
  const rect = mapWrapper.getBoundingClientRect()
  let center: Point
  if (position) {
    center = position
  } else {
    center = {
      x: rect.width / 2 + (Math.random() - 0.5) * rect.width * 0.4,
      y: rect.height / 2 + (Math.random() - 0.5) * rect.height * 0.4
    }
  }
  const newExp = window.App.createExplosion({
    explosionCenter: center
  })
  updateCalculationsForExplosion(newExp)
  state.explosions.push(newExp)
  state.selectedExplosionId = newExp.id
  syncControlsFromSelected(state, elements)
  refreshExplosionList(state, elements)
  return newExp
}

function findNearestExplosion(x: number, y: number, state: AppState, thresholdPx: number): Explosion | null {
  let nearest: Explosion | null = null
  let nearestDist = Infinity
  state.explosions.forEach(function (exp: Explosion): void {
    if (!exp.explosionCenter) return
    const dx = x - exp.explosionCenter.x
    const dy = y - exp.explosionCenter.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < thresholdPx && dist < nearestDist) {
      nearestDist = dist
      nearest = exp
    }
  })
  return nearest
}

function removeSelectedExplosion(state: AppState, elements: UiElements): void {
  if (state.explosions.length <= 1) {
    alert('至少需要保留 1 个爆炸点')
    return
  }
  const index = state.explosions.findIndex(function (e: Explosion): boolean { return e.id === state.selectedExplosionId })
  if (index < 0) return

  state.explosions.splice(index, 1)
  const newSelected = state.explosions[Math.max(0, index - 1)]
  state.selectedExplosionId = newSelected ? newSelected.id : null
  syncControlsFromSelected(state, elements)
  refreshExplosionList(state, elements)
}

export function handleCanvasClick(
  e: MouseEvent,
  mapCanvas: HTMLCanvasElement,
  state: AppState,
  mapHint: HTMLElement,
  dataElements: UiElements,
  mapCtx: CanvasRenderingContext2D,
  mapWrapper: HTMLElement,
  elements: UiElements
): void {
  if (state.isAnimating) return

  const rect = mapCanvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  if (e.shiftKey) {
    const newExp = addExplosion(state, elements, mapWrapper, { x: x, y: y })
    mapHint.classList.add('hidden')
    window.DataDisplay.updateDataDisplay(dataElements, state)
    window.Renderer.drawMap(mapCtx, mapWrapper, state)
    return
  }

  const SELECT_THRESHOLD = 24
  const nearest = findNearestExplosion(x, y, state, SELECT_THRESHOLD)
  if (nearest) {
    selectExplosion(state, nearest.id, elements)
  } else {
    const selected = getSelectedExplosion(state)
    if (!selected) {
      const firstWithPos = state.explosions.find(function (e: Explosion): boolean { return e.explosionCenter !== null })
      if (firstWithPos) {
        selectExplosion(state, firstWithPos.id, elements)
      } else {
        alert('请先选中一个爆炸点')
        return
      }
    }
    const currentSelected = getSelectedExplosion(state)
    if (currentSelected) {
      currentSelected.explosionCenter = { x: x, y: y }
      mapHint.classList.add('hidden')
      updateCalculationsForExplosion(currentSelected)
      refreshExplosionList(state, elements)
    }
  }

  window.DataDisplay.updateDataDisplay(dataElements, state)
  window.Renderer.drawMap(mapCtx, mapWrapper, state)
}

function triggerDetonate(
  state: AppState,
  elements: UiElements,
  effectCtx: CanvasRenderingContext2D,
  effectCanvas: HTMLCanvasElement,
  mapWrapper: HTMLElement,
  flashOverlay: HTMLElement
): void {
  const positionedExplosions = state.explosions.filter(function (e: Explosion): boolean { return e.explosionCenter !== null })
  if (positionedExplosions.length === 0) {
    alert('请至少为一个爆炸点设置位置')
    return
  }

  if (window.Timeline && window.Timeline.isActive()) {
    window.Timeline.stop()
  }

  ;(window.Animation.animateExplosion as any)(effectCtx, effectCanvas, mapWrapper, state, elements, flashOverlay)
}

function resetAll(
  state: AppState,
  elements: UiElements,
  dataElements: UiElements,
  effectCtx: CanvasRenderingContext2D,
  mapWrapper: HTMLElement,
  flashOverlay: HTMLElement,
  mapHint: HTMLElement,
  mapCtx: CanvasRenderingContext2D
): void {
  if (state.animationId) {
    cancelAnimationFrame(state.animationId)
  }

  if (window.Timeline && window.Timeline.isActive()) {
    window.Timeline.stop()
  }

  state.isAnimating = false
  state.animationId = null
  state.explosions = []
  state.selectedExplosionId = null

  const detonateBtn = elements.detonateBtn as HTMLButtonElement
  if (detonateBtn) detonateBtn.disabled = false
  flashOverlay.classList.remove('active')
  mapHint.classList.remove('hidden')

  const rect = mapWrapper.getBoundingClientRect()
  effectCtx.clearRect(0, 0, rect.width, rect.height)

  state.cities.forEach(function (city: City): void { city.destroyed = false })

  state.terrainSeed = Math.floor(Math.random() * 100000)
  syncStateFromTerrainControls(state, elements)
  window.App.regenerateTerrain()
  updateTerrainInfo(state, elements)

  const firstExp = window.App.createExplosion({
    explosionCenter: {
      x: rect.width / 2,
      y: rect.height / 2
    }
  })
  updateCalculationsForExplosion(firstExp)
  state.explosions.push(firstExp)
  state.selectedExplosionId = firstExp.id

  mapHint.classList.add('hidden')
  syncControlsFromSelected(state, elements)
  syncTerrainControlsFromState(state, elements)
  refreshExplosionList(state, elements)
  updateAllCalculations(state)
  window.DataDisplay.updateDataDisplay(dataElements, state)
  window.Renderer.drawMap(mapCtx, mapWrapper, state)
}

function handleViewToggle(view: string, state: AppState, elements: UiElements, dataElements: UiElements): void {
  state.viewMode = view
  document.querySelectorAll('.toggle-btn').forEach(function (btn: Element): void {
    btn.classList.toggle('active', (btn as HTMLElement).dataset.view === view)
  })
  const combinedStats = document.getElementById('combinedStats')
  if (combinedStats) {
    combinedStats.style.display = view === 'combined' ? 'block' : 'none'
  }
  window.DataDisplay.updateDataDisplay(dataElements, state)
}

function handleBuildingViewToggle(view: string, state: AppState, elements: UiElements): void {
  state.buildingViewMode = view
  document.querySelectorAll('.building-toggle-btn').forEach(function (btn: Element): void {
    btn.classList.toggle('active', (btn as HTMLElement).dataset.buildingView === view)
  })

  if (elements.buildingSummaryView) {
    elements.buildingSummaryView.style.display = view === 'summary' ? 'block' : 'none'
  }
  if (elements.buildingByTypeView) {
    elements.buildingByTypeView.style.display = view === 'byType' ? 'block' : 'none'
  }
  if (elements.buildingByDamageView) {
    elements.buildingByDamageView.style.display = view === 'byDamage' ? 'block' : 'none'
  }
}

export function recalculateEvacuation(
  state: AppState,
  elements: UiElements,
  mapCtx: CanvasRenderingContext2D,
  mapWrapper: HTMLElement
): void {
  if (!state.evacuationEnabled || !state.shelters || state.shelters.length === 0) {
    state.evacuationPlan = null
    return
  }

  const roads = window.Physics.generateRoadNetwork(
    mapWrapper.clientWidth,
    mapWrapper.clientHeight,
    state.cities,
    state.shelters
  )
  state.evacuationRoads = roads

  const roadCapacityEl = elements.roadCapacity as HTMLInputElement
  const capacityMultiplier = parseFloat(roadCapacityEl ? roadCapacityEl.value : '1')
  const adjustedRoads = roads.map(function (road: Road): Road {
    return {
      ...road,
      capacity: (road.capacity || 0) * capacityMultiplier
    }
  })

  const warningTimeSliderEl = elements.warningTimeSlider as HTMLInputElement
  const warningTime = parseInt(warningTimeSliderEl ? warningTimeSliderEl.value : '30', 10)

  const originalSpeed = window.Physics.VEHICLE_SPEED_KMH
  const vehicleSpeedEl = elements.vehicleSpeed as HTMLInputElement
  const customSpeed = parseInt(vehicleSpeedEl ? vehicleSpeedEl.value : '60', 10)
  window.Physics.VEHICLE_SPEED_KMH = customSpeed

  state.evacuationPlan = (window.Physics.calculateEvacuationPlan as any)(
    state.cities,
    state.shelters,
    adjustedRoads,
    state.scale,
    warningTime
  )

  window.Physics.VEHICLE_SPEED_KMH = originalSpeed

  updateEvacuationDisplay(state, elements)
}

export function updateEvacuationDisplay(state: AppState, elements: UiElements): void {
  const plan = state.evacuationPlan
  if (!plan) {
    if (elements.evacTotalPop) elements.evacTotalPop.textContent = '0'
    if (elements.evacEvacuated) elements.evacEvacuated.textContent = '0'
    if (elements.evacStranded) elements.evacStranded.textContent = '0'
    if (elements.evacRate) elements.evacRate.textContent = '0%'
    if (elements.evacProgress) elements.evacProgress.textContent = '0%'
    if (elements.evacProgressFill) (elements.evacProgressFill as HTMLElement).style.width = '0%'
    if (elements.evacTime) elements.evacTime.textContent = '0.0 小时'
    return
  }

  if (elements.evacTotalPop) {
    elements.evacTotalPop.textContent = formatNumberShort(plan.totalPopulation)
  }
  if (elements.evacEvacuated) {
    elements.evacEvacuated.textContent = formatNumberShort(plan.totalEvacuated)
  }
  if (elements.evacStranded) {
    elements.evacStranded.textContent = formatNumberShort(plan.totalStranded)
  }
  if (elements.evacRate) {
    const rate = plan.evacuationRate * 100
    if (rate < 0.1) {
      elements.evacRate.textContent = '<0.1%'
    } else if (rate < 1) {
      elements.evacRate.textContent = rate.toFixed(1) + '%'
    } else {
      elements.evacRate.textContent = Math.round(rate) + '%'
    }
  }

  const warningTimeSliderEl = elements.warningTimeSlider as HTMLInputElement
  const warningTime = parseInt(warningTimeSliderEl ? warningTimeSliderEl.value : '30', 10)
  if (elements.evacWarningTime) {
    elements.evacWarningTime.textContent = warningTime + ' 分钟'
  }
}

function formatNumberShort(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return Math.round(num).toString()
}

export function findNearestShelter(x: number, y: number, state: AppState, threshold: number): NearestShelterResult | null {
  if (!state.shelters) return null
  let nearest: NearestShelterResult | null = null
  let minDist = Infinity
  state.shelters.forEach(function (shelter: Shelter, idx: number): void {
    const dx = x - shelter.x
    const dy = y - shelter.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < threshold && dist < minDist) {
      minDist = dist
      nearest = { shelter: shelter, index: idx }
    }
  })
  return nearest
}

export function handleEvacCanvasClick(
  e: MouseEvent,
  mapCanvas: HTMLCanvasElement,
  state: AppState,
  mapCtx: CanvasRenderingContext2D,
  mapWrapper: HTMLElement,
  elements: UiElements
): void {
  if (!state.evacuationEnabled) return

  const rect = mapCanvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  const SHELTER_THRESHOLD = 30
  const nearest = findNearestShelter(x, y, state, SHELTER_THRESHOLD)

  if (nearest) {
    state.selectedShelterIndex = nearest.index
    window.Renderer.drawMap(mapCtx, mapWrapper, state)
    return
  }

  if (state.selectedShelterIndex !== undefined && state.selectedShelterIndex !== null && state.shelters) {
    const shelter = state.shelters[state.selectedShelterIndex]
    if (shelter) {
      shelter.x = x
      shelter.y = y
      recalculateEvacuation(state, elements, mapCtx, mapWrapper)
      window.Renderer.drawMap(mapCtx, mapWrapper, state)
    }
  }
}

export function addShelter(
  state: AppState,
  elements: UiElements,
  mapCtx: CanvasRenderingContext2D,
  mapWrapper: HTMLElement
): void {
  const rect = mapWrapper.getBoundingClientRect()
  const count = state.shelters ? state.shelters.length : 0
  const angle = count * Math.PI * 0.5 + Math.random() * 0.5
  const dist = Math.min(rect.width, rect.height) * (0.2 + Math.random() * 0.2)

  const newShelter: Shelter = {
    x: rect.width / 2 + Math.cos(angle) * dist,
    y: rect.height / 2 + Math.sin(angle) * dist,
    capacity: 500000 + Math.floor(Math.random() * 500000),
    name: '避难所 #' + (count + 1)
  }

  if (!state.shelters) state.shelters = []
  state.shelters.push(newShelter)
  state.selectedShelterIndex = state.shelters.length - 1

  const shelterCountEl = elements.shelterCount as HTMLInputElement
  if (shelterCountEl) {
    shelterCountEl.value = String(state.shelters.length)
  }

  recalculateEvacuation(state, elements, mapCtx, mapWrapper)
  window.Renderer.drawMap(mapCtx, mapWrapper, state)
}

export function updateShelterCount(
  state: AppState,
  elements: UiElements,
  mapCtx: CanvasRenderingContext2D,
  mapWrapper: HTMLElement
): void {
  const shelterCountEl = elements.shelterCount as HTMLInputElement
  const count = parseInt(shelterCountEl.value, 10)
  const rect = mapWrapper.getBoundingClientRect()

  if (!state.shelters || state.shelters.length !== count) {
    state.shelters = window.Physics.generateShelters(
      rect.width, rect.height, count
    )
    state.selectedShelterIndex = null
    recalculateEvacuation(state, elements, mapCtx, mapWrapper)
    window.Renderer.drawMap(mapCtx, mapWrapper, state)
  }
}

export function startEvacAnimation(
  state: AppState,
  elements: UiElements,
  effectCtx: CanvasRenderingContext2D,
  effectCanvas: HTMLCanvasElement
): void {
  if (!state.evacuationPlan) return

  if (window.Evacuation.isEvacuating()) {
    window.Evacuation.stopEvacuationAnimation()
  }

  const evacStartBtn = elements.evacStartBtn as HTMLButtonElement
  const evacPauseBtn = elements.evacPauseBtn as HTMLButtonElement
  const evacModeBadge = elements.evacModeBadge as HTMLElement

  if (evacStartBtn) {
    evacStartBtn.disabled = true
    evacStartBtn.textContent = '▶ 播放中...'
  }
  if (evacPauseBtn) {
    evacPauseBtn.disabled = false
  }
  if (evacModeBadge) {
    evacModeBadge.textContent = '播放中'
    evacModeBadge.classList.add('playing')
  }

  const evacSpeedEl = elements.evacSpeed as HTMLSelectElement
  const speed: number = parseFloat(evacSpeedEl ? evacSpeedEl.value : '1')
  ;(window.Evacuation.setSpeed as any)(speed)

  ;(window.Evacuation.startEvacuationAnimation as any)(
    effectCtx,
    effectCanvas,
    state,
    elements,
    state.evacuationPlan
  )
}

export function pauseEvacAnimation(elements: UiElements): void {
  if (window.Evacuation.isEvacuating()) {
    window.Evacuation.stopEvacuationAnimation()
  }
  const evacStartBtn = elements.evacStartBtn as HTMLButtonElement
  const evacPauseBtn = elements.evacPauseBtn as HTMLButtonElement
  const evacModeBadge = elements.evacModeBadge as HTMLElement

  if (evacStartBtn) {
    evacStartBtn.disabled = false
    evacStartBtn.textContent = '▶ 继续播放'
  }
  if (evacPauseBtn) {
    evacPauseBtn.disabled = true
  }
  if (evacModeBadge) {
    evacModeBadge.textContent = '已暂停'
    evacModeBadge.classList.remove('playing')
  }
}

export function resetEvacAnimation(
  state: AppState,
  elements: UiElements,
  effectCtx: CanvasRenderingContext2D,
  effectCanvas: HTMLCanvasElement
): void {
  ;(window.Evacuation.resetEvacuationAnimation as any)(
    effectCtx,
    effectCanvas,
    state,
    state.evacuationPlan
  )
  const evacStartBtn = elements.evacStartBtn as HTMLButtonElement
  const evacPauseBtn = elements.evacPauseBtn as HTMLButtonElement
  const evacModeBadge = elements.evacModeBadge as HTMLElement

  if (evacStartBtn) {
    evacStartBtn.disabled = false
    evacStartBtn.textContent = '▶ 播放动画'
  }
  if (evacPauseBtn) {
    evacPauseBtn.disabled = true
  }
  if (evacModeBadge) {
    evacModeBadge.textContent = '就绪'
    evacModeBadge.classList.remove('playing')
  }
  if (elements.evacProgress) {
    elements.evacProgress.textContent = '0%'
  }
  if (elements.evacProgressFill) {
    (elements.evacProgressFill as HTMLElement).style.width = '0%'
  }
  if (elements.evacTime) {
    elements.evacTime.textContent = '0.0 小时'
  }
  updateEvacuationDisplay(state, elements)
}

export function setupEventListeners(
  elements: UiElements,
  dataElements: UiElements,
  state: AppState,
  mapCanvas: HTMLCanvasElement,
  mapCtx: CanvasRenderingContext2D,
  effectCtx: CanvasRenderingContext2D,
  effectCanvas: HTMLCanvasElement,
  mapWrapper: HTMLElement,
  flashOverlay: HTMLElement,
  mapHint: HTMLElement
): void {
  const bombTypeEl = elements.bombType as HTMLSelectElement
  const yieldSliderEl = elements.yieldSlider as HTMLInputElement
  const burstHeightEl = elements.burstHeight as HTMLInputElement
  const scaleSliderEl = elements.scaleSlider as HTMLInputElement
  const showLabelsEl = elements.showLabels as HTMLInputElement
  const showLegendEl = elements.showLegend as HTMLInputElement
  const addExplosionBtn = elements.addExplosionBtn as HTMLButtonElement
  const removeExplosionBtn = elements.removeExplosionBtn as HTMLButtonElement
  const detonateBtn = elements.detonateBtn as HTMLButtonElement
  const resetBtn = elements.resetBtn as HTMLButtonElement
  const terrainEnabledEl = elements.terrainEnabled as HTMLInputElement
  const terrainPresetEl = elements.terrainPreset as HTMLSelectElement
  const terrainIntensityEl = elements.terrainIntensity as HTMLInputElement
  const showTerrainHeatmapEl = elements.showTerrainHeatmap as HTMLInputElement
  const showTerrainContoursEl = elements.showTerrainContours as HTMLInputElement
  const regenerateTerrainBtn = elements.regenerateTerrainBtn as HTMLButtonElement
  const evacuationEnabledEl = elements.evacuationEnabled as HTMLInputElement
  const shelterCountEl = elements.shelterCount as HTMLInputElement
  const warningTimeSliderEl = elements.warningTimeSlider as HTMLInputElement
  const roadCapacityEl = elements.roadCapacity as HTMLInputElement
  const vehicleSpeedEl = elements.vehicleSpeed as HTMLInputElement
  const recalcEvacBtn = elements.recalcEvacBtn as HTMLButtonElement
  const addShelterBtn = elements.addShelterBtn as HTMLButtonElement
  const evacStartBtn = elements.evacStartBtn as HTMLButtonElement
  const evacPauseBtn = elements.evacPauseBtn as HTMLButtonElement
  const evacResetBtn = elements.evacResetBtn as HTMLButtonElement
  const evacSpeedEl = elements.evacSpeed as HTMLSelectElement
  const buildingCitySelectEl = elements.buildingCitySelect as HTMLSelectElement
  const addZoneBtn = elements.addZoneBtn as HTMLButtonElement
  const resetZonesBtn = elements.resetZonesBtn as HTMLButtonElement
  const zoneEditorCloseEl = elements.zoneEditorClose as HTMLElement
  const zoneEditorOverlayEl = elements.zoneEditorOverlay as HTMLElement
  const zoneEditorCancelEl = elements.zoneEditorCancel as HTMLButtonElement
  const zoneEditorSaveEl = elements.zoneEditorSave as HTMLButtonElement
  const zoneColorEl = elements.zoneColor as HTMLInputElement
  const zoneColorTextEl = elements.zoneColorText as HTMLInputElement
  const zoneAltitudeSensEl = elements.zoneAltitudeSens as HTMLInputElement
  const zoneDeathRateEl = elements.zoneDeathRate as HTMLInputElement
  const zoneInjuryRateEl = elements.zoneInjuryRate as HTMLInputElement

  if (bombTypeEl) {
    bombTypeEl.addEventListener('change', function (e: Event): void {
      syncSelectedFromControls(state, elements)
      const selected = getSelectedExplosion(state)
      const target = e.target as HTMLSelectElement
      if (selected && target.value !== 'custom') {
        const bomb = BOMB_TYPES[target.value]
        if (bomb) {
          selected.yieldKilotons = bomb.yield
          if (yieldSliderEl) yieldSliderEl.value = String(bomb.yield)
          if (elements.yieldValue) elements.yieldValue.textContent = bomb.yield.toLocaleString()
        }
      }
      updateCalculationsForExplosion(getSelectedExplosion(state))
      refreshExplosionList(state, elements)
      window.DataDisplay.updateDataDisplay(dataElements, state)
      window.Renderer.drawMap(mapCtx, mapWrapper, state)
    })
  }

  if (yieldSliderEl) {
    yieldSliderEl.addEventListener('input', function (e: Event): void {
      syncSelectedFromControls(state, elements)
      if (bombTypeEl) bombTypeEl.value = 'custom'
      const selected = getSelectedExplosion(state)
      if (selected) selected.bombType = 'custom'
      updateCalculationsForExplosion(getSelectedExplosion(state))
      refreshExplosionList(state, elements)
      window.DataDisplay.updateDataDisplay(dataElements, state)
      window.Renderer.drawMap(mapCtx, mapWrapper, state)
    })
  }

  if (burstHeightEl) {
    burstHeightEl.addEventListener('change', function (): void {
      syncSelectedFromControls(state, elements)
      updateCalculationsForExplosion(getSelectedExplosion(state))
      refreshExplosionList(state, elements)
      window.DataDisplay.updateDataDisplay(dataElements, state)
      window.Renderer.drawMap(mapCtx, mapWrapper, state)
    })
  }

  if (scaleSliderEl) {
    scaleSliderEl.addEventListener('input', function (e: Event): void {
      const target = e.target as HTMLInputElement
      state.scale = parseInt(target.value, 10)
      if (elements.scaleValue) elements.scaleValue.textContent = String(state.scale)
      window.Renderer.drawMap(mapCtx, mapWrapper, state)
    })
  }

  if (showLabelsEl) {
    showLabelsEl.addEventListener('change', function (e: Event): void {
      const target = e.target as HTMLInputElement
      state.showLabels = target.checked
      window.Renderer.drawMap(mapCtx, mapWrapper, state)
    })
  }

  if (showLegendEl) {
    showLegendEl.addEventListener('change', function (e: Event): void {
      const target = e.target as HTMLInputElement
      state.showLegend = target.checked
      if (elements.legend) elements.legend.classList.toggle('hidden', !target.checked)
    })
  }

  if (addExplosionBtn) {
    addExplosionBtn.addEventListener('click', function (): void {
      if (state.isAnimating) return
      addExplosion(state, elements, mapWrapper)
      window.DataDisplay.updateDataDisplay(dataElements, state)
      window.Renderer.drawMap(mapCtx, mapWrapper, state)
    })
  }

  if (removeExplosionBtn) {
    removeExplosionBtn.addEventListener('click', function (): void {
      if (state.isAnimating) return
      removeSelectedExplosion(state, elements)
      window.DataDisplay.updateDataDisplay(dataElements, state)
      window.Renderer.drawMap(mapCtx, mapWrapper, state)
    })
  }

  document.querySelectorAll('.toggle-btn').forEach(function (btn: Element): void {
    btn.addEventListener('click', function (): void {
      handleViewToggle((btn as HTMLElement).dataset.view || '', state, elements, dataElements)
    })
  })

  if (detonateBtn) {
    detonateBtn.addEventListener('click', function (): void {
      triggerDetonate(state, elements, effectCtx, effectCanvas, mapWrapper, flashOverlay)
    })
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', function (): void {
      resetAll(state, elements, dataElements, effectCtx, mapWrapper, flashOverlay, mapHint, mapCtx)
    })
  }

  if (terrainEnabledEl) {
    terrainEnabledEl.addEventListener('change', function (e: Event): void {
      const target = e.target as HTMLInputElement
      state.terrainEnabled = target.checked
      regenerateTerrain(state, elements, mapCtx, mapWrapper, dataElements, false)
    })
  }

  if (terrainPresetEl) {
    terrainPresetEl.addEventListener('change', function (e: Event): void {
      const target = e.target as HTMLSelectElement
      state.terrainPreset = target.value
      regenerateTerrain(state, elements, mapCtx, mapWrapper, dataElements, false)
    })
  }

  if (terrainIntensityEl) {
    terrainIntensityEl.addEventListener('input', function (e: Event): void {
      const target = e.target as HTMLInputElement
      state.terrainIntensity = parseFloat(target.value)
      if (elements.terrainIntensityValue) {
        elements.terrainIntensityValue.textContent = state.terrainIntensity.toFixed(1)
      }
      regenerateTerrain(state, elements, mapCtx, mapWrapper, dataElements, false)
    })
  }

  if (showTerrainHeatmapEl) {
    showTerrainHeatmapEl.addEventListener('change', function (e: Event): void {
      const target = e.target as HTMLInputElement
      state.showTerrainHeatmap = target.checked
      window.Renderer.drawMap(mapCtx, mapWrapper, state)
    })
  }

  if (showTerrainContoursEl) {
    showTerrainContoursEl.addEventListener('change', function (e: Event): void {
      const target = e.target as HTMLInputElement
      state.showTerrainContours = target.checked
      window.Renderer.drawMap(mapCtx, mapWrapper, state)
    })
  }

  if (regenerateTerrainBtn) {
    regenerateTerrainBtn.addEventListener('click', function (): void {
      regenerateTerrain(state, elements, mapCtx, mapWrapper, dataElements, true)
    })
  }

  if (evacuationEnabledEl) {
    evacuationEnabledEl.addEventListener('change', function (e: Event): void {
      const target = e.target as HTMLInputElement
      state.evacuationEnabled = target.checked
      if (state.evacuationEnabled && state.shelters && state.shelters.length > 0) {
        recalculateEvacuation(state, elements, mapCtx, mapWrapper)
      }
      if (elements.evacuationPanel) {
        elements.evacuationPanel.classList.toggle('hidden', !target.checked)
      }
      window.Renderer.drawMap(mapCtx, mapWrapper, state)
    })
  }

  if (shelterCountEl) {
    shelterCountEl.addEventListener('change', function (): void {
      updateShelterCount(state, elements, mapCtx, mapWrapper)
    })
  }

  if (warningTimeSliderEl) {
    warningTimeSliderEl.addEventListener('input', function (e: Event): void {
      const target = e.target as HTMLInputElement
      const value = parseInt(target.value, 10)
      if (elements.warningTimeValue) {
        elements.warningTimeValue.textContent = String(value)
      }
    })
    warningTimeSliderEl.addEventListener('change', function (): void {
      recalculateEvacuation(state, elements, mapCtx, mapWrapper)
      window.Renderer.drawMap(mapCtx, mapWrapper, state)
      resetEvacAnimation(state, elements, effectCtx, effectCanvas)
    })
  }

  if (roadCapacityEl) {
    roadCapacityEl.addEventListener('change', function (): void {
      recalculateEvacuation(state, elements, mapCtx, mapWrapper)
      window.Renderer.drawMap(mapCtx, mapWrapper, state)
      resetEvacAnimation(state, elements, effectCtx, effectCanvas)
    })
  }

  if (vehicleSpeedEl) {
    vehicleSpeedEl.addEventListener('change', function (): void {
      recalculateEvacuation(state, elements, mapCtx, mapWrapper)
      window.Renderer.drawMap(mapCtx, mapWrapper, state)
      resetEvacAnimation(state, elements, effectCtx, effectCanvas)
    })
  }

  if (recalcEvacBtn) {
    recalcEvacBtn.addEventListener('click', function (): void {
      recalculateEvacuation(state, elements, mapCtx, mapWrapper)
      window.Renderer.drawMap(mapCtx, mapWrapper, state)
      resetEvacAnimation(state, elements, effectCtx, effectCanvas)
    })
  }

  if (addShelterBtn) {
    addShelterBtn.addEventListener('click', function (): void {
      addShelter(state, elements, mapCtx, mapWrapper)
      resetEvacAnimation(state, elements, effectCtx, effectCanvas)
    })
  }

  if (evacStartBtn) {
    evacStartBtn.addEventListener('click', function (): void {
      startEvacAnimation(state, elements, effectCtx, effectCanvas)
    })
  }

  if (evacPauseBtn) {
    evacPauseBtn.addEventListener('click', function (): void {
      pauseEvacAnimation(elements)
    })
  }

  if (evacResetBtn) {
    evacResetBtn.addEventListener('click', function (): void {
      resetEvacAnimation(state, elements, effectCtx, effectCanvas)
    })
  }

  if (evacSpeedEl) {
    evacSpeedEl.addEventListener('change', function (e: Event): void {
      const target = e.target as HTMLSelectElement
      const speed: number = parseFloat(target.value)
      ;(window.Evacuation.setSpeed as any)(speed)
    })
  }

  document.querySelectorAll('.building-toggle-btn').forEach(function (btn: Element): void {
    btn.addEventListener('click', function (): void {
      handleBuildingViewToggle((btn as HTMLElement).dataset.buildingView || '', state, elements)
    })
  })

  if (buildingCitySelectEl) {
    buildingCitySelectEl.addEventListener('change', function (): void {
      window.DataDisplay.updateBuildingDisplay(elements, state)
    })
  }

  mapCanvas.addEventListener('click', function (e: MouseEvent): void {
    if (state.evacuationEnabled && state.selectedShelterIndex !== undefined && state.selectedShelterIndex !== null) {
      handleEvacCanvasClick(e, mapCanvas, state, mapCtx, mapWrapper, elements)
      resetEvacAnimation(state, elements, effectCtx, effectCanvas)
    } else {
      handleCanvasClick(e, mapCanvas, state, mapHint, dataElements, mapCtx, mapWrapper, elements)
    }
    window.DataDisplay.updateBuildingDisplay(elements, state)
  })

  let resizeTimeout: number | null = null
  window.addEventListener('resize', function (): void {
    if (resizeTimeout) clearTimeout(resizeTimeout)
    resizeTimeout = window.setTimeout(function (): void {
      window.Renderer.setupCanvas(mapCanvas, null, mapCtx, effectCtx, mapWrapper, state)
      updateAllCalculations(state)
      window.App.regenerateTerrain()
      updateTerrainInfo(state, elements)
      window.DataDisplay.updateDataDisplay(dataElements, state)
      window.Renderer.drawMap(mapCtx, mapWrapper, state)
    }, 200)
  })

  let editingZoneKey: string | null = null
  let draggedZoneIndex: number | null = null

  function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(function (x: number): string {
      const hex = Math.round(x).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }).join('')
  }

  function refreshZoneList(
    state: AppState,
    elements: UiElements,
    mapCtx: CanvasRenderingContext2D,
    mapWrapper: HTMLElement,
    dataElements: UiElements
  ): void {
    if (!elements.zoneList) return

    const zones = window.Physics.getZones()
    elements.zoneList.innerHTML = ''

    zones.forEach(function (zone: ZoneDef, index: number): void {
      const item = document.createElement('div')
      item.className = 'zone-item'
      item.draggable = true
      item.dataset.zoneKey = zone.key
      item.dataset.index = String(index)

      const color = zone.color || [128, 128, 128]
      const hexColor = rgbToHex(color[0], color[1], color[2])

      item.innerHTML = `
                    <div class="zone-drag-handle" title="拖动排序">⋮⋮</div>
                    <div class="zone-color-preview" style="background: ${hexColor};"></div>
                    <div class="zone-info">
                        <div class="zone-name">${zone.label}</div>
                        <div class="zone-key">${zone.key} · ${zone.overpressureThreshold} psi</div>
                    </div>
                    <div class="zone-actions">
                        <button class="zone-edit-btn" title="编辑">✏️</button>
                        <button class="zone-delete-btn" title="删除">🗑️</button>
                    </div>
                `

      item.addEventListener('dragstart', function (e: DragEvent): void {
        draggedZoneIndex = index
        item.classList.add('dragging')
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move'
        }
      })

      item.addEventListener('dragend', function (): void {
        item.classList.remove('dragging')
        draggedZoneIndex = null
        document.querySelectorAll('.zone-item').forEach(function (el: Element): void {
          el.classList.remove('drag-over')
        })
      })

      item.addEventListener('dragover', function (e: DragEvent): void {
        e.preventDefault()
        if (draggedZoneIndex !== null && draggedZoneIndex !== index) {
          item.classList.add('drag-over')
        }
      })

      item.addEventListener('dragleave', function (): void {
        item.classList.remove('drag-over')
      })

      item.addEventListener('drop', function (e: DragEvent): void {
        e.preventDefault()
        item.classList.remove('drag-over')
        if (draggedZoneIndex !== null && draggedZoneIndex !== index) {
          const allZones = window.Physics.getZones()
          const draggedKey = allZones[draggedZoneIndex].key
          window.Physics.moveZone(draggedKey, index)
          refreshAllZoneRelated(state, elements, mapCtx, mapWrapper, dataElements)
        }
      })

      const editBtn = item.querySelector('.zone-edit-btn') as HTMLElement
      if (editBtn) {
        editBtn.addEventListener('click', function (e: MouseEvent): void {
          e.stopPropagation()
          openZoneEditor(zone, elements)
        })
      }

      const deleteBtn = item.querySelector('.zone-delete-btn') as HTMLElement
      if (deleteBtn) {
        deleteBtn.addEventListener('click', function (e: MouseEvent): void {
          e.stopPropagation()
          if (zones.length <= 1) {
            alert('至少需要保留一个圈层！')
            return
          }
          if (confirm('确定要删除圈层 "' + zone.label + '" 吗？')) {
            window.Physics.removeZone(zone.key)
            refreshAllZoneRelated(state, elements, mapCtx, mapWrapper, dataElements)
          }
        })
      }

      elements.zoneList!.appendChild(item)
    })
  }

  function refreshAllZoneRelated(
    state: AppState,
    elements: UiElements,
    mapCtx: CanvasRenderingContext2D,
    mapWrapper: HTMLElement,
    dataElements: UiElements
  ): void {
    ;updateAllCalculations(state)
    ;(window.DataDisplay.generateDataPanels as any)(dataElements)
    ;(window.DataDisplay.generateLegend as any)(dataElements)
    window.DataDisplay.updateDataDisplay(dataElements, state)
    window.Renderer.drawMap(mapCtx, mapWrapper, state)
    refreshZoneList(state, elements, mapCtx, mapWrapper, dataElements)
  }

  function openZoneEditor(zone: ZoneDef | null, elements: UiElements): void {
    editingZoneKey = zone ? zone.key : null

    const zoneKeyEl = elements.zoneKey as HTMLInputElement
    const zoneLabelEl = elements.zoneLabel as HTMLInputElement
    const zoneColorInputEl = elements.zoneColor as HTMLInputElement
    const zoneColorTextInputEl = elements.zoneColorText as HTMLInputElement
    const zoneDescriptionEl = elements.zoneDescription as HTMLTextAreaElement
    const zoneMinRadiusEl = elements.zoneMinRadius as HTMLInputElement
    const zoneRadiusFormulaEl = elements.zoneRadiusFormula as HTMLInputElement
    const zoneHeightFactorEl = elements.zoneHeightFactor as HTMLSelectElement
    const zoneDashEl = elements.zoneDash as HTMLSelectElement
    const zoneOverpressureEl = elements.zoneOverpressure as HTMLInputElement
    const zoneAltitudeSensInputEl = elements.zoneAltitudeSens as HTMLInputElement
    const zoneDestroyedEl = elements.zoneDestroyed as HTMLInputElement
    const zoneDeathRateInputEl = elements.zoneDeathRate as HTMLInputElement
    const zoneInjuryRateInputEl = elements.zoneInjuryRate as HTMLInputElement

    if (zone) {
      if (elements.zoneEditorTitle) elements.zoneEditorTitle.textContent = '编辑圈层: ' + zone.label
      if (zoneKeyEl) zoneKeyEl.value = zone.key
      if (zoneLabelEl) zoneLabelEl.value = zone.label
      const colorHex = rgbToHex(zone.color[0], zone.color[1], zone.color[2])
      if (zoneColorInputEl) zoneColorInputEl.value = colorHex
      if (zoneColorTextInputEl) zoneColorTextInputEl.value = colorHex
      if (zoneDescriptionEl) zoneDescriptionEl.value = zone.description || ''
      if (zoneMinRadiusEl) zoneMinRadiusEl.value = String(zone.minRadius || 0.5)
      if (zoneRadiusFormulaEl) zoneRadiusFormulaEl.value = zone.radiusFormula || ''
      if (zoneHeightFactorEl) zoneHeightFactorEl.value = zone.heightFactorType || 'height'
      if (zoneDashEl) {
        zoneDashEl.value = typeof zone.dash === 'string' ? zone.dash : (zone.dash ? 'dashed4' : 'solid')
      }
      if (zoneOverpressureEl) zoneOverpressureEl.value = String(zone.overpressureThreshold || 5)
      if (zoneAltitudeSensInputEl) zoneAltitudeSensInputEl.value = String(zone.altitudeSensitivity || 0.3)
      if (elements.zoneAltitudeSensValue) {
        elements.zoneAltitudeSensValue.textContent = (zone.altitudeSensitivity || 0.3).toFixed(2)
      }
      if (zoneDestroyedEl) zoneDestroyedEl.checked = zone.casualtyRates ? zone.casualtyRates.destroyed : false
      if (zoneDeathRateInputEl) zoneDeathRateInputEl.value = String(zone.casualtyRates ? zone.casualtyRates.deaths : 0.1)
      if (elements.zoneDeathRateValue) {
        elements.zoneDeathRateValue.textContent = (zone.casualtyRates ? zone.casualtyRates.deaths : 0.1).toFixed(2)
      }
      if (zoneInjuryRateInputEl) zoneInjuryRateInputEl.value = String(zone.casualtyRates ? zone.casualtyRates.injured : 0.2)
      if (elements.zoneInjuryRateValue) {
        elements.zoneInjuryRateValue.textContent = (zone.casualtyRates ? zone.casualtyRates.injured : 0.2).toFixed(2)
      }
    } else {
      if (elements.zoneEditorTitle) elements.zoneEditorTitle.textContent = '新增圈层'
      if (zoneKeyEl) zoneKeyEl.value = ''
      if (zoneLabelEl) zoneLabelEl.value = ''
      if (zoneColorInputEl) zoneColorInputEl.value = '#ff6600'
      if (zoneColorTextInputEl) zoneColorTextInputEl.value = '#ff6600'
      if (zoneDescriptionEl) zoneDescriptionEl.value = ''
      if (zoneMinRadiusEl) zoneMinRadiusEl.value = '0.5'
      if (zoneRadiusFormulaEl) zoneRadiusFormulaEl.value = '1.0 * Math.pow(W, 0.4)'
      if (zoneHeightFactorEl) zoneHeightFactorEl.value = 'height'
      if (zoneDashEl) zoneDashEl.value = 'solid'
      if (zoneOverpressureEl) zoneOverpressureEl.value = '5'
      if (zoneAltitudeSensInputEl) zoneAltitudeSensInputEl.value = '0.3'
      if (elements.zoneAltitudeSensValue) elements.zoneAltitudeSensValue.textContent = '0.30'
      if (zoneDestroyedEl) zoneDestroyedEl.checked = false
      if (zoneDeathRateInputEl) zoneDeathRateInputEl.value = '0.1'
      if (elements.zoneDeathRateValue) elements.zoneDeathRateValue.textContent = '0.10'
      if (zoneInjuryRateInputEl) zoneInjuryRateInputEl.value = '0.2'
      if (elements.zoneInjuryRateValue) elements.zoneInjuryRateValue.textContent = '0.20'
    }

    if (elements.zoneEditorModal) {
      elements.zoneEditorModal.style.display = 'flex'
    }
  }

  function closeZoneEditor(elements: UiElements): void {
    if (elements.zoneEditorModal) {
      elements.zoneEditorModal.style.display = 'none'
    }
    editingZoneKey = null
  }

  function handleZoneSave(
    state: AppState,
    elements: UiElements,
    mapCtx: CanvasRenderingContext2D,
    mapWrapper: HTMLElement,
    dataElements: UiElements
  ): void {
    const zoneKeyEl = elements.zoneKey as HTMLInputElement
    const zoneLabelEl = elements.zoneLabel as HTMLInputElement
    const zoneColorTextInputEl = elements.zoneColorText as HTMLInputElement
    const zoneDescriptionEl = elements.zoneDescription as HTMLTextAreaElement
    const zoneMinRadiusEl = elements.zoneMinRadius as HTMLInputElement
    const zoneRadiusFormulaEl = elements.zoneRadiusFormula as HTMLInputElement
    const zoneHeightFactorEl = elements.zoneHeightFactor as HTMLSelectElement
    const zoneDashEl = elements.zoneDash as HTMLSelectElement
    const zoneOverpressureEl = elements.zoneOverpressure as HTMLInputElement
    const zoneAltitudeSensInputEl = elements.zoneAltitudeSens as HTMLInputElement
    const zoneDestroyedEl = elements.zoneDestroyed as HTMLInputElement
    const zoneDeathRateInputEl = elements.zoneDeathRate as HTMLInputElement
    const zoneInjuryRateInputEl = elements.zoneInjuryRate as HTMLInputElement

    const key = zoneKeyEl ? zoneKeyEl.value.trim() : ''
    const label = zoneLabelEl ? zoneLabelEl.value.trim() : ''

    if (!key || !label) {
      alert('圈层标识和名称不能为空！')
      return
    }

    if (!/^[a-z_][a-z0-9_]*$/i.test(key)) {
      alert('圈层标识只能包含字母、数字和下划线，且必须以字母或下划线开头！')
      return
    }

    const colorValue = zoneColorTextInputEl ? zoneColorTextInputEl.value : ''
    const colorMatch = colorValue.match(/^#?([0-9a-f]{6})$/i)
    if (!colorMatch) {
      alert('请输入有效的颜色值（如 #ff0000）！')
      return
    }

    const colorHex = colorMatch[1]
    const color: number[] = [
      parseInt(colorHex.substr(0, 2), 16),
      parseInt(colorHex.substr(2, 2), 16),
      parseInt(colorHex.substr(4, 2), 16)
    ]

    let dashValue: string | null = zoneDashEl ? zoneDashEl.value : 'solid'
    if (dashValue === 'solid') dashValue = null

    const zoneDef: Omit<ZoneDef, 'order'> = {
      key: key,
      label: label,
      color: color,
      description: zoneDescriptionEl ? zoneDescriptionEl.value.trim() : '',
      minRadius: zoneMinRadiusEl ? parseFloat(zoneMinRadiusEl.value) || 0.1 : 0.1,
      radiusFormula: zoneRadiusFormulaEl ? zoneRadiusFormulaEl.value.trim() : '',
      heightFactorType: zoneHeightFactorEl ? zoneHeightFactorEl.value as ZoneDef['heightFactorType'] : 'height',
      dash: dashValue ? [parseInt(dashValue.replace('dashed', ''), 10)] : null,
      overpressureThreshold: zoneOverpressureEl ? parseFloat(zoneOverpressureEl.value) || 0 : 0,
      altitudeSensitivity: zoneAltitudeSensInputEl ? parseFloat(zoneAltitudeSensInputEl.value) || 0 : 0,
      casualtyRates: {
        deaths: zoneDeathRateInputEl ? parseFloat(zoneDeathRateInputEl.value) || 0 : 0,
        injured: zoneInjuryRateInputEl ? parseFloat(zoneInjuryRateInputEl.value) || 0 : 0,
        destroyed: zoneDestroyedEl ? zoneDestroyedEl.checked : false
      }
    }

    let result: { success: boolean; error?: string; zone?: ZoneDef }
    if (editingZoneKey) {
      result = window.Physics.updateZone(editingZoneKey, zoneDef)
    } else {
      result = window.Physics.addZone(zoneDef)
    }

    if (result.success) {
      closeZoneEditor(elements)
      refreshAllZoneRelated(state, elements, mapCtx, mapWrapper, dataElements)
    } else {
      alert('保存失败: ' + result.error)
    }
  }

  if (addZoneBtn) {
    addZoneBtn.addEventListener('click', function (): void {
      openZoneEditor(null, elements)
    })
  }

  if (resetZonesBtn) {
    resetZonesBtn.addEventListener('click', function (): void {
      if (confirm('确定要恢复所有默认圈层设置吗？当前的自定义修改将丢失。')) {
        window.Physics.resetZones()
        refreshAllZoneRelated(state, elements, mapCtx, mapWrapper, dataElements)
      }
    })
  }

  if (zoneEditorCloseEl) {
    zoneEditorCloseEl.addEventListener('click', function (): void {
      closeZoneEditor(elements)
    })
  }

  if (zoneEditorOverlayEl) {
    zoneEditorOverlayEl.addEventListener('click', function (): void {
      closeZoneEditor(elements)
    })
  }

  if (zoneEditorCancelEl) {
    zoneEditorCancelEl.addEventListener('click', function (): void {
      closeZoneEditor(elements)
    })
  }

  if (zoneEditorSaveEl) {
    zoneEditorSaveEl.addEventListener('click', function (): void {
      handleZoneSave(state, elements, mapCtx, mapWrapper, dataElements)
    })
  }

  if (zoneColorEl && zoneColorTextEl) {
    zoneColorEl.addEventListener('input', function (): void {
      zoneColorTextEl.value = zoneColorEl.value
    })
    zoneColorTextEl.addEventListener('input', function (): void {
      if (/^#?[0-9a-f]{6}$/i.test(zoneColorTextEl.value)) {
        zoneColorEl.value = zoneColorTextEl.value.startsWith('#')
          ? zoneColorTextEl.value
          : '#' + zoneColorTextEl.value
      }
    })
  }

  if (zoneAltitudeSensEl && elements.zoneAltitudeSensValue) {
    zoneAltitudeSensEl.addEventListener('input', function (): void {
      if (elements.zoneAltitudeSensValue) {
        elements.zoneAltitudeSensValue.textContent = parseFloat(zoneAltitudeSensEl.value).toFixed(2)
      }
    })
  }

  if (zoneDeathRateEl && elements.zoneDeathRateValue) {
    zoneDeathRateEl.addEventListener('input', function (): void {
      if (elements.zoneDeathRateValue) {
        elements.zoneDeathRateValue.textContent = parseFloat(zoneDeathRateEl.value).toFixed(2)
      }
    })
  }

  if (zoneInjuryRateEl && elements.zoneInjuryRateValue) {
    zoneInjuryRateEl.addEventListener('input', function (): void {
      if (elements.zoneInjuryRateValue) {
        elements.zoneInjuryRateValue.textContent = parseFloat(zoneInjuryRateEl.value).toFixed(2)
      }
    })
  }

  ;(window.DataDisplay.generateDataPanels as any)(dataElements)
  ;(window.DataDisplay.generateLegend as any)(dataElements)
  refreshZoneList(state, elements, mapCtx, mapWrapper, dataElements)
}
;
const uiModule: any = {
  getControlElements,
  setupEventListeners,
  updateCalculations: updateCalculationsForExplosion,
  updateAllCalculations,
  handleCanvasClick,
  refreshExplosionList,
  syncControlsFromSelected,
  syncTerrainControlsFromState,
  syncStateFromTerrainControls,
  updateTerrainInfo,
  regenerateTerrain,
  recalculateEvacuation,
  updateEvacuationDisplay,
  addShelter,
  updateShelterCount,
  startEvacAnimation,
  pauseEvacAnimation,
  resetEvacAnimation,
  handleEvacCanvasClick,
  findNearestShelter
}

export const UI = uiModule

;(window as any).UI = UI

export default UI