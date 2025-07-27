<template>
  <div class="login-container">
    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="floating-circle circle-1"></div>
      <div class="floating-circle circle-2"></div>
      <div class="floating-circle circle-3"></div>
      <div class="floating-circle circle-4"></div>
    </div>

    <!-- 登录卡片 -->
    <div class="login-card">
      <!-- 顶部Logo区域 -->
      <div class="login-header">
        <div class="logo-section">
          <div class="logo-icon">
            <div class="pulse-dot"></div>
          </div>
          <h1 class="app-title">Server Monitor</h1>
          <p class="app-subtitle">服务器监控管理系统</p>
        </div>
      </div>

      <!-- 登录表单 -->
      <div class="login-form-section">
        <div class="form-title">
          <h2>欢迎回来</h2>
          <p>请登录您的管理账户</p>
        </div>

        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="rules"
          @submit.prevent="handleLogin"
          class="login-form"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="请输入用户名"
              size="large"
              :prefix-icon="User"
              class="form-input"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              :prefix-icon="Lock"
              @keyup.enter="handleLogin"
              class="form-input"
              show-password
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              @click="handleLogin"
              class="login-button"
            >
              <span v-if="!loading">立即登录</span>
              <span v-else>登录中...</span>
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 底部信息 -->
        <div class="login-footer">
          <div class="security-notice">
            <el-icon><Lock /></el-icon>
            <span>请妥善保管您的登录凭据</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部版权信息 -->
    <div class="copyright">
      <p>© 2024 Server Monitor. All rights reserved.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Monitor } from '@element-plus/icons-vue'
import { useAuthStore } from '../store/auth'

const router = useRouter()
const authStore = useAuthStore()

const loginFormRef = ref()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    await loginFormRef.value.validate()
    loading.value = true
    
    const result = await authStore.login(loginForm.username, loginForm.password)
    
    if (result.success) {
      ElMessage.success('登录成功')
      router.push('/admin')
    } else {
      ElMessage.error(result.error)
    }
  } catch (error) {
    console.error('登录验证失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  position: relative;
  overflow: hidden;
}

/* 背景装饰 */
.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.floating-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  animation: float 6s ease-in-out infinite;
}

.circle-1 {
  width: 200px;
  height: 200px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.circle-2 {
  width: 150px;
  height: 150px;
  top: 60%;
  right: 15%;
  animation-delay: 2s;
}

.circle-3 {
  width: 100px;
  height: 100px;
  bottom: 20%;
  left: 20%;
  animation-delay: 4s;
}

.circle-4 {
  width: 80px;
  height: 80px;
  top: 30%;
  right: 30%;
  animation-delay: 1s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.5;
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
    opacity: 0.8;
  }
}

/* 登录卡片 */
.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 0;
  width: 480px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  overflow: hidden;
  animation: slideInUp 0.6s ease;
}

@keyframes slideInUp {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 顶部Logo区域 */
.login-header {
  background: linear-gradient(135deg, #007AFF, #5856D6);
  padding: 40px 40px 60px 40px;
  text-align: center;
  position: relative;
}

.login-header::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 30px;
  background: linear-gradient(135deg, #007AFF, #5856D6);
  border-radius: 0 0 50% 50%;
}

.logo-section {
  position: relative;
  z-index: 2;
}

.logo-icon {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px auto;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.pulse-dot {
  width: 32px;
  height: 32px;
  background: white;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}

.app-title {
  font-size: 28px;
  font-weight: 700;
  color: white;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.app-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  font-weight: 400;
}

/* 登录表单区域 */
.login-form-section {
  padding: 40px;
}

.form-title {
  text-align: center;
  margin-bottom: 32px;
}

.form-title h2 {
  font-size: 24px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0 0 8px 0;
}

.form-title p {
  font-size: 16px;
  color: #86868b;
  margin: 0;
}

/* 表单样式 */
.login-form {
  margin-bottom: 32px;
}

:deep(.el-form-item) {
  margin-bottom: 24px;
}

:deep(.form-input .el-input__wrapper) {
  border-radius: 12px;
  padding: 16px 20px;
  border: 2px solid #f0f0f0;
  transition: all 0.3s ease;
  background: #fafafa;
}

:deep(.form-input .el-input__wrapper:hover) {
  border-color: #007AFF;
  background: white;
}

:deep(.form-input .el-input__wrapper.is-focus) {
  border-color: #007AFF;
  background: white;
  box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1);
}

:deep(.form-input .el-input__inner) {
  font-size: 16px;
  color: #1d1d1f;
  font-weight: 500;
}

:deep(.form-input .el-input__inner::placeholder) {
  color: #86868b;
}

:deep(.form-input .el-input__prefix) {
  color: #86868b;
}

.login-button {
  width: 100%;
  height: 56px;
  border-radius: 12px;
  background: linear-gradient(135deg, #007AFF, #5856D6);
  border: none;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 122, 255, 0.3);
}

.login-button:active {
  transform: translateY(0);
}

/* 底部信息 */
.login-footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.security-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  font-size: 14px;
  color: #86868b;
}

.security-notice .el-icon {
  font-size: 16px;
}

/* 版权信息 */
.copyright {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
}

.copyright p {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-card {
    width: 90%;
    max-width: 400px;
    margin: 20px;
  }
  
  .login-header {
    padding: 32px 24px 48px 24px;
  }
  
  .login-form-section {
    padding: 32px 24px;
  }
  
  .app-title {
    font-size: 24px;
  }
  
  .form-title h2 {
    font-size: 20px;
  }
  
  .floating-circle {
    display: none;
  }
}

@media (max-width: 480px) {
  .login-card {
    width: 95%;
    margin: 10px;
  }
  
  .login-header {
    padding: 24px 20px 36px 20px;
  }
  
  .login-form-section {
    padding: 24px 20px;
  }
  
  .logo-icon {
    width: 60px;
    height: 60px;
    margin-bottom: 16px;
  }
  
  .pulse-dot {
    width: 24px;
    height: 24px;
  }
  
  .app-title {
    font-size: 20px;
  }
  
  .app-subtitle {
    font-size: 14px;
  }
}
</style>