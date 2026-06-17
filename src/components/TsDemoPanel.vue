<template>
  <div class="ts-demo-panel">
    <h3>📌 TypeScript 演示组件</h3>
    <div class="ts-demo-info">
      <div class="demo-row">
        <span>爆炸点数量：</span>
        <strong>{{ explosionCount }}</strong>
      </div>
      <div class="demo-row">
        <span>总当量：</span>
        <strong>{{ totalYield }} 千吨</strong>
      </div>
      <div class="demo-row">
        <span>总能量：</span>
        <strong>{{ totalEnergy }} TJ</strong>
      </div>
    </div>
    <button class="demo-btn" @click="refreshStats">刷新数据 (TS)</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Physics, App } from '@/legacy/index.js'
import type { Explosion } from '@/types/physics'

const explosionCount = ref(0)
const totalYield = ref(0)
const totalEnergy = ref(0)

let timer: number | null = null

function refreshStats(): void {
  const state = App.state as { explosions: Explosion[] }
  const explosions = state.explosions || []
  explosionCount.value = explosions.length
  totalYield.value = explosions.reduce((sum: number, e: Explosion) => sum + e.yieldKilotons, 0)
  totalEnergy.value = Math.round(
    explosions.reduce((sum: number, e: Explosion) => sum + Physics.calculateEnergy(e.yieldKilotons), 0)
  )
}

onMounted(() => {
  refreshStats()
  timer = window.setInterval(refreshStats, 1000)
})

onUnmounted(() => {
  if (timer !== null) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
.ts-demo-panel {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.ts-demo-panel h3 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: var(--text-primary);
}

.ts-demo-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.demo-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-secondary);
}

.demo-row strong {
  color: var(--accent-primary);
}

.demo-btn {
  width: 100%;
  padding: 8px 12px;
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: opacity 0.2s;
}

.demo-btn:hover {
  opacity: 0.9;
}
</style>
