<template>
  <div class="news-detail-page">
    <van-nav-bar
      :title="$t('news')"
      left-arrow
      @click-left="goBack"
    />

    <div v-if="news" class="news-detail">
      <h1 class="news-title">{{ news.title }}</h1>
      <div class="news-meta">
        <span class="news-author">{{ news.author }}</span>
        <span class="news-time">{{ news.publishTime }}</span>
        <span class="news-views">{{ news.views }}阅读</span>
      </div>
      <van-image v-if="news.image" v-lazy="news.image" class="news-image" fit="cover" @error="handleImageError" />
      <div class="news-content" v-html="news.content"></div>
      
      <div class="news-actions">
        <van-button
          type="primary"
          :icon="isFavorite ? 'star' : 'star-o'"
          @click="toggleFavorite"
        >
          {{ isFavorite ? $t('removeFavorite') : $t('addFavorite') }}
        </van-button>
      </div>

      <div v-if="relatedNews.length > 0" class="related-news">
        <h3 class="related-title">{{ $t('relatedNews') }}</h3>
        <van-cell-group>
          <van-cell
            v-for="item in relatedNews"
            :key="item.id"
            :title="item.title"
            @click="goToDetail(item.id)"
            is-link
          />
        </van-cell-group>
      </div>
    </div>

    <div v-else class="loading">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { newsApi, favoriteApi, historyApi } from '../api'
import { useUserStore } from '../store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const news = ref(null)
const relatedNews = ref([])
const isFavorite = ref(false)
const newsId = ref(0)

onMounted(() => {
  newsId.value = parseInt(route.params.id)
  loadNewsDetail()
})

watch(() => route.params.id, (newId) => {
  if (newId) {
    newsId.value = parseInt(newId)
    loadNewsDetail()
  }
})

async function loadNewsDetail() {
  window.scrollTo(0, 0)
  news.value = null
  try {
    const res = await newsApi.getDetail({ id: newsId.value })
    if (res.code === 200) {
      news.value = res.data
      relatedNews.value = res.data.relatedNews || []
      checkFavorite()
      addHistory()
    }
  } catch (error) {
    console.error('加载新闻详情失败:', error)
  }
}

async function addHistory() {
  if (!userStore.token) return
  try {
    console.log('添加历史记录:', { newsId: newsId.value, token: userStore.token })
    const res = await historyApi.add({ newsId: newsId.value })
    console.log('添加历史记录成功:', res)
  } catch (error) {
    console.error('添加历史记录失败:', error)
    console.error('错误详情:', error.response?.data || error.message || error)
  }
}

async function checkFavorite() {
  if (!userStore.token) return
  try {
    const res = await favoriteApi.check({ newsId: newsId.value })
    if (res.code === 200) {
      isFavorite.value = res.data.isFavorite
    }
  } catch (error) {
    console.error('检查收藏状态失败:', error)
  }
}

async function toggleFavorite() {
  if (!userStore.token) {
    router.push('/login')
    return
  }

  try {
    if (isFavorite.value) {
      const res = await favoriteApi.remove({ newsId: newsId.value })
      if (res.code === 200) {
        isFavorite.value = false
      }
    } else {
      const res = await favoriteApi.add({ newsId: newsId.value })
      if (res.code === 200) {
        isFavorite.value = true
      }
    }
  } catch (error) {
    console.error('操作收藏失败:', error)
  }
}

function goBack() {
  router.back()
}

function goToDetail(id) {
  router.push(`/news/${id}`)
}

function handleImageError(event) {
  const img = event.target
  if (img) {
    img.style.display = 'none'
  }
}
</script>

<style scoped>
.news-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.news-detail {
  background: #fff;
  padding: 16px;
}

.news-title {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  line-height: 1.5;
  margin-bottom: 16px;
}

.news-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
  color: #999;
  margin-bottom: 16px;
}

.news-image {
  width: 100%;
  height: auto;
  border-radius: 8px;
  margin-bottom: 16px;
}

.news-content {
  font-size: 16px;
  color: #333;
  line-height: 1.8;
}

.news-actions {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

.related-news {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f5f5f5;
}

.related-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.loading {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 50vh;
  gap: 12px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>