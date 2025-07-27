# 贡献指南

感谢您对 Server Monitor 项目的关注！我们欢迎各种形式的贡献。

## 🤝 如何贡献

### 报告问题
- 使用 [GitHub Issues](https://github.com/yourusername/server-monitor/issues) 报告 bug
- 请详细描述问题，包括复现步骤、预期行为和实际行为
- 提供运行环境信息（操作系统、Node.js版本等）

### 提出新功能
- 在 Issues 中描述新功能的需求和用例
- 讨论实现方案和技术细节
- 等待维护者确认后开始开发

### 提交代码
1. **Fork 项目**
   ```bash
   git clone https://github.com/yourusername/server-monitor.git
   ```

2. **创建特性分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **进行开发**
   - 遵循现有代码风格
   - 添加必要的测试
   - 更新相关文档

4. **提交更改**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **推送分支**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **创建 Pull Request**
   - 详细描述更改内容
   - 引用相关的 Issues
   - 确保 CI 检查通过

## 📝 代码规范

### 前端 (Vue.js)
- 使用 Vue 3 Composition API
- 遵循 Vue.js 官方风格指南
- 使用 TypeScript (如果适用)
- 组件命名使用 PascalCase
- 文件命名使用 kebab-case

### 后端 (Node.js)
- 使用 ES6+ 语法
- 函数命名使用 camelCase
- 文件命名使用 kebab-case
- 添加适当的错误处理
- 使用 async/await 处理异步操作

### 通用规范
- 使用有意义的变量和函数名
- 添加必要的注释
- 保持代码简洁和可读性
- 遵循 DRY (Don't Repeat Yourself) 原则

## 🧪 测试

### 运行测试
```bash
# 后端测试
cd backend
npm test

# 前端测试
cd frontend
npm test
```

### 添加测试
- 为新功能添加单元测试
- 确保测试覆盖率不降低
- 使用清晰的测试描述

## 📖 文档

### 更新文档
- 新功能需要更新相关文档
- API 变更需要更新 API 文档
- 重大变更需要更新 README

### 文档风格
- 使用清晰简洁的语言
- 提供代码示例
- 保持文档与代码同步

## 🚀 开发环境

### 环境搭建
```bash
# 克隆项目
git clone https://github.com/yourusername/server-monitor.git
cd server-monitor

# 安装依赖
cd backend && npm install
cd ../frontend && npm install

# 启动开发服务器
cd backend && npm run dev
cd ../frontend && npm run dev
```

### 技术栈
- **前端**: Vue.js 3, Element Plus, Vite
- **后端**: Node.js, Express.js, SQLite
- **工具**: Docker, Git

## 📋 Pull Request 检查清单

提交 PR 前请确保：

- [ ] 代码符合项目规范
- [ ] 添加了必要的测试
- [ ] 测试全部通过
- [ ] 更新了相关文档
- [ ] 提交信息清晰明确
- [ ] 没有引入不必要的依赖

## 🎯 提交信息规范

使用语义化提交信息：

- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建过程或辅助工具的变动

示例：
```
feat: add server batch import functionality
fix: resolve memory leak in monitoring service
docs: update API documentation for v2.0
```

## 🏷️ 发布流程

### 版本号规范
遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范：
- `MAJOR.MINOR.PATCH`
- 主版本号：不兼容的 API 修改
- 次版本号：向下兼容的功能性新增
- 修订号：向下兼容的问题修正

### 发布步骤
1. 更新版本号
2. 更新 CHANGELOG.md
3. 创建 Git 标签
4. 发布 GitHub Release

## 💬 社区

### 获取帮助
- [GitHub Issues](https://github.com/yourusername/server-monitor/issues) - 报告问题
- [GitHub Discussions](https://github.com/yourusername/server-monitor/discussions) - 社区讨论

### 行为准则
- 尊重他人
- 保持友善和专业
- 避免争议性话题
- 帮助新贡献者

## 🙏 致谢

感谢所有为项目做出贡献的开发者！

---

有任何问题欢迎通过 Issues 或 Discussions 与我们交流！