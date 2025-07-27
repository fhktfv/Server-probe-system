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
          <h1>服务器管理</h1>
          <p>管理和配置您的服务器</p>
        </div>

        <!-- 操作按钮组 -->
        <div class="actions-section">
          <div class="actions-grid">
            <div class="action-card" @click="showAddDialog">
              <div class="action-icon primary">
                <el-icon><Plus /></el-icon>
              </div>
              <div class="action-content">
                <div class="action-title">添加服务器</div>
                <div class="action-desc">配置新的服务器监控</div>
              </div>
            </div>

            <div class="action-card" @click="showBatchDialog">
              <div class="action-icon success">
                <el-icon><Upload /></el-icon>
              </div>
              <div class="action-content">
                <div class="action-title">批量添加</div>
                <div class="action-desc">一次性添加多台服务器</div>
              </div>
            </div>

            <div class="action-card" @click="showAuthPresetsDialog">
              <div class="action-icon warning">
                <el-icon><Key /></el-icon>
              </div>
              <div class="action-content">
                <div class="action-title">认证预设</div>
                <div class="action-desc">管理SSH认证配置</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 服务器列表 -->
        <section class="servers-section">
          <div class="section-header">
            <h2>服务器列表</h2>
            <div class="header-stats">
              <span class="stat-item">
                <span class="stat-value">{{ servers.length }}</span>
                <span class="stat-label">总计</span>
              </span>
              <span class="stat-item">
                <span class="stat-value online">{{ onlineCount }}</span>
                <span class="stat-label">在线</span>
              </span>
              <span class="stat-item">
                <span class="stat-value offline">{{ offlineCount }}</span>
                <span class="stat-label">离线</span>
              </span>
            </div>
          </div>

          <div class="table-container">
            <div class="table-wrapper">
              <table class="servers-table">
                <thead>
                  <tr>
                    <th>服务器信息</th>
                    <th>连接信息</th>
                    <th>分类</th>
                    <th>状态</th>
                    <th>网络流量</th>
                    <th>描述</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="server in servers" 
                    :key="server.id"
                    class="server-row"
                    :class="getServerRowClass(server)"
                  >
                    <td>
                      <div class="server-info">
                        <div class="server-name">{{ server.name }}</div>
                        <div class="server-id">ID: {{ server.id }}</div>
                      </div>
                    </td>
                    <td>
                      <div class="connection-info">
                        <div class="host">{{ server.host }}</div>
                        <div class="port">端口: {{ server.port }}</div>
                        <div class="username">用户: {{ server.username }}</div>
                      </div>
                    </td>
                    <td>
                      <div class="category-badge" :style="getCategoryStyle(server.category)">
                        {{ getCategoryName(server.category) }}
                      </div>
                    </td>
                    <td>
                      <div class="status-indicator" :class="server.status">
                        <div class="status-dot"></div>
                        <span class="status-text">{{ getStatusText(server.status) }}</span>
                      </div>
                    </td>
                    <td>
                      <div v-if="server.status === 'online' && getServerMonitorData(server.id)" class="network-info">
                        <div class="network-item">
                          <el-icon class="upload-icon"><Top /></el-icon>
                          <span>{{ formatBytes(getServerMonitorData(server.id)?.network_tx || 0) }}</span>
                        </div>
                        <div class="network-item">
                          <el-icon class="download-icon"><Bottom /></el-icon>
                          <span>{{ formatBytes(getServerMonitorData(server.id)?.network_rx || 0) }}</span>
                        </div>
                      </div>
                      <div v-else class="network-offline">
                        <span>-</span>
                      </div>
                    </td>
                    <td>
                      <div class="description">{{ server.description || '-' }}</div>
                    </td>
                    <td>
                      <div class="action-buttons">
                        <el-button
                          size="small"
                          type="primary"
                          @click="testConnection(server)"
                          :loading="server.testing"
                        >
                          测试
                        </el-button>
                        <el-button
                          size="small"
                          @click="editServer(server)"
                        >
                          编辑
                        </el-button>
                        <el-button
                          size="small"
                          type="danger"
                          @click="deleteServer(server)"
                        >
                          删除
                        </el-button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- 添加/编辑服务器对话框 -->
    <el-dialog 
      :title="dialogMode === 'add' ? '添加服务器' : '编辑服务器'"
      v-model="dialogVisible" 
      width="600px"
    >
      <el-form 
        ref="serverFormRef"
        :model="serverForm" 
        :rules="rules" 
        label-width="100px"
      >
        <el-form-item label="服务器名称" prop="name">
          <el-input v-model="serverForm.name" placeholder="请输入服务器名称" />
        </el-form-item>

        <el-form-item label="主机地址" prop="host">
          <el-input v-model="serverForm.host" placeholder="请输入IP地址或域名" />
        </el-form-item>

        <el-form-item label="端口" prop="port">
          <el-input-number v-model="serverForm.port" :min="1" :max="65535" />
        </el-form-item>

        <el-form-item label="用户名" prop="username">
          <el-input v-model="serverForm.username" placeholder="请输入SSH用户名" />
        </el-form-item>

        <el-form-item label="服务器分类" prop="category">
          <el-select 
            v-model="serverForm.category" 
            placeholder="选择分类"
            style="width: 100%"
          >
            <el-option label="默认" value="default" />
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.name"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="认证方式" prop="authType">
          <el-radio-group v-model="authType">
            <el-radio label="preset">使用预设</el-radio>
            <el-radio label="password">密码认证</el-radio>
            <el-radio label="key">密钥认证</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item 
          v-if="authType === 'preset'" 
          label="认证预设" 
          prop="presetId"
        >
          <el-select 
            v-model="serverForm.presetId" 
            placeholder="选择认证预设"
            style="width: 100%"
            @change="applyAuthPreset"
          >
            <el-option
              v-for="preset in authPresets"
              :key="preset.id"
              :label="preset.name"
              :value="preset.id"
            >
              <span>{{ preset.name }}</span>
              <span style="float: right; color: #8492a6; font-size: 12px">
                {{ preset.username }}
              </span>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item 
          v-if="authType === 'password'" 
          label="密码" 
          prop="password"
        >
          <el-input 
            v-model="serverForm.password" 
            type="password" 
            placeholder="请输入SSH密码"
            show-password 
          />
        </el-form-item>

        <el-form-item 
          v-if="authType === 'key'" 
          label="私钥" 
          prop="private_key"
        >
          <el-input 
            v-model="serverForm.private_key" 
            type="textarea" 
            :rows="4"
            placeholder="请输入SSH私钥内容" 
          />
        </el-form-item>

        <el-form-item label="描述">
          <el-input 
            v-model="serverForm.description" 
            type="textarea" 
            placeholder="请输入服务器描述（可选）" 
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="saveServer"
          :loading="saving"
        >
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量添加对话框 -->
    <el-dialog 
      title="批量添加服务器"
      v-model="batchDialogVisible" 
      width="800px"
    >
      <div class="batch-add-section">
        <div class="batch-input-area">
          <el-form label-width="100px">
            <el-form-item label="认证预设">
              <el-select 
                v-model="batchForm.presetId" 
                placeholder="选择认证预设"
                style="width: 100%"
                @change="applyBatchAuthPreset"
              >
                <el-option
                  v-for="preset in authPresets"
                  :key="preset.id"
                  :label="preset.name"
                  :value="preset.id"
                />
              </el-select>
            </el-form-item>
            
            <el-form-item label="IP地址列表">
              <el-input 
                v-model="batchForm.ipList" 
                type="textarea" 
                :rows="6"
                placeholder="请输入IP地址，每行一个，格式：
