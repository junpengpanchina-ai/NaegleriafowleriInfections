/**
 * 评论系统安全模块
 * 包含内容过滤、审核机制、垃圾评论检测等功能
 */

const securityUtils = require('./security-utils');

class CommentSecurity {
    constructor() {
        // 敏感词库
        this.sensitiveWords = [
            // 政治敏感词
            '政治敏感词1', '政治敏感词2',
            // 暴力词汇
            '暴力', '杀害', '伤害', '攻击',
            // 色情词汇
            '色情词1', '色情词2',
            // 广告词汇
            '代开发票', '办证', '贷款', '投资理财',
            // 其他不当内容
            '骗子', '诈骗', '传销'
        ];

        // 垃圾评论模式
        this.spamPatterns = [
            /(.)\1{4,}/g, // 重复字符
            /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // 邮箱
            /(https?:\/\/[^\s]+)/g, // URL链接
            /\d{11}/g, // 手机号
            /QQ[:：]\s*\d+/gi, // QQ号
            /微信[:：]\s*[\w\-_]+/gi, // 微信号
            /加我|联系我|私聊|详聊/gi // 联系方式相关
        ];

        // 评论频率限制
        this.commentLimits = new Map();
        
        // 用户信誉系统
        this.userReputation = new Map();
        
        // 评论审核队列
        this.moderationQueue = [];
        
        // 自动审核规则
        this.autoModerationRules = {
            minLength: 2,
            maxLength: 1000,
            maxLinksPerComment: 0,
            maxRepeatedChars: 3,
            requireApprovalForNewUsers: true,
            requireApprovalForSensitiveContent: true
        };
    }

    // ==================== 内容过滤 ====================

    /**
     * 检查评论内容是否包含敏感词
     * @param {string} content - 评论内容
     * @returns {object} 检查结果
     */
    checkSensitiveWords(content) {
        const foundWords = [];
        const lowerContent = content.toLowerCase();
        
        for (const word of this.sensitiveWords) {
            if (lowerContent.includes(word.toLowerCase())) {
                foundWords.push(word);
            }
        }
        
        return {
            hasSensitiveWords: foundWords.length > 0,
            words: foundWords,
            severity: this.getSensitiveWordSeverity(foundWords)
        };
    }

    /**
     * 获取敏感词严重程度
     * @param {Array} words - 敏感词列表
     * @returns {string} 严重程度
     */
    getSensitiveWordSeverity(words) {
        if (words.length === 0) return 'none';
        if (words.length >= 3) return 'critical';
        if (words.length >= 2) return 'high';
        return 'medium';
    }

    /**
     * 过滤敏感词（用*替换）
     * @param {string} content - 原始内容
     * @returns {string} 过滤后的内容
     */
    filterSensitiveWords(content) {
        let filtered = content;
        
        for (const word of this.sensitiveWords) {
            const regex = new RegExp(word, 'gi');
            filtered = filtered.replace(regex, '*'.repeat(word.length));
        }
        
        return filtered;
    }

    /**
     * 检测垃圾评论
     * @param {string} content - 评论内容
     * @param {object} user - 用户信息
     * @returns {object} 检测结果
     */
    detectSpam(content, user = {}) {
        const spamScore = this.calculateSpamScore(content, user);
        const isSpam = spamScore >= 70; // 70分以上认为是垃圾评论
        
        return {
            isSpam,
            score: spamScore,
            reasons: this.getSpamReasons(content, user),
            confidence: this.getSpamConfidence(spamScore)
        };
    }

