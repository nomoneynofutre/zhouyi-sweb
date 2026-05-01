// ==========================================
// Admin Panel v1.3.0 - 增加评论管理功能
// ==========================================

let postsData = [];
let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    checkLogin();
    initMenu();
    initForm();
    loadPosts();
    setDefaultDate();
});

function setDefaultDate() {
    const dateInput = document.getElementById('postDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }
}

function checkLogin() {
    const savedUser = localStorage.getItem('zhouyi_admin');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showPage('adminMain');
    } else {
        showPage('loginPage');
    }
}

function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const savedCredentials = localStorage.getItem('zhouyi_credentials');
    let validCredentials = { username: 'zhouyi', password: '123456' };
    
    if (savedCredentials) {
        validCredentials = JSON.parse(savedCredentials);
    }

    if (username === validCredentials.username && password === validCredentials.password) {
        currentUser = { username };
        localStorage.setItem('zhouyi_admin', JSON.stringify(currentUser));
        showPage('adminMain');
        renderPosts();
        showToast('登录成功');
    } else {
        showToast('用户名或密码错误', 'error');
    }
}

function logout() {
    localStorage.removeItem('zhouyi_admin');
    currentUser = null;
    showPage('loginPage');
    showToast('已退出登录');
}

function showPage(pageId) {
    document.querySelectorAll('.admin-page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

function initMenu() {
    const menuItems = document.querySelectorAll('.menu-item[data-page]');
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');
            switchPage(pageId);
        });
    });
}

function switchPage(pageId) {
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`.menu-item[data-page="${pageId}"]`).classList.add('active');

    document.querySelectorAll('.content-page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId + 'Page').classList.add('active');

    if (pageId === 'posts') {
        renderPosts();
    } else if (pageId === 'comments') {
        renderAdminComments();
    } else if (pageId === 'write') {
        resetWriteForm();
    }
}

function showToast(message, type = 'success') {
    const existing = document.querySelector('.admin-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'admin-toast';
    toast.style.background = type === 'error' ? 'rgba(255, 59, 48, 0.9)' : 'rgba(0, 0, 0, 0.8)';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 2500);
}

function loadPosts() {
    const saved = localStorage.getItem('zhouyi_posts');
    if (saved) {
        try {
            postsData = JSON.parse(saved);
            return;
        } catch (e) {}
    }

    fetch('posts.json')
        .then(res => res.json())
        .then(data => {
            postsData = data.posts;
            savePostsData();
            renderPosts();
        })
        .catch(() => {});
}

function savePostsData() {
    localStorage.setItem('zhouyi_posts', JSON.stringify(postsData));
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ==========================================
// 评论管理
// ==========================================

function renderAdminComments() {
    const commentsList = document.getElementById('adminCommentsList');
    if (!commentsList) return;

    const allComments = [];
    postsData.forEach(post => {
        if (post.comments && post.comments.length > 0) {
            post.comments.forEach(comment => {
                allComments.push({
                    ...comment,
                    postId: post.id,
                    postTitle: post.title
                });
            });
        }
    });

    allComments.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (allComments.length === 0) {
        commentsList.innerHTML = `
            <div style="text-align: center; padding: 60px 0; color: #86868b;">
                暂无评论
            </div>
        `;
        return;
    }

    commentsList.innerHTML = allComments.map(comment => `
        <div class="post-item comment-admin-item">
            <div class="post-item-info">
                <h3 style="margin-bottom: 6px;">${escapeHtml(comment.nickname)}</h3>
                <div class="post-item-meta">
                    ${comment.date}
                    <span class="post-item-tag" style="margin-left: 8px;">
                        文章：${escapeHtml(comment.postTitle)}
                    </span>
                </div>
                <p style="margin-top: 12px; font-size: 14px; color: #1d1d1f; line-height: 1.7;">
                    ${escapeHtml(comment.content)}
                </p>
            </div>
            <div class="post-item-actions">
                <button class="btn btn-danger" onclick="deleteComment('${comment.postId}', '${comment.id}')">
                    删除
                </button>
            </div>
        </div>
    `).join('');
}

window.deleteComment = function(postId, commentId) {
    if (!confirm('确定要删除这条评论吗？')) return;

    const post = postsData.find(p => p.id === postId);
    if (post && post.comments) {
        post.comments = post.comments.filter(c => c.id !== commentId);
        savePostsData();
        renderAdminComments();
        showToast('评论已删除');
    }
};

// ==========================================
// 文章管理
// ==========================================

function renderPosts() {
    const postsList = document.getElementById('postsList');
    if (!postsList) return;

    if (postsData.length === 0) {
        postsList.innerHTML = `
            <div style="text-align: center; padding: 60px 0; color: #86868b;">
                暂无文章，点击右上角"写文章"开始创作
            </div>
        `;
        return;
    }

    const sorted = [...postsData].sort((a, b) => new Date(b.date) - new Date(a.date));

    postsList.innerHTML = sorted.map(post => {
        const commentCount = (post.comments || []).length;
        return `
            <div class="post-item">
                <div class="post-item-info">
                    <h3>${escapeHtml(post.title)}</h3>
                    <div class="post-item-meta">
                        ${post.date}
                        <span class="post-item-tag">${post.tag}</span>
                        <span class="post-item-tag" style="background: rgba(41, 151, 255, 0.1); color: #2997ff;">
                            💬 ${commentCount} 条评论
                        </span>
                    </div>
                </div>
                <div class="post-item-actions">
                    <button class="btn-edit" onclick="editPost('${post.id}')">编辑</button>
                    <button class="btn btn-danger" onclick="deletePost('${post.id}')">删除</button>
                </div>
            </div>
        `;
    }).join('');
}

function initForm() {
    const form = document.getElementById('postForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            savePost();
        });
    }
}

