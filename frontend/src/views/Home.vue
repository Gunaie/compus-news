<template>
  <div class="home-page">
    <van-nav-bar :title="$t('title')" />
    
    <van-tabs v-model:active="activeCategoryIndex" @change="handleCategoryChange" sticky>
      <van-tab v-for="cat in categories" :key="cat.id" :title="cat.name" />
    </van-tabs>

    <van-pull-refresh v-model="refreshing" @refresh="loadNews(true)" :disabled="!categories.length">
      <van-list
        :loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="loadNews"
        :disabled="!categories.length"
      >
        <NewsVirtualList
          v-if="virtualEnabled && newsStore.home.items.length"
          :items="newsStore.home.items"
          @select="goToDetail"
        />
        <template v-else>
          <NewsCard
            v-for="(news, index) in newsStore.home.items"
            :key="news.id"
            :news="news"
            :priority="index === 0"
            @select="goToDetail"
          />
        </template>
      </van-list>
    </van-pull-refresh>

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
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useNewsStore } from '../store/news'
import NewsCard from '../components/NewsCard.vue'
import NewsVirtualList from '../components/NewsVirtualList.vue'

const router = useRouter()
const newsStore = useNewsStore()
const { categories, loading } = storeToRefs(newsStore)
const activeCategoryIndex = ref(Math.max(0, categories.value.findIndex(
  (category) => category.id === newsStore.home.categoryId
)))
const finished = computed(() => newsStore.home.loaded && !newsStore.home.hasMore)
const refreshing = ref(false)
const activeTab = ref(0)
const virtualEnabled = ref(false)

onMounted(() => {
  virtualEnabled.value = true
})

async function loadNews(isRefresh = false) {
  try {
    if (isRefresh) {
      refreshing.value = true
      const currentCategory = categories.value[activeCategoryIndex.value]
      if (currentCategory) {
        await newsStore.loadCategory(currentCategory.id, true)
      }
    } else {
      await newsStore.loadMore()
    }
  } catch (error) {
    console.error('加载新闻失败:', error)
  } finally {
    refreshing.value = false
  }
}

async function handleCategoryChange(index) {
  const category = categories.value[index]
  if (!category) return
  try {
    await newsStore.loadCategory(category.id, true)
  } catch (error) {
    console.error('切换分类失败:', error)
  }
}

function goToDetail(id) {
  router.push(`/news/${id}`)
}

</script>

<style scoped>
.home-page {
  min-height: 100vh;
  padding-bottom: 50px;
}
</style>