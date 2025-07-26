/**
 * 身份验证和授权中间件
 * 包含JWT令牌管理、会话管理等功能
 */

const jwt = require('jsonwebtoken');
const securityUtils = require('./security-utils');
const securityConfig = require('./security-config');

class AuthMiddleware {
    constructor() {
        this.sessions = new Map();
        this.refreshTokens = new Map();
        this.config = securityConfig.getConfig();
    }

    // ==================== JWT 管理 ====================

    /**
     * 生成访问令牌
     * @param {object} payload - 用户信息
     * @returns {string} JWT令牌
     */
    generateAccessToken(payload) {
        return jwt.sign(
            {
                ...payload,
                type: 'access',
                iat: Math.floor(Date.now() / 1000)
            },
            this.config.jwt.secret,
            {
                expiresIn: this.config.jwt.expiresIn,
                issuer: this.config.jwt.issuer,
                audience: this.config.jwt.audience
            }
        );
    }

    /**
     * 生成刷新令牌
     * @param {object} payload - 用户信息
     * @returns {string} 刷新令牌
     */
    generateRefreshToken(payload) {
        const refreshToken = jwt.sign(
            {
                userId: payload.userId,
                type: 'refresh',
                iat: Math.floor(Date.now() / 1000)
            },
            this.config.jwt.secret,
            {
                expiresIn: this.config.jwt.refreshExpiresIn,
                issuer: this.config.jwt.issuer,
                audience: this.config.jwt.audience
            }
        );

        // 存储刷新令牌
        this.refreshTokens.set(refreshToken, {
            userId: payload.userId,
            createdAt: Date.now(),
            used: false
        });

        return refreshToken;
    }

    /**
     * 验证访问令牌
     * @param {string} token - JWT令牌
     * @returns {object} 解码后的用户信息
     */
    verifyAccessToken(token) {
        try {
            const decoded = jwt.verify(token, this.config.jwt.secret, {
                issuer: this.config.jwt.issuer,
                audience: this.config.jwt.audience
            });

            if (decoded.type !== 'access') {
                throw new Error('Invalid token type');
            }

            return decoded;
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    /**
     * 刷新访问令牌
     * @param {string} refreshToken - 刷新令牌
     * @returns {object} 新的令牌对
     */
    refreshAccessToken(refreshToken) {
        try {
            // 验证刷新令牌
            const decoded = jwt.verify(refreshToken, this.config.jwt.secret);
            
            if (decoded.type !== 'refresh') {
                throw new Error('Invalid token type');
            }

            // 检查刷新令牌是否存在且未使用
            const tokenData = this.refreshTokens.get(refreshToken);
            if (!tokenData || tokenData.used) {
                throw new Error('Refresh token not found or already used');
            }

            // 标记旧刷新令牌为已使用
            tokenData.used = true;

            // 生成新的令牌对
            const payload = { userId: decoded.userId };
            const newAccessToken = this.generateAccessToken(payload);
            const newRefreshToken = this.generateRefreshToken(payload);

            return {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            };
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    }

    /**
     * 撤销刷新令牌
     * @param {string} refreshToken - 刷新令牌
     */
    revokeRefreshToken(refreshToken) {
        this.refreshTokens.delete(refreshToken);
    }

    // ==================== 会话管理 ====================

    /**
     * 创建会话
     * @param {object} user - 用户信息
     * @param {string} ip - IP地址
     * @param {string} userAgent - 用户代理
     * @returns {string} 会话ID
     */
    createSession(user, ip, userAgent) {
        const sessionId = securityUtils.generateUUID();
        const session = {
            id: sessionId,
            userId: user.id,
            username: user.username,
            role: user.role,
            ip: ip,
            userAgent: userAgent,
            createdAt: Date.now(),
            lastActivity: Date.now(),
            csrfToken: securityUtils.generateCSRFToken(sessionId)
        };

        this.sessions.set(sessionId, session);
        
        // 清理过期会话
        this.cleanupExpiredSessions();
        
        return sessionId;
    }

    /**
     * 获取会话
     * @param {string} sessionId - 会话ID
     * @returns {object} 会话信息
     */
    getSession(sessionId) {
        const session = this.sessions.get(sessionId);
        
        if (!session) return null;

        // 检查会话是否过期（24小时）
        const now = Date.now();
        if (now - session.lastActivity > 24 * 60 * 60 * 1000) {
            this.sessions.delete(sessionId);
            return null;
        }

        // 更新最后活动时间
        session.lastActivity = now;
        return session;
    }

    /**
     * 销毁会话
     * @param {string} sessionId - 会话ID
     */
    destroySession(sessionId) {
        this.sessions.delete(sessionId);
    }

    /**
     * 清理过期会话
     */
    cleanupExpiredSessions() {
        const now = Date.now();
        for (const [sessionId, session] of this.sessions.entries()) {
            if (now - session.lastActivity > 24 * 60 * 60 * 1000) {
                this.sessions.delete(sessionId);
            }
        }
    }

    // ==================== 中间件函数 ====================

    /**
     * 身份验证中间件
     * @param {object} req - 请求对象
     * @param {object} res - 响应对象
     * @param {function} next - 下一个中间件
     */
    authenticate() {
        return (req, res, next) => {
            try {
                // 获取令牌
                const authHeader = req.headers.authorization;
                const token = authHeader && authHeader.startsWith('Bearer ') 
                    ? authHeader.slice(7) 
                    : req.cookies?.accessToken;

                if (!token) {
                    return res.status(401).json({ 
                        error: 'Access token required',
                        code: 'NO_TOKEN'
                    });
                }

                // 验证令牌
                const decoded = this.verifyAccessToken(token);
                req.user = decoded;

                // 获取会话信息
                const sessionId = req.cookies?.sessionId;
                if (sessionId) {
                    const session = this.getSession(sessionId);
                    req.session = session;
                }

                next();
            } catch (error) {
                return res.status(401).json({ 
                    error: 'Invalid or expired token',
                    code: 'INVALID_TOKEN'
                });
            }
        };
    }

    /**
     * 授权中间件
     * @param {Array} roles - 允许的角色
     */
    authorize(roles = []) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({ 
                    error: 'Authentication required',
                    code: 'NO_AUTH'
                });
            }

            if (roles.length > 0 && !roles.includes(req.user.role)) {
                return res.status(403).json({ 
                    error: 'Insufficient permissions',
                    code: 'NO_PERMISSION'
                });
            }

            next();
        };
    }

