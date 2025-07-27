const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cron = require('node-cron');
const path = require('path');

const Database = require('./database');
const SystemMonitor = require('./monitor');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 信任代理配置（支持宝塔面板反向代理）
app.set('trust proxy', 1);

// 中间件配置
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// 初始化数据库和监控器
const db = new Database();
const monitor = new SystemMonitor();

// JWT中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// 公开API - 获取服务器状态（不需要认证）
app.get('/api/public/servers', (req, res) => {
  db.getAllServers((err, servers) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch servers' });
    }
    
    // 只返回公开信息，隐藏敏感数据
    const publicServers = servers.map(server => ({
      id: server.id,
      name: server.name,
      description: server.description,
      status: server.status,
      created_at: server.created_at,
      updated_at: server.updated_at
    }));
    
    res.json(publicServers);
  });
});

// 公开API - 获取服务器监控数据（不需要认证）
app.get('/api/public/servers/:id/monitor', (req, res) => {
  const { id } = req.params;
  
  db.getLatestMonitorData(id, (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch monitor data' });
    }
    res.json(data || {});
  });
});

// 认证路由
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    db.getUserByUsername(username, (err, user) => {
      if (err || !user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      bcrypt.compare(password, user.password, (err, result) => {
        if (err || !result) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
          { id: user.id, username: user.username, role: user.role },
          process.env.JWT_SECRET || 'fallback-secret',
          { expiresIn: '24h' }
        );

        res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// 验证token路由
app.get('/api/verify', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// 服务器管理路由
app.get('/api/servers', authenticateToken, (req, res) => {
  db.getAllServers((err, servers) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch servers' });
    }
    
    // 不返回敏感信息
    const safeServers = servers.map(server => ({
      ...server,
      password: server.password ? '***' : null,
      private_key: server.private_key ? '***' : null
    }));
    
    res.json(safeServers);
  });
});

app.post('/api/servers', authenticateToken, (req, res) => {
  const serverData = req.body;
  
  console.log('Adding server:', serverData);
  
  db.addServer(serverData, (err, id) => {
    if (err) {
      console.error('Database error adding server:', err);
      return res.status(500).json({ error: 'Failed to add server', details: err.message });
    }
    console.log('Server added successfully, ID:', id);
    res.json({ id, message: 'Server added successfully' });
  });
});

app.put('/api/servers/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const serverData = req.body;
  
  db.updateServer(id, serverData, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update server' });
    }
    res.json({ message: 'Server updated successfully' });
  });
});

app.delete('/api/servers/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  // 断开连接
  monitor.disconnect(parseInt(id));
  
  db.deleteServer(id, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete server' });
    }
    res.json({ message: 'Server deleted successfully' });
  });
});

// 测试服务器连接
app.post('/api/servers/:id/test', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    db.getServer(id, async (err, server) => {
      if (err || !server) {
        return res.status(404).json({ error: 'Server not found' });
      }

      const isConnected = await monitor.testConnection(server);
      
      // 更新服务器状态
      db.updateServerStatus(id, isConnected ? 'online' : 'offline', () => {});
      
      res.json({ connected: isConnected });
    });
  } catch (error) {
    res.status(500).json({ error: 'Connection test failed' });
  }
});

// 获取服务器监控数据
app.get('/api/servers/:id/monitor', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.getLatestMonitorData(id, (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch monitor data' });
    }
    res.json(data || {});
  });
});

//  获取历史监控数据
app.get('/api/servers/:id/history', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { hours = 24 } = req.query;
  
  db.getMonitorHistory(id, parseInt(hours), (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch history data' });
    }
    res.json(data || []);
  });
});

// 认证预设管理
app.get('/api/auth-presets', authenticateToken, (req, res) => {
  db.getAllAuthPresets((err, presets) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch auth presets' });
    }
    res.json(presets);
  });
});

app.post('/api/auth-presets', authenticateToken, (req, res) => {
  const presetData = req.body;
  
  db.addAuthPreset(presetData, (err, id) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to add auth preset' });
    }
    res.json({ id, message: 'Auth preset added successfully' });
  });
});

