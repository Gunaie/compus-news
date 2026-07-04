<template>
  <div class="profile-page">
    <van-nav-bar :title="$t('profile')" />

    <div v-if="!userStore.token" class="not-login">
      <van-empty :description="$t('pleaseLogin')" />
      <div class="login-actions">
        <van-button type="primary" @click="goToLogin">{{ $t('login') }}</van-button>
        <van-button @click="goToRegister">{{ $t('register') }}</van-button>
      </div>
    </div>

    <div v-else class="profile-content">
      <div class="user-info">
        <van-image :src="userStore.userInfo?.avatar || ''" class="avatar" fit="cover" />
        <div class="info">
          <h2 class="username">{{ userStore.userInfo?.username || '' }}</h2>
          <p class="bio">{{ userStore.userInfo?.bio || '这个人很懒，什么都没留下' }}</p>
        </div>
      </div>

      <van-cell-group class="menu-list">
        <van-cell :title="$t('favorite')" icon="star-o" @click="goToFavorite" is-link />
        <van-cell :title="$t('history')" icon="clock-o" @click="goToHistory" is-link />
        <van-cell :title="$t('logout')" icon="sign-out-o" @click="handleLogout" />
      </van-cell-group>
    </div>

    <van-tabbar v-model="activeTab" route>
      <van-tabbar-item icon="home-o" :label="$t('home')" to="/" />
      <van-tabbar-item icon="chat-o" :label="$t('chat')" to="/chat" />
      <van-tabbar-item icon="star-o" :label="$t('favorite')" to="/favorite" />
      <van-tabbar-item icon="clock-o" :label="$t('history')" to="/history" />
      <van-tabbar-item icon="user" :label="$t('profile')" to="/profile" />
    </van-tabbar>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { showToast } from 'vant'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref(4)

onMounted(() => {
  if (userStore.token && !userStore.userInfo) {
    userStore.getUserInfo()
  }
})

function goToLogin() {
  router.push('/login')
}

function goToRegister() {
  router.push('/register')
}

function goToFavorite() {
  router.push('/favorite')
}

function goToHistory() {
  router.push('/history')
}

async function handleLogout() {
  await userStore.logout()
  showToast('退出成功')
  router.push('/')
}
</script>

<style scoped>
.profile-page {
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

.login-actions {
  display: flex;
  gap: 16px;
}

.profile-content {
  padding: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  margin-bottom: 16px;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
}

.info {
  flex: 1;
}

.username {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.bio {
  font-size: 14px;
  color: #999;
}

.menu-list {
  background: #fff;
  border-radius: 12px;
}
</style>