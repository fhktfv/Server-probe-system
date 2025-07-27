import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import Home from './views/Home.vue'
import Dashboard from './views/Dashboard.vue'
import ServerList from './views/ServerList.vue'
import Login from './views/Login.vue'
import PublicDashboard from './views/PublicDashboard.vue'
import { useAuthStore } from './store/auth'

const routes = [
  { path: '/', component: Home }, // 新首页
  { path: '/public', component: PublicDashboard }, // 公开预览页面
  { path: '/guanli', component: Login }, // 管理登录页面
  { path: '/admin', component: Dashboard, meta: { requiresAuth: true } }, // 管理面板
  { path: '/admin/servers', component: ServerList, meta: { requiresAuth: true } }, // 服务器管理
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/guanli')
  } else {
    next()
  }
})

const app = createApp(App)

// 注册ElementPlus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(ElementPlus)
app.use(router)
app.mount('#app')