app.put('/api/auth-presets/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const presetData = req.body;
  
  db.updateAuthPreset(id, presetData, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update auth preset' });
    }
    res.json({ message: 'Auth preset updated successfully' });
  });
});

app.delete('/api/auth-presets/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.deleteAuthPreset(id, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete auth preset' });
    }
    res.json({ message: 'Auth preset deleted successfully' });
  });
});

// 批量添加服务器
app.post('/api/servers/batch', authenticateToken, (req, res) => {
  const { servers } = req.body;
  
  if (!servers || !Array.isArray(servers) || servers.length === 0) {
    return res.status(400).json({ error: 'Invalid servers data' });
  }
  
  db.addMultipleServers(servers, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to add servers', details: results });
    }
    res.json({ message: 'Servers added successfully', results });
  });
});

// 分类管理
app.get('/api/categories', authenticateToken, (req, res) => {
  db.getAllCategories((err, categories) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }
    res.json(categories);
  });
});

app.post('/api/categories', authenticateToken, (req, res) => {
  const categoryData = req.body;
  
  db.addCategory(categoryData, (err, id) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to add category' });
    }
    res.json({ id, message: 'Category added successfully' });
  });
});

app.put('/api/categories/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const categoryData = req.body;
  
  db.updateCategory(id, categoryData, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update category' });
    }
    res.json({ message: 'Category updated successfully' });
  });
});

app.delete('/api/categories/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.deleteCategory(id, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete category' });
    }
    res.json({ message: 'Category deleted successfully' });
  });
});

// 公开API - 获取分类（用于首页）
app.get('/api/public/categories', (req, res) => {
  db.getAllCategories((err, categories) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }
    res.json(categories);
  });
});

// Socket.IO 连接处理
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// 定时监控任务
let monitoringServers = new Set();

const startMonitoring = async () => {
  db.getAllServers(async (err, servers) => {
    if (err) return;
    
    for (const server of servers) {
      if (monitoringServers.has(server.id)) continue;
      
      try {
        await monitor.connectToServer(server);
        monitoringServers.add(server.id);
        
        // 更新服务器状态为在线
        db.updateServerStatus(server.id, 'online', () => {});
        
        console.log(`Connected to server: ${server.name}`);
      } catch (error) {
        console.error(`Failed to connect to ${server.name}:`, error.message);
        db.updateServerStatus(server.id, 'offline', () => {});
      }
    }
  });
};

// 收集监控数据
const collectMonitorData = async () => {
  for (const serverId of monitoringServers) {
    try {
      const systemInfo = await monitor.getSystemInfo(serverId);
      
      // 保存到数据库
      db.saveMonitorData({
        server_id: serverId,
        ...systemInfo
      }, (err) => {
        if (err) {
          console.error(`Failed to save monitor data for server ${serverId}:`, err);
        }
      });
      
      // 通过WebSocket发送实时数据
      io.emit('monitor_data', {
        server_id: serverId,
        data: systemInfo
      });
      
    } catch (error) {
      console.error(`Failed to collect data from server ${serverId}:`, error.message);
      
      // 标记服务器离线
      db.updateServerStatus(serverId, 'offline', () => {});
      monitoringServers.delete(serverId);
      monitor.disconnect(serverId);
    }
  }
};

// 定时任务
cron.schedule('*/30 * * * * *', collectMonitorData); // 每30秒收集一次数据
cron.schedule('*/2 * * * *', startMonitoring); // 每2分钟尝试连接离线服务器
cron.schedule('0 2 * * *', () => { // 每天凌晨2点清理旧数据
  db.cleanOldData(() => {
    console.log('Old data cleaned');
  });
});

// 启动时初始化连接
setTimeout(startMonitoring, 5000);

// 根路由 - 返回前端应用
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 处理Vue Router的history模式 - 所有非API路由都返回index.html
app.get('*', (req, res) => {
  // 如果是API请求，不处理
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server Monitor running on port ${PORT}`);
  console.log(`Default admin credentials: admin / admin123`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  monitor.disconnectAll();
  db.close();
  process.exit(0);
});