# 🚀 安全部署指南

## 📋 概述

本指南详细说明如何在生产环境中安全部署Naegleria fowleri信息网站，包括安全配置、监控设置和最佳实践。

## 🛠️ 系统要求

### 最低硬件要求
- **CPU**: 2核心 2.4GHz
- **内存**: 4GB RAM
- **存储**: 50GB SSD
- **网络**: 100Mbps带宽

### 推荐硬件配置
- **CPU**: 4核心 3.0GHz
- **内存**: 8GB RAM
- **存储**: 100GB SSD
- **网络**: 1Gbps带宽

### 软件要求
- **操作系统**: Ubuntu 20.04 LTS / CentOS 8 / RHEL 8
- **Node.js**: 16.x 或更高版本
- **npm**: 8.x 或更高版本
- **数据库**: 可选（当前使用文件存储）
- **反向代理**: Nginx 1.18+
- **SSL证书**: Let's Encrypt 或商业证书

## 🔧 预部署准备

### 1. 服务器初始化
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要工具
sudo apt install -y curl wget git unzip

# 创建应用用户
sudo useradd -m -s /bin/bash naegleria
sudo usermod -aG sudo naegleria

# 设置防火墙
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 2. 安装Node.js
```bash
# 使用NodeSource仓库安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### 3. 安装Nginx
```bash
# 安装Nginx
sudo apt install -y nginx

# 启动并启用Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 4. SSL证书配置
```bash
# 安装Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取SSL证书（替换yourdomain.com）
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 📦 应用部署

### 1. 下载应用代码
```bash
# 切换到应用用户
sudo su - naegleria

# 克隆代码仓库
git clone https://github.com/cdc/naegleria-fowleri-website.git
cd naegleria-fowleri-website

# 检出稳定版本
git checkout main
```

### 2. 安装依赖
```bash
# 安装生产依赖
npm ci --only=production

# 运行安全审计
npm audit
npm audit fix
```

### 3. 环境配置
```bash
# 创建环境变量文件
cp .env.example .env

# 编辑环境变量
nano .env
```

环境变量配置示例：
```bash
# 基本配置
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# 安全配置
JWT_SECRET=your-super-secure-jwt-secret-key-change-this
DB_ENCRYPTION_KEY=your-database-encryption-key-32-chars
SESSION_SECRET=your-session-secret-key

# 管理员配置
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=secure-admin-password

# SSL配置
HTTPS_ENABLED=true
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem

# 监控配置
ENABLE_MONITORING=true
LOG_LEVEL=info
MAX_LOG_SIZE=100MB
MAX_LOG_FILES=10

# 安全限制
MAX_REQUEST_SIZE=10mb
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
ENABLE_CORS=true
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# 邮件配置（可选）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-email-password
```

### 4. 目录权限设置
```bash
# 设置正确的文件权限
chmod 600 .env
chmod -R 755 public/
chmod -R 700 logs/
chmod -R 700 backups/
chmod -R 700 security/

# 创建必要目录
mkdir -p logs backups security uploads
```

## ⚙️ Nginx配置

### 1. 创建站点配置
```bash
sudo nano /etc/nginx/sites-available/naegleria-fowleri
```

Nginx配置文件：
```nginx
# HTTP重定向到HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS主配置
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL配置
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:MozTLS:10m;
    ssl_session_tickets off;
    
    # SSL协议和加密套件
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    
    # 安全头
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-src 'none'; object-src 'none';" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=()" always;
    
    # 限制请求大小
    client_max_body_size 10M;
    client_body_timeout 30s;
    client_header_timeout 30s;
    
    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # 安全文件保护
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    location ~ ^/(security|backups|logs)/ {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # 代理到Node.js应用
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        
        # 限制请求方法
        limit_except GET POST PUT DELETE OPTIONS {
            deny all;
        }
    }
    
    # 健康检查端点
    location /health {
        proxy_pass http://127.0.0.1:3000/health;
        access_log off;
    }
    
    # 安全管理面板（限制IP访问）
    location /security-dashboard.html {
        # 只允许管理员IP访问，替换为实际IP
        allow 192.168.1.0/24;
        allow 10.0.0.0/8;
        deny all;
        
        proxy_pass http://127.0.0.1:3000/security-dashboard.html;
    }
}
```

### 2. 启用站点配置
```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/naegleria-fowleri /etc/nginx/sites-enabled/

