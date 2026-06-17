<template>
  <div class="legend" :class="{ hidden: !show }">
    <h3>破坏圈层图例</h3>
    <div class="legend-items">
      <div v-for="zone in zones" :key="zone.key" class="legend-item">
        <div class="legend-color" :style="{ background: zone.color }"></div>
        <div class="legend-text">
          <strong>{{ zone.label }}</strong>
          <span>{{ zone.description }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ZoneConfig } from '../types'

defineProps<{
  zones: ZoneConfig[]
  show?: boolean
}>()
</script>
