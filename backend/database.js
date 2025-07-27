const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../data/servers.db');
    this.db = new sqlite3.Database(dbPath);
    this.init();
  }

  init() {
    this.db.serialize(() => {
      // 服务器表
      this.db.run(`
        CREATE TABLE IF NOT EXISTS servers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          host TEXT NOT NULL,
          port INTEGER DEFAULT 22,
          username TEXT NOT NULL,
          password TEXT,
          private_key TEXT,
          description TEXT,
          category TEXT DEFAULT 'default',
          status TEXT DEFAULT 'offline',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 服务器分类表
      this.db.run(`
        CREATE TABLE IF NOT EXISTS server_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          color TEXT DEFAULT '#1890ff',
          icon TEXT DEFAULT 'Setting',
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 监控数据表
      this.db.run(`
        CREATE TABLE IF NOT EXISTS monitor_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          server_id INTEGER,
          cpu_usage REAL,
          memory_total INTEGER,
          memory_used INTEGER,
          memory_free INTEGER,
          disk_total INTEGER,
          disk_used INTEGER,
          disk_free INTEGER,
          network_rx INTEGER,
          network_tx INTEGER,
          load_avg TEXT,
          uptime INTEGER,
          processes INTEGER,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (server_id) REFERENCES servers (id)
        )
      `);

      // 用户表（简单认证）
      this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT DEFAULT 'user',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 固定认证配置表
      this.db.run(`
        CREATE TABLE IF NOT EXISTS auth_presets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          username TEXT NOT NULL,
          password TEXT,
          private_key TEXT,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 创建默认管理员账户
      this.createDefaultAdmin();
      
      // 创建默认认证预设
      this.createDefaultAuthPresets();
      
      // 创建默认分类
      this.createDefaultCategories();
    });
  }

  createDefaultAdmin() {
    const bcrypt = require('bcryptjs');
    const defaultPassword = bcrypt.hashSync('admin123', 10);
    
    this.db.get('SELECT id FROM users WHERE username = ?', ['admin'], (err, row) => {
      if (!row) {
        this.db.run(
          'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
          ['admin', defaultPassword, 'admin']
        );
      }
    });
  }

  createDefaultAuthPresets() {
    // 检查是否已存在默认预设
    this.db.get('SELECT id FROM auth_presets WHERE name = ?', ['默认root认证'], (err, row) => {
      if (!row) {
        this.db.run(
          'INSERT INTO auth_presets (name, username, password, description) VALUES (?, ?, ?, ?)',
          ['默认root认证', 'root', 'password123', '常用的root账号认证']
        );
      }
    });
    
    this.db.get('SELECT id FROM auth_presets WHERE name = ?', ['Ubuntu用户'], (err, row) => {
      if (!row) {
        this.db.run(
          'INSERT INTO auth_presets (name, username, password, description) VALUES (?, ?, ?, ?)',
          ['Ubuntu用户', 'ubuntu', '', 'Ubuntu默认用户（通常使用密钥认证）']
        );
      }
    });
  }

  createDefaultCategories() {
    const defaultCategories = [
      { name: '生产环境', color: '#f5222d', icon: 'Monitor', description: '生产服务器' },
      { name: '测试环境', color: '#faad14', icon: 'Setting', description: '测试服务器' },
      { name: '开发环境', color: '#52c41a', icon: 'VideoPlay', description: '开发服务器' },
      { name: 'CDN节点', color: '#1890ff', icon: 'Connection', description: 'CDN服务器' },
      { name: '数据库', color: '#722ed1', icon: 'Database', description: '数据库服务器' }
    ];
    
    defaultCategories.forEach(category => {
      this.db.get('SELECT id FROM server_categories WHERE name = ?', [category.name], (err, row) => {
        if (!row) {
          this.db.run(
            'INSERT INTO server_categories (name, color, icon, description) VALUES (?, ?, ?, ?)',
            [category.name, category.color, category.icon, category.description]
          );
        }
      });
    });
  }

  // 服务器相关方法
  addServer(serverData, callback) {
    const { name, host, port = 22, username, password, private_key, description, category = 'default' } = serverData;
    this.db.run(
      `INSERT INTO servers (name, host, port, username, password, private_key, description, category)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, host, port, username, password, private_key, description, category],
      function(err) {
        callback(err, this ? this.lastID : null);
      }
    );
  }

  getAllServers(callback) {
    this.db.all('SELECT * FROM servers ORDER BY name', callback);
  }

  getServer(id, callback) {
    this.db.get('SELECT * FROM servers WHERE id = ?', [id], callback);
  }

  updateServer(id, serverData, callback) {
    const { name, host, port, username, password, private_key, description, category } = serverData;
    this.db.run(
      `UPDATE servers SET name = ?, host = ?, port = ?, username = ?, 
       password = ?, private_key = ?, description = ?, category = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, host, port, username, password, private_key, description, category, id],
      callback
    );
  }

  deleteServer(id, callback) {
    this.db.run('DELETE FROM servers WHERE id = ?', [id], callback);
  }

  updateServerStatus(id, status, callback) {
    this.db.run(
      'UPDATE servers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id],
      callback
    );
  }

  // 监控数据相关方法
  saveMonitorData(serverData, callback) {
    const {
      server_id, cpu_usage, memory_total, memory_used, memory_free,
      disk_total, disk_used, disk_free, network_rx, network_tx,
      load_avg, uptime, processes
    } = serverData;

    this.db.run(
      `INSERT INTO monitor_data 
       (server_id, cpu_usage, memory_total, memory_used, memory_free,
        disk_total, disk_used, disk_free, network_rx, network_tx,
        load_avg, uptime, processes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [server_id, cpu_usage, memory_total, memory_used, memory_free,
       disk_total, disk_used, disk_free, network_rx, network_tx,
       load_avg, uptime, processes],
      callback
    );
  }

  getLatestMonitorData(serverId, callback) {
    this.db.get(
      'SELECT * FROM monitor_data WHERE server_id = ? ORDER BY timestamp DESC LIMIT 1',
      [serverId],
      callback
    );
  }

  getMonitorHistory(serverId, hours = 24, callback) {
    this.db.all(
      `SELECT * FROM monitor_data 
       WHERE server_id = ? AND timestamp >= datetime('now', '-${hours} hours')
       ORDER BY timestamp DESC`,
      [serverId],
      callback
    );
  }

  // 用户认证相关方法
  getUserByUsername(username, callback) {
    this.db.get('SELECT * FROM users WHERE username = ?', [username], callback);
  }

  // 认证预设相关方法
  getAllAuthPresets(callback) {
    this.db.all('SELECT * FROM auth_presets ORDER BY name', callback);
  }

  getAuthPreset(id, callback) {
    this.db.get('SELECT * FROM auth_presets WHERE id = ?', [id], callback);
  }

  addAuthPreset(presetData, callback) {
    const { name, username, password, private_key, description } = presetData;
    this.db.run(
      'INSERT INTO auth_presets (name, username, password, private_key, description) VALUES (?, ?, ?, ?, ?)',
      [name, username, password, private_key, description],
      function(err) {
        callback(err, this ? this.lastID : null);
      }
    );
  }

  updateAuthPreset(id, presetData, callback) {
    const { name, username, password, private_key, description } = presetData;
    this.db.run(
      'UPDATE auth_presets SET name = ?, username = ?, password = ?, private_key = ?, description = ? WHERE id = ?',
      [name, username, password, private_key, description, id],
      callback
    );
  }

  deleteAuthPreset(id, callback) {
    this.db.run('DELETE FROM auth_presets WHERE id = ?', [id], callback);
  }

  // 分类管理相关方法
  getAllCategories(callback) {
    this.db.all('SELECT * FROM server_categories ORDER BY name', callback);
  }

  getCategory(id, callback) {
    this.db.get('SELECT * FROM server_categories WHERE id = ?', [id], callback);
  }

  addCategory(categoryData, callback) {
    const { name, color, icon, description } = categoryData;
    this.db.run(
      'INSERT INTO server_categories (name, color, icon, description) VALUES (?, ?, ?, ?)',
      [name, color, icon, description],
      function(err) {
        callback(err, this ? this.lastID : null);
      }
    );
  }

  updateCategory(id, categoryData, callback) {
    const { name, color, icon, description } = categoryData;
    this.db.run(
      'UPDATE server_categories SET name = ?, color = ?, icon = ?, description = ? WHERE id = ?',
      [name, color, icon, description, id],
      callback
    );
  }

  deleteCategory(id, callback) {
    // 先将使用此分类的服务器改为默认分类
    this.db.run('UPDATE servers SET category = ? WHERE category = (SELECT name FROM server_categories WHERE id = ?)', 
      ['default', id], (err) => {
        if (err) {
          callback(err);
          return;
        }
        // 然后删除分类
        this.db.run('DELETE FROM server_categories WHERE id = ?', [id], callback);
      }
    );
  }

  // 批量添加服务器（简化版本）
  addMultipleServers(serversData, callback) {
    if (!serversData || serversData.length === 0) {
      callback(new Error('No servers to add'), []);
      return;
    }

    const results = [];
    let completed = 0;
    
    serversData.forEach((serverData, index) => {
      this.addServer(serverData, (err, id) => {
        completed++;
        
        if (err) {
          results.push({ index, error: err.message, success: false });
        } else {
          results.push({ index, id, success: true });
        }
        
        if (completed === serversData.length) {
          const hasError = results.some(r => !r.success);
          callback(hasError ? new Error('Some servers failed to add') : null, results);
        }
      });
    });
  }

  // 清理旧数据（保留最近7天）
  cleanOldData(callback) {
    this.db.run(
      "DELETE FROM monitor_data WHERE timestamp < datetime('now', '-7 days')",
      callback
    );
  }

  close() {
    this.db.close();
  }
}

module.exports = Database;