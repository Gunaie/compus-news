<template>
  <div class="history-page">
    <van-nav-bar
      :title="$t('history')"
      :right-text="$t('clearAll')"
      @click-right="clearHistory"
    />

    <div v-if="!userStore.token" class="not-login">
      <van-empty :description="$t('pleaseLogin')" />
      <van-button type="primary" @click="goToLogin">{{ $t('login') }}</van-button>
    </div>

    <van-pull-refresh v-else v-model="refreshing" @refresh="loadHistory(true)">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        :finished-text="$t('noMore')"
        @load="loadHistory"
      >
        <div
          v-for="item in historyList"
          :key="item.id"
          class="history-item"
        >
          <div class="item-content" @click="goToDetail(item.id)">
            <h3 class="item-title">{{ item.title }}</h3>
            <p class="item-description">{{ item.description }}</p>
            <div class="item-meta">
              <span class="item-author">{{ item.author }}</span>
              <span class="item-time">{{ formatTime(item.viewTime) }}</span>
            </div>
          </div>
          <van-icon name="delete" class="delete-icon" @click="deleteHistory(item.historyId)" />
        </div>
      </van-list>
    </van-pull-refresh>

    <van-tabbar v-model="activeTab" route>
      <van-tabbar-item icon="home-o" :label="$t('home')" to="/" />
      <van-tabbar-item icon="star-o" :label="$t('favorite')" to="/favorite" />
      <van-tabbar-item icon="clock" :label="$t('history')" to="/history" />
      <van-tabbar-item icon="user-o" :label="$t('profile')" to="/profile" />
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { historyApi } from '../api'
import { useUserStore } from '../store/user'
import { showToast, showConfirmDialog } from 'vant'

const router = useRouter()
const userStore = useUserStore()

const historyList = ref([])
const page = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)

const activeTab = ref(2)

onMounted(() => {
  if (userStore.token) {
    loadHistory()
  }
})

async function loadHistory(isRefresh = false) {
  if (loading.value) return
  
  if (isRefresh) {
    refreshing.value = true
    page.value = 1
    historyList.value = []
    finished.value = false
  } else {
    loading.value = true
  }

  try {
    const res = await historyApi.getList({
      page: page.value,
      pageSize: pageSize.value
    })
    
    if (res.code === 200) {
      const list = res.data.list || []
      historyList.value = [...historyList.value, ...list]
      finished.value = !res.data.hasMore
      page.value++
    }
  } catch (error) {
    console.error('加载历史失败:', error)
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

async function deleteHistory(id) {
  try {
    const res = await historyApi.delete(id)
    if (res.code === 200) {
      historyList.value = historyList.value.filter(item => item.historyId !== id)
      showToast('删除成功')
    }
  } catch (error) {
    console.error('删除历史失败:', error)
  }
}

async function clearHistory() {
  try {
    await showConfirmDialog({
      title: '确认清空',
      message: '确定要清空所有历史记录吗？',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })

    const res = await historyApi.clear()
    if (res.code === 200) {
      historyList.value = []
      finished.value = true
      page.value = 1
      showToast('清空成功')
    }
  } catch (error) {
    console.error('清空历史失败:', error)
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
.history-page {
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

.history-item {
  display: flex;
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #f5f5f5;
  align-items: center;
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

.delete-icon {
  width: 24px;
  height: 24px;
  color: #999;
  padding: 8px;
}
</style>