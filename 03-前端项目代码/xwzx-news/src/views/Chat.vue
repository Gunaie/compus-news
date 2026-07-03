<template>
  <div class="chat-page">
    <van-nav-bar :title="$t('chat')" />

    <div class="chat-container">
      <div class="message-list" ref="messageList">
        <div class="system-message">
          <van-icon name="smile-o" />
          <span>你好！我是AI助手，有什么可以帮你的？</span>
        </div>

        <div
          v-for="(msg, index) in messages"
          :key="index"
          :class="['message-item', msg.role]"
        >
          <div class="avatar">
            <van-icon :name="msg.role === 'user' ? 'user-o' : 'chat-o'" />
          </div>
          <div class="message-content">
            <div class="message-text">{{ msg.content }}</div>
          </div>
        </div>

        <div v-if="loading" class="loading-message">
          <van-loading type="spinner" size="20" />
          <span>{{ $t('aiThinking') }}</span>
        </div>
      </div>
    </div>

    <div class="chat-input">
      <van-field
        v-model="inputMessage"
        :placeholder="$t('chatPlaceholder')"
        :disabled="loading"
        @keyup.enter="sendMessage"
      />
      <van-button
        type="primary"
        :disabled="loading || !inputMessage.trim()"
        @click="sendMessage"
      >
        {{ $t('send') }}
      </van-button>
    </div>

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
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { chatApi } from '../api'

const { t } = useI18n()

const router = useRouter()
const messageList = ref(null)
const messages = ref([])
const inputMessage = ref('')
const loading = ref(false)
const activeTab = ref(1)

const scrollToBottom = async () => {
  await nextTick()
  if (messageList.value) {
    messageList.value.scrollTop = messageList.value.scrollHeight
  }
}

const sendMessage = async () => {
  const message = inputMessage.value.trim()
  if (!message || loading.value) return

  const token = localStorage.getItem('token')
  if (!token) {
    router.push('/login')
    return
  }

  messages.value.push({ role: 'user', content: message })
  inputMessage.value = ''
  loading.value = true
  await scrollToBottom()

  try {
    const history = []
    const prevMessages = messages.value.slice(0, -1)
    for (let i = 0; i < prevMessages.length; i += 2) {
      const userMsg = prevMessages[i]
      const assistantMsg = prevMessages[i + 1]
      if (userMsg && userMsg.role === 'user') {
        history.push({
          user: userMsg.content,
          assistant: assistantMsg && assistantMsg.role === 'assistant' ? assistantMsg.content : ''
        })
      }
    }

    const response = await chatApi.completion({
      message: message,
      history: history
    })

    if (response.data && response.data.answer) {
      messages.value.push({ role: 'assistant', content: response.data.answer })
    }
  } catch (error) {
    console.error('Chat error:', error)
    messages.value.push({ role: 'assistant', content: t('chatError') })
  } finally {
    loading.value = false
    await scrollToBottom()
  }
}
</script>

<style scoped>
.chat-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.chat-container {
  flex: 1;
  overflow: hidden;
}

.message-list {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 100px;
}

.system-message {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  color: #999;
  font-size: 14px;
}

.system-message .van-icon {
  margin-right: 8px;
}

.message-item {
  display: flex;
  margin-bottom: 16px;
}

.message-item.user {
  flex-direction: row-reverse;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.message-item.user .avatar {
  background-color: #1989fa;
  color: white;
}

.message-content {
  max-width: 70%;
  padding: 0 12px;
}

.message-text {
  background-color: white;
  padding: 12px;
  border-radius: 12px;
  font-size: 15px;
  line-height: 1.6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.message-item.user .message-text {
  background-color: #1989fa;
  color: white;
  border-radius: 12px;
}

.loading-message {
  display: flex;
  align-items: center;
  padding: 12px;
  color: #999;
  font-size: 14px;
}

.loading-message .van-loading {
  margin-right: 8px;
}

.chat-input {
  position: fixed;
  bottom: 50px;
  left: 0;
  right: 0;
  padding: 12px;
  background-color: white;
  display: flex;
  gap: 12px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.chat-input .van-field {
  flex: 1;
}

.chat-input .van-button {
  flex-shrink: 0;
}
</style>