192.168.1.100 服务器1
192.168.1.101 服务器2
或者只输入IP：
192.168.1.100
192.168.1.101"
              />
            </el-form-item>
            
            <el-form-item label="SSH端口">
              <el-input-number v-model="batchForm.port" :min="1" :max="65535" />
            </el-form-item>
            
            <el-form-item label="用户名">
              <el-input v-model="batchForm.username" placeholder="SSH用户名" />
            </el-form-item>
            
            <el-form-item label="密码">
              <el-input 
                v-model="batchForm.password" 
                type="password" 
                placeholder="SSH密码"
                show-password 
              />
            </el-form-item>
          </el-form>
        </div>
        
        <div class="batch-preview" v-if="parsedServers.length > 0">
          <h4>预览 (共 {{ parsedServers.length }} 台服务器)</h4>
          <el-table :data="parsedServers" max-height="300" size="small">
            <el-table-column prop="name" label="服务器名称" />
            <el-table-column prop="host" label="IP地址" />
            <el-table-column prop="port" label="端口" width="80" />
            <el-table-column prop="username" label="用户名" />
          </el-table>
        </div>
      </div>

      <template #footer>
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="batchAddServers"
          :loading="batchSaving"
          :disabled="parsedServers.length === 0"
        >
          批量添加 ({{ parsedServers.length }})
        </el-button>
      </template>
    </el-dialog>

    <!-- 认证预设管理对话框 -->
    <el-dialog 
      title="认证预设管理"
      v-model="authPresetsDialogVisible" 
      width="800px"
    >
      <div class="auth-presets-header">
        <el-button type="primary" @click="showAddAuthPresetDialog">
          <el-icon><Plus /></el-icon>
          添加预设
        </el-button>
      </div>
      
      <el-table :data="authPresets" style="width: 100%">
        <el-table-column prop="name" label="预设名称" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="description" label="描述" />
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button
              type="warning"
              size="small"
              @click="editAuthPreset(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="deleteAuthPreset(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 添加/编辑认证预设对话框 -->
    <el-dialog 
      :title="authPresetDialogMode === 'add' ? '添加认证预设' : '编辑认证预设'"
      v-model="authPresetDialogVisible" 
      width="500px"
    >
      <el-form 
        ref="authPresetFormRef"
        :model="authPresetForm" 
        :rules="authPresetRules" 
        label-width="100px"
      >
        <el-form-item label="预设名称" prop="name">
          <el-input v-model="authPresetForm.name" placeholder="请输入预设名称" />
        </el-form-item>

        <el-form-item label="用户名" prop="username">
          <el-input v-model="authPresetForm.username" placeholder="请输入SSH用户名" />
        </el-form-item>

        <el-form-item label="密码">
          <el-input 
            v-model="authPresetForm.password" 
            type="password" 
            placeholder="请输入SSH密码（可选）"
            show-password 
          />
        </el-form-item>

        <el-form-item label="私钥">
          <el-input 
            v-model="authPresetForm.private_key" 
            type="textarea" 
            :rows="4"
            placeholder="请输入SSH私钥内容（可选）" 
          />
        </el-form-item>

        <el-form-item label="描述">
          <el-input 
            v-model="authPresetForm.description" 
            type="textarea" 
            placeholder="请输入描述（可选）" 
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="authPresetDialogVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="saveAuthPreset"
          :loading="authPresetSaving"
        >
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, Key, Monitor, Setting, User, ArrowDown, House, SwitchButton, Top, Bottom } from '@element-plus/icons-vue'
import axios from 'axios'
import { useAuthStore } from '../store/auth'

