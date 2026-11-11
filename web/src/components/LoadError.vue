<template>
  <div class="load-error" role="alert">
    <p>{{ message }}</p>
    <button class="load-retry" type="button" @click="$emit('retry')">重试</button>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ message?: string }>(), { message: '加载失败，网络可能不稳定。' })
defineEmits<{ retry: [] }>()
</script>

<style scoped>
.load-error {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 48px 20px; background: #fff; border: 1px solid var(--line); border-radius: 12px;
  text-align: center;
}
.load-error p { color: var(--muted); font-size: 14px; }
.load-retry {
  height: 34px; padding: 0 18px; border-radius: 8px; border: 1px solid var(--ink);
  background: var(--ink); color: #fff; font-size: 13.5px; cursor: pointer;
}
.load-retry:hover { opacity: 0.9; }
</style>
