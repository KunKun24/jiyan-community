<template>
  <div class="sk-list" aria-busy="true" aria-label="正在加载">
    <div v-for="i in rows" :key="i" class="sk-row" :class="{ compact }">
      <div v-if="thumb" class="sk-thumb" />
      <div class="sk-main">
        <div class="sk-line w70" />
        <div class="sk-line w45" />
        <div v-if="!compact" class="sk-line w30" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ rows?: number; thumb?: boolean; compact?: boolean }>(), {
  rows: 6,
  thumb: false,
  compact: false,
})
</script>

<style scoped>
.sk-list { display: flex; flex-direction: column; gap: 10px; padding: 4px 0; }
.sk-row {
  display: flex; gap: 14px; align-items: center;
  padding: 16px 18px; background: #fff; border: 1px solid var(--line); border-radius: 12px;
}
.sk-row.compact { padding: 12px 14px; }
.sk-thumb {
  width: 96px; height: 72px; flex: none; border-radius: 8px;
  background: linear-gradient(90deg, #efece5 25%, #f7f5f0 37%, #efece5 63%);
  background-size: 400% 100%; animation: sk-shine 1.4s ease infinite;
}
.sk-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 9px; }
.sk-line {
  height: 12px; border-radius: 6px;
  background: linear-gradient(90deg, #efece5 25%, #f7f5f0 37%, #efece5 63%);
  background-size: 400% 100%; animation: sk-shine 1.4s ease infinite;
}
.sk-line.w70 { width: 70%; }
.sk-line.w45 { width: 45%; height: 10px; }
.sk-line.w30 { width: 30%; height: 9px; }
@keyframes sk-shine { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }
@media (prefers-reduced-motion: reduce) {
  .sk-line, .sk-thumb { animation: none; }
}
</style>
