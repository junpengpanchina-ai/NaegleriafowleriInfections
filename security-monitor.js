/**
 * 安全监控和日志系统
 * 包含威胁检测、异常行为监控、安全报告等功能
 */

const fs = require('fs');
const path = require('path');

class SecurityMonitor {
    constructor() {
        this.logDir = './logs';
        this.maxLogSize = 10 * 1024 * 1024; // 10MB
        this.maxLogFiles = 5;
        
        // 安全事件统计
        this.eventStats = {
            requests: 0,
            blockedIPs: 0,
            xssAttempts: 0,
            sqlInjectionAttempts: 0,
            csrfAttempts: 0,
            spamComments: 0,
            loginFailures: 0,
            suspiciousActivity: 0
        };
        
        // 实时威胁监控
        this.threatPatterns = new Map();
        this.suspiciousIPs = new Map();
        this.alertThresholds = {
            requestsPerMinute: 100,
            loginFailuresPerHour: 10,
            xssAttemptsPerHour: 5,
            sqlInjectionAttemptsPerHour: 3,
            spamCommentsPerHour: 20
        };
        
        // 初始化日志目录
        this.initLogDirectory();
        
        // 启动监控
        this.startMonitoring();
    }

    // ==================== 日志管理 ====================

    /**
     * 初始化日志目录
     */
    initLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
        
