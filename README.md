# 🖥️ Server Monitor - 轻量级服务器监控系统

一个基于 Vue 3 + Node.js 的现代化服务器监控系统，支持 SSH 连接多台服务器进行实时监控。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node.js-v16+-green.svg)
![Vue](https://img.shields.io/badge/vue-3.x-brightgreen.svg)

### ✨截图示例
<img width="1919" height="955" alt="image" src="https://github.com/user-attachments/assets/9389bb2a-d1e3-46b4-b129-817cef81760b" />
<img width="1462" height="898" alt="image" src="https://github.com/user-attachments/assets/d859cb01-3570-43ca-b89e-ddbfe4bbe57c" />
<img width="1698" height="960" alt="image" src="https://github.com/user-attachments/assets/731be944-b231-4d03-8d8e-bf11527b7f13" />
<img width="682" height="647" alt="image" src="https://github.com/user-attachments/assets/876138f5-3fd7-427a-af72-6f4e88ce7a82" />


### 🎯 核心功能
- **实时监控**: CPU、内存、磁盘、网络流量实时监控
- **多服务器管理**: 支持通过SSH连接管理多台服务器
- **可视化面板**: 直观的图表和数据展示
- **认证管理**: 支持密码和SSH密钥认证
- **分类管理**: 服务器分类组织和管理
- **历史数据**: 监控数据历史记录和趋势分析

### 🛡️ 安全特性
- JWT token 认证
- 密码 bcrypt 加密
- SSH2 加密连接
- 请求频率限制
- Helmet 安全头部

### 🎨 界面特性
- 响应式设计，支持移动端
- 现代化 UI 设计
- Element Plus UI 组件
- 实时数据更新
- 公开展示页面

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0
- 被监控服务器需支持SSH连接

### 安装部署

```bash
# 克隆项目
git clone https://github.com/yourusername/server-monitor.git
cd server-monitor

# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install

# 构建前端
npm run build

# 复制构建文件到后端
cp -r dist/* ../backend/public/

# 启动后端服务
cd ../backend
npm start
```

### 配置

#### 环境变量
```bash
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key
DATABASE_PATH=/path/to/servers.db
PORT=3000
```

#### 默认账户
- 用户名: `admin`
- 密码: `admin123`

⚠️ **首次使用请立即修改默认密码！**

## 📖 使用说明

### 1. 登录管理后台
访问 `http://your-domain:3000/admin` 使用默认账户登录

### 2. 添加服务器
- 点击"添加服务器"
- 填写服务器信息（IP、端口、用户名、密码或密钥）
- 支持批量添加和认证预设

### 3. 监控数据
- 实时查看服务器状态
- 查看历史监控数据
- 公开页面展示: `http://your-domain:3000`

## 🏗️ 技术架构

### 后端技术栈
- **框架**: Express.js
- **数据库**: SQLite
- **认证**: JWT + bcrypt
- **SSH**: ssh2
- **实时通信**: Socket.io
- **安全**: Helmet, Rate Limiting

### 前端技术栈
- **框架**: Vue 3 (Composition API)
- **UI组件**: Element Plus
- **构建工具**: Vite
- **状态管理**: Vuex
- **图表**: Chart.js
- **HTTP客户端**: Axios

### 项目结构
```
server-monitor/
├── backend/                 # 后端代码
│   ├── app.js              # 主服务器文件
│   ├── database.js         # 数据库操作
│   ├── monitor.js          # SSH监控逻辑
│   └── public/             # 前端构建文件
├── frontend/               # 前端代码
│   ├── src/
│   │   ├── components/     # Vue组件
│   │   ├── views/          # 页面组件
│   │   ├── store/          # Vuex状态管理
│   │   └── utils/          # 工具函数
│   └── vite.config.js      # Vite配置
├── data/                   # 数据目录
├── docker-compose.yml      # Docker配置
└── Dockerfile             # Docker镜像配置
```

## 🔧 开发指南

### 开发环境搭建
```bash
# 后端开发
cd backend
npm run dev

# 前端开发
cd frontend
npm run dev
```

### API 接口

#### 认证
- `POST /api/login` - 用户登录
- `GET /api/verify` - 验证token

#### 服务器管理
- `GET /api/servers` - 获取服务器列表
- `POST /api/servers` - 添加服务器
- `PUT /api/servers/:id` - 更新服务器
- `DELETE /api/servers/:id` - 删除服务器
- `POST /api/servers/:id/test` - 测试连接

#### 监控数据
- `GET /api/servers/:id/monitor` - 获取实时监控数据
- `GET /api/servers/:id/history` - 获取历史数据

#### 公开API
- `GET /api/public/servers` - 公开服务器状态
- `GET /api/public/servers/:id/monitor` - 公开监控数据


### 贡献步骤
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📝 更新日志

### v1.0.0 (2025-01-XX)
- ✨ 初始版本发布
- 🎯 支持多服务器SSH监控
- 📊 实时数据可视化
- 🔐 JWT认证系统
- 📱 响应式UI设计

## 🐛 问题反馈

如果您遇到问题，请通过以下方式反馈：
- 提交 [Issue](https://github.com/yourusername/server-monitor/issues)
- 发送邮件至: your-email@domain.com

## 📄 开源协议

本项目采用 MIT 协议 - 查看 [LICENSE](./LICENSE) 文件了解详情

## 🙏 致谢

感谢以下开源项目：
- [Vue.js](https://vuejs.org/)
- [Express.js](https://expressjs.com/)
- [Element Plus](https://element-plus.org/)
- [ssh2](https://github.com/mscdex/ssh2)


⭐ 如果这个项目对您有帮助，请给个 Star！
