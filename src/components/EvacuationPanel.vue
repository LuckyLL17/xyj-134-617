<template>
  <div class="evacuation-panel" :class="{ hidden: !state.evacuationEnabled }">
    <div class="panel-header">
      <h3>🚗 撤离模拟</h3>
      <div class="evac-mode-badge">就绪</div>
    </div>
    <div class="evac-stats-grid">
      <div class="evac-stat-item">
        <span class="evac-stat-icon">👥</span>
        <div>
          <div class="evac-stat-label">总人口</div>
          <div class="evac-stat-value">0</div>
        </div>
      </div>
      <div class="evac-stat-item success">
        <span class="evac-stat-icon">✅</span>
        <div>
          <div class="evac-stat-label">可撤离</div>
          <div class="evac-stat-value">0</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AppState } from '../types'

defineProps<{
  state: AppState
}>()
</script>
