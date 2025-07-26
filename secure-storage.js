/**
 * 数据加密和安全存储模块
 * 包含敏感数据加密、密钥管理、安全备份等功能
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class SecureStorage {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.keyLength = 32; // 256 bits
        this.ivLength = 16;  // 128 bits
        this.tagLength = 16; // 128 bits
        this.saltLength = 32; // 256 bits
        
        // 密钥存储
        this.masterKey = null;
        this.derivedKeys = new Map();
        
        // 安全配置
        this.config = {
            encryptionEnabled: true,
            backupEnabled: true,
            backupInterval: 24 * 60 * 60 * 1000, // 24小时
            maxBackups: 7,
            compressionEnabled: true
        };
        
        // 初始化
        this.init();
    }

    // ==================== 初始化 ====================

    /**
     * 初始化安全存储
     */
    init() {
        this.loadOrGenerateMasterKey();
        this.setupBackupSystem();
        console.log('🔐 安全存储系统已初始化');
    }

    /**
     * 加载或生成主密钥
     */
    loadOrGenerateMasterKey() {
        const keyFile = './security/master.key';
        const keyDir = path.dirname(keyFile);
        
        // 确保密钥目录存在
        if (!fs.existsSync(keyDir)) {
            fs.mkdirSync(keyDir, { recursive: true, mode: 0o700 });
        }
        
        if (fs.existsSync(keyFile)) {
            // 加载现有密钥
            try {
                const keyData = fs.readFileSync(keyFile);
                this.masterKey = keyData;
                console.log('✅ 主密钥已加载');
            } catch (error) {
                console.error('❌ 加载主密钥失败:', error);
                this.generateMasterKey();
            }
        } else {
            // 生成新密钥
            this.generateMasterKey();
        }
    }

    /**
     * 生成主密钥
     */
    generateMasterKey() {
        this.masterKey = crypto.randomBytes(this.keyLength);
        
        const keyFile = './security/master.key';
        try {
            fs.writeFileSync(keyFile, this.masterKey, { mode: 0o600 });
            console.log('🔑 新主密钥已生成并保存');
        } catch (error) {
            console.error('❌ 保存主密钥失败:', error);
            throw new Error('Failed to save master key');
        }
    }

    /**
     * 设置备份系统
     */
    setupBackupSystem() {
        if (!this.config.backupEnabled) return;
        
        const backupDir = './backups';
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
        }
        
        // 定期备份
        setInterval(() => {
            this.createBackup();
        }, this.config.backupInterval);
        
        console.log('💾 自动备份系统已启用');
    }

    // ==================== 密钥管理 ====================

    /**
     * 派生密钥
     * @param {string} purpose - 密钥用途
     * @param {Buffer} salt - 盐值
     * @returns {Buffer} 派生密钥
     */
    deriveKey(purpose, salt = null) {
        if (!salt) {
            salt = crypto.randomBytes(this.saltLength);
        }
        
        const key = crypto.pbkdf2Sync(
            this.masterKey,
            Buffer.concat([Buffer.from(purpose), salt]),
            100000, // 迭代次数
            this.keyLength,
            'sha256'
        );
        
        return { key, salt };
    }

    /**
     * 获取或创建专用密钥
     * @param {string} purpose - 密钥用途
     * @returns {Buffer} 专用密钥
     */
    getOrCreateKey(purpose) {
        if (this.derivedKeys.has(purpose)) {
            return this.derivedKeys.get(purpose);
        }
        
        const { key, salt } = this.deriveKey(purpose);
        const keyData = { key, salt, purpose, createdAt: Date.now() };
        
        this.derivedKeys.set(purpose, keyData);
        this.saveKeyMetadata();
        
        return keyData;
    }

    /**
     * 保存密钥元数据
     */
    saveKeyMetadata() {
        const metadata = {};
        for (const [purpose, keyData] of this.derivedKeys.entries()) {
            metadata[purpose] = {
                salt: keyData.salt.toString('base64'),
                createdAt: keyData.createdAt
            };
        }
        
        const metadataFile = './security/keys.json';
        try {
            const encryptedMetadata = this.encryptData(JSON.stringify(metadata), 'metadata');
            fs.writeFileSync(metadataFile, JSON.stringify(encryptedMetadata), { mode: 0o600 });
        } catch (error) {
            console.error('保存密钥元数据失败:', error);
        }
    }

    /**
     * 加载密钥元数据
     */
    loadKeyMetadata() {
        const metadataFile = './security/keys.json';
        if (!fs.existsSync(metadataFile)) return;
        
        try {
            const encryptedData = JSON.parse(fs.readFileSync(metadataFile));
            const decryptedData = this.decryptData(encryptedData, 'metadata');
            const metadata = JSON.parse(decryptedData);
            
            for (const [purpose, data] of Object.entries(metadata)) {
                const salt = Buffer.from(data.salt, 'base64');
                const { key } = this.deriveKey(purpose, salt);
                
                this.derivedKeys.set(purpose, {
                    key,
                    salt,
                    purpose,
                    createdAt: data.createdAt
                });
            }
            
            console.log(`✅ 已加载 ${Object.keys(metadata).length} 个派生密钥`);
        } catch (error) {
            console.error('加载密钥元数据失败:', error);
        }
    }

    // ==================== 数据加密 ====================

    /**
     * 加密数据
     * @param {string|Buffer} data - 要加密的数据
     * @param {string} purpose - 加密目的
     * @returns {object} 加密结果
     */
    encryptData(data, purpose = 'general') {
        if (!this.config.encryptionEnabled) {
            return { data: data, encrypted: false };
        }
        
        try {
            const keyData = this.getOrCreateKey(purpose);
            const iv = crypto.randomBytes(this.ivLength);
            const cipher = crypto.createCipher(this.algorithm, keyData.key, { iv });
            
            let encrypted = cipher.update(data, 'utf8');
            encrypted = Buffer.concat([encrypted, cipher.final()]);
            
            const tag = cipher.getAuthTag();
            
            return {
                data: encrypted.toString('base64'),
                iv: iv.toString('base64'),
                tag: tag.toString('base64'),
                salt: keyData.salt.toString('base64'),
                algorithm: this.algorithm,
                purpose: purpose,
                encrypted: true,
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('数据加密失败:', error);
            throw new Error('Encryption failed');
        }
    }

    /**
     * 解密数据
     * @param {object} encryptedData - 加密的数据对象
     * @param {string} purpose - 解密目的
     * @returns {string} 解密后的数据
     */
    decryptData(encryptedData, purpose = 'general') {
        if (!encryptedData.encrypted) {
            return encryptedData.data;
        }
        
        try {
            const salt = Buffer.from(encryptedData.salt, 'base64');
            const { key } = this.deriveKey(purpose, salt);
            
            const iv = Buffer.from(encryptedData.iv, 'base64');
            const tag = Buffer.from(encryptedData.tag, 'base64');
            const encrypted = Buffer.from(encryptedData.data, 'base64');
            
            const decipher = crypto.createDecipher(encryptedData.algorithm, key, { iv });
            decipher.setAuthTag(tag);
            
            let decrypted = decipher.update(encrypted);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            
            return decrypted.toString('utf8');
        } catch (error) {
            console.error('数据解密失败:', error);
            throw new Error('Decryption failed');
        }
    }

    // ==================== 敏感数据处理 ====================

    /**
     * 加密用户密码
     * @param {string} password - 明文密码
     * @param {string} userId - 用户ID
     * @returns {object} 加密结果
     */
    encryptPassword(password, userId) {
        const salt = crypto.randomBytes(32);
        const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256');
        
        return {
            hash: hash.toString('base64'),
            salt: salt.toString('base64'),
            algorithm: 'pbkdf2',
            iterations: 100000,
            keyLength: 64,
            digest: 'sha256',
            userId: userId,
            createdAt: Date.now()
        };
    }

    /**
     * 验证用户密码
     * @param {string} password - 输入的密码
     * @param {object} storedPassword - 存储的密码数据
     * @returns {boolean} 验证结果
     */
    verifyPassword(password, storedPassword) {
        try {
            const salt = Buffer.from(storedPassword.salt, 'base64');
            const hash = crypto.pbkdf2Sync(
                password,
                salt,
                storedPassword.iterations,
                storedPassword.keyLength,
                storedPassword.digest
            );
            
            const storedHash = Buffer.from(storedPassword.hash, 'base64');
            return crypto.timingSafeEqual(hash, storedHash);
        } catch (error) {
            console.error('密码验证失败:', error);
            return false;
        }
    }

    /**
     * 加密个人信息
     * @param {object} personalInfo - 个人信息
     * @param {string} userId - 用户ID
     * @returns {object} 加密结果
     */
    encryptPersonalInfo(personalInfo, userId) {
        const sensitiveFields = ['email', 'phone', 'address', 'idCard'];
        const encrypted = { ...personalInfo };
        
        for (const field of sensitiveFields) {
            if (personalInfo[field]) {
                encrypted[field] = this.encryptData(
                    personalInfo[field],
                    `personal_${field}_${userId}`
                );
            }
        }
        
        return encrypted;
    }

    /**
     * 解密个人信息
     * @param {object} encryptedInfo - 加密的个人信息
     * @param {string} userId - 用户ID
     * @returns {object} 解密结果
     */
    decryptPersonalInfo(encryptedInfo, userId) {
        const sensitiveFields = ['email', 'phone', 'address', 'idCard'];
        const decrypted = { ...encryptedInfo };
        
        for (const field of sensitiveFields) {
            if (encryptedInfo[field] && encryptedInfo[field].encrypted) {
                try {
                    decrypted[field] = this.decryptData(
                        encryptedInfo[field],
                        `personal_${field}_${userId}`
                    );
                } catch (error) {
                    console.error(`解密 ${field} 失败:`, error);
                    decrypted[field] = '[解密失败]';
                }
            }
        }
        
        return decrypted;
    }

    // ==================== 安全存储 ====================

    /**
     * 安全保存数据到文件
     * @param {string} filename - 文件名
     * @param {any} data - 要保存的数据
     * @param {string} purpose - 加密目的
     */
    secureWriteFile(filename, data, purpose = 'file') {
        try {
            const dataString = typeof data === 'string' ? data : JSON.stringify(data);
            const encryptedData = this.encryptData(dataString, purpose);
            
            // 创建临时文件
            const tempFile = filename + '.tmp';
            fs.writeFileSync(tempFile, JSON.stringify(encryptedData), { mode: 0o600 });
            
            // 原子性替换
            fs.renameSync(tempFile, filename);
            
            console.log(`✅ 安全保存文件: ${filename}`);
        } catch (error) {
            console.error(`安全保存文件失败 ${filename}:`, error);
            throw error;
        }
    }

    /**
     * 安全读取文件数据
     * @param {string} filename - 文件名
     * @param {string} purpose - 解密目的
     * @returns {any} 解密后的数据
     */
    secureReadFile(filename, purpose = 'file') {
        try {
            if (!fs.existsSync(filename)) {
                return null;
            }
            
            const encryptedData = JSON.parse(fs.readFileSync(filename));
            const decryptedString = this.decryptData(encryptedData, purpose);
            
            try {
                return JSON.parse(decryptedString);
            } catch {
                return decryptedString;
            }
        } catch (error) {
            console.error(`安全读取文件失败 ${filename}:`, error);
            return null;
        }
    }

    // ==================== 备份和恢复 ====================

    /**
     * 创建安全备份
     */
    createBackup() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupDir = `./backups/backup-${timestamp}`;
            
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
            }
            
            // 备份数据文件
            const dataFiles = ['database.js', 'articles.json', 'users.json'];
            for (const file of dataFiles) {
                if (fs.existsSync(file)) {
                    const data = fs.readFileSync(file);
                    const encryptedData = this.encryptData(data.toString(), 'backup');
                    fs.writeFileSync(
                        path.join(backupDir, file + '.enc'),
                        JSON.stringify(encryptedData),
                        { mode: 0o600 }
                    );
                }
            }
            
            // 备份安全配置
            if (fs.existsSync('./security')) {
                const securityBackupDir = path.join(backupDir, 'security');
                fs.mkdirSync(securityBackupDir, { mode: 0o700 });
                
                const securityFiles = fs.readdirSync('./security');
                for (const file of securityFiles) {
                    if (file !== 'master.key') { // 不备份主密钥
                        fs.copyFileSync(
                            path.join('./security', file),
                            path.join(securityBackupDir, file)
                        );
                    }
                }
            }
            
            // 创建备份清单
            const manifest = {
                timestamp: timestamp,
                files: fs.readdirSync(backupDir),
                version: '1.0',
                encrypted: true
            };
            
            fs.writeFileSync(
                path.join(backupDir, 'manifest.json'),
                JSON.stringify(manifest, null, 2),
                { mode: 0o600 }
            );
            
            console.log(`💾 备份创建成功: ${backupDir}`);
            
            // 清理旧备份
            this.cleanupOldBackups();
            
        } catch (error) {
            console.error('创建备份失败:', error);
        }
    }

    /**
     * 清理旧备份
     */
    cleanupOldBackups() {
        try {
            const backupDir = './backups';
            if (!fs.existsSync(backupDir)) return;
            
            const backups = fs.readdirSync(backupDir)
                .filter(dir => dir.startsWith('backup-'))
                .map(dir => ({
                    name: dir,
                    path: path.join(backupDir, dir),
                    mtime: fs.statSync(path.join(backupDir, dir)).mtime
                }))
                .sort((a, b) => b.mtime - a.mtime);
            
            // 保留最新的N个备份
            const toDelete = backups.slice(this.config.maxBackups);
            
            for (const backup of toDelete) {
                fs.rmSync(backup.path, { recursive: true, force: true });
                console.log(`🗑️  删除旧备份: ${backup.name}`);
            }
            
        } catch (error) {
            console.error('清理旧备份失败:', error);
        }
    }

    /**
     * 恢复备份
     * @param {string} backupPath - 备份路径
     */
    restoreBackup(backupPath) {
        try {
            const manifestPath = path.join(backupPath, 'manifest.json');
            if (!fs.existsSync(manifestPath)) {
                throw new Error('备份清单文件不存在');
            }
            
            const manifest = JSON.parse(fs.readFileSync(manifestPath));
            console.log(`开始恢复备份: ${manifest.timestamp}`);
            
            // 恢复数据文件
            const encFiles = fs.readdirSync(backupPath).filter(f => f.endsWith('.enc'));
            
            for (const encFile of encFiles) {
                const originalFile = encFile.replace('.enc', '');
                const encryptedData = JSON.parse(fs.readFileSync(path.join(backupPath, encFile)));
                const decryptedData = this.decryptData(encryptedData, 'backup');
                
                fs.writeFileSync(originalFile, decryptedData);
                console.log(`✅ 恢复文件: ${originalFile}`);
            }
            
            console.log('🔄 备份恢复完成');
            
        } catch (error) {
            console.error('恢复备份失败:', error);
            throw error;
        }
    }

    // ==================== 工具方法 ====================

    /**
     * 生成安全随机字符串
     * @param {number} length - 长度
     * @returns {string} 随机字符串
     */
    generateSecureRandom(length = 32) {
        return crypto.randomBytes(length).toString('base64').slice(0, length);
    }

    /**
     * 计算数据哈希
     * @param {string} data - 数据
     * @param {string} algorithm - 哈希算法
     * @returns {string} 哈希值
     */
    calculateHash(data, algorithm = 'sha256') {
        return crypto.createHash(algorithm).update(data).digest('hex');
    }

    /**
     * 验证数据完整性
     * @param {string} data - 数据
     * @param {string} expectedHash - 期望的哈希值
     * @param {string} algorithm - 哈希算法
     * @returns {boolean} 验证结果
     */
    verifyIntegrity(data, expectedHash, algorithm = 'sha256') {
        const actualHash = this.calculateHash(data, algorithm);
        return crypto.timingSafeEqual(
            Buffer.from(actualHash, 'hex'),
            Buffer.from(expectedHash, 'hex')
        );
    }

    /**
     * 获取存储统计信息
     * @returns {object} 统计信息
     */
    getStorageStats() {
        return {
            encryptionEnabled: this.config.encryptionEnabled,
            backupEnabled: this.config.backupEnabled,
            derivedKeysCount: this.derivedKeys.size,
            backupCount: this.getBackupCount(),
            lastBackup: this.getLastBackupTime(),
            storageSize: this.calculateStorageSize()
        };
    }

    /**
     * 获取备份数量
     * @returns {number} 备份数量
     */
    getBackupCount() {
        try {
            const backupDir = './backups';
            if (!fs.existsSync(backupDir)) return 0;
            
            return fs.readdirSync(backupDir)
                .filter(dir => dir.startsWith('backup-'))
                .length;
        } catch {
            return 0;
        }
    }

    /**
     * 获取最后备份时间
     * @returns {string} 最后备份时间
     */
    getLastBackupTime() {
        try {
            const backupDir = './backups';
            if (!fs.existsSync(backupDir)) return null;
            
            const backups = fs.readdirSync(backupDir)
                .filter(dir => dir.startsWith('backup-'))
                .map(dir => ({
                    name: dir,
                    mtime: fs.statSync(path.join(backupDir, dir)).mtime
                }))
                .sort((a, b) => b.mtime - a.mtime);
            
            return backups.length > 0 ? backups[0].mtime.toISOString() : null;
        } catch {
            return null;
        }
    }

    /**
     * 计算存储大小
     * @returns {number} 存储大小（字节）
     */
    calculateStorageSize() {
        try {
            let totalSize = 0;
            const dirs = ['./security', './backups'];
            
            for (const dir of dirs) {
                if (fs.existsSync(dir)) {
                    totalSize += this.getDirSize(dir);
                }
            }
            
            return totalSize;
        } catch {
            return 0;
        }
    }

    /**
     * 获取目录大小
     * @param {string} dirPath - 目录路径
     * @returns {number} 目录大小
     */
    getDirSize(dirPath) {
        let totalSize = 0;
        
        const items = fs.readdirSync(dirPath);
        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const stats = fs.statSync(itemPath);
            
            if (stats.isDirectory()) {
                totalSize += this.getDirSize(itemPath);
            } else {
                totalSize += stats.size;
            }
        }
        
        return totalSize;
    }
}

// 导出单例
const secureStorage = new SecureStorage();

module.exports = secureStorage; 