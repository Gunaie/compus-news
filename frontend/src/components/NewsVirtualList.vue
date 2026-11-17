<template>
  <div ref="parentRef" class="virtual-list" :style="{ height: `${totalSize}px` }">
    <div
      v-for="virtualRow in virtualRows"
      :key="virtualRow.key"
      :ref="measureElement"
      :data-index="virtualRow.index"
      class="virtual-row"
      :style="{ transform: `translateY(${virtualRow.start - scrollMargin}px)` }"
    >
      <NewsCard
        :news="items[virtualRow.index]"
        :priority="virtualRow.index === 0"
        @select="$emit('select', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useWindowVirtualizer } from '@tanstack/vue-virtual'
import NewsCard from './NewsCard.vue'

const props = defineProps({
  items: { type: Array, required: true }
})

defineEmits(['select'])

const parentRef = ref(null)
const virtualizer = useWindowVirtualizer({
  count: props.items.length,
  estimateSize: () => 176,
  overscan: 5,
  getItemKey: (index) => props.items[index]?.id ?? index,
  scrollMargin: 0
})

const virtualRows = computed(() => virtualizer.value.getVirtualItems())
const totalSize = computed(() => virtualizer.value.getTotalSize())
const scrollMargin = computed(() => virtualizer.value.options.scrollMargin || 0)

function updateOptions() {
  virtualizer.value.setOptions({
    ...virtualizer.value.options,
    count: props.items.length,
    getItemKey: (index) => props.items[index]?.id ?? index,
    scrollMargin: parentRef.value?.offsetTop || 0
  })
}

function measureElement(element) {
  if (element) {
    virtualizer.value.measureElement(element)
  }
}

watch(() => props.items, async () => {
  await nextTick()
  updateOptions()
  virtualizer.value.measure()
})

watch(() => props.items.length, updateOptions)
onMounted(updateOptions)
</script>

<style scoped>
.virtual-list {
  position: relative;
  width: 100%;
}

.virtual-row {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}
</style>
