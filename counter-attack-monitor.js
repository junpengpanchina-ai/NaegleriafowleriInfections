/**
 * 反攻击监控系统
 * 包含攻击者追踪、行为分析、证据收集和反制措施
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

class CounterAttackMonitor {
    constructor() {
        this.attackersDB = new Map(); // 攻击者数据库
        this.honeypots = new Map(); // 蜜罐陷阱
        this.evidenceDB = new Map(); // 证据数据库
        this.counterMeasures = new Map(); // 反制措施
        
        // 攻击检测配置
        this.attackPatterns = {
            // XSS攻击模式
            xss: [
                /<script[^>]*>.*?<\/script>/gi,
                /javascript:/gi,
                /on\w+\s*=\s*["'][^"']*["']/gi,
                /<iframe[^>]*src\s*=\s*["'][^"']*["']/gi,
                /eval\s*\(/gi,
                /document\.cookie/gi
            ],
            
            // SQL注入模式
            sqlInjection: [
                /(union|select|insert|update|delete|drop|create|alter)\s+/gi,
                /(\s|^)(or|and)\s+\d+\s*=\s*\d+/gi,
                /['";]\s*(or|and)\s+['"]?\w+['"]?\s*=/gi,
                /\b(exec|execute|sp_)\w+/gi,
                /--\s*$/gm,
                /\/\*.*?\*\//gs
            ],
            
            // 目录遍历攻击
            pathTraversal: [
                /\.\.[\/\\]/g,
                /\.\.%2f/gi,
                /\.\.%5c/gi,
                /%2e%2e%2f/gi,
                /%2e%2e%5c/gi,
                /\.\.\/.*\/etc\/passwd/gi
            ],
            
            // 命令注入
            commandInjection: [
                /[;&|`$(){}[\]]/g,
                /\b(cat|ls|pwd|whoami|id|uname|wget|curl|nc|netcat)\b/gi,
                /\b(rm|mv|cp|chmod|chown)\s+/gi,
                /\|\s*(nc|netcat|bash|sh|cmd)/gi
            ],
            
            // 暴力破解
            bruteForce: {
                maxAttempts: 5,
                timeWindow: 300000, // 5分钟
                suspiciousUserAgents: [
                    /hydra/gi,
                    /nmap/gi,
                    /sqlmap/gi,
                    /nikto/gi,
                    /burp/gi,
                    /zap/gi
                ]
            },
            
            // 扫描行为
            scanning: {
                rapidRequests: 50, // 1分钟内超过50个请求
                suspiciousPaths: [
                    '/admin', '/wp-admin', '/phpmyadmin',
                    '/.env', '/config', '/backup',
                    '/test', '/debug', '/api/v1',
                    '/robots.txt', '/sitemap.xml'
                ]
            }
        };
        
        // 地理位置API配置
        this.geoAPI = {
            enabled: true,
            provider: 'ip-api.com',
            cache: new Map(),
            cacheTimeout: 24 * 60 * 60 * 1000 // 24小时
        };
        
        // 反制措施配置
        this.counterMeasuresConfig = {
            autoBlock: true,
            blockDuration: 24 * 60 * 60 * 1000, // 24小时
            honeypotRedirect: true,
            evidenceCollection: true,
            alertNotification: true,
            legalNotification: true
        };
        
        this.init();
    }

    // ==================== 初始化 ====================

    init() {
        this.createDirectories();
        this.setupHoneypots();
        this.loadAttackersDB();
        this.startPeriodicTasks();
        console.log('🕵️  反攻击监控系统已启动');
    }

    createDirectories() {
        const dirs = ['./security/attackers', './security/evidence', './security/honeypots'];
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
            }
        });
    }

    setupHoneypots() {
        // 设置蜜罐陷阱
        const honeypotPaths = [
            '/admin/login.php',
            '/wp-admin/admin.php',
            '/phpmyadmin/index.php',
            '/.env',
            '/config.php',
            '/backup.sql',
            '/test.php',
            '/debug.log'
        ];
        
        honeypotPaths.forEach(path => {
            this.honeypots.set(path, {
                path: path,
                hits: 0,
                lastHit: null,
                visitors: new Set()
            });
        });
    }

    loadAttackersDB() {
        const dbFile = './security/attackers/attackers.json';
        if (fs.existsSync(dbFile)) {
            try {
                const data = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
                this.attackersDB = new Map(Object.entries(data));
                console.log(`📋 已加载 ${this.attackersDB.size} 个攻击者记录`);
            } catch (error) {
                console.error('加载攻击者数据库失败:', error);
            }
        }
    }

    startPeriodicTasks() {
        // 每小时保存攻击者数据库
        setInterval(() => {
            this.saveAttackersDB();
        }, 60 * 60 * 1000);
        
        // 每天清理过期数据
        setInterval(() => {
            this.cleanupExpiredData();
        }, 24 * 60 * 60 * 1000);
        
        // 每6小时生成攻击报告
        setInterval(() => {
            this.generateAttackReport();
        }, 6 * 60 * 60 * 1000);
    }

    // ==================== 攻击检测 ====================

    /**
     * 检测和记录攻击
     * @param {object} request - 请求对象
     * @param {string} attackType - 攻击类型
     * @param {object} evidence - 攻击证据
     */
    detectAndRecordAttack(request, attackType, evidence) {
        const attackerIP = this.getClientIP(request);
        const timestamp = Date.now();
        
        // 记录攻击者信息
        this.recordAttacker(attackerIP, request, attackType, evidence);
        
        // 收集证据
        this.collectEvidence(attackerIP, request, attackType, evidence);
        
        // 获取地理位置信息
        this.getGeoLocation(attackerIP);
        
        // 执行反制措施
        this.executeCounterMeasures(attackerIP, attackType, evidence);
        
        // 发送告警
        this.sendAttackAlert(attackerIP, attackType, evidence);
        
        console.log(`🚨 检测到攻击: ${attackType} 来自 ${attackerIP}`);
    }

    /**
     * 记录攻击者信息
     * @param {string} ip - 攻击者IP
     * @param {object} request - 请求对象
     * @param {string} attackType - 攻击类型
     * @param {object} evidence - 攻击证据
     */
    recordAttacker(ip, request, attackType, evidence) {
        if (!this.attackersDB.has(ip)) {
            this.attackersDB.set(ip, {
                ip: ip,
                firstSeen: Date.now(),
                lastSeen: Date.now(),
                attackCount: 0,
                attackTypes: new Set(),
                userAgents: new Set(),
                requestedPaths: new Set(),
                geoLocation: null,
                threatLevel: 'LOW',
                isBlocked: false,
                blockExpiry: null,
                evidence: [],
                honeypotHits: 0,
                fingerprint: null
            });
        }
        
        const attacker = this.attackersDB.get(ip);
        attacker.lastSeen = Date.now();
        attacker.attackCount++;
        attacker.attackTypes.add(attackType);
        attacker.userAgents.add(request.headers['user-agent'] || 'Unknown');
        attacker.requestedPaths.add(request.url);
        
        // 生成攻击者指纹
        attacker.fingerprint = this.generateAttackerFingerprint(request);
        
        // 更新威胁等级
        attacker.threatLevel = this.calculateThreatLevel(attacker);
        
        // 记录攻击证据
        attacker.evidence.push({
            timestamp: Date.now(),
            attackType: attackType,
            evidence: evidence,
            request: {
                method: request.method,
                url: request.url,
                headers: request.headers,
                body: request.body ? request.body.substring(0, 1000) : null
            }
        });
        
        // 限制证据数量
        if (attacker.evidence.length > 100) {
            attacker.evidence = attacker.evidence.slice(-100);
        }
    }

    /**
     * 生成攻击者指纹
     * @param {object} request - 请求对象
     * @returns {string} 攻击者指纹
     */
    generateAttackerFingerprint(request) {
        const fingerprint = {
            userAgent: request.headers['user-agent'] || '',
            acceptLanguage: request.headers['accept-language'] || '',
            acceptEncoding: request.headers['accept-encoding'] || '',
            connection: request.headers['connection'] || '',
            dnt: request.headers['dnt'] || '',
            upgradeInsecureRequests: request.headers['upgrade-insecure-requests'] || ''
        };
        
        const fingerprintString = JSON.stringify(fingerprint);
        return crypto.createHash('sha256').update(fingerprintString).digest('hex');
    }

    /**
     * 计算威胁等级
     * @param {object} attacker - 攻击者信息
     * @returns {string} 威胁等级
     */
    calculateThreatLevel(attacker) {
        let score = 0;
        
        // 攻击次数权重
        score += Math.min(attacker.attackCount * 2, 50);
        
        // 攻击类型权重
        const typeWeights = {
            'sql_injection': 20,
            'xss_attack': 15,
            'command_injection': 25,
            'path_traversal': 15,
            'brute_force': 10,
            'scanning': 5
        };
        
        attacker.attackTypes.forEach(type => {
            score += typeWeights[type] || 5;
        });
        
        // 蜜罐命中权重
        score += attacker.honeypotHits * 10;
        
        // 时间窗口内的活动频率
        const timeWindow = 24 * 60 * 60 * 1000; // 24小时
        const recentActivity = Date.now() - attacker.firstSeen < timeWindow;
        if (recentActivity && attacker.attackCount > 10) {
            score += 20;
        }
        
        // 确定威胁等级
        if (score >= 80) return 'CRITICAL';
        if (score >= 60) return 'HIGH';
        if (score >= 40) return 'MEDIUM';
        return 'LOW';
    }

    // ==================== 证据收集 ====================

    /**
     * 收集攻击证据
     * @param {string} ip - 攻击者IP
     * @param {object} request - 请求对象
     * @param {string} attackType - 攻击类型
     * @param {object} evidence - 攻击证据
     */
    collectEvidence(ip, request, attackType, evidence) {
        const evidenceId = `${ip}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const evidenceData = {
            id: evidenceId,
            timestamp: new Date().toISOString(),
            attackerIP: ip,
            attackType: attackType,
            severity: this.getAttackSeverity(attackType),
            request: {
                method: request.method,
                url: request.url,
                headers: { ...request.headers },
                body: request.body || null,
                query: request.query || null
            },
            evidence: evidence,
            geoLocation: null,
            forensics: {
                userAgent: request.headers['user-agent'],
                referer: request.headers['referer'],
                xForwardedFor: request.headers['x-forwarded-for'],
                xRealIp: request.headers['x-real-ip'],
                fingerprint: this.generateAttackerFingerprint(request)
            },
            response: {
                blocked: true,
                action: 'BLOCKED_AND_LOGGED',
                timestamp: Date.now()
            }
        };
        
        // 保存证据到数据库
        this.evidenceDB.set(evidenceId, evidenceData);
        
        // 保存证据到文件
        this.saveEvidenceToFile(evidenceId, evidenceData);
        
        console.log(`📋 证据已收集: ${evidenceId}`);
    }

    /**
     * 保存证据到文件
     * @param {string} evidenceId - 证据ID
     * @param {object} evidenceData - 证据数据
     */
    saveEvidenceToFile(evidenceId, evidenceData) {
        try {
            const date = new Date().toISOString().split('T')[0];
            const evidenceDir = `./security/evidence/${date}`;
            
            if (!fs.existsSync(evidenceDir)) {
                fs.mkdirSync(evidenceDir, { recursive: true, mode: 0o700 });
            }
            
            const evidenceFile = path.join(evidenceDir, `${evidenceId}.json`);
            fs.writeFileSync(evidenceFile, JSON.stringify(evidenceData, null, 2), { mode: 0o600 });
            
            // 创建人类可读的报告
            const reportFile = path.join(evidenceDir, `${evidenceId}_report.txt`);
            const report = this.generateEvidenceReport(evidenceData);
            fs.writeFileSync(reportFile, report, { mode: 0o600 });
            
        } catch (error) {
            console.error('保存证据文件失败:', error);
        }
    }

    /**
     * 生成证据报告
     * @param {object} evidenceData - 证据数据
     * @returns {string} 格式化的报告
     */
    generateEvidenceReport(evidenceData) {
        return `
=== 网络攻击证据报告 ===
报告ID: ${evidenceData.id}
时间: ${evidenceData.timestamp}
攻击者IP: ${evidenceData.attackerIP}
攻击类型: ${evidenceData.attackType}
严重程度: ${evidenceData.severity}

=== 请求详情 ===
方法: ${evidenceData.request.method}
URL: ${evidenceData.request.url}
用户代理: ${evidenceData.forensics.userAgent || 'Unknown'}
来源页面: ${evidenceData.forensics.referer || 'None'}

=== 攻击载荷 ===
${JSON.stringify(evidenceData.evidence, null, 2)}

=== 请求头 ===
${JSON.stringify(evidenceData.request.headers, null, 2)}

=== 数字指纹 ===
${evidenceData.forensics.fingerprint}

=== 响应措施 ===
操作: ${evidenceData.response.action}
状态: ${evidenceData.response.blocked ? '已阻止' : '未阻止'}

=== 法律声明 ===
此报告记录了对本系统的未授权访问尝试。
根据相关法律法规，此行为可能构成违法犯罪。
本报告可作为法律诉讼的证据使用。

报告生成时间: ${new Date().toISOString()}
        `.trim();
    }

    // ==================== 地理位置追踪 ====================

    /**
     * 获取IP地理位置信息
     * @param {string} ip - IP地址
     */
    async getGeoLocation(ip) {
        if (!this.geoAPI.enabled || this.isPrivateIP(ip)) {
            return null;
        }
        
        // 检查缓存
        const cached = this.geoAPI.cache.get(ip);
        if (cached && Date.now() - cached.timestamp < this.geoAPI.cacheTimeout) {
            return cached.data;
        }
        
        try {
            const response = await this.fetchGeoData(ip);
            const geoData = {
                ip: ip,
                country: response.country || 'Unknown',
                countryCode: response.countryCode || 'Unknown',
                region: response.regionName || 'Unknown',
                city: response.city || 'Unknown',
                lat: response.lat || 0,
                lon: response.lon || 0,
                timezone: response.timezone || 'Unknown',
                isp: response.isp || 'Unknown',
                org: response.org || 'Unknown',
                as: response.as || 'Unknown',
                mobile: response.mobile || false,
                proxy: response.proxy || false,
                hosting: response.hosting || false
            };
            
            // 缓存结果
            this.geoAPI.cache.set(ip, {
                data: geoData,
                timestamp: Date.now()
            });
            
            // 更新攻击者信息
            if (this.attackersDB.has(ip)) {
                this.attackersDB.get(ip).geoLocation = geoData;
            }
            
            console.log(`🌍 获取地理位置: ${ip} -> ${geoData.country}, ${geoData.city}`);
            return geoData;
            
        } catch (error) {
            console.error(`获取IP地理位置失败 ${ip}:`, error);
            return null;
        }
    }

    /**
     * 获取地理位置数据
     * @param {string} ip - IP地址
     * @returns {Promise<object>} 地理位置数据
     */
    fetchGeoData(ip) {
        return new Promise((resolve, reject) => {
            const url = `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp,org,as,mobile,proxy,hosting`;
            
            https.get(url, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (response.status === 'success') {
                            resolve(response);
                        } else {
                            reject(new Error(response.message || 'API request failed'));
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            }).on('error', reject);
        });
    }

    /**
     * 检查是否为私有IP
     * @param {string} ip - IP地址
     * @returns {boolean} 是否为私有IP
     */
    isPrivateIP(ip) {
        const privateRanges = [
            /^10\./,
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
            /^192\.168\./,
            /^127\./,
            /^169\.254\./,
            /^::1$/,
            /^fc00:/,
            /^fe80:/
        ];
        
        return privateRanges.some(range => range.test(ip));
    }

    // ==================== 反制措施 ====================

    /**
     * 执行反制措施
     * @param {string} ip - 攻击者IP
     * @param {string} attackType - 攻击类型
     * @param {object} evidence - 攻击证据
     */
    executeCounterMeasures(ip, attackType, evidence) {
        const attacker = this.attackersDB.get(ip);
        if (!attacker) return;
        
        const measures = [];
        
        // 1. 自动封锁IP
        if (this.counterMeasuresConfig.autoBlock && this.shouldBlockIP(attacker)) {
            this.blockIP(ip);
            measures.push('IP_BLOCKED');
        }
        
        // 2. 蜜罐重定向
        if (this.counterMeasuresConfig.honeypotRedirect && this.shouldRedirectToHoneypot(attacker)) {
            this.setupHoneypotRedirect(ip);
            measures.push('HONEYPOT_REDIRECT');
        }
        
        // 3. 限制资源访问
        if (attacker.threatLevel === 'HIGH' || attacker.threatLevel === 'CRITICAL') {
            this.limitResourceAccess(ip);
            measures.push('RESOURCE_LIMITED');
        }
        
        // 4. 增强监控
        this.enhanceMonitoring(ip);
        measures.push('ENHANCED_MONITORING');
        
        // 5. 法律警告
        if (this.counterMeasuresConfig.legalNotification && attacker.attackCount > 5) {
            this.sendLegalWarning(ip);
            measures.push('LEGAL_WARNING');
        }
        
        // 记录反制措施
        this.counterMeasures.set(`${ip}_${Date.now()}`, {
            ip: ip,
            timestamp: Date.now(),
            attackType: attackType,
            measures: measures,
            evidence: evidence
        });
        
        console.log(`⚔️  执行反制措施 ${ip}: ${measures.join(', ')}`);
    }

    /**
     * 判断是否应该封锁IP
     * @param {object} attacker - 攻击者信息
     * @returns {boolean} 是否应该封锁
     */
    shouldBlockIP(attacker) {
        return attacker.attackCount >= 3 || 
               attacker.threatLevel === 'CRITICAL' ||
               attacker.honeypotHits > 0;
    }

    /**
     * 封锁IP地址
     * @param {string} ip - IP地址
     */
    blockIP(ip) {
        const attacker = this.attackersDB.get(ip);
        if (attacker) {
            attacker.isBlocked = true;
            attacker.blockExpiry = Date.now() + this.counterMeasuresConfig.blockDuration;
            
            // 这里可以集成到防火墙或负载均衡器
            // 示例：添加到iptables规则
            // exec(`iptables -A INPUT -s ${ip} -j DROP`);
            
            console.log(`🚫 IP已封锁: ${ip} (${this.counterMeasuresConfig.blockDuration / 1000 / 60 / 60}小时)`);
        }
    }

    /**
     * 判断是否应该重定向到蜜罐
     * @param {object} attacker - 攻击者信息
     * @returns {boolean} 是否应该重定向
     */
    shouldRedirectToHoneypot(attacker) {
        return attacker.attackCount >= 2 && attacker.threatLevel !== 'LOW';
    }

    /**
     * 设置蜜罐重定向
     * @param {string} ip - IP地址
     */
    setupHoneypotRedirect(ip) {
        // 为特定IP设置蜜罐重定向规则
        console.log(`🍯 设置蜜罐重定向: ${ip}`);
    }

    /**
     * 限制资源访问
     * @param {string} ip - IP地址
     */
    limitResourceAccess(ip) {
        // 限制高危IP的资源访问
        console.log(`⛔ 限制资源访问: ${ip}`);
    }

    /**
     * 增强监控
     * @param {string} ip - IP地址
     */
    enhanceMonitoring(ip) {
        // 对特定IP进行增强监控
        console.log(`🔍 增强监控: ${ip}`);
    }

    /**
     * 发送法律警告
     * @param {string} ip - IP地址
     */
    sendLegalWarning(ip) {
        const warning = `
⚠️  法律警告 ⚠️

IP地址: ${ip}
时间: ${new Date().toISOString()}

您的行为已被检测为对本系统的未授权访问尝试。
根据《网络安全法》等相关法律法规，此行为可能构成违法犯罪。

我们已记录您的所有活动，包括但不限于：
- IP地址和地理位置
- 攻击类型和载荷
- 时间戳和访问模式
- 数字指纹信息

请立即停止此类行为，否则我们将：
1. 向相关执法部门报告
2. 启动法律诉讼程序
3. 要求ISP配合调查
4. 公开披露攻击行为

本警告已记录并可作为法律证据使用。
        `;
        
        console.log(`⚖️  发送法律警告: ${ip}`);
        // 这里可以通过邮件、短信等方式发送警告
    }

    // ==================== 蜜罐管理 ====================

    /**
     * 检查蜜罐访问
     * @param {string} path - 访问路径
     * @param {string} ip - 访问者IP
     * @returns {boolean} 是否为蜜罐路径
     */
    checkHoneypotAccess(path, ip) {
        if (this.honeypots.has(path)) {
            const honeypot = this.honeypots.get(path);
            honeypot.hits++;
            honeypot.lastHit = Date.now();
            honeypot.visitors.add(ip);
            
            // 更新攻击者蜜罐命中次数
            if (this.attackersDB.has(ip)) {
                this.attackersDB.get(ip).honeypotHits++;
            }
            
            console.log(`🍯 蜜罐命中: ${path} <- ${ip}`);
            return true;
        }
        return false;
    }

    /**
     * 生成蜜罐响应
     * @param {string} path - 蜜罐路径
     * @returns {object} 蜜罐响应
     */
    generateHoneypotResponse(path) {
        const responses = {
            '/admin/login.php': `
                <!DOCTYPE html>
                <html><head><title>Admin Login</title></head>
                <body>
                <h1>Administrator Login</h1>
                <form method="post">
                    <input type="text" name="username" placeholder="Username">
                    <input type="password" name="password" placeholder="Password">
                    <button type="submit">Login</button>
                </form>
                </body></html>
            `,
            '/.env': `
                DB_HOST=localhost
                DB_DATABASE=production_db
                DB_USERNAME=admin
                DB_PASSWORD=super_secret_password_123
                APP_KEY=base64:fake_key_for_honeypot
                JWT_SECRET=fake_jwt_secret
            `,
            '/backup.sql': `
                -- MySQL dump (fake)
                -- Host: localhost    Database: production
                CREATE TABLE users (
                    id int PRIMARY KEY,
                    username varchar(50),
                    password varchar(255),
                    email varchar(100)
                );
                INSERT INTO users VALUES (1, 'admin', 'md5_fake_hash', 'admin@example.com');
            `
        };
        
        return responses[path] || '<html><body><h1>Access Denied</h1></body></html>';
    }

    // ==================== 报告生成 ====================

    /**
     * 生成攻击报告
     */
    generateAttackReport() {
        const now = Date.now();
        const report = {
            timestamp: new Date().toISOString(),
            period: '6小时报告',
            summary: {
                totalAttackers: this.attackersDB.size,
                activeAttackers: 0,
                totalAttacks: 0,
                blockedIPs: 0,
                honeypotHits: 0,
                evidenceCollected: this.evidenceDB.size
            },
            attackTypes: {},
            topAttackers: [],
            geoDistribution: {},
            threatLevels: {
                CRITICAL: 0,
                HIGH: 0,
                MEDIUM: 0,
                LOW: 0
            }
        };
        
        // 统计数据
        for (const [ip, attacker] of this.attackersDB.entries()) {
            report.summary.totalAttacks += attacker.attackCount;
            
            if (attacker.isBlocked) {
                report.summary.blockedIPs++;
            }
            
            if (now - attacker.lastSeen < 6 * 60 * 60 * 1000) { // 6小时内活跃
                report.summary.activeAttackers++;
            }
            
            report.summary.honeypotHits += attacker.honeypotHits;
            report.threatLevels[attacker.threatLevel]++;
            
            // 攻击类型统计
            attacker.attackTypes.forEach(type => {
                report.attackTypes[type] = (report.attackTypes[type] || 0) + 1;
            });
            
            // 地理分布统计
            if (attacker.geoLocation) {
                const country = attacker.geoLocation.country;
                report.geoDistribution[country] = (report.geoDistribution[country] || 0) + 1;
            }
            
            // Top攻击者
            report.topAttackers.push({
                ip: ip,
                attackCount: attacker.attackCount,
                threatLevel: attacker.threatLevel,
                country: attacker.geoLocation ? attacker.geoLocation.country : 'Unknown'
            });
        }
        
        // 排序Top攻击者
        report.topAttackers.sort((a, b) => b.attackCount - a.attackCount);
        report.topAttackers = report.topAttackers.slice(0, 10);
        
        // 保存报告
        this.saveAttackReport(report);
        
        console.log(`📊 攻击报告已生成: ${report.summary.totalAttackers}个攻击者, ${report.summary.totalAttacks}次攻击`);
    }

    /**
     * 保存攻击报告
     * @param {object} report - 报告数据
     */
    saveAttackReport(report) {
        try {
            const date = new Date().toISOString().split('T')[0];
            const time = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
            const reportFile = `./security/reports/attack-report-${date}-${time}.json`;
            
            const reportDir = path.dirname(reportFile);
            if (!fs.existsSync(reportDir)) {
                fs.mkdirSync(reportDir, { recursive: true, mode: 0o700 });
            }
            
            fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), { mode: 0o600 });
            
            // 生成人类可读的报告
            const readableReport = this.generateReadableReport(report);
            const txtReportFile = reportFile.replace('.json', '.txt');
            fs.writeFileSync(txtReportFile, readableReport, { mode: 0o600 });
            
        } catch (error) {
            console.error('保存攻击报告失败:', error);
        }
    }

    /**
     * 生成可读报告
     * @param {object} report - 报告数据
     * @returns {string} 可读报告
     */
    generateReadableReport(report) {
        return `
=== 网络攻击监控报告 ===
生成时间: ${report.timestamp}
报告周期: ${report.period}

=== 攻击概况 ===
总攻击者数量: ${report.summary.totalAttackers}
活跃攻击者: ${report.summary.activeAttackers}
总攻击次数: ${report.summary.totalAttacks}
已封锁IP: ${report.summary.blockedIPs}
蜜罐命中: ${report.summary.honeypotHits}
收集证据: ${report.summary.evidenceCollected}

=== 威胁等级分布 ===
严重威胁: ${report.threatLevels.CRITICAL}
高危威胁: ${report.threatLevels.HIGH}
中等威胁: ${report.threatLevels.MEDIUM}
低级威胁: ${report.threatLevels.LOW}

=== 攻击类型统计 ===
${Object.entries(report.attackTypes).map(([type, count]) => `${type}: ${count}次`).join('\n')}

=== Top 10 攻击者 ===
${report.topAttackers.map((attacker, index) => 
    `${index + 1}. ${attacker.ip} (${attacker.country}) - ${attacker.attackCount}次攻击 [${attacker.threatLevel}]`
).join('\n')}

=== 地理分布 ===
${Object.entries(report.geoDistribution).map(([country, count]) => `${country}: ${count}个攻击者`).join('\n')}

=== 建议措施 ===
${this.generateRecommendations(report)}
        `.trim();
    }

    /**
     * 生成安全建议
     * @param {object} report - 报告数据
     * @returns {string} 安全建议
     */
    generateRecommendations(report) {
        const recommendations = [];
        
        if (report.threatLevels.CRITICAL > 0) {
            recommendations.push('- 立即审查严重威胁IP，考虑永久封锁');
        }
        
        if (report.summary.honeypotHits > 10) {
            recommendations.push('- 蜜罐命中频繁，建议增加更多蜜罐陷阱');
        }
        
        if (report.summary.activeAttackers > 20) {
            recommendations.push('- 活跃攻击者较多，建议加强防护措施');
        }
        
        const topAttackType = Object.entries(report.attackTypes).sort((a, b) => b[1] - a[1])[0];
        if (topAttackType) {
            recommendations.push(`- 主要攻击类型为${topAttackType[0]}，建议针对性加强防护`);
        }
        
        if (recommendations.length === 0) {
            recommendations.push('- 当前安全状况良好，继续保持监控');
        }
        
        return recommendations.join('\n');
    }

    // ==================== 工具方法 ====================

    /**
     * 获取客户端IP
     * @param {object} request - 请求对象
     * @returns {string} 客户端IP
     */
    getClientIP(request) {
        return request.headers['x-forwarded-for'] ||
               request.headers['x-real-ip'] ||
               request.connection.remoteAddress ||
               request.socket.remoteAddress ||
               '127.0.0.1';
    }

    /**
     * 获取攻击严重程度
     * @param {string} attackType - 攻击类型
     * @returns {string} 严重程度
     */
    getAttackSeverity(attackType) {
        const severityMap = {
            'sql_injection': 'CRITICAL',
            'command_injection': 'CRITICAL',
            'xss_attack': 'HIGH',
            'path_traversal': 'HIGH',
            'brute_force': 'MEDIUM',
            'scanning': 'LOW'
        };
        
        return severityMap[attackType] || 'MEDIUM';
    }

    /**
     * 发送攻击告警
     * @param {string} ip - 攻击者IP
     * @param {string} attackType - 攻击类型
     * @param {object} evidence - 攻击证据
     */
    sendAttackAlert(ip, attackType, evidence) {
        const alert = {
            timestamp: new Date().toISOString(),
            type: 'ATTACK_DETECTED',
            severity: this.getAttackSeverity(attackType),
            attackerIP: ip,
            attackType: attackType,
            evidence: evidence,
            message: `检测到${attackType}攻击，来源IP: ${ip}`
        };
        
        console.log(`🚨 攻击告警: ${alert.message}`);
        
        // 这里可以集成邮件、短信、Slack等告警系统
        // this.sendEmailAlert(alert);
        // this.sendSlackAlert(alert);
    }

    /**
     * 保存攻击者数据库
     */
    saveAttackersDB() {
        try {
            const dbFile = './security/attackers/attackers.json';
            const data = {};
            
            for (const [ip, attacker] of this.attackersDB.entries()) {
                data[ip] = {
                    ...attacker,
                    attackTypes: Array.from(attacker.attackTypes),
                    userAgents: Array.from(attacker.userAgents),
                    requestedPaths: Array.from(attacker.requestedPaths)
                };
            }
            
            fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), { mode: 0o600 });
            console.log(`💾 攻击者数据库已保存: ${Object.keys(data).length}条记录`);
            
        } catch (error) {
            console.error('保存攻击者数据库失败:', error);
        }
    }

    /**
     * 清理过期数据
     */
    cleanupExpiredData() {
        const now = Date.now();
        const expiryTime = 30 * 24 * 60 * 60 * 1000; // 30天
        
        // 清理过期的攻击者记录
        for (const [ip, attacker] of this.attackersDB.entries()) {
            if (now - attacker.lastSeen > expiryTime) {
                this.attackersDB.delete(ip);
            }
        }
        
        // 清理过期的证据
        for (const [id, evidence] of this.evidenceDB.entries()) {
            if (now - new Date(evidence.timestamp).getTime() > expiryTime) {
                this.evidenceDB.delete(id);
            }
        }
        
        // 清理过期的反制措施记录
        for (const [id, measure] of this.counterMeasures.entries()) {
            if (now - measure.timestamp > expiryTime) {
                this.counterMeasures.delete(id);
            }
        }
        
        console.log('🧹 过期数据清理完成');
    }

    // ==================== API接口 ====================

    /**
     * 获取攻击者信息
     * @param {string} ip - IP地址
     * @returns {object} 攻击者信息
     */
    getAttackerInfo(ip) {
        const attacker = this.attackersDB.get(ip);
        if (!attacker) return null;
        
        return {
            ...attacker,
            attackTypes: Array.from(attacker.attackTypes),
            userAgents: Array.from(attacker.userAgents),
            requestedPaths: Array.from(attacker.requestedPaths)
        };
    }

    /**
     * 获取所有攻击者列表
     * @returns {Array} 攻击者列表
     */
    getAllAttackers() {
        const attackers = [];
        for (const [ip, attacker] of this.attackersDB.entries()) {
            attackers.push({
                ip: ip,
                ...attacker,
                attackTypes: Array.from(attacker.attackTypes),
                userAgents: Array.from(attacker.userAgents),
                requestedPaths: Array.from(attacker.requestedPaths)
            });
        }
        return attackers.sort((a, b) => b.lastSeen - a.lastSeen);
    }

    /**
     * 获取统计信息
     * @returns {object} 统计信息
     */
    getStatistics() {
        const stats = {
            totalAttackers: this.attackersDB.size,
            totalEvidence: this.evidenceDB.size,
            totalCounterMeasures: this.counterMeasures.size,
            honeypotHits: 0,
            blockedIPs: 0,
            threatLevels: {
                CRITICAL: 0,
                HIGH: 0,
                MEDIUM: 0,
                LOW: 0
            }
        };
        
        for (const attacker of this.attackersDB.values()) {
            stats.honeypotHits += attacker.honeypotHits;
            if (attacker.isBlocked) stats.blockedIPs++;
            stats.threatLevels[attacker.threatLevel]++;
        }
        
        return stats;
    }
}

// 导出单例
const counterAttackMonitor = new CounterAttackMonitor();

module.exports = counterAttackMonitor; 