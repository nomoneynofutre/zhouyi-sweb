// ==========================================
// 苹果风格个人网站 v1.3.0 - 增加评论功能
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    const logo = document.querySelector('.logo');
    if (logo) {
        logo.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    const scrollHint = document.querySelector('.scroll-hint');
    if (scrollHint) {
        scrollHint.addEventListener('click', function() {
            const nextScreen = document.getElementById('about');
            if (nextScreen) {
                nextScreen.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    const backToTop = document.querySelector('.back-to-top');
    function updateBackToTop() {
        if (backToTop) {
            if (window.scrollY > window.innerHeight * 0.5) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        }
    }
    window.addEventListener('scroll', updateBackToTop, { passive: true });
    updateBackToTop();

    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.full-screen');

    function updateActiveNav() {
        let current = '';
        const scrollPos = window.scrollY + window.innerHeight / 3;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-target') === current) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', updateActiveNav, { passive: true });
    updateActiveNav();

    const navbar = document.querySelector('.navbar');
    function updateNavbar() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
    window.addEventListener('scroll', updateNavbar, { passive: true });
    updateNavbar();

    const fadeElements = document.querySelectorAll('.fade-in');
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    fadeElements.forEach(el => observer.observe(el));

    const skillBars = document.querySelectorAll('.skill-progress');
    const skillObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const width = entry.target.getAttribute('data-width');
                setTimeout(() => {
                    entry.target.style.width = width;
                }, 300);
            }
        });
    }, { threshold: 0.5 });

    skillBars.forEach(bar => skillObserver.observe(bar));

    // ==========================================
    // 文章 + 评论系统
    // ==========================================

    const blogMain = document.querySelector('.blog-main');
    let postsData = [];

    function showToast(message, type = 'success') {
        const existing = document.querySelector('.blog-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'blog-toast';
        toast.style.background = type === 'error' ? 'rgba(255, 59, 48, 0.9)' : 'rgba(0, 0, 0, 0.8)';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.remove(), 2500);
    }

    function generateCommentId() {
        return 'c' + Date.now() + Math.random().toString(36).substr(2, 5);
    }

    function getCurrentDateTime() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    }

    function renderComments(post, commentsContainer) {
        const comments = post.comments || [];

        let commentsHtml = `
            <div class="comments-header">
                <span class="comments-title">💬 评论</span>
                <span class="comments-count">${comments.length} 条</span>
            </div>
            <div class="comments-list">
        `;

        if (comments.length === 0) {
            commentsHtml += `<div class="empty-comments">暂无评论，快来抢沙发！</div>`;
        } else {
            comments.forEach(comment => {
                commentsHtml += `
                    <div class="comment-item">
                        <div class="comment-header">
                            <span class="comment-nickname">${escapeHtml(comment.nickname)}</span>
                            <span class="comment-date">${comment.date}</span>
                        </div>
                        <div class="comment-content">${escapeHtml(comment.content)}</div>
                    </div>
                `;
            });
        }

        commentsHtml += `
            </div>
            <div class="comment-form">
                <div class="comment-form-title">发表评论</div>
                <div class="comment-form-row">
                    <input type="text" class="comment-input comment-nickname-input" 
                           placeholder="你的昵称" maxlength="20">
                    <input type="text" class="comment-input comment-content-input" 
                           placeholder="说点什么..." maxlength="500">
                </div>
                <div class="comment-submit">
                    <button class="btn-comment" onclick="submitComment('${post.id}')">
                        发表评论
                    </button>
                </div>
            </div>
        `;

        commentsContainer.innerHTML = commentsHtml;
    }

    window.submitComment = function(postId) {
        const postCard = document.querySelector(`.post-card[data-post-id="${postId}"]`);
        const nicknameInput = postCard.querySelector('.comment-nickname-input');
        const contentInput = postCard.querySelector('.comment-content-input');

        const nickname = nicknameInput.value.trim();
        const content = contentInput.value.trim();

        if (!nickname) {
            showToast('请输入你的昵称', 'error');
            nicknameInput.focus();
            return;
        }

        if (!content) {
            showToast('请输入评论内容', 'error');
            contentInput.focus();
            return;
        }

        const post = postsData.find(p => p.id === postId);
        if (post) {
            if (!post.comments) post.comments = [];

            post.comments.push({
                id: generateCommentId(),
                nickname: nickname,
                content: content,
                date: getCurrentDateTime()
            });

            savePostsData();

            const commentsContainer = postCard.querySelector('.comments-section');
            renderComments(post, commentsContainer);

            showToast('评论发表成功！');
        }
    };

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function savePostsData() {
        localStorage.setItem('zhouyi_posts', JSON.stringify(postsData));
    }

    function loadLocalPosts() {
        const saved = localStorage.getItem('zhouyi_posts');
        if (saved) {
            try {
                postsData = JSON.parse(saved);
                return true;
            } catch (e) {
                return false;
            }
        }
        return false;
    }

    function renderPosts() {
        const postsContainer = blogMain.querySelector('.posts-container');
        if (!postsContainer) {
            const container = document.createElement('div');
            container.className = 'posts-container';
            blogMain.appendChild(container);
        }

        const container = blogMain.querySelector('.posts-container');
        container.innerHTML = '';

        const sortedPosts = [...postsData].sort((a, b) => new Date(b.date) - new Date(a.date));

        sortedPosts.forEach(post => {
            const postCard = document.createElement('div');
            postCard.className = 'post-card fade-in';
            postCard.setAttribute('data-post-id', post.id);

            postCard.innerHTML = `
                <div class="post-meta">
                    <span class="post-date">${post.date}</span>
                    <span class="post-tag">${post.tag}</span>
                </div>
                <h3 class="post-title">${escapeHtml(post.title)}</h3>
                <p class="post-excerpt">${escapeHtml(post.excerpt)}</p>
                <div class="post-read-more">
                    <span>阅读全文 ↓</span>
                </div>
                <div class="post-full-content" style="display: none;">
                    ${escapeHtml(post.content).replace(/\n/g, '<br><br>')}
                    <div class="comments-section"></div>
                </div>
            `;

            postCard.addEventListener('click', function(e) {
                if (e.target.closest('.comment-form') || 
                    e.target.closest('.comments-list') ||
                    e.target.tagName === 'INPUT' ||
                    e.target.tagName === 'BUTTON') {
                    return;
                }

                const isExpanded = postCard.classList.contains('expanded');
                
                if (isExpanded) {
                    postCard.classList.remove('expanded');
                    postCard.querySelector('.post-full-content').style.display = 'none';
                } else {
                    postCard.classList.add('expanded');
                    postCard.querySelector('.post-full-content').style.display = 'block';
                    
                    const commentsContainer = postCard.querySelector('.comments-section');
                    renderComments(post, commentsContainer);
                }
            });

            container.appendChild(postCard);
        });

        const newFades = container.querySelectorAll('.fade-in');
        newFades.forEach(el => observer.observe(el));
    }

    async function initPosts() {
        if (loadLocalPosts()) {
            renderPosts();
        }

        try {
            const response = await fetch('posts.json');
            const data = await response.json();
            
            if (!loadLocalPosts()) {
                postsData = data.posts;
                savePostsData();
            } else {
                data.posts.forEach(serverPost => {
                    const localPost = postsData.find(p => p.id === serverPost.id);
                    if (!localPost) {
                        postsData.push(serverPost);
                    }
                });
                savePostsData();
            }
            
            renderPosts();
        } catch (error) {
            if (postsData.length === 0) {
                blogMain.innerHTML += '<p style="text-align: center; color: #86868b;">文章加载中...</p>';
            }
        }
    }

    // ==========================================
    // 🥚 彩蛋：连续点击博客3次进入管理后台
    // ==========================================
    const blogNavLink = document.querySelector('.nav-link[data-target="blog"]');
    if (blogNavLink) {
        let blogClickCount = 0;
        let blogClickTimer = null;

        blogNavLink.addEventListener('click', function(e) {
            blogClickCount++;

            if (blogClickCount === 3) {
                showToast('🔓 管理后台已解锁');
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 500);
                blogClickCount = 0;
                if (blogClickTimer) clearTimeout(blogClickTimer);
                return;
            }

            if (blogClickTimer) clearTimeout(blogClickTimer);
            blogClickTimer = setTimeout(() => {
                blogClickCount = 0;
            }, 1500);
        });
    }

    initPosts();
});