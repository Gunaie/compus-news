<template>
  <div class="login-page">
    <van-nav-bar :title="$t('login')" left-arrow @click-left="goBack" />
    
    <div class="login-form">
      <van-form @submit="handleSubmit">
        <van-field
          v-model="form.username"
          :label="$t('username')"
          :placeholder="`请输入${$t('username')}`"
          required
        />
        <van-field
          v-model="form.password"
          :label="$t('password')"
          :placeholder="`请输入${$t('password')}`"
          type="password"
          required
        />
        <van-button type="primary" native-type="submit" block>{{ $t('login') }}</van-button>
      </van-form>
      
      <div class="register-link">
        {{ $t('register') }}?
        <span @click="goToRegister">{{ $t('register') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { showToast } from 'vant'

const router = useRouter()
const userStore = useUserStore()

const form = reactive({
  username: '',
  password: ''
})

async function handleSubmit() {
  try {
    const res = await userStore.login(form)
    showToast(res.message)
    router.push('/')
  } catch (error) {
    showToast(error.message || '登录失败')
  }
}

function goBack() {
  router.back()
}

function goToRegister() {
  router.push('/register')
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.login-form {
  padding: 24px;
}

.register-link {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
  color: #999;
}

.register-link span {
  color: #1989fa;
}
</style>