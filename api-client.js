/**
 * 前端API客户端
 * 替换原来的localStorage操作，使用HTTP API调用
 */

class APIClient {
    constructor(baseURL = 'http://localhost:3000/api') {
        this.baseURL = baseURL;
    }

    // 通用请求方法
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // GET请求
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    // POST请求
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: data,
        });
    }

    // PUT请求
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: data,
        });
    }

    // DELETE请求
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // === 文章相关API ===

    async getArticles() {
        const response = await this.get('/articles');
        return response.data;
    }

    async getArticleById(id) {
        const response = await this.get(`/articles/${id}`);
        return response.data;
    }

    async addArticle(articleData) {
        const response = await this.post('/articles', articleData);
        return response.data;
    }

    async updateArticle(id, updateData) {
        const response = await this.put(`/articles/${id}`, updateData);
        return response.data;
    }

    async deleteArticle(id) {
        const response = await this.delete(`/articles/${id}`);
        return response;
    }

    // === 评论相关API ===

    async getComments(articleId = null) {
        const endpoint = articleId ? `/comments?articleId=${articleId}` : '/comments';
        const response = await this.get(endpoint);
        return response.data;
    }

    async addComment(commentData) {
        const response = await this.post('/comments', commentData);
        return response.data;
    }

    // === 用户相关API ===

    async login(username, password) {
        const response = await this.post('/login', { username, password });
        return response.data;
    }

    // === 统计相关API ===

    async getStatistics() {
        const response = await this.get('/statistics');
        return response.data;
    }
}

// 模拟原来的ArticleDatabase接口，保持兼容性
class ArticleDatabase {
    constructor() {
        this.api = new APIClient();
        this.cache = {
            articles: [],
            comments: [],
            users: [],
            settings: this.getDefaultSettings()
        };
        this.init();
    }

    async init() {
        try {
            // 初始化时加载数据到缓存
            await this.refreshCache();
        } catch (error) {
            console.warn('无法连接到后端服务器，使用本地缓存模式');
            this.initLocalData();
        }
    }

    async refreshCache() {
        this.cache.articles = await this.api.getArticles();
        this.cache.comments = await this.api.getComments();
        // statistics等其他数据按需加载
    }

    // 本地缓存模式（当API不可用时）
    initLocalData() {
        const localArticles = localStorage.getItem('articles_db');
        if (localArticles) {
            this.cache.articles = JSON.parse(localArticles);
        } else {
            this.cache.articles = this.getSampleArticles();
        }
    }

    getDefaultSettings() {
        return {
            siteName: '文章博客系统',
            siteDescription: '分享知识，传递价值',
            articlesPerPage: 6,
            commentsPerPage: 10,
            enableComments: true,
            enableLikes: true,
            moderateComments: false
        };
    }

    getSampleArticles() {
        return [
            {
                id: Date.now(),
                title: '如何学习前端开发',
                author: '张三',
                content: '前端开发是一个快速发展的领域，需要掌握HTML、CSS、JavaScript等技术。',
                status: 'published',
                createTime: new Date('2024-01-15').toLocaleString(),
                updateTime: new Date('2024-01-15').toLocaleString(),
                category: '技术分享',
                tags: ['前端', '学习', 'JavaScript'],
                viewCount: 128,
                likeCount: 15,
                commentCount: 8
            }
        ];
    }

    // === 兼容性方法 ===

    async getArticles() {
        try {
            this.cache.articles = await this.api.getArticles();
            return this.cache.articles;
        } catch (error) {
            console.warn('API调用失败，返回缓存数据');
            return this.cache.articles;
        }
    }

    async getArticleById(id) {
        try {
            const article = await this.api.getArticleById(id);
            // 更新缓存中的文章
            const index = this.cache.articles.findIndex(a => a.id === parseInt(id));
            if (index !== -1) {
                this.cache.articles[index] = article;
            }
            return article;
        } catch (error) {
            console.warn('API调用失败，从缓存获取文章');
            return this.cache.articles.find(article => article.id === parseInt(id));
        }
    }

