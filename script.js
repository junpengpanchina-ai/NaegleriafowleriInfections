// 纯原生JavaScript - 无第三方库
document.addEventListener('DOMContentLoaded', function() {
    
    // 政府横幅切换
    const govToggle = document.querySelector('.gov-info-toggle');
    const govInfo = document.querySelector('.gov-info');
    
    if (govToggle && govInfo) {
        govToggle.addEventListener('click', function() {
            const isVisible = !govInfo.hidden;
            govInfo.hidden = isVisible;
            govToggle.setAttribute('aria-expanded', !isVisible);
            govToggle.textContent = isVisible ? "Here's how you know" : "Hide";
        });
    }
    
    // 探索主题下拉菜单
    const exploreBtn = document.getElementById('exploreBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');
    
    if (exploreBtn && dropdownMenu) {
        exploreBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const isOpen = dropdownMenu.classList.contains('show');
            dropdownMenu.classList.toggle('show');
            exploreBtn.setAttribute('aria-expanded', !isOpen);
            
            // 旋转箭头图标
            const icon = exploreBtn.querySelector('svg');
            if (icon) {
                icon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
            }
        });
        
        // 点击外部关闭下拉菜单
        document.addEventListener('click', function(e) {
            if (!exploreBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.classList.remove('show');
                exploreBtn.setAttribute('aria-expanded', 'false');
                const icon = exploreBtn.querySelector('svg');
                if (icon) {
                    icon.style.transform = 'rotate(0deg)';
                }
            }
        });
        
        // 处理下拉链接
        const dropdownLinks = dropdownMenu.querySelectorAll('.nav-links a, .related-link, .view-all-link, .view-all-button');
        dropdownLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');
                if (targetId.startsWith('#')) {
                    e.preventDefault();
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    } else {
                        // 如果目标元素不存在，显示占位信息
                        console.log(`导航到: ${this.textContent}`);
                        alert(`功能页面: ${this.textContent} - 这里可以添加具体的页面内容`);
                    }
                }
                // 关闭下拉菜单
                dropdownMenu.classList.remove('show');
                exploreBtn.setAttribute('aria-expanded', 'false');
                const icon = exploreBtn.querySelector('svg');
                if (icon) {
                    icon.style.transform = 'rotate(0deg)';
                }
            });
        });

        // 处理栏目标题点击（可展开对应页面）
        const columnTitles = dropdownMenu.querySelectorAll('.nav-column-title');
        columnTitles.forEach(title => {
            title.addEventListener('click', function(e) {
                e.preventDefault();
                const columnType = this.querySelector('span').textContent;
                console.log(`点击栏目: ${columnType}`);
                
                // 可以在这里添加栏目页面的导航逻辑
                alert(`栏目页面: ${columnType} - 显示该栏目的所有内容`);
                
                // 关闭下拉菜单
                dropdownMenu.classList.remove('show');
                exploreBtn.setAttribute('aria-expanded', 'false');
                const icon = exploreBtn.querySelector('svg');
                if (icon) {
                    icon.style.transform = 'rotate(0deg)';
                }
            });
        });
    }
    
    // 搜索功能
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    if (searchInput && searchBtn) {
        searchBtn.addEventListener('click', function() {
            performSearch(searchInput.value.trim());
        });
        
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch(searchInput.value.trim());
            }
        });
    }
    
    function performSearch(query) {
        if (!query) return;
        
        // 简单搜索实现 - 高亮页面文本
        const searchTerms = query.toLowerCase().split(' ');
        const textNodes = getTextNodes(document.body);
        
        // 移除现有高亮
        removeHighlights();
        
        let matches = 0;
        textNodes.forEach(node => {
            const text = node.textContent.toLowerCase();
            searchTerms.forEach(term => {
                if (text.includes(term)) {
                    highlightText(node, term);
                    matches++;
                }
            });
        });
        
        if (matches > 0) {
            alert(`找到 ${matches} 个匹配结果: "${query}"`);
        } else {
            alert(`未找到相关结果: "${query}"`);
        }
    }
    
    function getTextNodes(element) {
        const textNodes = [];
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    if (node.parentElement.tagName === 'SCRIPT' ||
                        node.parentElement.tagName === 'STYLE' ||
                        node.parentElement.classList.contains('search-highlight')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );
        
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }
        return textNodes;
    }
    
    function highlightText(textNode, searchTerm) {
        const text = textNode.textContent;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        const highlightedText = text.replace(regex, '<span class="search-highlight">$1</span>');
        
        if (highlightedText !== text) {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = highlightedText;
            const parent = textNode.parentNode;
            while (wrapper.firstChild) {
                parent.insertBefore(wrapper.firstChild, textNode);
            }
            parent.removeChild(textNode);
        }
    }
    
    function removeHighlights() {
        const highlights = document.querySelectorAll('.search-highlight');
        highlights.forEach(highlight => {
            const parent = highlight.parentNode;
            parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
            parent.normalize();
        });
    }
    
    // 语言切换功能现在由translations.js处理
    // 监听语言切换事件
    window.addEventListener('languageChanged', function(e) {
        const lang = e.detail.language;
        console.log(`语言已切换到: ${lang === 'en' ? '英语' : '西班牙语'}`);
        
        // 重新加载文章内容（如果需要的话）
        if (typeof loadHomepageArticles === 'function') {
            setTimeout(loadHomepageArticles, 100);
        }
    });
    
    // 手风琴功能
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    accordionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const content = document.getElementById(targetId);
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            
            // 关闭其他手风琴
            accordionHeaders.forEach(otherHeader => {
                if (otherHeader !== this) {
                    const otherTargetId = otherHeader.getAttribute('data-target');
                    const otherContent = document.getElementById(otherTargetId);
                    if (otherContent) {
                        otherContent.classList.remove('show');
                        otherHeader.setAttribute('aria-expanded', 'false');
                    }
                }
            });
            
            // 切换当前手风琴
            if (content) {
                if (isExpanded) {
                    content.classList.remove('show');
                    this.setAttribute('aria-expanded', 'false');
                } else {
                    content.classList.add('show');
                    this.setAttribute('aria-expanded', 'true');
                    
                    // 打开后平滑滚动到手风琴
                    setTimeout(() => {
                        this.scrollIntoView({
                            behavior: 'smooth',
                            block: 'nearest'
                        });
                    }, 300);
                }
            }
        });
    });
    
    // 快速链接平滑滚动
    const quickLinks = document.querySelectorAll('.quick-links a, .related-links a');
    
    quickLinks.forEach(link => {
        if (link.getAttribute('href').startsWith('#')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    // 更新URL但不跳转
                    history.pushState(null, null, targetId);
                }
            });
        }
    });
    
    // 邮件订阅
    const subscriptionForm = document.querySelector('.subscription-form');
    
    if (subscriptionForm) {
        subscriptionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input[type="email"]').value;
            
            // 基本邮件验证
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (emailRegex.test(email)) {
                alert('感谢订阅！您将收到Naegleria fowleri的相关更新。');
                this.reset();
            } else {
                alert('请输入有效的邮箱地址。');
            }
        });
    }
    
    // 分享功能
    const shareButtons = document.querySelectorAll('.share-btn');
    
    shareButtons.forEach(button => {
        button.addEventListener('click', function() {
            const platform = this.getAttribute('data-platform');
            const url = encodeURIComponent(window.location.href);
            const title = encodeURIComponent(document.title);
            
            let shareUrl = '';
            
            switch (platform) {
                case 'facebook':
                    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                    break;
                case 'twitter':
                    shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
                    break;
                case 'linkedin':
                    shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
                    break;
                default:
                    return;
            }
            
            if (shareUrl) {
                window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
            }
        });
    });
    
    // 滚动显示动画
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const animateOnScroll = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // 应用动画到元素
    const elementsToAnimate = document.querySelectorAll('.section-title, .key-points-list li, .accordion-item, .resource-card, .stat-item');
    elementsToAnimate.forEach(el => {
        el.classList.add('fade-in-element');
        animateOnScroll.observe(el);
    });
    
    // 键盘导航增强
    document.addEventListener('keydown', function(e) {
        // ESC键关闭下拉菜单
        if (e.key === 'Escape') {
            if (dropdownMenu && dropdownMenu.classList.contains('show')) {
                dropdownMenu.classList.remove('show');
                exploreBtn.setAttribute('aria-expanded', 'false');
                const icon = exploreBtn.querySelector('svg');
                if (icon) {
                    icon.style.transform = 'rotate(0deg)';
                }
            }
            
            if (govInfo && !govInfo.hidden) {
                govInfo.hidden = true;
                govToggle.setAttribute('aria-expanded', 'false');
                govToggle.textContent = "Here's how you know";
            }
        }
        
        // Ctrl+F聚焦搜索
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
    });
    
    // 打印增强
    window.addEventListener('beforeprint', function() {
        // 打印时展开所有手风琴
        const accordionContents = document.querySelectorAll('.accordion-content');
        accordionContents.forEach(content => {
            content.classList.add('show');
        });
    });
    
    window.addEventListener('afterprint', function() {
        // 打印后恢复手风琴状态
        const accordionContents = document.querySelectorAll('.accordion-content');
        const accordionHeaders = document.querySelectorAll('.accordion-header');
        
        accordionContents.forEach((content, index) => {
            const header = accordionHeaders[index];
            if (header && header.getAttribute('aria-expanded') !== 'true') {
                content.classList.remove('show');
            }
        });
    });
    
    // 页面可见性API
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            console.log('页面隐藏');
        } else {
            console.log('页面可见');
        }
    });
    
    // 防抖函数
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // 节流函数
    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    // 优化的滚动监听
    const optimizedScrollHandler = throttle(function() {
        // 滚动相关逻辑
    }, 16);
    
    window.addEventListener('scroll', optimizedScrollHandler);
    
    // 错误处理
    window.addEventListener('error', function(e) {
        console.error('JavaScript错误:', e.error);
    });
    
    window.addEventListener('unhandledrejection', function(e) {
        console.error('未处理的Promise拒绝:', e.reason);
        e.preventDefault();
    });
    
    console.log('Naegleria fowleri信息门户已成功加载 - 纯原生JavaScript实现');
}); 