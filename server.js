const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

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

// 静态文件服务
function serveStaticFile(req, res, filePath) {
    const extname = path.extname(filePath);
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
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
            // 创建评论
            const newComment = {
                id: Date.now(),
                ...requestData,
                createTime: new Date().toLocaleString(),
                status: 'approved',
                likes: 0
            };
            articlesData.comments.push(newComment);
            
            // 更新文章评论数
            const article = articlesData.articles.find(a => a.id === newComment.articleId);
            if (article) {
                article.commentCount = (article.commentCount || 0) + 1;
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
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    console.log(`${method} ${pathname}`);

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

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log('API接口已启用，前后端连接成功！');
}); 