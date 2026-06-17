<template>
  <div class="building-panel">
    <div class="panel-header">
      <h3>🏗️ 建筑结构等级</h3>
    </div>
    <div class="building-summary">
      <div class="building-stats-grid">
        <div class="building-stat-item">
          <span class="building-stat-icon">🏢</span>
          <div>
            <div class="building-stat-label">总人口</div>
            <div class="building-stat-value">0</div>
          </div>
        </div>
        <div class="building-stat-item">
          <span class="building-stat-icon">💥</span>
          <div>
            <div class="building-stat-label">建筑摧毁人口</div>
            <div class="building-stat-value danger">0</div>
          </div>
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
