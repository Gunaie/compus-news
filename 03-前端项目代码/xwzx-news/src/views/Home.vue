<template>
  <div class="home-page">
    <van-nav-bar :title="$t('title')" />
    
    <van-tabs v-model:active="activeCategoryIndex" @change="handleCategoryChange" sticky>
      <van-tab v-for="cat in categories" :key="cat.id" :title="cat.name">
        <van-pull-refresh v-model="refreshing" @refresh="loadNews(true)" :disabled="!categories.length">
          <van-list
            v-model:loading="loading"
            :finished="finished"
            finished-text="没有更多了"
            @load="loadNews"
            :disabled="!categories.length"
          >
            <div
              v-for="news in newsList"
              :key="news.id"
              class="news-item"
              @click="goToDetail(news.id)"
            >
              <div class="news-content">
                <h3 class="news-title">{{ news.title }}</h3>
                <p class="news-description">{{ news.description }}</p>
                <div class="news-meta">
                  <span class="news-author">{{ news.author }}</span>
                  <span class="news-time">{{ formatTime(news.publish_time) }}</span>
                  <span class="news-views">{{ news.views }}阅读</span>
                </div>
              </div>
              <van-image
                v-if="news.image"
                v-lazy="news.image"
                class="news-image"
                fit="cover"
                @error="handleImageError($event, news)"
              />
            </div>
          </van-list>
        </van-pull-refresh>
      </van-tab>
    </van-tabs>

    <van-tabbar v-model="activeTab" route>
      <van-tabbar-item icon="home-o" :label="$t('home')" to="/" />
      <van-tabbar-item icon="chat-o" :label="$t('chat')" to="/chat" />
      <van-tabbar-item icon="star-o" :label="$t('favorite')" to="/favorite" />
      <van-tabbar-item icon="clock-o" :label="$t('history')" to="/history" />
      <van-tabbar-item icon="user-o" :label="$t('profile')" to="/profile" />
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { newsApi } from '../api'

const router = useRouter()

const categories = ref([])
const activeCategoryIndex = ref(0)
const newsList = ref([])
const page = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)

const activeTab = ref(0)

onMounted(() => {
  loadCategories()
})

async function loadCategories() {
  try {
    const res = await newsApi.getCategories()
    if (res.code === 200) {
      categories.value = res.data.filter(cat => cat.id !== 1)
      if (categories.value.length > 0) {
        activeCategoryIndex.value = 0
        loadNews()
      }
    }
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

async function loadNews(isRefresh = false) {
  if (loading.value) return
  
  if (isRefresh) {
    refreshing.value = true
    page.value = 1
    newsList.value = []
    finished.value = false
  } else {
    loading.value = true
  }

  try {
    const currentCategory = categories.value[activeCategoryIndex.value]
    if (!currentCategory) return
    
    const res = await newsApi.getList({
      categoryId: currentCategory.id,
      page: page.value,
      pageSize: pageSize.value
    })
    
    if (res.code === 200) {
      const list = res.data.list || []
      newsList.value = [...newsList.value, ...list]
      finished.value = !res.data.hasMore
      page.value++
    }
  } catch (error) {
    console.error('加载新闻失败:', error)
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

function handleCategoryChange() {
  page.value = 1
  newsList.value = []
  finished.value = false
  loadNews()
}

function goToDetail(id) {
  router.push(`/news/${id}`)
}

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

function handleImageError(event, news) {
  const img = event.target
  if (img) {
    img.style.display = 'none'
  }
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  padding-bottom: 50px;
}

.news-item {
  display: flex;
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #f5f5f5;
  gap: 12px;
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
  color: #ccc;
}

.news-image {
  width: 100px;
  height: 80px;
  flex-shrink: 0;
  border-radius: 6px;
}
</style>