<template>
  <div class="dashboard-home">
    <!-- 顶部导航栏 -->
    <nav class="top-navbar">
      <div class="nav-container">
        <div class="nav-left">
          <div class="logo">
            <div class="logo-icon">
              <div class="pulse"></div>
            </div>
            <span class="logo-text">Server Monitor</span>
          </div>
        </div>
        
        <div class="nav-right">
          <button 
            class="menu-button" 
            @click="showSidebar = !showSidebar"
            :class="{ active: showSidebar }"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </nav>

    <!-- 侧边栏 -->
    <div class="sidebar-overlay" :class="{ active: showSidebar }" @click="showSidebar = false"></div>
    <aside class="sidebar" :class="{ active: showSidebar }">
      <div class="sidebar-header">
        <h2>控制面板</h2>
        <button class="close-btn" @click="showSidebar = false">
          <el-icon><Close /></el-icon>
        </button>
      </div>
      
      <div class="sidebar-content">
        <div class="menu-section">
          <div class="menu-title">管理</div>
          <a href="/guanli" class="menu-item">
            <el-icon><Setting /></el-icon>
            <span>后台管理</span>
          </a>
          <div class="menu-item" @click="refreshData">
            <el-icon><Refresh /></el-icon>
            <span>刷新数据</span>
          </div>
        </div>
        
        <div class="menu-section">
          <div class="menu-title">分类筛选</div>
          <div 
            class="category-item" 
            :class="{ active: selectedCategory === 'all' }"
            @click="selectedCategory = 'all'"
          >
            <div class="category-color" style="background: linear-gradient(45deg, #667eea, #764ba2)"></div>
            <span>全部服务器</span>
            <span class="count">{{ totalServers }}</span>
          </div>
          <div 
            v-for="category in categories" 
            :key="category.id"
            class="category-item"
            :class="{ active: selectedCategory === category.name }"
            @click="selectedCategory = category.name"
          >
            <div class="category-color" :style="{ background: category.color }"></div>
            <span>{{ category.name }}</span>
            <span class="count">{{ getCategoryCount(category.name) }}</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- 主内容区域 -->
    <main class="main-content">
      <!-- 统计概览 -->
      <section class="stats-overview">
        <div class="stats-grid">
          <div class="stat-card online" @click="selectedCategory = 'online'">
            <div class="stat-icon">
              <el-icon><Check /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ onlineServers }}</div>
              <div class="stat-label">在线</div>
            </div>
            <div class="stat-change positive">
              <el-icon><TrendCharts /></el-icon>
            </div>
          </div>

          <div class="stat-card offline" @click="selectedCategory = 'offline'">
            <div class="stat-icon">
              <el-icon><Close /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ offlineServers }}</div>
              <div class="stat-label">离线</div>
            </div>
            <div class="stat-change negative">
              <el-icon><TrendCharts /></el-icon>
            </div>
          </div>

          <div class="stat-card warning">
            <div class="stat-icon">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ warningServers }}</div>
              <div class="stat-label">警告</div>
            </div>
            <div class="stat-change warning">
              <el-icon><TrendCharts /></el-icon>
            </div>
          </div>

          <div class="stat-card total">
            <div class="stat-icon">
              <el-icon><Monitor /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ totalServers }}</div>
              <div class="stat-label">总计</div>
            </div>
            <div class="stat-change stable">
              <el-icon><TrendCharts /></el-icon>
            </div>
          </div>
        </div>
      </section>

      <!-- 服务器网格 -->
      <section class="servers-section">
        <div class="section-header">
          <h2>{{ getSectionTitle() }}</h2>
          <div class="view-controls">
            <button 
              class="view-btn"
              :class="{ active: viewMode === 'grid' }"
              @click="viewMode = 'grid'"
            >
              <el-icon><Grid /></el-icon>
            </button>
            <button 
              class="view-btn"
              :class="{ active: viewMode === 'list' }"
              @click="viewMode = 'list'"
            >
              <el-icon><List /></el-icon>
            </button>
          </div>
        </div>

        <div class="servers-container" :class="viewMode">
          <div 
            v-for="server in filteredServers" 
            :key="server.id"
            class="server-card"
            :class="getServerCardClass(server)"
            @click="selectServer(server)"
          >
            <!-- 卡片头部 -->
            <div class="card-header">
              <div class="server-info">
                <div class="server-name">{{ server.name }}</div>
                <div class="server-host">{{ server.host }}</div>
              </div>
              <div class="server-status">
                <div class="status-indicator" :class="server.status"></div>
              </div>
            </div>

            <!-- 监控数据 -->
            <div v-if="server.status === 'online' && getServerMonitorData(server.id)" class="metrics">
              <!-- CPU -->
              <div class="metric-row">
                <div class="metric-label">
                  <el-icon><Cpu /></el-icon>
                  <span>CPU</span>
                </div>
                <div class="metric-value">
                  <div class="progress-container">
                    <div 
                      class="progress-bar" 
                      :class="getMetricClass(getServerMonitorData(server.id)?.cpu_usage || 0)"
                      :style="{ width: (getServerMonitorData(server.id)?.cpu_usage || 0) + '%' }"
                    ></div>
                  </div>
                  <span class="percentage">{{ getServerMonitorData(server.id)?.cpu_usage || 0 }}%</span>
                </div>
              </div>

              <!-- 内存 -->
              <div class="metric-row">
                <div class="metric-label">
                  <el-icon><Coin /></el-icon>
                  <span>内存</span>
                </div>
                <div class="metric-value">
                  <div class="progress-container">
                    <div 
                      class="progress-bar" 
                      :class="getMetricClass(getMemoryUsage(server.id))"
                      :style="{ width: getMemoryUsage(server.id) + '%' }"
                    ></div>
                  </div>
                  <span class="percentage">{{ getMemoryUsage(server.id) }}%</span>
                </div>
              </div>

              <!-- 磁盘 -->
              <div class="metric-row">
                <div class="metric-label">
                  <el-icon><Folder /></el-icon>
                  <span>磁盘</span>
                </div>
                <div class="metric-value">
                  <div class="progress-container">
                    <div 
                      class="progress-bar" 
                      :class="getMetricClass(getDiskUsage(server.id))"
                      :style="{ width: getDiskUsage(server.id) + '%' }"
                    ></div>
                  </div>
                  <span class="percentage">{{ getDiskUsage(server.id) }}%</span>
                </div>
              </div>

              <!-- 网络 -->
              <div class="metric-row network">
                <div class="metric-label">
                  <el-icon><Connection /></el-icon>
                  <span>网络</span>
                </div>
                <div class="network-stats">
                  <div class="network-item">
                    <el-icon class="upload"><Top /></el-icon>
                    <span>{{ formatBytes(getServerMonitorData(server.id)?.network_tx || 0) }}</span>
                  </div>
                  <div class="network-item">
                    <el-icon class="download"><Bottom /></el-icon>
                    <span>{{ formatBytes(getServerMonitorData(server.id)?.network_rx || 0) }}</span>
                  </div>
                </div>
              </div>

              <!-- 负载和运行时间 -->
              <div class="system-stats">
                <div class="system-item">
                  <span class="label">负载:</span>
                  <span class="value">{{ getServerMonitorData(server.id)?.load_avg || 'N/A' }}</span>
                </div>
                <div class="system-item">
                  <span class="label">运行:</span>
                  <span class="value">{{ formatUptime(getServerMonitorData(server.id)?.uptime) }}</span>
                </div>
              </div>
            </div>

            <!-- 离线状态 -->
            <div v-else class="offline-state">
              <div class="offline-icon">
                <el-icon><Close /></el-icon>
              </div>
              <div class="offline-text">离线</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import io from 'socket.io-client'
