<template>
  <div v-if="items.length" class="carousel" @mouseenter="paused = true" @mouseleave="paused = false">
    <div class="slides" :style="{ aspectRatio: ratio }">
      <component
        :is="item.link ? 'a' : 'div'"
        v-for="(item, i) in items"
        :key="item.id"
        class="slide"
        :class="{ active: i === active }"
        :href="item.link || undefined"
        :target="item.link ? '_blank' : undefined"
        :rel="item.link ? 'noopener' : undefined"
      >
        <img :src="item.image" :alt="item.title || '轮播图'" />
      </component>
    </div>
    <div v-if="items.length > 1" class="dots">
      <button v-for="(item, i) in items" :key="item.id" class="dot" :class="{ on: i === active }" :aria-label="`第 ${i + 1} 张`" @click="active = i" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { get } from '../api'

interface Banner { id: number; image: string; link: string; title: string }

const items = ref<Banner[]>([])
const active = ref(0)
const paused = ref(false)
const ratio = ref('16 / 6')
let timer: number | undefined

function updateRatio() {
  const item = items.value[active.value]
  if (!item) return
  const img = new Image()
  img.onload = () => {
    if (img.naturalWidth && img.naturalHeight) ratio.value = `${img.naturalWidth} / ${img.naturalHeight}`
  }
  img.src = item.image
}

function tick() {
  timer = window.setInterval(() => {
    if (!paused.value && items.value.length > 1) active.value = (active.value + 1) % items.value.length
  }, 4500)
}

onMounted(async () => {
  const r = await get<{ items: Banner[] }>('/api/banners')
  if (r.ok && r.data) items.value = r.data.items
  updateRatio()
  tick()
})
watch(active, updateRatio)
onBeforeUnmount(() => window.clearInterval(timer))
</script>

<style scoped>
.carousel { position: relative; border-radius: 14px; overflow: hidden; border: 1px solid var(--line); background: #fff; margin-bottom: 22px; }
.slides { position: relative; background: #f1ede6; }
.slide { position: absolute; inset: 0; opacity: 0; transition: opacity .5s ease; }
.slide.active { opacity: 1; }
.slide img { width: 100%; height: 100%; object-fit: cover; display: block; }
.dots { position: absolute; left: 50%; bottom: 10px; transform: translateX(-50%); display: flex; gap: 6px; }
.dot { width: 7px; height: 7px; border-radius: 50%; border: 0; background: rgba(255,255,255,.55); cursor: pointer; padding: 0; }
.dot.on { background: #fff; width: 18px; border-radius: 4px; }

</style>
