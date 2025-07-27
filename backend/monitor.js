const { Client } = require('ssh2');
const os = require('os');

class SystemMonitor {
  constructor() {
    this.connections = new Map();
  }

  // 建立SSH连接
  async connectToServer(serverInfo) {
    return new Promise((resolve, reject) => {
      const conn = new Client();
      const { host, port = 22, username, password, private_key } = serverInfo;

      const config = {
        host,
        port,
        username,
        readyTimeout: 10000,
        algorithms: {
          kex: ['diffie-hellman-group-exchange-sha256', 'diffie-hellman-group14-sha256'],
          cipher: ['aes128-ctr', 'aes192-ctr', 'aes256-ctr']
        }
      };

      if (private_key) {
        config.privateKey = private_key;
      } else if (password) {
        config.password = password;
      }

      conn.on('ready', () => {
        this.connections.set(serverInfo.id, conn);
        resolve(conn);
      });

      conn.on('error', (err) => {
        reject(err);
      });

      conn.connect(config);
    });
  }

  // 执行SSH命令
  async executeCommand(serverId, command) {
    return new Promise((resolve, reject) => {
      const conn = this.connections.get(serverId);
      if (!conn) {
        reject(new Error('No connection found for server'));
        return;
      }

      conn.exec(command, (err, stream) => {
        if (err) {
          reject(err);
          return;
        }

        let output = '';
        let error = '';

        stream.on('close', (code) => {
          if (code === 0) {
            resolve(output.trim());
          } else {
            reject(new Error(error || `Command failed with code ${code}`));
          }
        });

        stream.on('data', (data) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data) => {
          error += data.toString();
        });
      });
    });
  }

  // 获取系统信息
  async getSystemInfo(serverId) {
    try {
      const commands = {
        // CPU信息和使用率 - 使用更可靠的方法
        cpu: "grep 'cpu ' /proc/stat | awk '{usage=($2+$4)*100/($2+$3+$4+$5)} END {print usage}' || top -bn1 | grep 'Cpu(s)' | sed 's/.*, *\\([0-9.]*\\)%* id.*/\\1/' | awk '{print 100 - $1}' || echo '0'",
        
        // 内存信息
        memory: "free -b | grep '^Mem:' | awk '{print $2,$3,$7}'",
        
        // 磁盘信息 - 获取根分区信息
        disk: "df -B1 / | tail -1 | awk '{print $2,$3,$4}'",
        
        // 网络流量 - 改进网络接口检测
        network: "cat /proc/net/dev | grep -E '(eth0|ens[0-9]+|eno[0-9]+|enp[0-9]+s[0-9]+)' | head -1 | awk '{print $2,$10}' || cat /proc/net/dev | tail -n +3 | head -1 | awk '{print $2,$10}' || echo '0 0'",
        
        // 系统负载
        load: "cat /proc/loadavg | awk '{print $1,$2,$3}'",
        
        // 系统运行时间
        uptime: "cat /proc/uptime | awk '{print $1}'",
        
        // 进程数量
        processes: "ps aux | wc -l",
        
        // 系统信息
        sysinfo: "uname -sr && cat /proc/version | head -1"
      };

      const results = {};
      
      for (const [key, cmd] of Object.entries(commands)) {
        try {
          results[key] = await this.executeCommand(serverId, cmd);
        } catch (err) {
          console.error(`Error executing ${key} command:`, err);
          results[key] = null;
        }
      }

      return this.parseSystemData(results);
    } catch (error) {
      throw new Error(`Failed to get system info: ${error.message}`);
    }
  }

  // 解析系统数据
  parseSystemData(raw) {
    const data = {
      timestamp: new Date().toISOString(),
      cpu_usage: 0,
      memory_total: 0,
      memory_used: 0,
      memory_free: 0,
      disk_total: 0,
      disk_used: 0,
      disk_free: 0,
      network_rx: 0,
      network_tx: 0,
      load_avg: '0 0 0',
      uptime: 0,
      processes: 0
    };

    // 解析CPU使用率
    if (raw.cpu) {
      const cpuStr = raw.cpu.toString().trim();
      const cpu = parseFloat(cpuStr);
      data.cpu_usage = isNaN(cpu) ? 0 : Math.round(cpu * 100) / 100;
      console.log(`CPU raw: "${cpuStr}", parsed: ${data.cpu_usage}`);
    }

    // 解析内存信息 (单位: 字节)
    if (raw.memory) {
      const memParts = raw.memory.toString().trim().split(/\s+/);
      if (memParts.length >= 3) {
        data.memory_total = parseInt(memParts[0]) || 0;
        data.memory_used = parseInt(memParts[1]) || 0;
        data.memory_free = parseInt(memParts[2]) || 0;
        console.log(`Memory raw: "${raw.memory}", parsed: total=${data.memory_total}, used=${data.memory_used}`);
      }
    }

    // 解析磁盘信息 (单位: 字节)
    if (raw.disk) {
      const diskParts = raw.disk.toString().trim().split(/\s+/);
      if (diskParts.length >= 3) {
        data.disk_total = parseInt(diskParts[0]) || 0;
        data.disk_used = parseInt(diskParts[1]) || 0;
        data.disk_free = parseInt(diskParts[2]) || 0;
        console.log(`Disk raw: "${raw.disk}", parsed: total=${data.disk_total}, used=${data.disk_used}`);
      }
    }

    // 解析网络流量 (单位: 字节)
    if (raw.network) {
      const netParts = raw.network.toString().trim().split(/\s+/);
      if (netParts.length >= 2) {
        data.network_rx = parseInt(netParts[0]) || 0;
        data.network_tx = parseInt(netParts[1]) || 0;
        console.log(`Network raw: "${raw.network}", parsed: rx=${data.network_rx}, tx=${data.network_tx}`);
      }
    }

    // 解析系统负载
    if (raw.load) {
      data.load_avg = raw.load.toString().trim();
    }

    // 解析运行时间
    if (raw.uptime) {
      const uptimeStr = raw.uptime.toString().trim();
      data.uptime = parseInt(parseFloat(uptimeStr)) || 0;
    }

    // 解析进程数
    if (raw.processes) {
      const processStr = raw.processes.toString().trim();
      data.processes = parseInt(processStr) || 0;
    }

    return data;
  }

  // 断开连接
  disconnect(serverId) {
    const conn = this.connections.get(serverId);
    if (conn) {
      conn.end();
      this.connections.delete(serverId);
    }
  }

  // 断开所有连接
  disconnectAll() {
    for (const [serverId, conn] of this.connections) {
      conn.end();
    }
    this.connections.clear();
  }

  // 检查服务器连接状态
  async testConnection(serverInfo) {
    try {
      await this.connectToServer(serverInfo);
      const result = await this.executeCommand(serverInfo.id, 'echo "connection_test"');
      return result === 'connection_test';
    } catch (error) {
      return false;
    }
  }
}

module.exports = SystemMonitor;