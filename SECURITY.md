# 安全策略 (Security Policy)

## 🛡️ 概述

本项目是一个关于Naegleria fowleri感染信息的医疗健康网站，采用了多层次的安全防护措施，确保用户数据安全和系统稳定运行。

## 🔒 安全功能

### 1. 输入验证和XSS防护
- **HTML实体编码**: 所有用户输入都经过严格的HTML实体编码
- **内容清理**: 使用白名单机制过滤危险HTML标签和属性
- **脚本检测**: 自动检测和阻止XSS攻击尝试
- **输入长度限制**: 限制输入字段的最大长度，防止缓冲区溢出

### 2. SQL注入防护
- **参数化查询**: 使用参数化查询防止SQL注入
- **输入模式检测**: 检测SQL注入攻击模式
- **数据库权限控制**: 最小权限原则，限制数据库访问权限

### 3. CSRF防护
- **令牌验证**: 每个会话生成唯一的CSRF令牌
- **同源策略**: 严格验证请求来源
- **一次性令牌**: CSRF令牌仅可使用一次，防止重放攻击

### 4. 身份验证和授权
- **JWT令牌**: 使用JSON Web Token进行身份验证
- **密码加密**: 使用bcrypt进行密码哈希
- **会话管理**: 安全的会话创建、验证和销毁
- **角色权限**: 基于角色的访问控制(RBAC)

### 5. 评论系统安全
- **内容审核**: 自动检测敏感词、垃圾内容和恶意链接
- **频率限制**: 防止评论轰炸和垃圾评论
- **用户信誉系统**: 基于行为的用户信誉评分
- **自动审核**: 智能审核机制，可疑内容进入人工审核队列

### 6. 数据加密和安全存储
- **数据加密**: 敏感数据使用AES-256-GCM加密
- **密钥管理**: 安全的密钥派生和存储机制
- **安全备份**: 定期创建加密备份
- **完整性验证**: 数据完整性校验

### 7. 网络安全
- **安全头**: 设置完整的HTTP安全头
- **CORS配置**: 严格的跨域资源共享配置
- **速率限制**: API请求频率限制
- **IP封锁**: 自动封锁恶意IP地址

### 8. 安全监控
- **实时监控**: 24/7安全事件监控
- **威胁检测**: 自动检测和响应安全威胁
- **日志记录**: 详细的安全日志记录
- **告警系统**: 实时安全告警通知

## 🚨 漏洞报告

### 报告流程
如果您发现了安全漏洞，请按照以下步骤报告：

1. **不要公开披露**: 请勿在公共场所（如GitHub Issues、论坛等）公开安全漏洞
2. **发送邮件**: 将漏洞详情发送至 security@cdc.gov
3. **提供详情**: 请包含以下信息：
   - 漏洞描述和影响范围
   - 重现步骤
   - 概念验证代码（如适用）
   - 建议的修复方案（可选）

### 邮件模板
```
主题: [SECURITY] Naegleria fowleri网站安全漏洞报告

漏洞类型: [XSS/SQL注入/CSRF/其他]
影响范围: [高/中/低]
发现时间: [YYYY-MM-DD]

详细描述:
[请详细描述漏洞]

重现步骤:
1. [步骤1]
2. [步骤2]
3. [步骤3]

预期影响:
[描述可能的安全影响]

建议修复:
[如有修复建议请提供]
```

### 响应时间承诺
- **确认收到**: 24小时内确认收到漏洞报告
- **初步评估**: 72小时内完成初步安全评估
- **修复计划**: 7天内提供修复计划和时间表
- **修复完成**: 根据漏洞严重程度，30天内完成修复

### 漏洞等级
- **严重(Critical)**: 可导致系统完全妥协或大量数据泄露
- **高危(High)**: 可导致重要功能受损或部分数据泄露
- **中危(Medium)**: 可导致功能异常或信息泄露
- **低危(Low)**: 轻微的安全问题或潜在风险

## 🔧 安全配置

### 环境变量
确保设置以下环境变量：

```bash
# JWT密钥（生产环境必须更改）
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# 数据库加密密钥
DB_ENCRYPTION_KEY=your-database-encryption-key

# 管理员邮箱
ADMIN_EMAIL=admin@yourdomain.com

# 安全模式
NODE_ENV=production
SECURITY_MODE=strict

# HTTPS配置
HTTPS_ENABLED=true
SSL_CERT_PATH=/path/to/ssl/cert.pem
SSL_KEY_PATH=/path/to/ssl/key.pem
```

### 服务器配置
推荐的服务器安全配置：

```nginx
# Nginx配置示例
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    # SSL配置
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    
    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";
    
    # 限制请求大小
    client_max_body_size 10M;
    
    # 代理到Node.js应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📋 安全检查清单

### 部署前检查
- [ ] 更改所有默认密码和密钥
- [ ] 启用HTTPS和安全头
- [ ] 配置防火墙规则
- [ ] 设置日志监控
- [ ] 测试备份和恢复流程
- [ ] 验证输入验证和输出编码
- [ ] 检查依赖包安全漏洞
- [ ] 配置错误页面，避免信息泄露

### 运维检查
- [ ] 定期更新依赖包
- [ ] 监控安全日志
- [ ] 检查异常访问模式
- [ ] 验证备份完整性
- [ ] 更新安全策略
- [ ] 进行渗透测试
- [ ] 审查用户权限

## 🛠️ 安全工具

### 内置安全工具
项目包含以下安全工具：

1. **安全扫描器** (`npm run security:scan`)
   - 检测XSS和SQL注入漏洞
   - 扫描敏感信息泄露
   - 验证安全配置

2. **安全监控** (`npm run security:monitor`)
   - 实时威胁监控
   - 异常行为检测
   - 自动告警通知

3. **安全备份** (`npm run security:backup`)
   - 创建加密备份
   - 验证备份完整性
   - 自动清理旧备份

### 外部安全工具推荐
- **OWASP ZAP**: Web应用安全扫描
- **Nmap**: 网络端口扫描
- **Burp Suite**: Web应用渗透测试
- **Snyk**: 依赖包漏洞扫描

## 📚 安全资源

### 相关标准和指南
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CIS Controls](https://www.cisecurity.org/controls/)
- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html)

### 培训资源
- [OWASP WebGoat](https://owasp.org/www-project-webgoat/)
- [PortSwigger Web Security Academy](https://portswigger.net/web-security)
- [SANS Secure Coding Practices](https://www.sans.org/white-papers/2172/)

## 📞 联系信息

- **安全团队邮箱**: security@cdc.gov
- **紧急联系电话**: +1-800-CDC-INFO
- **安全事件报告**: security-incident@cdc.gov

## 📄 许可证

本安全策略遵循 [MIT License](LICENSE) 许可证。

---

**最后更新**: 2025年1月21日  
**版本**: 1.0  
**维护者**: CDC安全团队 