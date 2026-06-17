<template>
  <div class="casualty-panel">
    <div class="panel-header">
      <h3>📊 影响预估</h3>
      <div class="view-toggle">
        <button class="toggle-btn active" data-view="combined">联合影响</button>
        <button class="toggle-btn" data-view="selected">选中爆炸点</button>
      </div>
    </div>
    <div class="casualty-grid">
      <div class="casualty-item">
        <span class="casualty-icon">💀</span>
        <div>
          <div class="casualty-label">预估死亡人数</div>
          <div class="casualty-value">0</div>
        </div>
      </div>
      <div class="casualty-item">
        <span class="casualty-icon">🩹</span>
        <div>
          <div class="casualty-label">预估受伤人数</div>
          <div class="casualty-value">0</div>
        </div>
      </div>
      <div class="casualty-item">
        <span class="casualty-icon">🏙️</span>
        <div>
          <div class="casualty-label">影响区域面积</div>
          <div class="casualty-value">0 km²</div>
        </div>
      </div>
      <div class="casualty-item">
        <span class="casualty-icon">⚡</span>
        <div>
          <div class="casualty-label">总释放能量</div>
          <div class="casualty-value">0 TJ</div>
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
