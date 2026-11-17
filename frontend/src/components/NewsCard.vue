<template>
  <article class="news-item" :data-news-id="news.id" @click="$emit('select', news.id)">
    <div class="news-content">
      <h3 class="news-title">{{ news.title }}</h3>
      <p class="news-description">{{ news.description }}</p>
      <div class="news-meta">
        <span class="news-author">{{ news.author }}</span>
        <span class="news-time">{{ formatTime(news.publish_time) }}</span>
        <span class="news-views">{{ news.views }}阅读</span>
      </div>
    </div>
    <img
      v-if="news.image"
      v-bind="imageProps"
      class="news-image"
      :alt="news.title"
      width="100"
      height="80"
      :loading="priority ? 'eager' : 'lazy'"
      :fetchpriority="priority ? 'high' : 'auto'"
      decoding="async"
      @error="handleImageError"
    />
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { getThumbnailProps } from '../utils/image'

const props = defineProps({
  news: { type: Object, required: true },
  priority: { type: Boolean, default: false }
})

defineEmits(['select'])

const imageProps = computed(() => getThumbnailProps(props.news.image))

function formatTime(timeStr) {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return timeStr.slice(0, 10)
}

function handleImageError(event) {
  event.target.style.display = 'none'
}
</script>

<style scoped>
.news-item {
  display: flex;
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #f5f5f5;
  gap: 12px;
  cursor: pointer;
}

.news-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.news-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 8px;
}

.news-description {
  font-size: 14px;
  color: #999;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.news-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}

.news-image {
  width: 100px;
  height: 80px;
  flex-shrink: 0;
  border-radius: 6px;
  object-fit: cover;
  background: #f5f5f5;
}
</style>
