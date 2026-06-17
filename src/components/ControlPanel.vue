<template>
  <aside class="control-panel">
    <section class="panel-section">
      <h2>爆炸点管理</h2>
      <div class="explosion-list">
        <div
          v-for="explosion in explosions"
          :key="explosion.id"
          :class="['explosion-item', { active: explosion.id === selectedExplosionId }]"
          @click="$emit('select-explosion', explosion.id)"
        >
          <div class="explosion-item-left">
            <div class="explosion-number">{{ explosion.id }}</div>
            <div class="explosion-meta">
              <div class="explosion-title">爆炸点 #{{ explosion.id }}</div>
              <div class="explosion-sub">{{ explosion.yieldKilotons }} 千吨</div>
            </div>
          </div>
          <div
            :class="[
              'explosion-position-indicator',
              explosion.explosionCenter ? 'set' : 'unset'
            ]"
          ></div>
        </div>
        <div v-if="explosions.length === 0" class="empty-list-tip">暂无爆炸点</div>
      </div>
      <div class="explosion-actions">
        <button class="add-btn" @click="$emit('add-explosion')">
          <span class="btn-icon">+</span> 添加爆炸点
        </button>
        <button class="remove-btn" @click="$emit('remove-explosion')">
          <span class="btn-icon">−</span> 删除选中
        </button>
      </div>
      <div class="explosion-info">
        <span class="info-text">当前爆炸点数量：</span>
        <span class="info-count">{{ explosions.length }}</span>
      </div>
    </section>
  </aside>
</template>

<script setup lang="ts">
import type { Explosion } from '../types'

defineProps<{
  explosions: Explosion[]
  selectedExplosionId: number | null
  viewMode: string
}>()

defineEmits<{
  (e: 'add-explosion'): void
  (e: 'remove-explosion'): void
  (e: 'select-explosion', id: number): void
  (e: 'update-params', params: any): void
}>()
</script>