# 删除默认配置
sudo rm -f /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl reload nginx
```

## 🔄 进程管理

### 1. 使用PM2管理Node.js进程
```bash
# 全局安装PM2
sudo npm install -g pm2

# 创建PM2配置文件
nano ecosystem.config.js
```

PM2配置文件：
```javascript
module.exports = {
  apps: [{
    name: 'naegleria-fowleri-website',
    script: 'server.js',
    cwd: '/home/naegleria/naegleria-fowleri-website',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'backups'],
    max_restarts: 10,
    min_uptime: '10s',
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000
  }]
};
```

### 2. 启动应用
```bash
# 启动应用
pm2 start ecosystem.config.js

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u naegleria --hp /home/naegleria
```

## 📊 监控和日志

### 1. 系统监控
```bash
# 安装系统监控工具
sudo apt install -y htop iotop nethogs

# 安装日志分析工具
sudo apt install -y logrotate fail2ban
```

### 2. Fail2Ban配置
```bash
# 创建自定义jail配置
sudo nano /etc/fail2ban/jail.local
```

Fail2Ban配置：
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
backend = systemd

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 10

[nginx-botsearch]
enabled = true
filter = nginx-botsearch
logpath = /var/log/nginx/access.log
maxretry = 2
```

### 3. 日志轮转配置
```bash
# 创建应用日志轮转配置
sudo nano /etc/logrotate.d/naegleria-fowleri
```

日志轮转配置：
```
/home/naegleria/naegleria-fowleri-website/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 naegleria naegleria
    postrotate
        pm2 reloadLogs
    endscript
}
```

## 🔒 安全加固

### 1. 系统安全
```bash
# 禁用root登录
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# 修改SSH端口（可选）
sudo sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config

# 重启SSH服务
sudo systemctl restart sshd

# 设置自动安全更新
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 2. 数据库安全（如果使用）
```bash
# MySQL安全配置示例
mysql_secure_installation

# 创建应用专用数据库用户
mysql -u root -p << EOF
CREATE DATABASE naegleria_fowleri;
CREATE USER 'nf_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON naegleria_fowleri.* TO 'nf_user'@'localhost';
FLUSH PRIVILEGES;
EOF
```

### 3. 文件系统安全
```bash
# 设置严格的文件权限
sudo chmod 700 /home/naegleria/naegleria-fowleri-website
sudo chmod 600 /home/naegleria/naegleria-fowleri-website/.env
sudo chmod -R 700 /home/naegleria/naegleria-fowleri-website/security
sudo chmod -R 700 /home/naegleria/naegleria-fowleri-website/backups

# 设置SELinux（如果启用）
sudo setsebool -P httpd_can_network_connect 1
```

## 📈 性能优化

### 1. Node.js优化
```bash
# 设置Node.js内存限制
export NODE_OPTIONS="--max-old-space-size=1024"

# 启用生产模式优化
export NODE_ENV=production
```

### 2. 数据库优化（如果使用）
```sql
-- MySQL优化示例
SET GLOBAL innodb_buffer_pool_size = 1073741824; -- 1GB
SET GLOBAL query_cache_size = 268435456; -- 256MB
SET GLOBAL max_connections = 200;
```

### 3. 缓存配置
```bash
# 安装Redis（可选，用于缓存）
sudo apt install -y redis-server

# 配置Redis
sudo nano /etc/redis/redis.conf
# 设置: maxmemory 256mb
# 设置: maxmemory-policy allkeys-lru

