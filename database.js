/**
 * 前端数据库管理系统
 * 使用 localStorage 实现文章、点赞、评论的存储和管理
 */

class ArticleDatabase {
    constructor() {
        this.storageKeys = {
            articles: 'articles_db',
            comments: 'comments_db',
            likes: 'likes_db',
            users: 'users_db',
            settings: 'settings_db',
            homepage: 'homepage_db'
        };
        this.init();
    }

    // 初始化数据库
    init() {
        this.initArticles();
        this.initComments();
        this.initLikes();
        this.initUsers();
        this.initSettings();
        this.initHomepage();
    }

    // 初始化文章表
    initArticles() {
        const articles = this.getArticles();
        if (articles.length === 0) {
            const sampleArticles = [
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
                },
                {
                    id: Date.now() + 2,
                    title: 'CSS Grid 布局详解',
                    author: '王五',
                    content: 'CSS Grid是一个强大的二维布局系统，可以帮助我们创建复杂的网页布局。相比于传统的布局方式，Grid提供了更加灵活和直观的解决方案。本文将通过实例演示Grid的各种用法和技巧。',
                    status: 'draft',
                    createTime: new Date('2024-01-05').toLocaleString(),
                    updateTime: new Date('2024-01-05').toLocaleString(),
                    category: '技术教程',
                    tags: ['CSS', 'Grid', '布局'],
                    viewCount: 89,
                    likeCount: 7,
                    commentCount: 3
                }
            ];
            this.setArticles(sampleArticles);
        }
    }

    // 初始化评论表
    initComments() {
        const comments = this.getComments();
        if (comments.length === 0) {
            const sampleComments = [
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
                },
                {
                    id: 2,
                    articleId: Date.now(),
                    author: '小红',
                    email: 'xiaohong@example.com',
                    content: '同意楼上的观点，确实很实用',
                    createTime: new Date('2024-01-16 14:20').toLocaleString(),
                    status: 'approved',
                    likes: 1,
                    parentId: 1
                },
                {
                    id: 3,
                    articleId: Date.now() + 1,
                    author: '技术爱好者',
                    email: 'tech@example.com',
                    content: 'Vue.js确实是个很好的框架，期待更多相关内容',
                    createTime: new Date('2024-01-11 16:45').toLocaleString(),
                    status: 'approved',
                    likes: 5,
                    parentId: null
                }
            ];
            this.setComments(sampleComments);
        }
    }

    // 初始化点赞表
    initLikes() {
        const likes = this.getLikes();
        if (likes.length === 0) {
            const sampleLikes = [
                {
                    id: 1,
                    articleId: Date.now(),
                    userIp: '192.168.1.100',
                    createTime: new Date('2024-01-16 09:15').toLocaleString()
                },
                {
                    id: 2,
                    articleId: Date.now() + 1,
                    userIp: '192.168.1.101',
                    createTime: new Date('2024-01-11 11:20').toLocaleString()
                }
            ];
            this.setLikes(sampleLikes);
        }
    }

    // 初始化用户表
    initUsers() {
        const users = this.getUsers();
        if (users.length === 0) {
            const sampleUsers = [
                {
                    id: 1,
                    username: 'admin',
                    password: '123456', // 实际项目中应该加密
                    role: 'admin',
                    email: 'admin@example.com',
                    createTime: new Date().toLocaleString()
                }
            ];
            this.setUsers(sampleUsers);
        }
    }

    // 初始化设置表
    initSettings() {
        const settings = this.getSettings();
        if (Object.keys(settings).length === 0) {
            const defaultSettings = {
                siteName: '文章博客系统',
                siteDescription: '分享知识，传递价值',
                articlesPerPage: 6,
                commentsPerPage: 10,
                enableComments: true,
                enableLikes: true,
                moderateComments: false
            };
            this.setSettings(defaultSettings);
        }
    }

    // === 文章相关操作 ===

    getArticles() {
        const data = localStorage.getItem(this.storageKeys.articles);
        return data ? JSON.parse(data) : [];
    }

    setArticles(articles) {
        localStorage.setItem(this.storageKeys.articles, JSON.stringify(articles));
        this.notifyDataChange('articles');
    }

    getArticleById(id) {
        const articles = this.getArticles();
        return articles.find(article => article.id === parseInt(id));
    }

    addArticle(articleData) {
        const articles = this.getArticles();
        const newArticle = {
            id: Date.now(),
            ...articleData,
            createTime: new Date().toLocaleString(),
            updateTime: new Date().toLocaleString(),
            viewCount: 0,
            likeCount: 0,
            commentCount: 0
        };
        articles.unshift(newArticle);
        this.setArticles(articles);
        return newArticle;
    }

    updateArticle(id, updateData) {
        const articles = this.getArticles();
        const index = articles.findIndex(article => article.id === parseInt(id));
        if (index !== -1) {
            articles[index] = {
                ...articles[index],
                ...updateData,
                updateTime: new Date().toLocaleString()
            };
            this.setArticles(articles);
            return articles[index];
        }
        return null;
    }

    deleteArticle(id) {
        const articles = this.getArticles();
        const filteredArticles = articles.filter(article => article.id !== parseInt(id));
        this.setArticles(filteredArticles);
        
        // 同时删除相关的评论和点赞
        this.deleteCommentsByArticleId(id);
        this.deleteLikesByArticleId(id);
    }

    incrementViewCount(id) {
        const article = this.getArticleById(id);
        if (article) {
            this.updateArticle(id, { viewCount: (article.viewCount || 0) + 1 });
        }
    }

    // === 评论相关操作 ===

    getComments() {
        const data = localStorage.getItem(this.storageKeys.comments);
        return data ? JSON.parse(data) : [];
    }

    setComments(comments) {
        localStorage.setItem(this.storageKeys.comments, JSON.stringify(comments));
        this.notifyDataChange('comments');
    }

    getCommentsByArticleId(articleId) {
        const comments = this.getComments();
        return comments.filter(comment => comment.articleId === parseInt(articleId));
    }

    addComment(commentData) {
        const comments = this.getComments();
        const newComment = {
            id: Date.now(),
            ...commentData,
            createTime: new Date().toLocaleString(),
            status: 'approved', // 简化版本，直接通过
            likes: 0
        };
        comments.push(newComment);
        this.setComments(comments);

        // 更新文章评论数
        this.updateArticleCommentCount(commentData.articleId);
        
        return newComment;
    }

    deleteComment(id) {
        const comments = this.getComments();
        const comment = comments.find(c => c.id === parseInt(id));
        if (comment) {
            const filteredComments = comments.filter(c => c.id !== parseInt(id));
            this.setComments(filteredComments);
            this.updateArticleCommentCount(comment.articleId);
        }
    }

    deleteCommentsByArticleId(articleId) {
        const comments = this.getComments();
        const filteredComments = comments.filter(comment => comment.articleId !== parseInt(articleId));
        this.setComments(filteredComments);
    }

    updateArticleCommentCount(articleId) {
        const comments = this.getCommentsByArticleId(articleId);
        const article = this.getArticleById(articleId);
        if (article) {
            this.updateArticle(articleId, { commentCount: comments.length });
        }
    }

    // === 点赞相关操作 ===

    getLikes() {
        const data = localStorage.getItem(this.storageKeys.likes);
        return data ? JSON.parse(data) : [];
    }

    setLikes(likes) {
        localStorage.setItem(this.storageKeys.likes, JSON.stringify(likes));
        this.notifyDataChange('likes');
    }

    getLikesByArticleId(articleId) {
        const likes = this.getLikes();
        return likes.filter(like => like.articleId === parseInt(articleId));
    }

    addLike(articleId, userIp = 'unknown') {
        const likes = this.getLikes();
        
        // 检查是否已经点赞（简化版本，用IP判断）
        const existingLike = likes.find(like => 
            like.articleId === parseInt(articleId) && like.userIp === userIp
        );
        
        if (existingLike) {
            return { success: false, message: '您已经点过赞了' };
        }

        const newLike = {
            id: Date.now(),
            articleId: parseInt(articleId),
            userIp: userIp,
            createTime: new Date().toLocaleString()
        };
        
        likes.push(newLike);
        this.setLikes(likes);
        
        // 更新文章点赞数
        this.updateArticleLikeCount(articleId);
        
        return { success: true, message: '点赞成功' };
    }

    removeLike(articleId, userIp = 'unknown') {
        const likes = this.getLikes();
        const filteredLikes = likes.filter(like => 
            !(like.articleId === parseInt(articleId) && like.userIp === userIp)
        );
        
        if (filteredLikes.length < likes.length) {
            this.setLikes(filteredLikes);
            this.updateArticleLikeCount(articleId);
            return { success: true, message: '取消点赞成功' };
        }
        
        return { success: false, message: '未找到点赞记录' };
    }

    deleteLikesByArticleId(articleId) {
        const likes = this.getLikes();
        const filteredLikes = likes.filter(like => like.articleId !== parseInt(articleId));
        this.setLikes(filteredLikes);
    }

    updateArticleLikeCount(articleId) {
        const likes = this.getLikesByArticleId(articleId);
        const article = this.getArticleById(articleId);
        if (article) {
            this.updateArticle(articleId, { likeCount: likes.length });
        }
    }

    hasUserLiked(articleId, userIp = 'unknown') {
        const likes = this.getLikes();
        return likes.some(like => 
            like.articleId === parseInt(articleId) && like.userIp === userIp
        );
    }

    // === 用户相关操作 ===

    getUsers() {
        const data = localStorage.getItem(this.storageKeys.users);
        return data ? JSON.parse(data) : [];
    }

    setUsers(users) {
        localStorage.setItem(this.storageKeys.users, JSON.stringify(users));
    }

    validateUser(username, password) {
        const users = this.getUsers();
        return users.find(user => user.username === username && user.password === password);
    }

    // === 设置相关操作 ===

    getSettings() {
        const data = localStorage.getItem(this.storageKeys.settings);
        return data ? JSON.parse(data) : {};
    }

    setSettings(settings) {
        localStorage.setItem(this.storageKeys.settings, JSON.stringify(settings));
    }

    getSetting(key) {
        const settings = this.getSettings();
        return settings[key];
    }

    setSetting(key, value) {
        const settings = this.getSettings();
        settings[key] = value;
        this.setSettings(settings);
    }

    // === 统计相关操作 ===

    getStatistics() {
        const articles = this.getArticles();
        const comments = this.getComments();
        const likes = this.getLikes();

        return {
            totalArticles: articles.length,
            publishedArticles: articles.filter(a => a.status === 'published').length,
            draftArticles: articles.filter(a => a.status === 'draft').length,
            totalComments: comments.length,
            totalLikes: likes.length,
            totalViews: articles.reduce((sum, article) => sum + (article.viewCount || 0), 0)
        };
    }

    // === 搜索相关操作 ===

    searchArticles(keyword, options = {}) {
        const articles = this.getArticles();
        const { status = null, category = null, author = null } = options;

        let filteredArticles = articles;

        // 状态筛选
        if (status) {
            filteredArticles = filteredArticles.filter(article => article.status === status);
        }

        // 分类筛选
        if (category) {
            filteredArticles = filteredArticles.filter(article => article.category === category);
        }

        // 作者筛选
        if (author) {
            filteredArticles = filteredArticles.filter(article => article.author === author);
        }

        // 关键词搜索
        if (keyword) {
            const lowerKeyword = keyword.toLowerCase();
            filteredArticles = filteredArticles.filter(article =>
                article.title.toLowerCase().includes(lowerKeyword) ||
                article.content.toLowerCase().includes(lowerKeyword) ||
                article.author.toLowerCase().includes(lowerKeyword) ||
                (article.tags && article.tags.some(tag => tag.toLowerCase().includes(lowerKeyword)))
            );
        }

        return filteredArticles;
    }

    // === 数据变更通知 ===

    notifyDataChange(type) {
        // 触发自定义事件，让其他组件知道数据已更新
        const event = new CustomEvent('databaseUpdate', {
            detail: { type, timestamp: Date.now() }
        });
        window.dispatchEvent(event);
    }

    // === 数据导入导出 ===

    exportData() {
        return {
            articles: this.getArticles(),
            comments: this.getComments(),
            likes: this.getLikes(),
            users: this.getUsers(),
            settings: this.getSettings(),
            exportTime: new Date().toLocaleString()
        };
    }

    importData(data) {
        try {
            if (data.articles) this.setArticles(data.articles);
            if (data.comments) this.setComments(data.comments);
            if (data.likes) this.setLikes(data.likes);
            if (data.users) this.setUsers(data.users);
            if (data.settings) this.setSettings(data.settings);
            return { success: true, message: '数据导入成功' };
        } catch (error) {
            return { success: false, message: '数据导入失败：' + error.message };
        }
    }

    // === 首页内容管理 ===

    initHomepage() {
        const homepage = this.getHomepage();
        if (Object.keys(homepage).length === 0) {
            const defaultHomepage = {
                title: 'Naegleria fowleri Infection | CDC',
                mainTitle: 'Naegleria fowleri Infection',
                description: 'Learn about Naegleria fowleri infections, symptoms, prevention, and treatment from the CDC.',
                keyPoints: [
                    'Naegleria fowleri is a free-living amoeba that causes primary amebic meningoencephalitis (PAM).',
                    'Infection occurs when contaminated water enters through the nose.',
                    'The infection is rare but nearly always fatal.',
                    'Prevention involves avoiding warm freshwater activities or using nose protection.'
                ],
                sections: {
                    symptoms: {
                        title: 'Symptoms and Diagnosis',
                        content: 'Initial symptoms of PAM (Primary Amebic Meningoencephalitis) start about 5 days after infection and may include: headache, fever, nausea or vomiting, stiff neck. Later symptoms may include seizures, altered mental status, hallucinations, and focal neurologic deficits.'
                    },
                    prevention: {
                        title: 'Prevention',
                        content: 'You can reduce your risk by following these prevention tips: avoid jumping or diving into warm freshwater, hold your nose shut or use nose clips when jumping or diving, avoid putting your head underwater in hot springs and thermally-polluted water, avoid water activities in warm freshwater during periods of high water temperature.'
                    },
                    treatment: {
                        title: 'Treatment',
                        content: 'Treatment for PAM is difficult because the infection progresses rapidly. Several drugs have shown promise in laboratory studies, including: Amphotericin B, Azithromycin, Fluconazole, Rifampin, Miltefosine. Early diagnosis and treatment are critical.'
                    },
                    statistics: {
                        title: 'Statistics and Surveillance',
                        content: '154 total cases in the U.S. (1962-2021), 97% case fatality rate, 5 known survivors worldwide. Most infections occur during the summer months when water temperatures are highest.'
                    }
                },
                stats: {
                    totalCases: '154',
                    fatalityRate: '97%',
                    survivors: '5'
                },
                lastUpdated: new Date().toLocaleString()
            };
            this.setHomepage(defaultHomepage);
        }
    }

    getHomepage() {
        const data = localStorage.getItem(this.storageKeys.homepage);
        return data ? JSON.parse(data) : {};
    }

    setHomepage(homepage) {
        localStorage.setItem(this.storageKeys.homepage, JSON.stringify(homepage));
        this.notifyDataChange('homepage');
    }

    updateHomepage(updateData) {
        const homepage = this.getHomepage();
        const updatedHomepage = {
            ...homepage,
            ...updateData,
            lastUpdated: new Date().toLocaleString()
        };
        this.setHomepage(updatedHomepage);
        return updatedHomepage;
    }

    updateHomepageSection(sectionKey, sectionData) {
        const homepage = this.getHomepage();
        if (!homepage.sections) homepage.sections = {};
        homepage.sections[sectionKey] = {
            ...homepage.sections[sectionKey],
            ...sectionData
        };
        homepage.lastUpdated = new Date().toLocaleString();
        this.setHomepage(homepage);
        return homepage;
    }

    // === 数据清理 ===

    clearAllData() {
        Object.values(this.storageKeys).forEach(key => {
            localStorage.removeItem(key);
        });
        this.init();
    }

    // === 获取用户IP（模拟） ===

    getUserIP() {
        // 简化版本，实际项目中可以通过服务端获取真实IP
        return localStorage.getItem('userIP') || this.generateMockIP();
    }

    generateMockIP() {
        const ip = `192.168.1.${Math.floor(Math.random() * 255)}`;
        localStorage.setItem('userIP', ip);
        return ip;
    }
}

// 创建全局数据库实例
window.ArticleDB = new ArticleDatabase();

// 导出到全局作用域，方便其他文件使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ArticleDatabase;
} 