<script setup lang="ts">
import { onMounted } from 'vue'
import { loadMe } from './store'

onMounted(loadMe)
</script>

<template>
  <RouterView />
</template>