sudo systemctl restart redis
```

## 🔍 健康检查

### 1. 创建健康检查脚本
```bash
nano /home/naegleria/health-check.sh
```

健康检查脚本：
```bash
#!/bin/bash

# 健康检查脚本
APP_URL="https://yourdomain.com"
LOG_FILE="/home/naegleria/health-check.log"

# 检查应用响应
response=$(curl -s -o /dev/null -w "%{http_code}" $APP_URL)

if [ $response -eq 200 ]; then
    echo "$(date): 应用健康检查通过 - HTTP $response" >> $LOG_FILE
else
    echo "$(date): 应用健康检查失败 - HTTP $response" >> $LOG_FILE
    # 发送告警邮件
    echo "应用健康检查失败，HTTP状态码: $response" | mail -s "网站健康检查告警" admin@yourdomain.com
    
    # 尝试重启应用
    pm2 restart naegleria-fowleri-website
fi

# 检查磁盘空间
disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $disk_usage -gt 80 ]; then
    echo "$(date): 磁盘空间不足 - 使用率 ${disk_usage}%" >> $LOG_FILE
    echo "磁盘空间使用率已达到 ${disk_usage}%" | mail -s "磁盘空间告警" admin@yourdomain.com
fi

# 检查内存使用
memory_usage=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
if [ $memory_usage -gt 90 ]; then
    echo "$(date): 内存使用率过高 - ${memory_usage}%" >> $LOG_FILE
fi
```

### 2. 设置定时任务
```bash
# 编辑crontab
crontab -e

# 添加健康检查任务
*/5 * * * * /home/naegleria/health-check.sh
0 2 * * * /home/naegleria/naegleria-fowleri-website/backup.sh
0 3 * * 0 npm audit >> /home/naegleria/security-audit.log
```

## 🚨 故障排除

### 常见问题和解决方案

1. **应用无法启动**
```bash
# 检查日志
pm2 logs naegleria-fowleri-website

# 检查端口占用
sudo netstat -tlnp | grep :3000

# 检查环境变量
printenv | grep NODE_ENV
```

2. **SSL证书问题**
```bash
# 检查证书状态
sudo certbot certificates

# 续期证书
sudo certbot renew --dry-run
```

3. **性能问题**
```bash
# 检查系统资源
htop
iotop
free -h
df -h

# 检查应用性能
pm2 monit
```

## 📋 部署检查清单

### 部署前检查
- [ ] 服务器硬件配置满足要求
- [ ] 操作系统和软件版本正确
- [ ] 防火墙规则配置正确
- [ ] SSL证书安装和配置
- [ ] 环境变量设置完整
- [ ] 文件权限设置正确
- [ ] 数据库连接测试（如适用）

### 部署后检查
- [ ] 应用成功启动
- [ ] 网站可以正常访问
- [ ] HTTPS重定向工作正常
- [ ] 安全头配置生效
- [ ] 日志记录正常
- [ ] 监控系统运行
- [ ] 备份系统工作
- [ ] 健康检查通过

### 安全检查
- [ ] 所有默认密码已更改
- [ ] 敏感文件权限正确
- [ ] 不必要的服务已禁用
- [ ] 安全更新已安装
- [ ] 入侵检测系统运行
- [ ] 日志监控配置
- [ ] 访问控制测试

## 📞 支持和维护

### 日常维护任务
- 每日检查应用日志和系统日志
- 每周检查安全更新和补丁
- 每月进行性能评估和优化
- 每季度进行安全审计
- 每年进行渗透测试

### 紧急联系信息
- **技术支持**: tech-support@cdc.gov
- **安全事件**: security-incident@cdc.gov
- **紧急电话**: +1-800-CDC-INFO

---

**文档版本**: 1.0  
**最后更新**: 2025年1月21日  
**维护者**: CDC技术团队 