import { 
  Monitor, Setting, Check, Close, Warning, TrendCharts, 
  Grid, List, Cpu, Coin, Folder, Connection, Top, Bottom,
  Refresh
} from '@element-plus/icons-vue'

const servers = ref([])
const categories = ref([])
const monitorData = ref({})
const socket = ref(null)
const showSidebar = ref(false)
const selectedCategory = ref('all')
const viewMode = ref('grid')

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

const filteredServers = computed(() => {
  if (selectedCategory.value === 'all') return servers.value
  if (selectedCategory.value === 'online') return servers.value.filter(s => s.status === 'online')
  if (selectedCategory.value === 'offline') return servers.value.filter(s => s.status === 'offline')
  return servers.value.filter(s => s.category === selectedCategory.value)
})

const getSectionTitle = () => {
  if (selectedCategory.value === 'all') return '全部服务器'
  if (selectedCategory.value === 'online') return '在线服务器'
  if (selectedCategory.value === 'offline') return '离线服务器'
  const category = categories.value.find(c => c.name === selectedCategory.value)
  return category ? category.name : '服务器列表'
}

const getCategoryCount = (categoryName) => {
  return servers.value.filter(s => s.category === categoryName).length
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

const getMetricClass = (percentage) => {
  if (percentage >= 90) return 'critical'
  if (percentage >= 80) return 'danger'
  if (percentage >= 60) return 'warning'
  return 'normal'
}

const selectServer = (server) => {
  // 可以添加选中服务器的详细信息显示
  console.log('Selected server:', server)
}

const refreshData = () => {
  fetchServers()
  fetchCategories()
}

const fetchServers = async () => {
  try {
    const response = await axios.get('/api/public/servers')
    servers.value = response.data
    
    for (const server of servers.value) {
      if (server.status === 'online') {
        try {
          const monitorResponse = await axios.get(`/api/public/servers/${server.id}/monitor`)
          monitorData.value[server.id] = monitorResponse.data
        } catch (error) {
          console.error(`Failed to fetch monitor data for server ${server.id}`)
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch servers:', error)
  }
}

const fetchCategories = async () => {
  try {
    const response = await axios.get('/api/public/categories')
    categories.value = response.data
  } catch (error) {
    console.error('Failed to fetch categories:', error)
  }
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
  
  if (days > 0) return `${days}天`
  if (hours > 0) return `${hours}小时`
  return `${minutes}分钟`
}

const formatBytes = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
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

onMounted(() => {
  fetchServers()
  fetchCategories()
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
.dashboard-home {
  min-height: 100vh;
  background: #f5f5f7;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 顶部导航栏 */
.top-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  z-index: 1000;
}

.nav-container {
  max-width: 100%;
  height: 100%;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
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

/* 汉堡菜单按钮 */
.menu-button {
  width: 40px;
  height: 40px;
  background: none;
  border: none;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.menu-button:hover {
  background: rgba(0, 0, 0, 0.05);
}

.menu-button span {
  width: 20px;
  height: 2px;
  background: #1d1d1f;
  border-radius: 1px;
  transition: all 0.3s ease;
}

.menu-button.active span:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.menu-button.active span:nth-child(2) {
  opacity: 0;
}

.menu-button.active span:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -6px);
}

/* 侧边栏 */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(5px);
  z-index: 1001;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.sidebar-overlay.active {
  opacity: 1;
  visibility: visible;
}

.sidebar {
  position: fixed;
  top: 0;
  right: -320px;
  width: 320px;
  height: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-left: 1px solid rgba(0, 0, 0, 0.05);
  z-index: 1002;
  transition: all 0.3s ease;
  overflow-y: auto;
}

.sidebar.active {
  right: 0;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1d1d1f;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.sidebar-content {
  padding: 20px;
}

.menu-section {
  margin-bottom: 32px;
}

.menu-title {
  font-size: 14px;
  font-weight: 600;
  color: #86868b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  color: #1d1d1f;
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
  margin-bottom: 4px;
}

.menu-item:hover {
  background: rgba(0, 122, 255, 0.1);
  transform: translateX(2px);
}

.category-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 4px;
}

.category-item:hover {
  background: rgba(0, 0, 0, 0.03);
}

.category-item.active {
  background: rgba(0, 122, 255, 0.1);
  color: #007AFF;
}

.category-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.count {
  margin-left: auto;
  font-size: 14px;
  font-weight: 600;
  color: #86868b;
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 8px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

/* 主内容区域 */
.main-content {
  margin-top: 60px;
  padding: 24px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

/* 统计概览 */
.stats-overview {
  margin-bottom: 32px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
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
  height: 3px;
  transition: all 0.3s ease;
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
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stat-card.online .stat-icon { background: #34C759; }
.stat-card.offline .stat-icon { background: #FF3B30; }
.stat-card.warning .stat-icon { background: #FF9500; }
.stat-card.total .stat-icon { background: #007AFF; }

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #1d1d1f;
  line-height: 1;
}

.stat-label {
  color: #86868b;
  font-size: 14px;
  font-weight: 500;
}

.stat-change {
  margin-left: auto;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-change.positive { background: rgba(52, 199, 89, 0.1); color: #34C759; }
.stat-change.negative { background: rgba(255, 59, 48, 0.1); color: #FF3B30; }
.stat-change.warning { background: rgba(255, 149, 0, 0.1); color: #FF9500; }
.stat-change.stable { background: rgba(0, 122, 255, 0.1); color: #007AFF; }

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

.view-controls {
  display: flex;
  gap: 8px;
}

.view-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.view-btn:hover {
  background: #f5f5f7;
}

.view-btn.active {
  background: #007AFF;
  color: white;
}

/* 服务器容器 */
.servers-container {
  display: grid;
  gap: 16px;
}

.servers-container.grid {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.servers-container.list {
  grid-template-columns: 1fr;
}

/* 服务器卡片 */
.server-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  cursor: pointer;
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
  height: 3px;
  border-radius: 16px 16px 0 0;
}

.server-card.online::before { background: #34C759; }
.server-card.offline::before { background: #FF3B30; }
.server-card.warning::before { background: #FF9500; }
.server-card.loading::before { background: #86868b; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.server-name {
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 4px;
}

.server-host {
  font-size: 14px;
  color: #86868b;
  font-family: 'SF Mono', Monaco, monospace;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  position: relative;
}

.status-indicator.online {
  background: #34C759;
  animation: pulse-green 2s infinite;
}

.status-indicator.offline {
  background: #FF3B30;
}

@keyframes pulse-green {
  0%, 100% { box-shadow: 0 0 0 0 rgba(52, 199, 89, 0.7); }
  50% { box-shadow: 0 0 0 8px rgba(52, 199, 89, 0); }
}

/* 指标显示 */
.metrics {
  space-y: 12px;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
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
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: flex-end;
}

.progress-container {
  width: 60px;
  height: 6px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 3px;
  transition: all 0.3s ease;
}

.progress-bar.normal { background: #34C759; }
.progress-bar.warning { background: #FF9500; }
.progress-bar.danger { background: #FF3B30; }
.progress-bar.critical { 
  background: #FF3B30; 
  animation: pulse-red 2s infinite;
}

@keyframes pulse-red {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.percentage {
  font-size: 12px;
  font-weight: 600;
  color: #1d1d1f;
  min-width: 30px;
  text-align: right;
  font-family: 'SF Mono', Monaco, monospace;
}

/* 网络统计 */
.metric-row.network {
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.network-stats {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.network-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #86868b;
}

.network-item .upload { color: #FF9500; }
.network-item .download { color: #34C759; }

/* 系统统计 */
.system-stats {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.system-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.system-item .label {
  font-size: 12px;
  color: #86868b;
}

.system-item .value {
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
}

/* 离线状态 */
.offline-state {
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
@media (max-width: 768px) {
  .main-content {
    padding: 16px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .servers-container.grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
}

@media (max-width: 480px) {
  .nav-container {
    padding: 0 16px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .server-card {
    padding: 16px;
  }
}
</style>