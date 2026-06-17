<template>
  <div class="map-wrapper" ref="mapWrapperRef">
    <canvas ref="mapCanvasRef" id="mapCanvas"></canvas>
    <canvas ref="effectCanvasRef" id="effectCanvas"></canvas>
    <div id="flashOverlay" class="flash-overlay"></div>
    <div class="map-hint" :class="{ hidden: state.explosions.length > 0 }">
      👆 点击地图选择爆炸位置
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { AppState } from '../types'

const props = defineProps<{
  state: AppState
}>()

const mapWrapperRef = ref<HTMLDivElement | null>(null)
const mapCanvasRef = ref<HTMLCanvasElement | null>(null)
const effectCanvasRef = ref<HTMLCanvasElement | null>(null)

onMounted(() => {
  if (typeof window !== 'undefined' && window.Renderer && mapCanvasRef.value && effectCanvasRef.value && mapWrapperRef.value) {
    const mapCtx = mapCanvasRef.value.getContext('2d')
    const effectCtx = effectCanvasRef.value.getContext('2d')
    if (mapCtx && effectCtx) {
      window.Renderer.setupCanvas(
        mapCanvasRef.value,
        effectCanvasRef.value,
        mapCtx,
        effectCtx,
        mapWrapperRef.value,
        props.state
      )
      window.Renderer.drawMap(mapCtx, mapWrapperRef.value, props.state)
    }
  }
})

watch(
  () => props.state.explosions.length,
  () => {
    if (mapCanvasRef.value && mapWrapperRef.value) {
      const ctx = mapCanvasRef.value.getContext('2d')
      if (ctx && typeof window !== 'undefined' && window.Renderer) {
        window.Renderer.drawMap(ctx, mapWrapperRef.value, props.state)
      }
    }
  }
)
</script>