const router = useRouter()
const authStore = useAuthStore()
const servers = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogMode = ref('add')
const saving = ref(false)
const serverFormRef = ref()
const authType = ref('password')

// 认证预设相关
const authPresets = ref([])
const categories = ref([])
const authPresetsDialogVisible = ref(false)
const authPresetDialogVisible = ref(false)
const authPresetDialogMode = ref('add')
const authPresetSaving = ref(false)
const authPresetFormRef = ref()

// 批量添加相关
const batchDialogVisible = ref(false)
const batchSaving = ref(false)

const serverForm = reactive({
  id: null,
  name: '',
  host: '',
  port: 22,
  username: '',
  password: '',
  private_key: '',
  description: '',
  category: 'default',
  presetId: null
})

const batchForm = reactive({
  presetId: null,
  ipList: '',
  port: 22,
  username: '',
  password: ''
})

const authPresetForm = reactive({
  id: null,
  name: '',
  username: '',
  password: '',
  private_key: '',
  description: ''
})

const parsedServers = computed(() => {
  if (!batchForm.ipList.trim()) return []
  
  const lines = batchForm.ipList.trim().split('\n')
  const servers = []
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim()
    if (!trimmedLine) return
    
    const parts = trimmedLine.split(/\s+/)
    const ip = parts[0]
    const name = parts[1] || `服务器-${ip}`
    
    if (ip && /^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
      servers.push({
        name,
        host: ip,
        port: batchForm.port,
        username: batchForm.username,
        password: batchForm.password,
        description: `批量添加 - ${new Date().toLocaleDateString()}`
      })
    }
  })
  
  return servers
})

// 监听批量表单IP列表变化
watch(() => batchForm.ipList, () => {
  // 触发计算属性更新
}, { immediate: true })

