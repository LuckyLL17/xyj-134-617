<template>
  <div class="timeline-panel">
    <div class="panel-header">
      <h3>⏱️ 时间轴推演</h3>
      <div class="timeline-mode-badge">待机中</div>
    </div>
    <div class="timeline-stages">
      <div class="stage-dot active" data-stage="0">
        <div class="stage-marker"></div>
        <span class="stage-label">爆炸瞬间</span>
        <span class="stage-time">T+0</span>
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
