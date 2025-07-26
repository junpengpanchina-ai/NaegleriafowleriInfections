/**
 * 安全工具类
 * 包含输入验证、XSS防护、CSRF保护等功能
 */

class SecurityUtils {
    constructor() {
        this.csrfTokens = new Map();
        this.loginAttempts = new Map();
        this.blockedIPs = new Set();
        
        // HTML实体编码映射
        this.htmlEntities = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;',
            '`': '&#x60;',
            '=': '&#x3D;'
        };

        // 危险脚本模式
        this.dangerousPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /<iframe[^>]*>.*?<\/iframe>/gi,
            /<object[^>]*>.*?<\/object>/gi,
            /<embed[^>]*>.*?<\/embed>/gi,
            /<link[^>]*rel\s*=\s*["']?stylesheet["']?[^>]*>/gi,
            /<meta[^>]*http-equiv[^>]*>/gi
        ];

        // SQL注入模式
        this.sqlInjectionPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
            /(;|\||&|\$|\*|'|"|\\|<|>|%)/g,
            /(\b(OR|AND)\b\s+\b\d+\b\s*=\s*\b\d+\b)/gi
        ];
    }

    // ==================== XSS 防护 ====================

    /**
     * HTML实体编码
     * @param {string} str - 需要编码的字符串
     * @returns {string} 编码后的字符串
     */
    escapeHtml(str) {
        if (typeof str !== 'string') return str;
        return str.replace(/[&<>"'`=\/]/g, (match) => this.htmlEntities[match]);
    }

    /**
     * 移除危险的HTML标签和属性
     * @param {string} html - HTML字符串
     * @returns {string} 清理后的HTML
     */
    sanitizeHtml(html) {
        if (typeof html !== 'string') return '';

        // 移除危险脚本
        let sanitized = html;
        this.dangerousPatterns.forEach(pattern => {
            sanitized = sanitized.replace(pattern, '');
        });

        // 只允许安全的标签
        const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'];
        const allowedAttributes = ['href', 'title', 'alt'];

        // 简单的标签过滤（实际项目建议使用DOMPurify等专业库）
        sanitized = sanitized.replace(/<(\/?)([\w]+)([^>]*)>/g, (match, slash, tag, attrs) => {
            const tagLower = tag.toLowerCase();
            
            if (!allowedTags.includes(tagLower)) {
                return '';
            }

            // 过滤属性
            if (attrs) {
                attrs = attrs.replace(/\s*([\w-]+)\s*=\s*["']([^"']*)["']/g, (attrMatch, name, value) => {
                    if (allowedAttributes.includes(name.toLowerCase())) {
                        return ` ${name}="${this.escapeHtml(value)}"`;
                    }
                    return '';
                });
            }

            return `<${slash}${tagLower}${attrs}>`;
        });

        return sanitized;
    }

    /**
     * 验证输入是否包含XSS攻击
     * @param {string} input - 输入字符串
     * @returns {boolean} 是否安全
     */
    isXSSFree(input) {
        if (typeof input !== 'string') return true;
        
        return !this.dangerousPatterns.some(pattern => pattern.test(input));
    }

    // ==================== CSRF 防护 ====================

    /**
     * 生成CSRF令牌
     * @param {string} sessionId - 会话ID
     * @returns {string} CSRF令牌
     */
    generateCSRFToken(sessionId) {
        const token = this.generateRandomString(32);
        const timestamp = Date.now();
        
        this.csrfTokens.set(sessionId, {
            token,
            timestamp,
            used: false
        });

        // 清理过期令牌
        this.cleanupExpiredTokens();
        
        return token;
    }

    /**
     * 验证CSRF令牌
     * @param {string} sessionId - 会话ID
     * @param {string} token - 提交的令牌
     * @returns {boolean} 是否有效
     */
    validateCSRFToken(sessionId, token) {
        const tokenData = this.csrfTokens.get(sessionId);
        
        if (!tokenData) return false;
        if (tokenData.used) return false;
        if (tokenData.token !== token) return false;
        
        // 检查令牌是否过期（1小时）
        const now = Date.now();
        if (now - tokenData.timestamp > 3600000) {
            this.csrfTokens.delete(sessionId);
            return false;
        }

        // 标记令牌已使用（一次性使用）
        tokenData.used = true;
        return true;
    }

    /**
     * 清理过期的CSRF令牌
     */
    cleanupExpiredTokens() {
        const now = Date.now();
        for (const [sessionId, tokenData] of this.csrfTokens.entries()) {
            if (now - tokenData.timestamp > 3600000) {
                this.csrfTokens.delete(sessionId);
            }
        }
    }

    // ==================== 输入验证 ====================

    /**
     * 验证邮箱格式
     * @param {string} email - 邮箱地址
     * @returns {boolean} 是否有效
     */
    isValidEmail(email) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    }

    /**
     * 验证密码强度
     * @param {string} password - 密码
     * @returns {object} 验证结果
     */
    validatePassword(password) {
        const result = {
            isValid: true,
            errors: [],
            strength: 0
        };

        if (!password || password.length < 8) {
            result.isValid = false;
            result.errors.push('密码长度至少8位');
        } else {
            result.strength += 1;
        }

        if (!/[A-Z]/.test(password)) {
            result.isValid = false;
            result.errors.push('密码必须包含大写字母');
        } else {
            result.strength += 1;
        }

        if (!/[a-z]/.test(password)) {
            result.isValid = false;
            result.errors.push('密码必须包含小写字母');
        } else {
            result.strength += 1;
        }

        if (!/\d/.test(password)) {
            result.isValid = false;
            result.errors.push('密码必须包含数字');
        } else {
            result.strength += 1;
        }

        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            result.isValid = false;
            result.errors.push('密码必须包含特殊字符');
        } else {
            result.strength += 1;
        }

        // 检查常见弱密码
        const commonPasswords = ['password', '123456', 'admin', 'root', 'user'];
        if (commonPasswords.includes(password.toLowerCase())) {
            result.isValid = false;
            result.errors.push('不能使用常见弱密码');
            result.strength = 0;
        }

        return result;
    }

    /**
     * 验证用户名
     * @param {string} username - 用户名
     * @returns {boolean} 是否有效
     */
    isValidUsername(username) {
        if (!username || username.length < 3 || username.length > 20) return false;
        return /^[a-zA-Z0-9_-]+$/.test(username);
    }

    /**
     * 检测SQL注入攻击
     * @param {string} input - 输入字符串
     * @returns {boolean} 是否包含SQL注入
     */
    hasSQLInjection(input) {
        if (typeof input !== 'string') return false;
        
        return this.sqlInjectionPatterns.some(pattern => pattern.test(input));
    }

    /**
     * 验证文件类型
     * @param {string} filename - 文件名
     * @param {Array} allowedTypes - 允许的文件类型
     * @returns {boolean} 是否允许
     */
    isValidFileType(filename, allowedTypes = ['.jpg', '.jpeg', '.png', '.gif']) {
        if (!filename) return false;
        
        const ext = filename.toLowerCase().split('.').pop();
        return allowedTypes.includes(`.${ext}`);
    }

    // ==================== 登录保护 ====================

    /**
     * 记录登录尝试
     * @param {string} ip - IP地址
     * @param {boolean} success - 是否成功
     */
    recordLoginAttempt(ip, success) {
        if (!this.loginAttempts.has(ip)) {
            this.loginAttempts.set(ip, {
                attempts: 0,
                lastAttempt: Date.now(),
                blocked: false
            });
        }

        const record = this.loginAttempts.get(ip);
        record.lastAttempt = Date.now();

        if (success) {
            record.attempts = 0;
            record.blocked = false;
        } else {
            record.attempts++;
            
            // 5次失败后封锁30分钟
            if (record.attempts >= 5) {
                record.blocked = true;
                this.blockedIPs.add(ip);
                
                // 30分钟后自动解封
                setTimeout(() => {
                    this.blockedIPs.delete(ip);
                    if (this.loginAttempts.has(ip)) {
                        this.loginAttempts.get(ip).blocked = false;
                    }
                }, 30 * 60 * 1000);
            }
        }
    }

    /**
     * 检查IP是否被封锁
     * @param {string} ip - IP地址
     * @returns {boolean} 是否被封锁
     */
    isIPBlocked(ip) {
        return this.blockedIPs.has(ip);
    }

    /**
     * 获取剩余登录尝试次数
     * @param {string} ip - IP地址
     * @returns {number} 剩余次数
     */
    getRemainingAttempts(ip) {
        const record = this.loginAttempts.get(ip);
        if (!record) return 5;
        return Math.max(0, 5 - record.attempts);
    }

    // ==================== 工具方法 ====================

    /**
     * 生成随机字符串
     * @param {number} length - 长度
     * @returns {string} 随机字符串
     */
    generateRandomString(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * 生成UUID
     * @returns {string} UUID
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * 哈希密码
     * @param {string} password - 明文密码
     * @param {string} salt - 盐值
     * @returns {string} 哈希后的密码
     */
    async hashPassword(password, salt = null) {
        if (!salt) {
            salt = this.generateRandomString(16);
        }

        // 在实际项目中，应该使用bcrypt或类似的库
        // 这里使用简单的哈希作为示例
        const encoder = new TextEncoder();
        const data = encoder.encode(password + salt);
        
        if (typeof crypto !== 'undefined' && crypto.subtle) {
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            return `${salt}:${hashHex}`;
        } else {
            // Fallback for Node.js
            const crypto = require('crypto');
            const hash = crypto.createHash('sha256').update(password + salt).digest('hex');
            return `${salt}:${hash}`;
        }
    }

    /**
     * 验证密码
     * @param {string} password - 明文密码
     * @param {string} hashedPassword - 哈希密码
     * @returns {boolean} 是否匹配
     */
    async verifyPassword(password, hashedPassword) {
        const [salt, hash] = hashedPassword.split(':');
        const newHash = await this.hashPassword(password, salt);
        return newHash === hashedPassword;
    }

    /**
     * 获取客户端IP地址
     * @param {object} req - 请求对象
     * @returns {string} IP地址
     */
    getClientIP(req) {
        return req.headers['x-forwarded-for'] ||
               req.headers['x-real-ip'] ||
               req.connection.remoteAddress ||
               req.socket.remoteAddress ||
               (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
               '127.0.0.1';
    }

    /**
     * 清理和验证输入数据
     * @param {any} data - 输入数据
     * @param {object} rules - 验证规则
     * @returns {object} 清理后的数据和验证结果
     */
    validateAndSanitize(data, rules = {}) {
        const result = {
            data: {},
            isValid: true,
            errors: []
        };

        for (const [key, value] of Object.entries(data)) {
            const rule = rules[key] || {};
            
            // 类型检查
            if (rule.type && typeof value !== rule.type) {
                result.isValid = false;
                result.errors.push(`${key} 类型错误`);
                continue;
            }

            // 长度检查
            if (rule.maxLength && value.length > rule.maxLength) {
                result.isValid = false;
                result.errors.push(`${key} 长度超过限制`);
                continue;
            }

            // XSS检查
            if (typeof value === 'string' && !this.isXSSFree(value)) {
                result.isValid = false;
                result.errors.push(`${key} 包含危险内容`);
                continue;
            }

            // SQL注入检查
            if (typeof value === 'string' && this.hasSQLInjection(value)) {
                result.isValid = false;
                result.errors.push(`${key} 包含危险SQL`);
                continue;
            }

            // 清理数据
            if (typeof value === 'string') {
                result.data[key] = rule.allowHtml ? this.sanitizeHtml(value) : this.escapeHtml(value);
            } else {
                result.data[key] = value;
            }
        }

        return result;
    }
}

// 导出单例
const securityUtils = new SecurityUtils();

// Node.js环境
if (typeof module !== 'undefined' && module.exports) {
    module.exports = securityUtils;
}

// 浏览器环境
if (typeof window !== 'undefined') {
    window.SecurityUtils = securityUtils;
} 