const rules = {
  name: [
    { required: true, message: '请输入服务器名称', trigger: 'blur' }
  ],
  host: [
    { required: true, message: '请输入主机地址', trigger: 'blur' }
  ],
  port: [
    { required: true, message: '请输入端口号', trigger: 'blur' }
  ],
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { 
      required: () => authType.value === 'password', 
      message: '请输入密码', 
      trigger: 'blur' 
    }
  ],
  private_key: [
    { 
      required: () => authType.value === 'key', 
      message: '请输入私钥', 
      trigger: 'blur' 
    }
  ],
  presetId: [
    { 
      required: () => authType.value === 'preset', 
      message: '请选择认证预设', 
      trigger: 'change' 
    }
  ]
}

const authPresetRules = {
  name: [
    { required: true, message: '请输入预设名称', trigger: 'blur' }
  ],
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ]
}

const fetchServers = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/servers')
    servers.value = response.data
    
    // 立即获取在线服务器的监控数据
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
    ElMessage.error('获取服务器列表失败')
  } finally {
    loading.value = false
  }
}

const showAddDialog = () => {
  dialogMode.value = 'add'
  resetForm()
  dialogVisible.value = true
}

const editServer = (server) => {
  dialogMode.value = 'edit'
  Object.assign(serverForm, {
    ...server,
    password: server.password === '***' ? '' : server.password,
    private_key: server.private_key === '***' ? '' : server.private_key
  })
  authType.value = server.password !== null ? 'password' : 'key'
  dialogVisible.value = true
}

const resetForm = () => {
  Object.assign(serverForm, {
    id: null,
    name: '',
    host: '',
    port: 22,
    username: '',
    password: '',
    private_key: '',
    description: '',
    category: 'default'
  })
  authType.value = 'password'
  if (serverFormRef.value) {
    serverFormRef.value.resetFields()
  }
}

const saveServer = async () => {
  if (!serverFormRef.value) return
  
  try {
    await serverFormRef.value.validate()
    
    saving.value = true
    
    const data = { ...serverForm }
    if (authType.value === 'password') {
      data.private_key = null
    } else {
      data.password = null
    }
    
    if (dialogMode.value === 'add') {
      await axios.post('/api/servers', data)
      ElMessage.success('服务器添加成功')
    } else {
      await axios.put(`/api/servers/${data.id}`, data)
      ElMessage.success('服务器更新成功')
    }
    
    dialogVisible.value = false
    await fetchServers()
  } catch (error) {
    console.error('保存失败:', error)
    if (error.response?.data?.error) {
      ElMessage.error(error.response.data.error)
    } else {
      ElMessage.error('保存失败')
    }
  } finally {
    saving.value = false
  }
}

const testConnection = async (server) => {
  server.testing = true
  try {
    const response = await axios.post(`/api/servers/${server.id}/test`)
    if (response.data.connected) {
      ElMessage.success('连接成功')
      server.status = 'online'
    } else {
      ElMessage.error('连接失败')
      server.status = 'offline'
    }
  } catch (error) {
    ElMessage.error('连接测试失败')
    server.status = 'offline'
  } finally {
    server.testing = false
  }
}

const deleteServer = async (server) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除服务器 "${server.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await axios.delete(`/api/servers/${server.id}`)
    ElMessage.success('服务器删除成功')
    await fetchServers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
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

onMounted(async () => {
  // 确保认证状态正确
  await authStore.checkAuth()
  
  fetchServers()
  fetchAuthPresets()
  fetchCategories()
  
  // 定期获取监控数据
  setInterval(async () => {
    for (const server of servers.value) {
      if (server.status === 'online') {
        try {
          const response = await axios.get(`/api/servers/${server.id}/monitor`)
          monitorData.value[server.id] = response.data
        } catch (error) {
          console.error(`Failed to fetch monitor data for server ${server.id}`)
        }
      }
    }
  }, 30000) // 每30秒更新一次
})

// 分类相关方法
const fetchCategories = async () => {
  try {
    const response = await axios.get('/api/categories')
    categories.value = response.data
  } catch (error) {
    ElMessage.error('获取分类失败')
  }
}

// 认证预设相关方法
const fetchAuthPresets = async () => {
  try {
    const response = await axios.get('/api/auth-presets')
    authPresets.value = response.data
  } catch (error) {
    ElMessage.error('获取认证预设失败')
  }
}

const showAuthPresetsDialog = () => {
  authPresetsDialogVisible.value = true
}

const showAddAuthPresetDialog = () => {
  authPresetDialogMode.value = 'add'
  resetAuthPresetForm()
  authPresetDialogVisible.value = true
}

const editAuthPreset = (preset) => {
  authPresetDialogMode.value = 'edit'
  Object.assign(authPresetForm, preset)
  authPresetDialogVisible.value = true
}

