import { reactive } from 'vue'
import axios from 'axios'

const state = reactive({
  isAuthenticated: false,
  user: null,
  token: localStorage.getItem('token')
})

// 设置axios默认headers
if (state.token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`
}

export const useAuthStore = () => {
  const login = async (username, password) => {
    try {
      const response = await axios.post('/api/login', { username, password })
      const { token, user } = response.data
      
      state.token = token
      state.user = user
      state.isAuthenticated = true
      
      localStorage.setItem('token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || '登录失败' 
      }
    }
  }

  const logout = () => {
    state.token = null
    state.user = null
    state.isAuthenticated = false
    
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
  }

  const checkAuth = async () => {
    if (!state.token) return false
    
    try {
      const response = await axios.get('/api/verify')
      state.user = response.data.user
      state.isAuthenticated = true
      return true
    } catch (error) {
      logout()
      return false
    }
  }

  // 初始化时检查认证状态
  if (state.token && !state.isAuthenticated) {
    checkAuth()
  }

  return {
    state,
    login,
    logout,
    checkAuth,
    isAuthenticated: state.isAuthenticated
  }
}