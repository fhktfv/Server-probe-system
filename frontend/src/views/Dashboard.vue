<template>
  <div class="admin-layout">
    <!-- 顶部导航栏 -->
    <nav class="admin-navbar">
      <div class="nav-container">
        <div class="nav-left">
          <div class="logo">
            <div class="logo-icon">
              <div class="pulse"></div>
            </div>
            <span class="logo-text">管理控制台</span>
          </div>
        </div>
        
        <div class="nav-center">
          <div class="nav-tabs">
            <router-link to="/admin" class="nav-tab" :class="{ active: $route.path === '/admin' }">
              <el-icon><Monitor /></el-icon>
              <span>监控面板</span>
            </router-link>
            <router-link to="/admin/servers" class="nav-tab" :class="{ active: $route.path === '/admin/servers' }">
              <el-icon><Setting /></el-icon>
              <span>服务器管理</span>
            </router-link>
          </div>
        </div>
        
        <div class="nav-right">
          <el-dropdown @command="handleCommand">
            <div class="user-menu">
              <div class="user-avatar">
                <el-icon><User /></el-icon>
              </div>
              <span class="user-name">管理员</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="home">
                  <el-icon><House /></el-icon>
                  返回首页
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </nav>

    <!-- 主内容区域 -->
    <main class="admin-main">
      <div class="admin-container">
        <!-- 页面标题 -->
        <div class="page-header">
          <h1>监控面板</h1>
          <p>实时服务器状态监控</p>
        </div>

        <!-- 统计概览 -->
        <section class="stats-section">
          <div class="stats-grid">
            <div class="stat-card online">
              <div class="stat-icon">
                <el-icon><Check /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ onlineServers }}</div>
                <div class="stat-label">在线服务器</div>
                <div class="stat-trend">+{{ Math.floor(Math.random() * 5) }}</div>
              </div>
              <div class="stat-chart">
                <div class="mini-chart online-chart"></div>
              </div>
            </div>

            <div class="stat-card offline">
              <div class="stat-icon">
                <el-icon><Close /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ offlineServers }}</div>
                <div class="stat-label">离线服务器</div>
                <div class="stat-trend negative">-{{ Math.floor(Math.random() * 3) }}</div>
              </div>
              <div class="stat-chart">
                <div class="mini-chart offline-chart"></div>
              </div>
            </div>

            <div class="stat-card warning">
              <div class="stat-icon">
                <el-icon><Warning /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ warningServers }}</div>
                <div class="stat-label">警告服务器</div>
                <div class="stat-trend">{{ warningServers > 0 ? '+' : '' }}{{ warningServers }}</div>
              </div>
              <div class="stat-chart">
                <div class="mini-chart warning-chart"></div>
              </div>
            </div>

            <div class="stat-card total">
              <div class="stat-icon">
                <el-icon><Monitor /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ totalServers }}</div>
                <div class="stat-label">总服务器</div>
                <div class="stat-trend">+{{ Math.floor(Math.random() * 2) }}</div>
              </div>
              <div class="stat-chart">
                <div class="mini-chart total-chart"></div>
              </div>
            </div>
          </div>
        </section>

        <!-- 服务器状态 -->
        <section class="servers-section">
          <div class="section-header">
            <h2>服务器状态</h2>
            <div class="header-actions">
              <el-button type="primary" @click="refreshData">
                <el-icon><Refresh /></el-icon>
                刷新数据
              </el-button>
              <router-link to="/admin/servers">
                <el-button type="default">
                  <el-icon><Setting /></el-icon>
                  管理服务器
                </el-button>
              </router-link>
            </div>
          </div>

          <div class="servers-grid">
            <div 
              v-for="server in servers" 
              :key="server.id"
              class="server-card"
              :class="getServerCardClass(server)"
            >
              <div class="server-header">
                <div class="server-info">
                  <div class="server-name">{{ server.name }}</div>
                  <div class="server-host">{{ server.host }}:{{ server.port }}</div>
                </div>
                <div class="server-actions">
                  <el-button 
                    size="small" 
                    type="primary" 
                    @click="testConnection(server)"
                    :loading="server.testing"
                  >
                    测试
                  </el-button>
                </div>
              </div>

              <div v-if="server.status === 'online' && getServerMonitorData(server.id)" class="server-metrics">
                <!-- CPU使用率 -->
                <div class="metric-item">
                  <div class="metric-header">
                    <div class="metric-label">
                      <el-icon><Cpu /></el-icon>
                      <span>CPU</span>
                    </div>
                    <span class="metric-value">{{ getServerMonitorData(server.id)?.cpu_usage || 0 }}%</span>
                  </div>
                  <div class="progress-bar">
                    <div 
                      class="progress-fill" 
                      :class="getProgressClass(getServerMonitorData(server.id)?.cpu_usage || 0)"
                      :style="{ width: (getServerMonitorData(server.id)?.cpu_usage || 0) + '%' }"
                    ></div>
                  </div>
                </div>

                <!-- 内存使用率 -->
                <div class="metric-item">
                  <div class="metric-header">
                    <div class="metric-label">
                      <el-icon><Coin /></el-icon>
                      <span>内存</span>
                    </div>
                    <span class="metric-value">{{ getMemoryUsage(server.id) }}%</span>
                  </div>
                  <div class="progress-bar">
                    <div 
                      class="progress-fill" 
                      :class="getProgressClass(getMemoryUsage(server.id))"
                      :style="{ width: getMemoryUsage(server.id) + '%' }"
                    ></div>
                  </div>
                </div>

                <!-- 磁盘使用率 -->
                <div class="metric-item">
                  <div class="metric-header">
                    <div class="metric-label">
                      <el-icon><Folder /></el-icon>
                      <span>磁盘</span>
                    </div>
                    <span class="metric-value">{{ getDiskUsage(server.id) }}%</span>
                  </div>
                  <div class="progress-bar">
                    <div 
                      class="progress-fill" 
                      :class="getProgressClass(getDiskUsage(server.id))"
                      :style="{ width: getDiskUsage(server.id) + '%' }"
                    ></div>
                  </div>
                </div>

                <!-- 系统信息 -->
                <div class="system-info">
                  <div class="info-item">
                    <span class="info-label">系统负载</span>
                    <span class="info-value">{{ getServerMonitorData(server.id)?.load_avg || 'N/A' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">运行时间</span>
                    <span class="info-value">{{ formatUptime(getServerMonitorData(server.id)?.uptime) }}</span>
                  </div>
                </div>
              </div>

              <div v-else class="server-offline">
                <div class="offline-icon">
                  <el-icon><Close /></el-icon>
                </div>
                <div class="offline-text">{{ server.status === 'offline' ? '服务器离线' : '数据加载中...' }}</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import io from 'socket.io-client'
import { useAuthStore } from '../store/auth'
import {
  Monitor, Setting, Check, Close, Warning, User, ArrowDown,
  House, SwitchButton, Refresh, Cpu, Coin, Folder
} from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()
const servers = ref([])
const monitorData = ref({})
const socket = ref(null)

const totalServers = computed(() => servers.value.length)
const onlineServers = computed(() => servers.value.filter(s => s.status === 'online').length)
const offlineServers = computed(() => servers.value.filter(s => s.status === 'offline').length)
const warningServers = computed(() => {
  return servers.value.filter(server => {
    const data = monitorData.value[server.id]
    if (!data || server.status !== 'online') return false
    return data.cpu_usage > 80 || getMemoryUsage(server.id) > 80 || getDiskUsage(server.id) > 80
  }).length
})

const handleCommand = (command) => {
  switch (command) {
    case 'home':
      window.location.href = '/'
      break
    case 'logout':
      localStorage.removeItem('token')
      router.push('/guanli')
      break
  }
}

const refreshData = () => {
  fetchServers()
  ElMessage.success('数据刷新完成')
}

const fetchServers = async () => {
  try {
    const response = await axios.get('/api/servers')
    servers.value = response.data
    
    for (const server of servers.value) {
      if (server.status === 'online') {
        try {
          const monitorResponse = await axios.get(`/api/servers/${server.id}/monitor`)
          monitorData.value[server.id] = monitorResponse.data
        } catch (error) {
          console.error(`Failed to fetch monitor data for server ${server.id}`)
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch servers:', error)
    ElMessage.error('获取服务器数据失败')
  }
}

const testConnection = async (server) => {
  server.testing = true
  try {
    const response = await axios.post(`/api/servers/${server.id}/test`)
    if (response.data.connected) {
      ElMessage.success(`${server.name} 连接成功`)
      server.status = 'online'
    } else {
      ElMessage.error(`${server.name} 连接失败`)
      server.status = 'offline'
    }
  } catch (error) {
    ElMessage.error(`${server.name} 连接测试失败`)
    server.status = 'offline'
  } finally {
    server.testing = false
  }
}

const getServerCardClass = (server) => {
  const data = monitorData.value[server.id]
  if (server.status === 'offline') return 'offline'
  if (!data) return 'loading'
  
  const cpuHigh = (data.cpu_usage || 0) > 80
  const memHigh = getMemoryUsage(server.id) > 80
  const diskHigh = getDiskUsage(server.id) > 80
  
  if (cpuHigh || memHigh || diskHigh) return 'warning'
  return 'online'
}

const getProgressClass = (percentage) => {
  if (percentage >= 90) return 'critical'
  if (percentage >= 80) return 'danger'
  if (percentage >= 60) return 'warning'
  return 'normal'
}

const getServerMonitorData = (serverId) => {
  return monitorData.value[serverId]
}

const getMemoryUsage = (serverId) => {
  const data = monitorData.value[serverId]
  if (!data || !data.memory_total) return 0
  return Math.round((data.memory_used / data.memory_total) * 100)
}

const getDiskUsage = (serverId) => {
  const data = monitorData.value[serverId]
  if (!data || !data.disk_total) return 0
  return Math.round((data.disk_used / data.disk_total) * 100)
}

const formatUptime = (seconds) => {
  if (!seconds) return 'N/A'
  
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (days > 0) return `${days}天 ${hours}小时`
  if (hours > 0) return `${hours}小时 ${minutes}分钟`
  return `${minutes}分钟`
}

const connectSocket = () => {
  socket.value = io()
  
  socket.value.on('connect', () => {
    console.log('Socket connected')
  })
  
  socket.value.on('monitor_data', (data) => {
    monitorData.value[data.server_id] = data.data
  })
  
  socket.value.on('disconnect', () => {
    console.log('Socket disconnected')
  })
}

onMounted(async () => {
  // 确保认证状态正确
  await authStore.checkAuth()
  
  fetchServers()
  connectSocket()
  setInterval(fetchServers, 30000)
})

onUnmounted(() => {
  if (socket.value) {
    socket.value.disconnect()
  }
})
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background: #f5f5f7;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 顶部导航栏 */
.admin-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  z-index: 1000;
}

.nav-container {
  max-width: 1400px;
  height: 100%;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #007AFF, #5856D6);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.pulse {
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #1d1d1f;
}

.nav-tabs {
  display: flex;
  gap: 8px;
}

.nav-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 12px;
  color: #86868b;
  text-decoration: none;
  transition: all 0.2s ease;
  font-weight: 500;
}

.nav-tab:hover {
  background: rgba(0, 122, 255, 0.1);
  color: #007AFF;
}

.nav-tab.active {
  background: #007AFF;
  color: white;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-menu:hover {
  background: rgba(0, 0, 0, 0.05);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #007AFF, #5856D6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.user-name {
  font-weight: 500;
  color: #1d1d1f;
}

/* 主内容区域 */
.admin-main {
  margin-top: 64px;
  padding: 32px 0;
}

.admin-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 32px;
  font-weight: 700;
  color: #1d1d1f;
  margin: 0 0 8px 0;
}

.page-header p {
  font-size: 16px;
  color: #86868b;
  margin: 0;
}

/* 统计概览 */
.stats-section {
  margin-bottom: 40px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 20px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.stat-card.online::before { background: #34C759; }
.stat-card.offline::before { background: #FF3B30; }
.stat-card.warning::before { background: #FF9500; }
.stat-card.total::before { background: #007AFF; }

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
  flex-shrink: 0;
}

.stat-card.online .stat-icon { background: #34C759; }
.stat-card.offline .stat-icon { background: #FF3B30; }
.stat-card.warning .stat-icon { background: #FF9500; }
.stat-card.total .stat-icon { background: #007AFF; }

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: #1d1d1f;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  color: #86868b;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.stat-trend {
  font-size: 12px;
  font-weight: 600;
  color: #34C759;
}

.stat-trend.negative {
  color: #FF3B30;
}

.stat-chart {
  width: 60px;
  height: 40px;
  flex-shrink: 0;
}

.mini-chart {
  width: 100%;
  height: 100%;
  border-radius: 6px;
  position: relative;
  overflow: hidden;
}

.online-chart { background: linear-gradient(135deg, rgba(52, 199, 89, 0.1), rgba(52, 199, 89, 0.3)); }
.offline-chart { background: linear-gradient(135deg, rgba(255, 59, 48, 0.1), rgba(255, 59, 48, 0.3)); }
.warning-chart { background: linear-gradient(135deg, rgba(255, 149, 0, 0.1), rgba(255, 149, 0, 0.3)); }
.total-chart { background: linear-gradient(135deg, rgba(0, 122, 255, 0.1), rgba(0, 122, 255, 0.3)); }

/* 服务器区域 */
.servers-section {
  margin-bottom: 40px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.servers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
}

.server-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  position: relative;
}

.server-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.server-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  border-radius: 16px 16px 0 0;
}

.server-card.online::before { background: #34C759; }
.server-card.offline::before { background: #FF3B30; }
.server-card.warning::before { background: #FF9500; }
.server-card.loading::before { background: #86868b; }

.server-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.server-name {
  font-size: 18px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 4px;
}

.server-host {
  font-size: 14px;
  color: #86868b;
  font-family: 'SF Mono', Monaco, monospace;
}

.metric-item {
  margin-bottom: 16px;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.metric-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #86868b;
  font-weight: 500;
}

.metric-value {
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
  font-family: 'SF Mono', Monaco, monospace;
}

.progress-bar {
  height: 8px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.progress-fill.normal { background: #34C759; }
.progress-fill.warning { background: #FF9500; }
.progress-fill.danger { background: #FF3B30; }
.progress-fill.critical { 
  background: #FF3B30; 
  animation: pulse-red 2s infinite;
}

@keyframes pulse-red {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.system-info {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.info-label {
  color: #86868b;
}

.info-value {
  color: #1d1d1f;
  font-weight: 500;
  font-family: 'SF Mono', Monaco, monospace;
}

.server-offline {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #86868b;
}

.offline-icon {
  font-size: 32px;
  margin-bottom: 8px;
  color: #FF3B30;
}

.offline-text {
  font-size: 14px;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .servers-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}

@media (max-width: 768px) {
  .admin-container {
    padding: 0 16px;
  }
  
  .nav-container {
    padding: 0 16px;
  }
  
  .nav-center {
    display: none;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .servers-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
}

@media (max-width: 480px) {
  .server-card {
    padding: 16px;
  }
  
  .stat-card {
    padding: 16px;
  }
}
</style>