const resetAuthPresetForm = () => {
  Object.assign(authPresetForm, {
    id: null,
    name: '',
    username: '',
    password: '',
    private_key: '',
    description: ''
  })
  if (authPresetFormRef.value) {
    authPresetFormRef.value.resetFields()
  }
}

const saveAuthPreset = async () => {
  if (!authPresetFormRef.value) return
  
  try {
    await authPresetFormRef.value.validate()
    
    authPresetSaving.value = true
    
    if (authPresetDialogMode.value === 'add') {
      await axios.post('/api/auth-presets', authPresetForm)
      ElMessage.success('认证预设添加成功')
    } else {
      await axios.put(`/api/auth-presets/${authPresetForm.id}`, authPresetForm)
      ElMessage.success('认证预设更新成功')
    }
    
    authPresetDialogVisible.value = false
    await fetchAuthPresets()
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    authPresetSaving.value = false
  }
}

const deleteAuthPreset = async (preset) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除认证预设 "${preset.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await axios.delete(`/api/auth-presets/${preset.id}`)
    ElMessage.success('认证预设删除成功')
    await fetchAuthPresets()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const applyAuthPreset = (presetId) => {
  const preset = authPresets.value.find(p => p.id === presetId)
  if (preset) {
    serverForm.username = preset.username
    serverForm.password = preset.password || ''
    serverForm.private_key = preset.private_key || ''
  }
}

// 批量添加相关方法
const showBatchDialog = () => {
  resetBatchForm()
  batchDialogVisible.value = true
}

const resetBatchForm = () => {
  Object.assign(batchForm, {
    presetId: null,
    ipList: '',
    port: 22,
    username: '',
    password: ''
  })
}

const applyBatchAuthPreset = (presetId) => {
  const preset = authPresets.value.find(p => p.id === presetId)
  if (preset) {
    batchForm.username = preset.username
    batchForm.password = preset.password || ''
  }
}

const batchAddServers = async () => {
  if (parsedServers.value.length === 0) {
    ElMessage.error('请输入有效的IP地址')
    return
  }
  
  try {
    batchSaving.value = true
    
    const response = await axios.post('/api/servers/batch', {
      servers: parsedServers.value
    })
    
    ElMessage.success(`成功添加 ${parsedServers.value.length} 台服务器`)
    batchDialogVisible.value = false
    await fetchServers()
  } catch (error) {
    ElMessage.error('批量添加失败')
  } finally {
    batchSaving.value = false
  }
}

// 用户菜单处理
const handleCommand = (command) => {
  switch (command) {
    case 'home':
      window.location.href = '/'
      break
    case 'logout':
      localStorage.removeItem('token')
      window.location.href = '/guanli'
      break
  }
}

// 服务器统计
const onlineCount = computed(() => {
  return servers.value.filter(s => s.status === 'online').length
})

const offlineCount = computed(() => {
  return servers.value.filter(s => s.status === 'offline').length
})

// 获取分类名称
const getCategoryName = (categoryName) => {
  if (categoryName === 'default') return '默认'
  const category = categories.value.find(c => c.name === categoryName)
  return category ? category.name : categoryName
}

// 获取分类样式
const getCategoryStyle = (categoryName) => {
  if (categoryName === 'default') {
    return {
      background: '#f0f0f0',
      color: '#666',
      padding: '4px 8px',
      borderRadius: '8px',
      fontSize: '12px',
      fontWeight: '500'
    }
  }
  
  const category = categories.value.find(c => c.name === categoryName)
  if (category) {
    return {
      background: category.color,
      color: 'white',
      padding: '4px 8px',
      borderRadius: '8px',
      fontSize: '12px',
      fontWeight: '500'
    }
  }
  
  return {
    background: '#1890ff',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '500'
  }
}

// 获取服务器行样式类
const getServerRowClass = (server) => {
  return {
    'online': server.status === 'online',
    'offline': server.status === 'offline'
  }
}

// 添加缺失的方法
const monitorData = ref({})

// 获取服务器监控数据
const getServerMonitorData = (serverId) => {
  return monitorData.value[serverId]
}

// 格式化字节大小
const formatBytes = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
</script>

<style scoped>
/* 整体布局 */
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

/* 操作按钮组 */
.actions-section {
  margin-bottom: 32px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  max-width: 900px;
}

.action-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.action-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  flex-shrink: 0;
}

