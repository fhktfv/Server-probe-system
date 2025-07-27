<template>
  <div class="app">
    <router-view />
  </div>
</template>

<script setup>
// 简化的App组件，让各个页面自己控制完整布局
</script>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app {
  width: 100%;
  min-height: 100vh;
}
</style>