    /**
     * 计算垃圾评论分数
     * @param {string} content - 评论内容
     * @param {object} user - 用户信息
     * @returns {number} 垃圾评论分数 (0-100)
     */
    calculateSpamScore(content, user) {
        let score = 0;
        
        // 内容长度检查
        if (content.length < 5) score += 20;
        if (content.length > 500) score += 10;
        
        // 重复字符检查
        const repeatedChars = content.match(/(.)\1{3,}/g);
        if (repeatedChars) score += repeatedChars.length * 15;
        
        // 链接检查
        const links = content.match(/(https?:\/\/[^\s]+)/g);
        if (links) score += links.length * 25;
        
        // 邮箱检查
        const emails = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
        if (emails) score += emails.length * 30;
        
        // 电话号码检查
        const phones = content.match(/\d{11}/g);
        if (phones) score += phones.length * 35;
        
        // 全大写检查
        if (content === content.toUpperCase() && content.length > 10) score += 15;
        
        // 特殊字符过多
        const specialChars = content.match(/[!@#$%^&*()_+=\[\]{}|;:,.<>?]/g);
        if (specialChars && specialChars.length > content.length * 0.3) score += 20;
        
        // 用户信誉检查
        const reputation = this.getUserReputation(user.id);
        if (reputation < 20) score += 25;
        if (reputation < 10) score += 40;
        
        // 新用户检查
        if (user.isNew) score += 15;
        
        // 评论频率检查
        if (this.isCommentingTooFast(user.id)) score += 30;
        
        return Math.min(100, score);
    }

    /**
     * 获取垃圾评论原因
     * @param {string} content - 评论内容
     * @param {object} user - 用户信息
     * @returns {Array} 原因列表
     */
    getSpamReasons(content, user) {
        const reasons = [];
        
        if (content.length < 5) reasons.push('内容过短');
        if (content.match(/(.)\1{3,}/g)) reasons.push('包含大量重复字符');
        if (content.match(/(https?:\/\/[^\s]+)/g)) reasons.push('包含链接');
        if (content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)) reasons.push('包含邮箱地址');
        if (content.match(/\d{11}/g)) reasons.push('包含电话号码');
        if (content === content.toUpperCase() && content.length > 10) reasons.push('全部大写');
        if (this.getUserReputation(user.id) < 20) reasons.push('用户信誉较低');
        if (user.isNew) reasons.push('新用户');
        if (this.isCommentingTooFast(user.id)) reasons.push('评论过于频繁');
        
        return reasons;
    }

    /**
     * 获取垃圾评论检测置信度
     * @param {number} score - 垃圾评论分数
     * @returns {string} 置信度
     */
    getSpamConfidence(score) {
        if (score >= 90) return 'very_high';
        if (score >= 70) return 'high';
        if (score >= 50) return 'medium';
        if (score >= 30) return 'low';
        return 'very_low';
    }

    // ==================== 频率限制 ====================

    /**
     * 检查用户评论频率
     * @param {string} userId - 用户ID
     * @returns {boolean} 是否评论过快
     */
    isCommentingTooFast(userId) {
        if (!userId) return false;
        
        const now = Date.now();
        const userLimits = this.commentLimits.get(userId) || { count: 0, resetTime: now + 60000 };
        
        // 重置计数器
        if (now > userLimits.resetTime) {
            userLimits.count = 0;
            userLimits.resetTime = now + 60000; // 1分钟窗口
        }
        
        // 检查频率限制：1分钟内最多5条评论
        return userLimits.count >= 5;
    }

    /**
     * 记录用户评论
     * @param {string} userId - 用户ID
     */
    recordComment(userId) {
        if (!userId) return;
        
        const now = Date.now();
        const userLimits = this.commentLimits.get(userId) || { count: 0, resetTime: now + 60000 };
        
        if (now > userLimits.resetTime) {
            userLimits.count = 1;
            userLimits.resetTime = now + 60000;
        } else {
            userLimits.count++;
        }
        
        this.commentLimits.set(userId, userLimits);
    }

    /**
     * 获取用户剩余评论次数
     * @param {string} userId - 用户ID
     * @returns {number} 剩余次数
     */
    getRemainingComments(userId) {
        if (!userId) return 0;
        
        const userLimits = this.commentLimits.get(userId);
        if (!userLimits) return 5;
        
        const now = Date.now();
        if (now > userLimits.resetTime) return 5;
        
        return Math.max(0, 5 - userLimits.count);
    }

    // ==================== 用户信誉系统 ====================

    /**
     * 获取用户信誉分数
     * @param {string} userId - 用户ID
     * @returns {number} 信誉分数 (0-100)
     */
    getUserReputation(userId) {
        if (!userId) return 50; // 默认分数
        
        const reputation = this.userReputation.get(userId);
        return reputation ? reputation.score : 50;
    }

    /**
     * 更新用户信誉分数
     * @param {string} userId - 用户ID
     * @param {number} change - 分数变化
     * @param {string} reason - 变化原因
     */
    updateUserReputation(userId, change, reason) {
        if (!userId) return;
        
        const reputation = this.userReputation.get(userId) || {
            score: 50,
            history: []
        };
        
        reputation.score = Math.max(0, Math.min(100, reputation.score + change));
        reputation.history.push({
            change,
            reason,
            timestamp: Date.now(),
            newScore: reputation.score
        });
        
        // 只保留最近50条记录
        if (reputation.history.length > 50) {
            reputation.history = reputation.history.slice(-50);
        }
        
        this.userReputation.set(userId, reputation);
    }

    // ==================== 自动审核 ====================

    /**
     * 自动审核评论
     * @param {object} comment - 评论对象
     * @param {object} user - 用户信息
     * @returns {object} 审核结果
     */
    autoModerate(comment, user = {}) {
        const result = {
            approved: false,
            needsReview: false,
            blocked: false,
            reasons: [],
            score: 0
        };

        // 基本验证
        const validation = this.validateComment(comment);
        if (!validation.isValid) {
            result.blocked = true;
            result.reasons = validation.errors;
            return result;
        }

        // 敏感词检查
        const sensitiveCheck = this.checkSensitiveWords(comment.content);
        if (sensitiveCheck.hasSensitiveWords) {
            if (sensitiveCheck.severity === 'critical') {
                result.blocked = true;
                result.reasons.push(`包含严重敏感词: ${sensitiveCheck.words.join(', ')}`);
                return result;
            } else {
                result.needsReview = true;
                result.reasons.push(`包含敏感词: ${sensitiveCheck.words.join(', ')}`);
            }
        }

        // 垃圾评论检测
        const spamCheck = this.detectSpam(comment.content, user);
        result.score = spamCheck.score;
        
        if (spamCheck.isSpam) {
            if (spamCheck.confidence === 'very_high') {
                result.blocked = true;
                result.reasons.push(`垃圾评论 (${spamCheck.score}分): ${spamCheck.reasons.join(', ')}`);
                return result;
            } else {
                result.needsReview = true;
                result.reasons.push(`疑似垃圾评论 (${spamCheck.score}分): ${spamCheck.reasons.join(', ')}`);
            }
        }

        // 频率检查
        if (this.isCommentingTooFast(user.id)) {
            result.blocked = true;
            result.reasons.push('评论过于频繁，请稍后再试');
            return result;
        }

        // 新用户检查
        if (user.isNew && this.autoModerationRules.requireApprovalForNewUsers) {
            result.needsReview = true;
            result.reasons.push('新用户评论需要审核');
        }

        // 用户信誉检查
        const reputation = this.getUserReputation(user.id);
        if (reputation < 30) {
            result.needsReview = true;
            result.reasons.push(`用户信誉较低 (${reputation}分)`);
        }

        // 如果没有需要审核的原因，则自动通过
        if (!result.needsReview && !result.blocked) {
            result.approved = true;
        }

        return result;
    }

    /**
     * 验证评论基本格式
     * @param {object} comment - 评论对象
     * @returns {object} 验证结果
     */
    validateComment(comment) {
        const result = {
            isValid: true,
            errors: []
        };

        // 检查必填字段
        if (!comment.content) {
            result.isValid = false;
            result.errors.push('评论内容不能为空');
        }

        if (!comment.author) {
            result.isValid = false;
            result.errors.push('评论作者不能为空');
        }

        // 长度检查
        if (comment.content && comment.content.length < this.autoModerationRules.minLength) {
            result.isValid = false;
            result.errors.push(`评论内容太短，至少需要${this.autoModerationRules.minLength}个字符`);
        }

        if (comment.content && comment.content.length > this.autoModerationRules.maxLength) {
            result.isValid = false;
            result.errors.push(`评论内容太长，最多${this.autoModerationRules.maxLength}个字符`);
        }

        // XSS检查
        if (comment.content && !securityUtils.isXSSFree(comment.content)) {
            result.isValid = false;
            result.errors.push('评论内容包含危险脚本');
        }

        // SQL注入检查
        if (comment.content && securityUtils.hasSQLInjection(comment.content)) {
            result.isValid = false;
            result.errors.push('评论内容包含危险SQL代码');
        }

        // 邮箱格式检查
        if (comment.email && !securityUtils.isValidEmail(comment.email)) {
            result.isValid = false;
            result.errors.push('邮箱格式不正确');
        }

        return result;
    }

    // ==================== 审核队列管理 ====================

    /**
     * 添加评论到审核队列
     * @param {object} comment - 评论对象
     * @param {Array} reasons - 需要审核的原因
     */
    addToModerationQueue(comment, reasons = []) {
        const moderationItem = {
            id: comment.id,
            comment: comment,
            reasons: reasons,
            addedAt: Date.now(),
            status: 'pending',
            priority: this.calculateModerationPriority(reasons)
        };

        this.moderationQueue.push(moderationItem);
        
        // 按优先级排序
        this.moderationQueue.sort((a, b) => b.priority - a.priority);
    }

    /**
     * 计算审核优先级
     * @param {Array} reasons - 审核原因
     * @returns {number} 优先级分数
     */
    calculateModerationPriority(reasons) {
        let priority = 0;
        
        for (const reason of reasons) {
            if (reason.includes('敏感词')) priority += 50;
            if (reason.includes('垃圾评论')) priority += 30;
            if (reason.includes('信誉较低')) priority += 20;
            if (reason.includes('新用户')) priority += 10;
        }
        
        return priority;
    }

    /**
     * 获取审核队列
     * @param {number} limit - 限制数量
     * @returns {Array} 审核队列
     */
    getModerationQueue(limit = 50) {
        return this.moderationQueue.slice(0, limit);
    }

    /**
     * 处理审核结果
     * @param {string} commentId - 评论ID
     * @param {string} action - 处理动作 (approve/reject)
     * @param {string} moderatorId - 审核员ID
     */
    processModerationResult(commentId, action, moderatorId) {
        const index = this.moderationQueue.findIndex(item => item.id === commentId);
        
        if (index !== -1) {
            const item = this.moderationQueue[index];
            item.status = action;
            item.moderatedBy = moderatorId;
            item.moderatedAt = Date.now();
            
            // 从队列中移除
            this.moderationQueue.splice(index, 1);
            
            // 更新用户信誉
            if (item.comment.userId) {
                const change = action === 'approve' ? 2 : -5;
                this.updateUserReputation(item.comment.userId, change, `评论${action === 'approve' ? '通过' : '被拒绝'}审核`);
            }
        }
    }

    // ==================== 工具方法 ====================

    /**
     * 清理评论内容
     * @param {string} content - 原始内容
     * @returns {string} 清理后的内容
     */
    sanitizeComment(content) {
        if (!content) return '';
        
        // HTML转义
        let sanitized = securityUtils.escapeHtml(content);
        
        // 移除多余空白
        sanitized = sanitized.trim().replace(/\s+/g, ' ');
        
        // 限制长度
        if (sanitized.length > this.autoModerationRules.maxLength) {
            sanitized = sanitized.substring(0, this.autoModerationRules.maxLength) + '...';
        }
        
        return sanitized;
    }

    /**
     * 获取评论统计信息
     * @returns {object} 统计信息
     */
    getStats() {
        return {
            moderationQueue: this.moderationQueue.length,
            totalUsers: this.userReputation.size,
            averageReputation: this.calculateAverageReputation(),
            activeUsers: this.commentLimits.size
        };
    }

    /**
     * 计算平均信誉分数
     * @returns {number} 平均分数
     */
    calculateAverageReputation() {
        if (this.userReputation.size === 0) return 50;
        
        let total = 0;
        for (const reputation of this.userReputation.values()) {
            total += reputation.score;
        }
        
        return Math.round(total / this.userReputation.size);
    }

    /**
     * 重置用户限制（用于测试）
     */
    resetLimits() {
        this.commentLimits.clear();
    }

    /**
     * 更新敏感词库
     * @param {Array} words - 新的敏感词列表
     */
    updateSensitiveWords(words) {
        this.sensitiveWords = [...new Set([...this.sensitiveWords, ...words])];
    }
}

// 导出单例
const commentSecurity = new CommentSecurity();

// Node.js环境
if (typeof module !== 'undefined' && module.exports) {
    module.exports = commentSecurity;
}

// 浏览器环境
if (typeof window !== 'undefined') {
    window.CommentSecurity = commentSecurity;
} 