    async addArticle(articleData) {
        try {
            const newArticle = await this.api.addArticle(articleData);
            this.cache.articles.unshift(newArticle);
            this.notifyDataChange('articles');
            return newArticle;
        } catch (error) {
            console.warn('API调用失败，使用本地方式添加文章');
            const newArticle = {
                id: Date.now(),
                ...articleData,
                createTime: new Date().toLocaleString(),
                updateTime: new Date().toLocaleString(),
                viewCount: 0,
                likeCount: 0,
                commentCount: 0
            };
            this.cache.articles.unshift(newArticle);
            localStorage.setItem('articles_db', JSON.stringify(this.cache.articles));
            this.notifyDataChange('articles');
            return newArticle;
        }
    }

    async updateArticle(id, updateData) {
        try {
            const updatedArticle = await this.api.updateArticle(id, updateData);
            const index = this.cache.articles.findIndex(article => article.id === parseInt(id));
            if (index !== -1) {
                this.cache.articles[index] = updatedArticle;
            }
            this.notifyDataChange('articles');
            return updatedArticle;
        } catch (error) {
            console.warn('API调用失败，使用本地方式更新文章');
            const index = this.cache.articles.findIndex(article => article.id === parseInt(id));
            if (index !== -1) {
                this.cache.articles[index] = {
                    ...this.cache.articles[index],
                    ...updateData,
                    updateTime: new Date().toLocaleString()
                };
                localStorage.setItem('articles_db', JSON.stringify(this.cache.articles));
                this.notifyDataChange('articles');
                return this.cache.articles[index];
            }
            return null;
        }
    }

    async deleteArticle(id) {
        try {
            await this.api.deleteArticle(id);
            this.cache.articles = this.cache.articles.filter(article => article.id !== parseInt(id));
            this.notifyDataChange('articles');
        } catch (error) {
            console.warn('API调用失败，使用本地方式删除文章');
            this.cache.articles = this.cache.articles.filter(article => article.id !== parseInt(id));
            localStorage.setItem('articles_db', JSON.stringify(this.cache.articles));
            this.notifyDataChange('articles');
        }
    }

    async validateUser(username, password) {
        try {
            const user = await this.api.login(username, password);
            return user;
        } catch (error) {
            console.warn('API登录失败，使用本地验证');
            const users = [{ username: 'admin', password: '123456', role: 'admin' }];
            return users.find(user => user.username === username && user.password === password);
        }
    }

    async getStatistics() {
        try {
            return await this.api.getStatistics();
        } catch (error) {
            console.warn('API调用失败，计算本地统计');
            return {
                totalArticles: this.cache.articles.length,
                publishedArticles: this.cache.articles.filter(a => a.status === 'published').length,
                draftArticles: this.cache.articles.filter(a => a.status === 'draft').length,
                totalComments: this.cache.comments.length,
                totalLikes: 0,
                totalViews: this.cache.articles.reduce((sum, article) => sum + (article.viewCount || 0), 0)
            };
        }
    }

    // 保持原有的方法接口
    incrementViewCount(id) {
        // 这个方法在API版本中通过getArticleById自动处理
        return this.getArticleById(id);
    }

    getSettings() {
        return this.cache.settings;
    }

    getSetting(key) {
        return this.cache.settings[key];
    }

    notifyDataChange(type) {
        const event = new CustomEvent('databaseUpdate', {
            detail: { type, timestamp: Date.now() }
        });
        window.dispatchEvent(event);
    }

    // 搜索功能（本地处理）
    searchArticles(keyword, options = {}) {
        const { status = null, category = null, author = null } = options;
        let filteredArticles = this.cache.articles;

        if (status) {
            filteredArticles = filteredArticles.filter(article => article.status === status);
        }

        if (category) {
            filteredArticles = filteredArticles.filter(article => article.category === category);
        }

        if (author) {
            filteredArticles = filteredArticles.filter(article => article.author === author);
        }

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
}

// 创建全局实例
window.ArticleDB = new ArticleDatabase();
window.APIClient = APIClient;

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ArticleDatabase, APIClient };
} 