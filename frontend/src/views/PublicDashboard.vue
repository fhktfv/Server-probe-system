<template>
  <div class="public-dashboard">
    <div class="header">
      <h1>
        <el-icon size="32" color="#1890ff"><Monitor /></el-icon>
        服务器状态监控
      </h1>
      <p class="subtitle">实时服务器运行状态</p>
    </div>

    <div class="stats-overview">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon online">
                <el-icon><Check /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ onlineServers }}</div>
                <div class="stat-label">在线服务器</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon offline">
                <el-icon><Close /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ offlineServers }}</div>
                <div class="stat-label">离线服务器</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon warning">
                <el-icon><Warning /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ warningServers }}</div>
                <div class="stat-label">警告服务器</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon total">
                <el-icon><Setting /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ totalServers }}</div>
                <div class="stat-label">总服务器</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <el-row :gutter="20" class="server-cards">
      <el-col :span="8" v-for="server in servers" :key="server.id">
        <el-card class="server-card" :class="getServerStatusClass(server.status)">
          <template #header>
            <div class="server-header">
              <div class="server-title">
                <el-icon><Setting /></el-icon>
                <span>{{ server.name }}</span>
              </div>
              <el-tag 
                :type="getStatusTagType(server.status)"
                size="small"
              >
                {{ getStatusText(server.status) }}
              </el-tag>
            </div>
          </template>

          <div v-if="server.status === 'online' && getServerMonitorData(server.id)" class="server-metrics">
            <div class="metric-row">
              <div class="metric-item">
                <div class="metric-label">CPU使用率</div>
                <el-progress 
                  :percentage="getServerMonitorData(server.id)?.cpu_usage || 0"
                  :color="getProgressColor(getServerMonitorData(server.id)?.cpu_usage || 0)"
                  :stroke-width="8"
                />
              </div>
            </div>

            <div class="metric-row">
              <div class="metric-item">
                <div class="metric-label">内存使用率</div>
                <el-progress 
                  :percentage="getMemoryUsage(server.id)"
                  :color="getProgressColor(getMemoryUsage(server.id))"
                  :stroke-width="8"
                />
              </div>
            </div>

            <div class="metric-row">
              <div class="metric-item">
                <div class="metric-label">磁盘使用率</div>
                <el-progress 
                  :percentage="getDiskUsage(server.id)"
                  :color="getProgressColor(getDiskUsage(server.id))"
                  :stroke-width="8"
                />
              </div>
            </div>

            <div class="server-info">
              <div class="info-item">
                <span class="info-label">系统负载:</span>
                <span class="info-value">{{ getServerMonitorData(server.id)?.load_avg || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">运行时间:</span>
                <span class="info-value">{{ formatUptime(getServerMonitorData(server.id)?.uptime) }}</span>
              </div>
            </div>
          </div>

          <div v-else class="server-offline">
            <el-empty description="服务器离线" :image-size="60" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <div class="footer">
      <p>© 2025 服务器监控系统 | 实时更新</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import io from 'socket.io-client'
import { 
  Monitor, Setting, Check, Close, Warning 
} from '@element-plus/icons-vue'

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

const fetchServers = async () => {
  try {
    const response = await axios.get('/api/public/servers')
    servers.value = response.data
    
    // 获取每个服务器的监控数据
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

const getProgressColor = (percentage) => {
  if (percentage >= 80) return '#f56c6c'
  if (percentage >= 60) return '#e6a23c'
  return '#67c23a'
}

const getServerStatusClass = (status) => {
  return {
    'status-online': status === 'online',
    'status-offline': status === 'offline'
  }
}

const getStatusTagType = (status) => {
  switch (status) {
    case 'online': return 'success'
    case 'offline': return 'danger'
    default: return 'info'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'online': return '在线'
    case 'offline': return '离线'
    default: return '未知'
  }
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

onMounted(() => {
  fetchServers()
  connectSocket()
  
  // 每30秒刷新一次数据
  setInterval(fetchServers, 30000)
})

onUnmounted(() => {
  if (socket.value) {
    socket.value.disconnect()
  }
})
</script>

<style scoped>
.public-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.header {
  text-align: center;
  color: white;
  margin-bottom: 40px;
}

.header h1 {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 2.5rem;
  margin: 0 0 10px 0;
  font-weight: 300;
}

.subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  margin: 0;
}

.stats-overview {
  margin-bottom: 40px;
}

.stat-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.stat-icon.online { background: #52c41a; }
.stat-icon.offline { background: #f5222d; }
.stat-icon.warning { background: #faad14; }
.stat-icon.total { background: #1890ff; }

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  line-height: 1;
}

.stat-label {
  color: #666;
  font-size: 14px;
  margin-top: 4px;
}

.server-cards {
  margin-bottom: 40px;
}

.server-card {
  margin-bottom: 20px;
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
  transition: all 0.3s;
}

.server-card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.server-card.status-online {
  border-left: 4px solid #52c41a;
}

.server-card.status-offline {
  border-left: 4px solid #f5222d;
}

.server-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.server-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #333;
}

.server-metrics {
  padding: 0;
}

.metric-row {
  margin-bottom: 16px;
}

.metric-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.server-info {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.info-label {
  color: #666;
}

.info-value {
  color: #333;
  font-weight: 500;
}

.server-offline {
  text-align: center;
  padding: 20px 0;
}

.footer {
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 40px;
}

.footer p {
  margin: 0;
  font-size: 14px;
}

:deep(.el-progress-bar__outer) {
  border-radius: 4px;
}

:deep(.el-progress-bar__inner) {
  border-radius: 4px;
}

:deep(.el-card__header) {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}
</style>