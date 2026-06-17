<template>
  <div class="data-panels">
    <div class="data-card">
      <h4>爆炸点数量</h4>
      <div class="data-value"><span>{{ state.explosions.length }}</span></div>
      <div class="data-desc">当前爆炸点总数</div>
    </div>
    <div class="data-card">
      <h4>总释放能量</h4>
      <div class="data-value"><span>{{ totalYield.toLocaleString() }}</span> <span class="unit">千吨</span></div>
      <div class="data-desc">所有爆炸点累加</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AppState, Explosion } from '../types'

const props = defineProps<{
  state: AppState
}>()

const totalYield = computed(() => {
  return props.state.explosions.reduce((sum: number, e: Explosion) => sum + e.yieldKilotons, 0)
})
</script>
