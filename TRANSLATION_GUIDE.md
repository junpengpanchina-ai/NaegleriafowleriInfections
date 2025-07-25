# 翻译功能使用指南

## 功能概述

网站现在支持英语(EN)和西班牙语(ES)双语切换功能，所有的UI文本都可以实时翻译。

## 功能特性

### ✅ 已实现的功能
- 🌐 双语支持：英语 ↔ 西班牙语
- 💾 语言偏好保存：自动记住用户选择
- 🔄 实时切换：无需刷新页面
- 📱 响应式设计：适配所有设备
- 🎯 全覆盖翻译：包含所有UI元素

### 🎯 翻译覆盖范围
- **页面头部**：政府横幅、主标题、搜索栏
- **导航菜单**：所有菜单项和链接
- **主要内容**：关键点、症状、预防、治疗、统计数据
- **侧边栏**：快速链接、相关主题、邮件订阅
- **页脚**：所有链接和版权信息
- **文章区域**：文章标题和操作按钮

## 使用方法

### 1. 基本使用
```html
<!-- 在页面顶部的语言切换按钮 -->
<div class="language-toggle">
    <button class="lang-btn active" data-lang="en">EN</button>
    <button class="lang-btn" data-lang="es">ES</button>
</div>
```

### 2. 为新元素添加翻译
如果需要为新的HTML元素添加翻译支持：

```html
<!-- 添加 data-translate 属性 -->
<h1 data-translate="myTitle">My Title</h1>
<p data-translate="myDescription">My description text</p>

<!-- 对于input输入框的placeholder -->
<input data-translate="searchPlaceholder" placeholder="Search...">
```

然后在 `translations.js` 中添加对应的翻译：

```javascript
// 在英语翻译对象中
en: {
    myTitle: 'My Title',
    myDescription: 'My description text',
    searchPlaceholder: 'Search...'
},

// 在西班牙语翻译对象中  
es: {
    myTitle: 'Mi Título',
    myDescription: 'Mi texto de descripción',
    searchPlaceholder: 'Buscar...'
}
```

### 3. 编程方式使用
```javascript
// 获取当前语言
const currentLang = window.translationSystem.getCurrentLanguage();

// 切换到指定语言
window.translationSystem.switchLanguage('es');

// 获取翻译文本
const text = window.translationSystem.getText('keyName');

// 监听语言切换事件
window.addEventListener('languageChanged', function(e) {
    const newLang = e.detail.language;
    console.log('语言已切换到:', newLang);
});
```

## 技术实现

### 文件结构
```
translations.js          # 翻译系统核心文件
index.html              # 主页面（已添加翻译属性）
script.js               # 主脚本（已集成翻译事件）
test-translation.html   # 翻译功能测试页面
```

### 核心类：TranslationSystem
- **自动初始化**：页面加载时自动启动
- **本地存储**：记住用户语言偏好
- **事件驱动**：支持语言切换事件监听
- **DOM操作**：自动查找并翻译带有`data-translate`属性的元素

## 测试方法

### 1. 访问测试页面
```
http://localhost:3000/test-translation.html
```

### 2. 功能测试checklist
- [ ] 点击EN/ES按钮能否正常切换语言
- [ ] 页面文本是否实时翻译
- [ ] 刷新页面后语言设置是否保持
- [ ] 所有标记的元素是否都被翻译
- [ ] 搜索框placeholder是否翻译
- [ ] 控制台是否有错误信息

## 添加新语言

如果需要添加新语言（如法语），按以下步骤：

### 1. 在translations.js中添加语言数据
```javascript
this.translations = {
    en: { /* 英语翻译 */ },
    es: { /* 西班牙语翻译 */ },
    fr: {  // 新增法语
        mainTitle: 'Infection à Naegleria fowleri',
        // ... 其他翻译
    }
};
```

### 2. 添加语言按钮
```html
<button class="lang-btn" data-lang="fr">FR</button>
```

## 故障排除

### 常见问题
1. **翻译不显示**：检查`data-translate`属性值是否在翻译文件中存在
2. **语言不切换**：确保translations.js正确加载
3. **页面报错**：检查浏览器控制台错误信息

### 调试命令
```javascript
// 检查翻译系统是否加载
console.log(window.translationSystem);

// 查看当前语言
console.log(window.translationSystem.getCurrentLanguage());

// 查看翻译数据
console.log(window.translationSystem.translations);
```

## 性能说明

- ⚡ **轻量级**：纯JavaScript实现，无第三方依赖
- 🚀 **快速切换**：DOM操作优化，切换流畅
- 💾 **本地缓存**：语言偏好存储在localStorage
- 📦 **体积小**：翻译文件约15KB

---

**注意**：此翻译系统完全基于原生JavaScript开发，无需任何第三方库，符合项目要求。 