.action-icon.primary { background: #007AFF; }
.action-icon.success { background: #34C759; }
.action-icon.warning { background: #FF9500; }

.action-content {
  flex: 1;
}

.action-title {
  font-size: 18px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 4px;
}

.action-desc {
  font-size: 14px;
  color: #86868b;
}

/* 服务器列表 */
.servers-section {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.section-header {
  padding: 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0;
}

.header-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #1d1d1f;
}

.stat-value.online { color: #34C759; }
.stat-value.offline { color: #FF3B30; }

.stat-label {
  font-size: 12px;
  color: #86868b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 表格容器 */
.table-container {
  overflow-x: auto;
}

.table-wrapper {
  min-width: 100%;
}

.servers-table {
  width: 100%;
  border-collapse: collapse;
}

.servers-table th {
  padding: 16px 24px;
  text-align: left;
  font-weight: 600;
  color: #86868b;
  font-size: 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background: #f8f9fa;
  position: sticky;
  top: 0;
  z-index: 10;
}

.servers-table td {
  padding: 16px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  vertical-align: middle;
}

.server-row {
  transition: all 0.2s ease;
}

.server-row:hover {
  background: rgba(0, 122, 255, 0.02);
}

.server-row.online {
  border-left: 3px solid #34C759;
}

.server-row.offline {
  border-left: 3px solid #FF3B30;
}

.server-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.server-name {
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1f;
}

.server-id {
  font-size: 12px;
  color: #86868b;
  font-family: 'SF Mono', Monaco, monospace;
}

.connection-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.host {
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
  font-family: 'SF Mono', Monaco, monospace;
}

.port, .username {
  font-size: 12px;
  color: #86868b;
}

.category-badge {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-indicator.online .status-dot {
  background: #34C759;
  animation: pulse-green 2s infinite;
}

.status-indicator.offline .status-dot {
  background: #FF3B30;
}

@keyframes pulse-green {
  0%, 100% { box-shadow: 0 0 0 0 rgba(52, 199, 89, 0.7); }
  50% { box-shadow: 0 0 0 4px rgba(52, 199, 89, 0); }
}

.status-text {
  font-size: 14px;
  font-weight: 500;
  color: #1d1d1f;
}

.description {
  font-size: 14px;
  color: #86868b;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

/* 网络流量样式 */
.network-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.network-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #1d1d1f;
}

.upload-icon {
  color: #FF9500;
  font-size: 14px;
}

.download-icon {
  color: #34C759;
  font-size: 14px;
}

.network-offline {
  color: #86868b;
  font-size: 14px;
  text-align: center;
}

/* 对话框样式 */
:deep(.el-dialog) {
  border-radius: 16px;
  backdrop-filter: blur(10px);
  overflow: hidden;
}

:deep(.el-dialog__header) {
  background: #f8f9fa;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

:deep(.el-dialog__body) {
  padding: 24px;
}

:deep(.el-dialog__footer) {
  padding: 16px 24px;
  background: #f8f9fa;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

/* 按钮样式 */
:deep(.el-button) {
  border-radius: 8px;
  transition: all 0.2s ease;
  font-weight: 500;
}

:deep(.el-button:hover) {
  transform: translateY(-1px);
}

:deep(.el-button--primary) {
  background: #007AFF;
  border-color: #007AFF;
}

:deep(.el-button--success) {
  background: #34C759;
  border-color: #34C759;
}

:deep(.el-button--danger) {
  background: #FF3B30;
  border-color: #FF3B30;
}

:deep(.el-button--warning) {
  background: #FF9500;
  border-color: #FF9500;
}

/* 表单样式 */
:deep(.el-form-item__label) {
  font-weight: 600;
  color: #1d1d1f;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

:deep(.el-input__wrapper:hover) {
  border-color: #007AFF;
}

:deep(.el-select .el-input .el-select__caret) {
  color: #86868b;
}

:deep(.el-textarea__inner) {
  border-radius: 8px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .actions-grid {
    grid-template-columns: 1fr;
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
  
  .servers-table {
    font-size: 14px;
  }
  
  .servers-table th,
  .servers-table td {
    padding: 12px 16px;
  }
  
  .action-card {
    padding: 20px;
  }
  
  .section-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
}

@media (max-width: 480px) {
  .admin-main {
    padding: 20px 0;
  }
  
  .page-header h1 {
    font-size: 24px;
  }
  
  .action-card {
    padding: 16px;
  }
  
  .section-header {
    padding: 16px;
  }
  
  .servers-table th,
  .servers-table td {
    padding: 8px 12px;
  }
}
</style>