# Naegleria fowleri 信息门户

这是一个关于 Naegleria fowleri（食脑阿米巴）的综合信息门户网站，采用前后端分离架构。

## 🚀 快速启动

### 前后端分离版本（推荐）

1. **启动后端服务器**
   ```bash
   node server.js
   ```
   或者使用npm命令：
   ```bash
   npm start
   ```

2. **访问网站**
   - 前台展示：http://localhost:3000
   - 后台管理：http://localhost:3000/admin.html
   - 数据看板：http://localhost:3000/dashboard.html
   - 登录页面：http://localhost:3000/login.html

3. **默认登录信息**
   - 用户名：admin
   - 密码：123456

### API接口

后端提供以下REST API接口：

- `GET /api/articles` - 获取文章列表
- `POST /api/articles` - 创建新文章
- `GET /api/articles/:id` - 获取单个文章
- `PUT /api/articles/:id` - 更新文章
- `DELETE /api/articles/:id` - 删除文章
- `GET /api/comments` - 获取评论列表
- `POST /api/comments` - 创建新评论
- `POST /api/login` - 用户登录
- `GET /api/statistics` - 获取统计信息

## 🏗️ 项目架构

```
NaegleriafowleriInfections/
├── server.js           # Node.js后端服务器
├── api-client.js       # 前端API客户端
├── package.json        # 项目配置文件
├── index.html          # 首页
├── articles.html       # 文章列表页
├── admin.html          # 后台管理页面
├── dashboard.html      # 数据看板
├── login.html          # 登录页面
├── styles.css          # 样式文件
├── script.js           # 前端交互脚本
└── database.js         # 原localStorage版本（已弃用）
```

## 💡 功能特性

### 前台功能
- 📚 文章浏览和搜索
- 💬 评论系统
- 📊 文章统计
- 🌐 响应式设计
- 🔍 全文搜索

### 后台功能
- ✏️ 文章编辑管理
- 📈 数据统计看板
- 👥 用户管理
- 🔐 登录认证
- 📊 实时数据更新

### 技术特性
- 🚀 前后端分离架构
- 📡 RESTful API接口
- 💾 内存数据存储（可扩展到数据库）
- 🔄 自动降级到localStorage（离线模式）
- 📱 响应式布局
- ⚡ 纯原生JavaScript（无第三方库）

## 🔧 开发说明

### 系统要求
- Node.js >= 12.0.0
- 现代浏览器（支持ES6+）

### 本地开发
1. 克隆项目
2. 启动后端服务器：`node server.js`
3. 浏览器访问：`http://localhost:3000`

### 部署说明
1. 将所有文件上传到服务器
2. 安装Node.js运行环境
3. 启动服务器：`node server.js`
4. 配置反向代理（可选）

## 📝 数据存储

当前版本使用内存存储数据，重启服务器后数据会重置。在生产环境中，建议：

1. 集成数据库（MySQL、PostgreSQL、MongoDB等）
2. 实现数据持久化
3. 添加数据备份功能

## 🎯 后续优化

- [ ] 集成真实数据库
- [ ] 用户权限管理
- [ ] 文件上传功能
- [ ] 邮件通知系统
- [ ] 缓存机制
- [ ] 日志系统
- [ ] 单元测试

## 🔒 安全注意事项

- 默认密码仅用于演示，生产环境请修改
- 建议启用HTTPS
- 实现请求频率限制
- 添加输入验证和过滤

## 📞 技术支持

如遇问题，请检查：
1. Node.js版本是否符合要求
2. 端口3000是否被占用
3. 浏览器控制台是否有错误信息

---

**注意**：这是一个演示项目，包含基础的前后端分离架构实现。在生产环境使用前，请根据实际需求完善安全性和功能。