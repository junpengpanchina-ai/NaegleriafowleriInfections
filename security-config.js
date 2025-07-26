/**
 * 网络安全配置文件
 * 包含CSP、CORS、安全头等配置
 */

class SecurityConfig {
    constructor() {
        this.config = {
            // Content Security Policy 配置
            csp: {
                'default-src': ["'self'"],
                'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com"],
                'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                'img-src': ["'self'", "data:", "https:", "blob:"],
                'font-src': ["'self'", "https://fonts.gstatic.com"],
                'connect-src': ["'self'", "https://api.github.com"],
                'frame-src': ["'none'"],
                'object-src': ["'none'"],
                'base-uri': ["'self'"],
                'form-action': ["'self'"],
                'frame-ancestors': ["'none'"],
                'upgrade-insecure-requests': []
            },

            // CORS 配置
            cors: {
                origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
                credentials: true,
                maxAge: 86400 // 24小时
            },

            // 安全头配置
            securityHeaders: {
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'X-XSS-Protection': '1; mode=block',
                'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
                'Referrer-Policy': 'strict-origin-when-cross-origin',
                'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            },

            // 速率限制配置
            rateLimit: {
                windowMs: 15 * 60 * 1000, // 15分钟
                max: 100, // 限制每个IP在windowMs内最多100个请求
                message: {
                    error: 'Too many requests from this IP, please try again later.',
                    retryAfter: 900
                },
                standardHeaders: true,
                legacyHeaders: false
            },

            // 登录保护配置
            loginProtection: {
                maxAttempts: 5,
                lockoutDuration: 30 * 60 * 1000, // 30分钟
                resetTime: 24 * 60 * 60 * 1000 // 24小时后重置
            },

            // 密码策略
            passwordPolicy: {
                minLength: 8,
                requireUppercase: true,
                requireLowercase: true,
                requireNumbers: true,
                requireSpecialChars: true,
                maxAge: 90 * 24 * 60 * 60 * 1000, // 90天
                historyCount: 5 // 记住最近5个密码
            },

            // JWT配置
            jwt: {
                secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
                expiresIn: '1h',
                refreshExpiresIn: '7d',
                issuer: 'naegleria-fowleri-app',
                audience: 'naegleria-fowleri-users'
            },

            // 文件上传安全配置
            fileUpload: {
                maxSize: 5 * 1024 * 1024, // 5MB
                allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
                allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
                uploadPath: './uploads/',
                virusScan: true
            },

            // 输入验证配置
            validation: {
                maxStringLength: 10000,
                maxArrayLength: 100,
                maxObjectDepth: 10,
                allowedTags: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
                allowedAttributes: ['href', 'title', 'alt', 'src']
            }
        };
    }

    // 获取CSP头字符串
    getCSPHeader() {
        const csp = this.config.csp;
        return Object.entries(csp)
            .map(([directive, sources]) => {
                if (sources.length === 0) return directive;
                return `${directive} ${sources.join(' ')}`;
            })
            .join('; ');
    }

    // 获取CORS配置
    getCORSConfig() {
        return this.config.cors;
    }

    // 获取安全头
    getSecurityHeaders() {
        return {
            ...this.config.securityHeaders,
            'Content-Security-Policy': this.getCSPHeader()
        };
    }

    // 获取速率限制配置
    getRateLimitConfig() {
        return this.config.rateLimit;
    }

    // 验证配置
    validate() {
        const errors = [];

        // 验证JWT密钥
        if (this.config.jwt.secret === 'your-super-secret-jwt-key-change-this-in-production') {
            errors.push('⚠️  请更改默认的JWT密钥');
        }

        // 验证CORS配置
        if (this.config.cors.origin.includes('*')) {
            errors.push('⚠️  CORS配置过于宽松，请指定具体的域名');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // 更新配置
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        return this.validate();
    }

    // 获取完整配置
    getConfig() {
        return this.config;
    }
}

// 导出单例
const securityConfig = new SecurityConfig();

// Node.js环境
if (typeof module !== 'undefined' && module.exports) {
    module.exports = securityConfig;
}

// 浏览器环境
if (typeof window !== 'undefined') {
    window.SecurityConfig = securityConfig;
} 