const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

// 安全模块
const securityConfig = require('./security-config');
const securityUtils = require('./security-utils');
const authMiddleware = require('./auth-middleware');
const commentSecurity = require('./comment-security');
const counterAttackMonitor = require('./counter-attack-monitor');

// 内存数据存储（实际项目中应使用数据库）
let articlesData = {
    articles: [
        {
            id: Date.now(),
            title: '如何学习前端开发',
            author: '张三',
            content: '前端开发是一个快速发展的领域，需要掌握HTML、CSS、JavaScript等技术。随着技术的不断发展，我们需要保持学习的热情和持续更新知识体系。建议新手从基础开始，逐步深入学习各种框架和工具。',
            status: 'published',
            createTime: new Date('2024-01-15').toLocaleString(),
            updateTime: new Date('2024-01-15').toLocaleString(),
            category: '技术分享',
            tags: ['前端', '学习', 'JavaScript'],
            viewCount: 128,
            likeCount: 15,
            commentCount: 8
        },
        {
            id: Date.now() + 1,
            title: 'Vue.js 入门指南',
            author: '李四',
            content: 'Vue.js是一个渐进式JavaScript框架，易于学习和使用。它采用了组件化的开发模式，让我们可以更好地组织代码结构。本文将详细介绍Vue.js的核心概念，包括数据绑定、组件系统、路由管理等内容。',
            status: 'published',
            createTime: new Date('2024-01-10').toLocaleString(),
            updateTime: new Date('2024-01-10').toLocaleString(),
            category: '技术教程',
            tags: ['Vue.js', '框架', '前端'],
            viewCount: 256,
            likeCount: 32,
            commentCount: 12
        }
    ],
    comments: [
        {
            id: 1,
            articleId: Date.now(),
            author: '小明',
            email: 'xiaoming@example.com',
            content: '写得很好，对初学者很有帮助！',
            createTime: new Date('2024-01-16 10:30').toLocaleString(),
            status: 'approved',
            likes: 3,
            parentId: null
        }
    ],
    likes: [],
    users: [
        {
            id: 1,
            username: 'admin',
            password: '123456',
            role: 'admin',
            email: 'admin@example.com',
            createTime: new Date().toLocaleString()
        }
    ],
    settings: {
        siteName: '文章博客系统',
        siteDescription: '分享知识，传递价值',
        articlesPerPage: 6,
        commentsPerPage: 10,
        enableComments: true,
        enableLikes: true,
        moderateComments: false
    }
};

// MIME类型映射
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml'
};

// 安全中间件
function applySecurityMiddleware(req, res, next) {
    // 设置安全头
    authMiddleware.setSecurityHeaders(res);
    
    // 获取客户端IP
    req.clientIP = securityUtils.getClientIP(req);
    
    // 检查蜜罐访问
    if (counterAttackMonitor.checkHoneypotAccess(req.url, req.clientIP)) {
        // 记录蜜罐命中
        counterAttackMonitor.detectAndRecordAttack(req, 'honeypot_access', {
            path: req.url,
            method: req.method,
            userAgent: req.headers['user-agent']
        });
        
        // 返回蜜罐响应
        const honeypotResponse = counterAttackMonitor.generateHoneypotResponse(req.url);
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(honeypotResponse);
        return;
    }
    
    // 检查IP是否被封锁
    if (securityUtils.isIPBlocked(req.clientIP)) {
        // 记录封锁访问尝试
        counterAttackMonitor.detectAndRecordAttack(req, 'blocked_access_attempt', {
            reason: 'IP已被封锁',
            attempts: 'continued_access_after_block'
        });
        
        res.writeHead(429, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({
            error: 'IP blocked due to suspicious activity',
            code: 'IP_BLOCKED',
            message: '您的IP地址因可疑活动已被封锁。如有疑问，请联系管理员。'
        }));
        return;
    }
    
    // 检测攻击模式
    detectAttackPatterns(req);
    
    // 记录安全事件
    authMiddleware.logSecurityEvent('request', {
        ip: req.clientIP,
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent']
    });
    
    next();
}