        console.log(`✅ 安全日志目录已初始化: ${this.logDir}`);
    }

    /**
     * 写入安全日志
     * @param {string} level - 日志级别
     * @param {string} event - 事件类型
     * @param {object} data - 事件数据
     */
    log(level, event, data = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            event,
            data,
            pid: process.pid
        };

        // 控制台输出
        const colorMap = {
            INFO: '\x1b[36m',    // 青色
            WARN: '\x1b[33m',    // 黄色
            ERROR: '\x1b[31m',   // 红色
            CRITICAL: '\x1b[35m' // 紫色
        };
        
        const color = colorMap[level] || '\x1b[0m';
        const reset = '\x1b[0m';
        
        console.log(`${color}[${timestamp}] ${level}: ${event}${reset}`, data);

        // 写入文件
        this.writeLogToFile(logEntry);
        
        // 更新统计
        this.updateStats(event, data);
        
        // 威胁检测
        this.detectThreats(event, data);
    }

    /**
     * 写入日志文件
     * @param {object} logEntry - 日志条目
     */
    writeLogToFile(logEntry) {
        const logFileName = `security-${new Date().toISOString().split('T')[0]}.log`;
        const logFilePath = path.join(this.logDir, logFileName);
        
        const logLine = JSON.stringify(logEntry) + '\n';
        
        try {
            // 检查文件大小，如果太大则轮转
            if (fs.existsSync(logFilePath)) {
                const stats = fs.statSync(logFilePath);
                if (stats.size > this.maxLogSize) {
                    this.rotateLogFile(logFilePath);
                }
            }
            
            fs.appendFileSync(logFilePath, logLine);
        } catch (error) {
            console.error('写入安全日志失败:', error);
        }
    }

    /**
     * 轮转日志文件
     * @param {string} logFilePath - 日志文件路径
     */
    rotateLogFile(logFilePath) {
        const dir = path.dirname(logFilePath);
        const basename = path.basename(logFilePath, '.log');
        
        // 轮转现有文件
        for (let i = this.maxLogFiles - 1; i >= 1; i--) {
            const oldFile = path.join(dir, `${basename}.${i}.log`);
            const newFile = path.join(dir, `${basename}.${i + 1}.log`);
            
            if (fs.existsSync(oldFile)) {
                if (i === this.maxLogFiles - 1) {
                    fs.unlinkSync(oldFile); // 删除最老的文件
                } else {
                    fs.renameSync(oldFile, newFile);
                }
            }
        }
        
        // 重命名当前文件
        const rotatedFile = path.join(dir, `${basename}.1.log`);
        fs.renameSync(logFilePath, rotatedFile);
    }

    // ==================== 统计更新 ====================

    /**
     * 更新事件统计
     * @param {string} event - 事件类型
     * @param {object} data - 事件数据
     */
    updateStats(event, data) {
        switch (event) {
            case 'request':
                this.eventStats.requests++;
                break;
            case 'ip_blocked':
                this.eventStats.blockedIPs++;
                break;
            case 'xss_attempt':
                this.eventStats.xssAttempts++;
                break;
            case 'sql_injection':
                this.eventStats.sqlInjectionAttempts++;
                break;
            case 'csrf_attack':
                this.eventStats.csrfAttempts++;
                break;
            case 'comment_blocked':
                if (data.reasons && data.reasons.some(r => r.includes('垃圾评论'))) {
                    this.eventStats.spamComments++;
                }
                break;
            case 'login_failure':
                this.eventStats.loginFailures++;
                break;
            case 'suspicious_activity':
                this.eventStats.suspiciousActivity++;
                break;
        }
    }

    // ==================== 威胁检测 ====================

    /**
     * 检测威胁模式
     * @param {string} event - 事件类型
     * @param {object} data - 事件数据
     */
    detectThreats(event, data) {
        const ip = data.ip;
        if (!ip) return;

        // 记录IP活动
        if (!this.suspiciousIPs.has(ip)) {
            this.suspiciousIPs.set(ip, {
                requests: 0,
                loginFailures: 0,
                xssAttempts: 0,
                sqlInjectionAttempts: 0,
                spamComments: 0,
                firstSeen: Date.now(),
                lastSeen: Date.now(),
                events: []
            });
        }

        const ipData = this.suspiciousIPs.get(ip);
        ipData.lastSeen = Date.now();
        ipData.events.push({ event, timestamp: Date.now(), data });

        // 保持最近100个事件
        if (ipData.events.length > 100) {
            ipData.events = ipData.events.slice(-100);
        }

        // 更新IP统计
        switch (event) {
            case 'request':
                ipData.requests++;
                break;
            case 'login_failure':
                ipData.loginFailures++;
                break;
            case 'xss_attempt':
                ipData.xssAttempts++;
                break;
            case 'sql_injection':
                ipData.sqlInjectionAttempts++;
                break;
            case 'comment_blocked':
                if (data.reasons && data.reasons.some(r => r.includes('垃圾评论'))) {
                    ipData.spamComments++;
                }
                break;
        }

        // 威胁检测
        this.analyzeIPBehavior(ip, ipData);
    }

    /**
     * 分析IP行为模式
     * @param {string} ip - IP地址
     * @param {object} ipData - IP数据
     */
    analyzeIPBehavior(ip, ipData) {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        const oneMinute = 60 * 1000;

        // 获取最近一小时的事件
        const recentEvents = ipData.events.filter(e => now - e.timestamp < oneHour);
        const recentMinuteEvents = ipData.events.filter(e => now - e.timestamp < oneMinute);

        // 检测异常模式
        const threats = [];

        // 1. 请求频率异常
        if (recentMinuteEvents.length > this.alertThresholds.requestsPerMinute) {
            threats.push({
                type: 'high_request_frequency',
                severity: 'HIGH',
                description: `IP ${ip} 在1分钟内发送了 ${recentMinuteEvents.length} 个请求`,
                count: recentMinuteEvents.length
            });
        }

        // 2. 登录失败过多
        const loginFailures = recentEvents.filter(e => e.event === 'login_failure').length;
        if (loginFailures > this.alertThresholds.loginFailuresPerHour) {
            threats.push({
                type: 'brute_force_attack',
                severity: 'CRITICAL',
                description: `IP ${ip} 在1小时内登录失败 ${loginFailures} 次`,
                count: loginFailures
            });
        }

        // 3. XSS攻击尝试
        const xssAttempts = recentEvents.filter(e => e.event === 'xss_attempt').length;
        if (xssAttempts > this.alertThresholds.xssAttemptsPerHour) {
            threats.push({
                type: 'xss_attack',
                severity: 'HIGH',
                description: `IP ${ip} 在1小时内尝试XSS攻击 ${xssAttempts} 次`,
                count: xssAttempts
            });
        }

        // 4. SQL注入攻击尝试
        const sqlAttempts = recentEvents.filter(e => e.event === 'sql_injection').length;
        if (sqlAttempts > this.alertThresholds.sqlInjectionAttemptsPerHour) {
            threats.push({
                type: 'sql_injection_attack',
                severity: 'CRITICAL',
                description: `IP ${ip} 在1小时内尝试SQL注入攻击 ${sqlAttempts} 次`,
                count: sqlAttempts
            });
        }

        // 5. 垃圾评论
        const spamComments = recentEvents.filter(e => 
            e.event === 'comment_blocked' && 
            e.data.reasons && 
            e.data.reasons.some(r => r.includes('垃圾评论'))
        ).length;
        if (spamComments > this.alertThresholds.spamCommentsPerHour) {
            threats.push({
                type: 'spam_attack',
                severity: 'MEDIUM',
                description: `IP ${ip} 在1小时内发送垃圾评论 ${spamComments} 次`,
                count: spamComments
            });
        }

        // 6. 多种攻击类型组合
        const attackTypes = new Set();
        recentEvents.forEach(e => {
            if (['xss_attempt', 'sql_injection', 'csrf_attack'].includes(e.event)) {
                attackTypes.add(e.event);
            }
        });
        if (attackTypes.size >= 2) {
            threats.push({
                type: 'multi_vector_attack',
                severity: 'CRITICAL',
                description: `IP ${ip} 使用多种攻击手段: ${Array.from(attackTypes).join(', ')}`,
                count: attackTypes.size
            });
        }

        // 处理威胁
        if (threats.length > 0) {
            this.handleThreats(ip, threats);
        }
    }

    /**
     * 处理检测到的威胁
     * @param {string} ip - IP地址
     * @param {Array} threats - 威胁列表
     */
    handleThreats(ip, threats) {
        for (const threat of threats) {
            // 记录威胁日志
            this.log('ERROR', 'threat_detected', {
                ip: ip,
                threat: threat,
                timestamp: Date.now()
            });

            // 根据威胁严重程度采取行动
            if (threat.severity === 'CRITICAL') {
                this.blockIP(ip, threat);
            } else if (threat.severity === 'HIGH') {
                this.flagSuspiciousIP(ip, threat);
            }

            // 发送告警（在实际项目中可以发送邮件、短信等）
            this.sendAlert(threat);
        }
    }

    /**
     * 封锁IP地址
     * @param {string} ip - IP地址
     * @param {object} threat - 威胁信息
     */
    blockIP(ip, threat) {
        // 这里应该调用防火墙或安全组件来封锁IP
        this.log('CRITICAL', 'ip_blocked', {
            ip: ip,
            reason: threat.description,
            threat: threat,
            timestamp: Date.now()
        });

        console.log(`🚫 IP ${ip} 已被自动封锁: ${threat.description}`);
    }

    /**
     * 标记可疑IP
     * @param {string} ip - IP地址
     * @param {object} threat - 威胁信息
     */
    flagSuspiciousIP(ip, threat) {
        this.log('WARN', 'suspicious_ip_flagged', {
            ip: ip,
            reason: threat.description,
            threat: threat,
            timestamp: Date.now()
        });

        console.log(`⚠️  IP ${ip} 被标记为可疑: ${threat.description}`);
    }

    /**
     * 发送安全告警
     * @param {object} threat - 威胁信息
     */
    sendAlert(threat) {
        // 在实际项目中，这里可以集成邮件、短信、Slack等告警系统
        console.log(`🚨 安全告警: ${threat.description}`);
        
        // 可以添加邮件通知、webhook等
        // this.sendEmailAlert(threat);
        // this.sendSlackAlert(threat);
    }

    // ==================== 监控和报告 ====================

    /**
     * 启动实时监控
     */
    startMonitoring() {
        // 每分钟清理过期数据
        setInterval(() => {
            this.cleanupExpiredData();
        }, 60 * 1000);

        // 每小时生成安全报告
        setInterval(() => {
            this.generateHourlyReport();
        }, 60 * 60 * 1000);

        // 每天生成详细报告
        setInterval(() => {
            this.generateDailyReport();
        }, 24 * 60 * 60 * 1000);

        console.log('🔍 安全监控系统已启动');
    }

    /**
     * 清理过期数据
     */
    cleanupExpiredData() {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;

        // 清理过期的IP数据
        for (const [ip, data] of this.suspiciousIPs.entries()) {
            if (now - data.lastSeen > oneDay) {
                this.suspiciousIPs.delete(ip);
            } else {
                // 清理过期事件
                data.events = data.events.filter(e => now - e.timestamp < oneDay);
            }
        }
    }

    /**
     * 生成小时报告
     */
    generateHourlyReport() {
        const report = {
            timestamp: new Date().toISOString(),
            period: 'hourly',
            stats: { ...this.eventStats },
            topThreats: this.getTopThreats(),
            suspiciousIPs: this.getSuspiciousIPs()
        };

        this.log('INFO', 'hourly_report', report);
        
        // 重置小时统计
        Object.keys(this.eventStats).forEach(key => {
            this.eventStats[key] = 0;
        });
    }

    /**
     * 生成日报告
     */
    generateDailyReport() {
        const report = {
            timestamp: new Date().toISOString(),
            period: 'daily',
            summary: this.generateSecuritySummary(),
            recommendations: this.generateSecurityRecommendations()
        };

        this.log('INFO', 'daily_report', report);
        
        // 保存到文件
        this.saveDailyReport(report);
    }

    /**
     * 获取主要威胁
     * @returns {Array} 威胁列表
     */
    getTopThreats() {
        const threats = [];
        
        for (const [ip, data] of this.suspiciousIPs.entries()) {
            const score = this.calculateThreatScore(data);
            if (score > 50) {
                threats.push({
                    ip: ip,
                    score: score,
                    events: data.events.length,
                    lastSeen: new Date(data.lastSeen).toISOString()
                });
            }
        }
        
        return threats.sort((a, b) => b.score - a.score).slice(0, 10);
    }

    /**
     * 计算威胁分数
     * @param {object} ipData - IP数据
     * @returns {number} 威胁分数
     */
    calculateThreatScore(ipData) {
        let score = 0;
        
        score += ipData.loginFailures * 10;
        score += ipData.xssAttempts * 15;
        score += ipData.sqlInjectionAttempts * 20;
        score += ipData.spamComments * 5;
        score += Math.min(ipData.requests / 10, 50);
        
        return Math.min(score, 100);
    }

    /**
     * 获取可疑IP列表
     * @returns {Array} 可疑IP列表
     */
    getSuspiciousIPs() {
        const suspicious = [];
        
        for (const [ip, data] of this.suspiciousIPs.entries()) {
            const score = this.calculateThreatScore(data);
            if (score > 30) {
                suspicious.push({
                    ip: ip,
                    score: score,
                    firstSeen: new Date(data.firstSeen).toISOString(),
                    lastSeen: new Date(data.lastSeen).toISOString(),
                    eventCount: data.events.length
                });
            }
        }
        
        return suspicious.sort((a, b) => b.score - a.score);
    }

    /**
     * 生成安全摘要
     * @returns {object} 安全摘要
     */
    generateSecuritySummary() {
        return {
            totalRequests: this.eventStats.requests,
            securityEvents: {
                blockedIPs: this.eventStats.blockedIPs,
                xssAttempts: this.eventStats.xssAttempts,
                sqlInjectionAttempts: this.eventStats.sqlInjectionAttempts,
                csrfAttempts: this.eventStats.csrfAttempts,
                spamComments: this.eventStats.spamComments,
                loginFailures: this.eventStats.loginFailures
            },
            riskLevel: this.calculateRiskLevel(),
            activeSuspiciousIPs: this.suspiciousIPs.size
        };
    }

    /**
     * 计算风险等级
     * @returns {string} 风险等级
     */
    calculateRiskLevel() {
        const totalThreats = this.eventStats.xssAttempts + 
                           this.eventStats.sqlInjectionAttempts + 
                           this.eventStats.csrfAttempts;
        
        if (totalThreats > 50) return 'HIGH';
        if (totalThreats > 20) return 'MEDIUM';
        if (totalThreats > 5) return 'LOW';
        return 'MINIMAL';
    }

    /**
     * 生成安全建议
     * @returns {Array} 建议列表
     */
    generateSecurityRecommendations() {
        const recommendations = [];
        
        if (this.eventStats.loginFailures > 50) {
            recommendations.push('考虑启用账户锁定机制和双因素认证');
        }
        
        if (this.eventStats.xssAttempts > 10) {
            recommendations.push('加强输入验证和输出编码');
        }
        
        if (this.eventStats.sqlInjectionAttempts > 5) {
            recommendations.push('使用参数化查询和输入验证');
        }
        
        if (this.suspiciousIPs.size > 20) {
            recommendations.push('考虑实施更严格的IP封锁策略');
        }
        
        return recommendations;
    }

    /**
     * 保存日报告到文件
     * @param {object} report - 报告数据
     */
    saveDailyReport(report) {
        const reportFileName = `security-report-${new Date().toISOString().split('T')[0]}.json`;
        const reportFilePath = path.join(this.logDir, reportFileName);
        
        try {
            fs.writeFileSync(reportFilePath, JSON.stringify(report, null, 2));
            console.log(`📊 日安全报告已保存: ${reportFilePath}`);
        } catch (error) {
            console.error('保存安全报告失败:', error);
        }
    }

    // ==================== API接口 ====================

    /**
     * 获取实时统计
     * @returns {object} 统计数据
     */
    getRealTimeStats() {
        return {
            stats: { ...this.eventStats },
            suspiciousIPs: this.getSuspiciousIPs().slice(0, 5),
            riskLevel: this.calculateRiskLevel(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 获取威胁详情
     * @param {string} ip - IP地址
     * @returns {object} 威胁详情
     */
    getThreatDetails(ip) {
        const ipData = this.suspiciousIPs.get(ip);
        if (!ipData) return null;
        
        return {
            ip: ip,
            score: this.calculateThreatScore(ipData),
            firstSeen: new Date(ipData.firstSeen).toISOString(),
            lastSeen: new Date(ipData.lastSeen).toISOString(),
            events: ipData.events.slice(-20), // 最近20个事件
            stats: {
                requests: ipData.requests,
                loginFailures: ipData.loginFailures,
                xssAttempts: ipData.xssAttempts,
                sqlInjectionAttempts: ipData.sqlInjectionAttempts,
                spamComments: ipData.spamComments
            }
        };
    }
}

// 导出单例
const securityMonitor = new SecurityMonitor();

module.exports = securityMonitor; 