function resetWriteForm() {
    document.getElementById('editPostId').value = '';
    document.getElementById('writePageTitle').textContent = '写文章';
    document.getElementById('postTitle').value = '';
    document.getElementById('postExcerpt').value = '';
    document.getElementById('postContent').value = '';
    document.getElementById('postTag').value = '生活';
    setDefaultDate();
}

function editPost(postId) {
    const post = postsData.find(p => p.id === postId);
    if (!post) return;

    switchPage('write');
    document.getElementById('writePageTitle').textContent = '编辑文章';
    document.getElementById('editPostId').value = post.id;
    document.getElementById('postTitle').value = post.title;
    document.getElementById('postDate').value = post.date;
    document.getElementById('postTag').value = post.tag;
    document.getElementById('postExcerpt').value = post.excerpt;
    document.getElementById('postContent').value = post.content;
}

function cancelEdit() {
    if (confirm('确定要取消吗？未保存的内容将丢失。')) {
        switchPage('posts');
    }
}

function savePost() {
    const editId = document.getElementById('editPostId').value;
    const postData = {
        title: document.getElementById('postTitle').value.trim(),
        date: document.getElementById('postDate').value,
        tag: document.getElementById('postTag').value.trim(),
        excerpt: document.getElementById('postExcerpt').value.trim(),
        content: document.getElementById('postContent').value.trim()
    };

    if (!postData.title || !postData.excerpt || !postData.content) {
        showToast('请填写完整信息', 'error');
        return;
    }

    if (editId) {
        const index = postsData.findIndex(p => p.id === editId);
        if (index !== -1) {
            postsData[index] = { ...postsData[index], ...postData };
            showToast('文章已更新');
        }
    } else {
        postData.id = generateId();
        postData.comments = [];
        postsData.push(postData);
        showToast('文章已发布');
    }

    savePostsData();
    switchPage('posts');
}

window.deletePost = function(postId) {
    if (!confirm('确定要删除这篇文章吗？此操作不可恢复！')) return;

    postsData = postsData.filter(p => p.id !== postId);
    savePostsData();
    renderPosts();
    showToast('文章已删除');
};

function changePassword() {
    const current = document.getElementById('currentPassword').value;
    const newPwd = document.getElementById('newPassword').value;
    const confirmPwd = document.getElementById('confirmPassword').value;

    const savedCredentials = localStorage.getItem('zhouyi_credentials');
    const validCredentials = savedCredentials ? JSON.parse(savedCredentials) : { username: 'zhouyi', password: '123456' };

    if (current !== validCredentials.password) {
        showToast('当前密码错误', 'error');
        return;
    }

    if (!newPwd || newPwd.length < 4) {
        showToast('新密码至少4位', 'error');
        return;
    }

    if (newPwd !== confirmPwd) {
        showToast('两次输入的密码不一致', 'error');
        return;
    }

    validCredentials.password = newPwd;
    localStorage.setItem('zhouyi_credentials', JSON.stringify(validCredentials));

    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';

    showToast('密码修改成功');
}

function exportData() {
    const dataStr = JSON.stringify({ posts: postsData }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'posts.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('导出成功');
}

function clearAllData() {
    if (!confirm('确定要清空所有文章和评论数据吗？此操作不可恢复！')) return;
    localStorage.removeItem('zhouyi_posts');
    location.reload();
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.id === 'password') {
        login();
    }
});