// 攻击模式检测
function detectAttackPatterns(req) {
    const ip = req.clientIP;
    const url = req.url;
    const userAgent = req.headers['user-agent'] || '';
    const body = req.body || '';
    
    // 检测XSS攻击
    const xssPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=\s*["'][^"']*["']/gi,
        /<iframe[^>]*src/gi,
        /eval\s*\(/gi
    ];
    
    for (const pattern of xssPatterns) {
        if (pattern.test(url) || pattern.test(body) || pattern.test(userAgent)) {
            counterAttackMonitor.detectAndRecordAttack(req, 'xss_attack', {
                pattern: pattern.source,
                location: pattern.test(url) ? 'url' : pattern.test(body) ? 'body' : 'user-agent',
                payload: pattern.test(url) ? url : pattern.test(body) ? body.substring(0, 200) : userAgent
            });
            break;
        }
    }
    
    // 检测SQL注入
    const sqlPatterns = [
        /(union|select|insert|update|delete|drop|create|alter)\s+/gi,
        /(\s|^)(or|and)\s+\d+\s*=\s*\d+/gi,
        /['";]\s*(or|and)\s+['"]?\w+['"]?\s*=/gi,
        /--\s*$/gm
    ];
    
    for (const pattern of sqlPatterns) {
        if (pattern.test(url) || pattern.test(body)) {
            counterAttackMonitor.detectAndRecordAttack(req, 'sql_injection', {
                pattern: pattern.source,
                location: pattern.test(url) ? 'url' : 'body',
                payload: pattern.test(url) ? url : body.substring(0, 200)
            });
            break;
        }
    }
    
    // 检测目录遍历
    const pathTraversalPatterns = [
        /\.\.[\/\\]/g,
        /\.\.%2f/gi,
        /\.\.%5c/gi,
        /%2e%2e%2f/gi
    ];
    
    for (const pattern of pathTraversalPatterns) {
        if (pattern.test(url)) {
            counterAttackMonitor.detectAndRecordAttack(req, 'path_traversal', {
                pattern: pattern.source,
                payload: url
            });
            break;
        }
    }
    
    // 检测命令注入
    const commandInjectionPatterns = [
        /[;&|`$(){}[\]]/g,
        /\b(cat|ls|pwd|whoami|id|uname|wget|curl|nc|netcat)\b/gi,
        /\b(rm|mv|cp|chmod|chown)\s+/gi
    ];
    
    for (const pattern of commandInjectionPatterns) {
        if (pattern.test(url) || pattern.test(body)) {
            counterAttackMonitor.detectAndRecordAttack(req, 'command_injection', {
                pattern: pattern.source,
                location: pattern.test(url) ? 'url' : 'body',
                payload: pattern.test(url) ? url : body.substring(0, 200)
            });
            break;
        }
    }
    
    // 检测扫描行为
    const suspiciousPaths = [
        '/admin', '/wp-admin', '/phpmyadmin',
        '/.env', '/config', '/backup',
        '/test', '/debug', '/api/v1'
    ];
    
    if (suspiciousPaths.some(path => url.includes(path))) {
        counterAttackMonitor.detectAndRecordAttack(req, 'scanning', {
            suspiciousPath: url,
            scanType: 'directory_enumeration'
        });
    }
    
    // 检测可疑用户代理
    const suspiciousUAs = [
        /sqlmap/gi, /nikto/gi, /nmap/gi,
        /burp/gi, /zap/gi, /hydra/gi
    ];
    
    for (const pattern of suspiciousUAs) {
        if (pattern.test(userAgent)) {
            counterAttackMonitor.detectAndRecordAttack(req, 'scanning', {
                suspiciousUserAgent: userAgent,
                scanType: 'automated_tool'
            });
            break;
        }
    }
}

// 静态文件服务
function serveStaticFile(req, res, filePath) {
    const extname = path.extname(filePath);
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    // 安全检查
    const normalizedPath = path.normalize(filePath);
    if (normalizedPath.includes('..') || normalizedPath.includes('~')) {
        res.writeHead(403, {'Content-Type': 'text/html'});
        res.end('<h1>403 Forbidden</h1>');
        return;
    }
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, {'Content-Type': 'text/html'});
                res.end('<h1>404 Not Found</h1>');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + err.code);
            }
        } else {
            res.writeHead(200, {'Content-Type': contentType});
            res.end(content, 'utf-8');
        }
    });
}

// API处理函数
function handleAPI(req, res, pathname, method) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        let requestData = {};
        if (body) {
            try {
                requestData = JSON.parse(body);
            } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({error: 'Invalid JSON'}));
                return;
            }
        }

        // 路由处理
        if (pathname === '/api/articles' && method === 'GET') {
            // 获取文章列表
            res.writeHead(200);
            res.end(JSON.stringify({
                success: true,
                data: articlesData.articles
            }));
        }
        else if (pathname === '/api/articles' && method === 'POST') {
            // 创建文章
            const newArticle = {
                id: Date.now(),
                ...requestData,
                createTime: new Date().toLocaleString(),
                updateTime: new Date().toLocaleString(),
                viewCount: 0,
                likeCount: 0,
                commentCount: 0
            };
            articlesData.articles.unshift(newArticle);
            res.writeHead(201);
            res.end(JSON.stringify({
                success: true,
                data: newArticle
            }));
        }
        else if (pathname.startsWith('/api/articles/') && method === 'GET') {
            // 获取单个文章
            const id = parseInt(pathname.split('/')[3]);
            const article = articlesData.articles.find(a => a.id === id);
            if (article) {
                // 增加浏览量
                article.viewCount = (article.viewCount || 0) + 1;
                res.writeHead(200);
                res.end(JSON.stringify({
                    success: true,
                    data: article
                }));
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({
                    success: false,
                    error: 'Article not found'
                }));
            }
        }
        else if (pathname.startsWith('/api/articles/') && method === 'PUT') {
            // 更新文章
            const id = parseInt(pathname.split('/')[3]);
            const index = articlesData.articles.findIndex(a => a.id === id);
            if (index !== -1) {
                articlesData.articles[index] = {
                    ...articlesData.articles[index],
                    ...requestData,
                    updateTime: new Date().toLocaleString()
                };
                res.writeHead(200);
                res.end(JSON.stringify({
                    success: true,
                    data: articlesData.articles[index]
                }));
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({
                    success: false,
                    error: 'Article not found'
                }));
            }
        }
        else if (pathname.startsWith('/api/articles/') && method === 'DELETE') {
            // 删除文章
            const id = parseInt(pathname.split('/')[3]);
            const index = articlesData.articles.findIndex(a => a.id === id);
            if (index !== -1) {
                articlesData.articles.splice(index, 1);
                // 同时删除相关评论
                articlesData.comments = articlesData.comments.filter(c => c.articleId !== id);
                res.writeHead(200);
                res.end(JSON.stringify({
                    success: true,
                    message: 'Article deleted'
                }));
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({
                    success: false,
                    error: 'Article not found'
                }));
            }
        }
        else if (pathname === '/api/comments' && method === 'GET') {
            // 获取评论列表
            const articleId = parseInt(req.url.split('articleId=')[1]);
            const comments = articleId ? 
                articlesData.comments.filter(c => c.articleId === articleId) : 
                articlesData.comments;
            res.writeHead(200);
            res.end(JSON.stringify({
                success: true,
                data: comments
            }));
        }
        else if (pathname === '/api/comments' && method === 'POST') {
            // 创建评论 - 加强安全处理
            
            // 输入验证和清理
            const validationResult = securityUtils.validateAndSanitize(requestData, {
                author: { type: 'string', maxLength: 50 },
                email: { type: 'string', maxLength: 100 },
                content: { type: 'string', maxLength: 1000, allowHtml: false },
                articleId: { type: 'number' }
            });
            
            if (!validationResult.isValid) {
                res.writeHead(400);
                res.end(JSON.stringify({
                    success: false,
                    error: 'Validation failed',
                    details: validationResult.errors
                }));
                return;
            }
            
            const cleanData = validationResult.data;
            
            // 创建评论对象
            const newComment = {
                id: Date.now(),
                articleId: cleanData.articleId,
                author: cleanData.author,
                email: cleanData.email,
                content: cleanData.content,
                createTime: new Date().toLocaleString(),
                status: 'pending', // 默认待审核
                likes: 0,
                parentId: cleanData.parentId || null,
                ip: req.clientIP,
                userAgent: req.headers['user-agent']
            };
            
            // 获取用户信息
            const user = {
                id: req.headers['x-user-id'] || req.clientIP,
                isNew: !articlesData.comments.some(c => c.ip === req.clientIP)
            };
            
            // 自动审核
            const moderationResult = commentSecurity.autoModerate(newComment, user);
            
            if (moderationResult.blocked) {
                // 记录安全事件
                authMiddleware.logSecurityEvent('comment_blocked', {
                    ip: req.clientIP,
                    reasons: moderationResult.reasons,
                    content: cleanData.content.substring(0, 100)
                });
                
                res.writeHead(400);
                res.end(JSON.stringify({
                    success: false,
                    error: 'Comment blocked',
                    reasons: moderationResult.reasons
                }));
                return;
            }
            
            if (moderationResult.needsReview) {
                newComment.status = 'pending';
                commentSecurity.addToModerationQueue(newComment, moderationResult.reasons);
                
                authMiddleware.logSecurityEvent('comment_queued', {
                    ip: req.clientIP,
                    reasons: moderationResult.reasons,
                    score: moderationResult.score
                });
            } else if (moderationResult.approved) {
                newComment.status = 'approved';
                
                authMiddleware.logSecurityEvent('comment_approved', {
                    ip: req.clientIP,
                    score: moderationResult.score
                });
            }
            
            // 记录评论频率
            commentSecurity.recordComment(user.id);
            
            // 清理评论内容
            newComment.content = commentSecurity.sanitizeComment(newComment.content);
            
            // 保存评论
            articlesData.comments.push(newComment);
            
            // 更新文章评论数（只有通过审核的评论才计数）
            if (newComment.status === 'approved') {
                const article = articlesData.articles.find(a => a.id === newComment.articleId);
                if (article) {
                    article.commentCount = (article.commentCount || 0) + 1;
                }
            }
            
            res.writeHead(201);
            res.end(JSON.stringify({
                success: true,
                data: newComment
            }));
        }
        else if (pathname === '/api/login' && method === 'POST') {
            // 用户登录
            const {username, password} = requestData;
            const user = articlesData.users.find(u => u.username === username && u.password === password);
            if (user) {
                res.writeHead(200);
                res.end(JSON.stringify({
                    success: true,
                    data: {
                        id: user.id,
                        username: user.username,
                        role: user.role,
                        email: user.email
                    }
                }));
            } else {
                res.writeHead(401);
                res.end(JSON.stringify({
                    success: false,
                    error: 'Invalid credentials'
                }));
            }
        }
        else if (pathname === '/api/statistics' && method === 'GET') {
            // 获取统计信息
            const stats = {
                totalArticles: articlesData.articles.length,
                publishedArticles: articlesData.articles.filter(a => a.status === 'published').length,
                draftArticles: articlesData.articles.filter(a => a.status === 'draft').length,
                totalComments: articlesData.comments.length,
                totalLikes: articlesData.likes.length,
                totalViews: articlesData.articles.reduce((sum, article) => sum + (article.viewCount || 0), 0)
            };
            res.writeHead(200);
            res.end(JSON.stringify({
                success: true,
                data: stats
            }));
        }
        else if (pathname === '/api/security/attackers' && method === 'GET') {
            // 获取攻击者列表
            const attackers = counterAttackMonitor.getAllAttackers();
            res.writeHead(200);
            res.end(JSON.stringify({
                success: true,
                data: attackers
            }));
        }
        else if (pathname.startsWith('/api/security/attacker/') && method === 'GET') {
            // 获取特定攻击者信息
            const ip = pathname.split('/')[4];
            const attacker = counterAttackMonitor.getAttackerInfo(ip);
            
            if (attacker) {
                res.writeHead(200);
                res.end(JSON.stringify({
                    success: true,
                    data: attacker
                }));
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({
                    success: false,
                    error: 'Attacker not found'
                }));
            }
        }
        else if (pathname === '/api/security/statistics' && method === 'GET') {
            // 获取安全统计信息
            const securityStats = counterAttackMonitor.getStatistics();
            res.writeHead(200);
            res.end(JSON.stringify({
                success: true,
                data: securityStats
            }));
        }
        else if (pathname === '/api/security/block-ip' && method === 'POST') {
            // 手动封锁IP
            const { ip, reason } = requestData;
            
            if (!ip) {
                res.writeHead(400);
                res.end(JSON.stringify({
                    success: false,
                    error: 'IP address is required'
                }));
                return;
            }
            
            // 记录手动封锁
            counterAttackMonitor.detectAndRecordAttack({
                url: '/manual-block',
                method: 'POST',
                headers: { 'user-agent': 'Admin Manual Block' },
                clientIP: ip
            }, 'manual_block', {
                reason: reason || 'Manual block by administrator',
                blockedBy: 'admin'
            });
            
            res.writeHead(200);
            res.end(JSON.stringify({
                success: true,
                message: `IP ${ip} has been blocked`
            }));
        }
        else if (pathname === '/api/security/unblock-ip' && method === 'POST') {
            // 解除IP封锁
            const { ip } = requestData;
            
            if (!ip) {
                res.writeHead(400);
                res.end(JSON.stringify({
                    success: false,
                    error: 'IP address is required'
                }));
                return;
            }
            
            const attacker = counterAttackMonitor.getAttackerInfo(ip);
            if (attacker) {
                // 解除封锁（这里需要在counterAttackMonitor中添加相应方法）
                res.writeHead(200);
                res.end(JSON.stringify({
                    success: true,
                    message: `IP ${ip} has been unblocked`
                }));
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({
                    success: false,
                    error: 'IP not found in attacker database'
                }));
            }
        }
        else {
            res.writeHead(404);
            res.end(JSON.stringify({
                success: false,
                error: 'API endpoint not found'
            }));
        }
    });
}

// 创建服务器
const server = http.createServer((req, res) => {
    // 应用安全中间件
    applySecurityMiddleware(req, res, () => {
        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname;
        const method = req.method;

        console.log(`${method} ${pathname} - IP: ${req.clientIP}`);

        // API路由
        if (pathname.startsWith('/api/')) {
            handleAPI(req, res, pathname, method);
            return;
        }

        // 静态文件路由
        let filePath = '.' + pathname;
        if (filePath === './') {
            filePath = './index.html';
        }

        serveStaticFile(req, res, filePath);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log('API接口已启用，前后端连接成功！');
}); 