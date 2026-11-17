<template>
  <div class="not-found-page">
    <van-nav-bar title="页面不存在" />
    <van-empty image="error" description="你访问的页面或新闻不存在">
      <van-button round type="primary" to="/">返回首页</van-button>
    </van-empty>
  </div>
</template>

<style scoped>
.not-found-page {
  min-height: 100vh;
  background: #fff;
}
</style>
