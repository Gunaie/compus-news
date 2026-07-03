<template>
  <div class="favorite-page">
    <van-nav-bar :title="$t('favorite')" />
    
    <div v-if="!userStore.token" class="not-login">
      <van-empty :description="$t('pleaseLogin')" />
      <van-button type="primary" @click="goToLogin">{{ $t('login') }}</van-button>
    </div>

    <van-pull-refresh v-else v-model="refreshing" @refresh="loadFavorites(true)">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        :finished-text="$t('noMore')"
        @load="loadFavorites"
      >
        <div
          v-for="item in favorites"
          :key="item.id"
          class="favorite-item"
          @click="goToDetail(item.id)"
        >
          <div class="item-content">
            <h3 class="item-title">{{ item.title }}</h3>
            <p class="item-description">{{ item.description }}</p>
            <div class="item-meta">
              <span class="item-author">{{ item.author }}</span>
              <span class="item-time">{{ formatTime(item.favoriteTime) }}</span>
            </div>
          </div>
          <van-image v-if="item.image" :src="item.image" class="item-image" fit="cover" />
        </div>
      </van-list>
    </van-pull-refresh>

    <van-tabbar v-model="activeTab" route>
      <van-tabbar-item icon="home-o" :label="$t('home')" to="/" />
      <van-tabbar-item icon="star" :label="$t('favorite')" to="/favorite" />
      <van-tabbar-item icon="clock-o" :label="$t('history')" to="/history" />
      <van-tabbar-item icon="user-o" :label="$t('profile')" to="/profile" />
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { favoriteApi } from '../api'
import { useUserStore } from '../store/user'

const router = useRouter()
const userStore = useUserStore()

const favorites = ref([])
const page = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)

const activeTab = ref(1)

onMounted(() => {
  if (userStore.token) {
    loadFavorites()
  }
})

async function loadFavorites(isRefresh = false) {
  if (loading.value) return
  
  if (isRefresh) {
    refreshing.value = true
    page.value = 1
    favorites.value = []
    finished.value = false
  } else {
    loading.value = true
  }

  try {
    const res = await favoriteApi.getList({
      page: page.value,
      pageSize: pageSize.value
    })
    
    if (res.code === 200) {
      const list = res.data.list || []
      favorites.value = [...favorites.value, ...list]
      finished.value = !res.data.hasMore
      page.value++
    }
  } catch (error) {
    console.error('加载收藏失败:', error)
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

function goToLogin() {
  router.push('/login')
}

function goToDetail(id) {
  router.push(`/news/${id}`)
}

function formatTime(timeStr) {
  if (!timeStr) return ''
  return timeStr.slice(0, 10)
}
</script>

<style scoped>
.favorite-page {
  min-height: 100vh;
  padding-bottom: 50px;
}

.not-login {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  gap: 16px;
}

.favorite-item {
  display: flex;
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #f5f5f5;
  gap: 12px;
}

.item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.item-title {
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

.item-description {
  font-size: 14px;
  color: #999;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  font-size: 12px;
  color: #ccc;
}

.item-image {
  width: 100px;
  height: 80px;
  flex-shrink: 0;
  border-radius: 6px;
}
</style>