    /**
     * CSRF保护中间件
     */
    csrfProtection() {
        return (req, res, next) => {
            // GET请求不需要CSRF保护
            if (req.method === 'GET') {
                return next();
            }

            const sessionId = req.cookies?.sessionId;
            const csrfToken = req.headers['x-csrf-token'] || req.body.csrfToken;

            if (!sessionId || !csrfToken) {
                return res.status(403).json({ 
                    error: 'CSRF token required',
                    code: 'NO_CSRF_TOKEN'
                });
            }

            if (!securityUtils.validateCSRFToken(sessionId, csrfToken)) {
                return res.status(403).json({ 
                    error: 'Invalid CSRF token',
                    code: 'INVALID_CSRF_TOKEN'
                });
            }

            next();
        };
    }

    /**
     * 登录保护中间件
     */
    loginProtection() {
        return (req, res, next) => {
            const ip = securityUtils.getClientIP(req);

            if (securityUtils.isIPBlocked(ip)) {
                return res.status(429).json({ 
                    error: 'Too many login attempts. Please try again later.',
                    code: 'IP_BLOCKED',
                    remainingAttempts: 0
                });
            }

            req.clientIP = ip;
            next();
        };
    }

    /**
     * 可选身份验证中间件
     */
    optionalAuth() {
        return (req, res, next) => {
            try {
                const authHeader = req.headers.authorization;
                const token = authHeader && authHeader.startsWith('Bearer ') 
                    ? authHeader.slice(7) 
                    : req.cookies?.accessToken;

                if (token) {
                    const decoded = this.verifyAccessToken(token);
                    req.user = decoded;

                    const sessionId = req.cookies?.sessionId;
                    if (sessionId) {
                        const session = this.getSession(sessionId);
                        req.session = session;
                    }
                }
            } catch (error) {
                // 可选身份验证，忽略错误
            }

            next();
        };
    }

    // ==================== 工具方法 ====================

    /**
     * 设置安全Cookie
     * @param {object} res - 响应对象
     * @param {string} name - Cookie名称
     * @param {string} value - Cookie值
     * @param {object} options - Cookie选项
     */
    setSecureCookie(res, name, value, options = {}) {
        const defaultOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000, // 24小时
            ...options
        };

        res.cookie(name, value, defaultOptions);
    }

    /**
     * 清除Cookie
     * @param {object} res - 响应对象
     * @param {string} name - Cookie名称
     */
    clearCookie(res, name) {
        res.clearCookie(name, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
    }

    /**
     * 生成安全响应头
     * @param {object} res - 响应对象
     */
    setSecurityHeaders(res) {
        const headers = securityConfig.getSecurityHeaders();
        for (const [key, value] of Object.entries(headers)) {
            res.setHeader(key, value);
        }
    }

    /**
     * 记录安全事件
     * @param {string} event - 事件类型
     * @param {object} details - 事件详情
     */
    logSecurityEvent(event, details) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            event: event,
            details: details,
            severity: this.getEventSeverity(event)
        };

        console.log(`[SECURITY] ${logEntry.severity}: ${event}`, details);
        
        // 在实际项目中，这里应该写入安全日志文件或发送到监控系统
    }

    /**
     * 获取事件严重程度
     * @param {string} event - 事件类型
     * @returns {string} 严重程度
     */
    getEventSeverity(event) {
        const severityMap = {
            'login_success': 'INFO',
            'login_failure': 'WARN',
            'login_blocked': 'ERROR',
            'token_invalid': 'WARN',
            'csrf_attack': 'ERROR',
            'xss_attempt': 'ERROR',
            'sql_injection': 'CRITICAL',
            'unauthorized_access': 'ERROR'
        };

        return severityMap[event] || 'INFO';
    }
}

// 导出单例
const authMiddleware = new AuthMiddleware();

module.exports = authMiddleware; 