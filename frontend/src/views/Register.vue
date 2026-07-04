<template>
  <div class="register-page">
    <van-nav-bar :title="$t('register')" left-arrow @click-left="goBack" />
    
    <div class="register-form">
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
          :error-message="'密码需6-128个字符'"
        />
        <van-field
          v-model="form.confirmPassword"
          :label="$t('confirmPassword')"
          :placeholder="`请确认${$t('password')}`"
          type="password"
          required
        />
        <van-button type="primary" native-type="submit" block>{{ $t('register') }}</van-button>
      </van-form>
      
      <div class="login-link">
        {{ $t('login') }}?
        <span @click="goToLogin">{{ $t('login') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { showToast } from 'vant'

const router = useRouter()
const userStore = useUserStore()

const form = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})

async function handleSubmit() {
  if (form.password !== form.confirmPassword) {
    showToast('两次密码不一致')
    return
  }
  
  try {
    const res = await userStore.register({
      username: form.username,
      password: form.password
    })
    showToast(res.message)
    router.push('/')
  } catch (error) {
    showToast(error.message || '注册失败')
  }
}

function goBack() {
  router.back()
}

function goToLogin() {
  router.push('/login')
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.register-form {
  padding: 24px;
}

.login-link {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
  color: #999;
}

.login-link span {
  color: #1989fa;
}
</style>