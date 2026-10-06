/* ============================================================
   GENESIS ADMIN — Logic
============================================================ */

/* Firebase Config (same as main site) */
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDHCpn9yfi7jgYrAMu2q1DLXVm9hjJNBxo",
  authDomain: "genesiskashmir.firebaseapp.com",
  databaseURL: "https://genesiskashmir-default-rtdb.firebaseio.com",
  projectId: "genesiskashmir",
  storageBucket: "genesiskashmir.firebasestorage.app",
  messagingSenderId: "612574232339",
  appId: "1:612574232339:web:10001d538d58c43523a4e6",
  measurementId: "G-DNRMW36YDH"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

/* The only email allowed to use this admin panel */
const ADMIN_EMAIL = "exploremiracles2017@gmail.com";

/* Enable offline persistence */
db.enablePersistence({ synchronizeTabs: true })
  .then(() => console.log('🔥 Admin: Firestore + persistence'))
  .catch(() => console.log('🔥 Admin: Firestore'));

/* ============================================================
   STATE
============================================================ */
const state = {
  user: null,
  currentTab: 'dashboard',
  // Cached data
  news: [],
  reviews: [],
  downloads: [],
  admissions: [],
  messages: [],
  // Filters
  reviewFilter: 'pending',
  admissionFilter: 'all',
  messageFilter: 'all',
  newsSearch: '',
  newsFilter: 'all',
  downloadFilter: 'all',
  admissionSearch: ''
};

/* ============================================================
   HELPERS
============================================================ */
function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(value) {
  if (!value) return '—';
  let d;
  if (typeof value.toDate === 'function') d = value.toDate();
  else if (typeof value === 'object' && typeof value.seconds === 'number') d = new Date(value.seconds * 1000);
  else if (value instanceof Date) d = value;
  else d = new Date(value);
  if (isNaN(d.getTime())) return escapeHtml(String(value));
  return d.toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

function timeAgo(value) {
  if (!value) return '—';
  let d;
  if (typeof value.toDate === 'function') d = value.toDate();
  else if (typeof value === 'object' && typeof value.seconds === 'number') d = new Date(value.seconds * 1000);
  else if (value instanceof Date) d = value;
  else d = new Date(value);
  if (isNaN(d.getTime())) return '';
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

/* ============================================================
   TOASTS
============================================================ */
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `admin-toast ${type}`;

  const icons = {
    success: 'bi-check-circle-fill',
    error: 'bi-x-circle-fill',
    info: 'bi-info-circle-fill'
  };

  toast.innerHTML = `
    <i class="bi ${icons[type] || icons.info}"></i>
    <div>${escapeHtml(message)}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('leaving');
    setTimeout(() => toast.remove(), 350);
  }, 3000);
}

/* ============================================================
   CONFIRM DIALOG
============================================================ */
let confirmCallback = null;

function showConfirm(title, message, callback) {
  document.getElementById('adminConfirmTitle').textContent = title;
  document.getElementById('adminConfirmMessage').textContent = message;
  confirmCallback = callback;
  document.getElementById('adminConfirm').classList.remove('d-none');
}

function closeConfirm() {
  document.getElementById('adminConfirm').classList.add('d-none');
  confirmCallback = null;
}

document.getElementById('adminConfirmOk')?.addEventListener('click', () => {
  if (typeof confirmCallback === 'function') confirmCallback();
  closeConfirm();
});

document.querySelectorAll('[data-close-confirm]').forEach(el => {
  el.addEventListener('click', closeConfirm);
});

/* ============================================================
   MODAL SYSTEM
============================================================ */
function openModal({ title, subtitle = '', body = '', footer = '', onMount = null }) {
  document.getElementById('adminModalTitle').textContent = title;
  document.getElementById('adminModalSubtitle').textContent = subtitle;
  document.getElementById('adminModalBody').innerHTML = body;
  document.getElementById('adminModalFooter').innerHTML = footer;
  document.getElementById('adminModal').classList.remove('d-none');

  if (typeof onMount === 'function') {
    requestAnimationFrame(() => onMount());
  }
}

function closeModal() {
  document.getElementById('adminModal').classList.add('d-none');
}

document.querySelectorAll('[data-close-modal]').forEach(el => {
  el.addEventListener('click', closeModal);
});

/* ============================================================
   AUTH
============================================================ */
const loginScreen = document.getElementById('loginScreen');
const adminApp = document.getElementById('adminApp');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const loginBtn = document.getElementById('loginBtn');
const loginSpinner = document.getElementById('loginSpinner');
const loginBtnText = document.getElementById('loginBtnText');
const adminUserEmail = document.getElementById('adminUserEmail');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.classList.add('d-none');

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    loginError.textContent = 'Please enter both email and password.';
    loginError.classList.remove('d-none');
    return;
  }

  loginBtn.disabled = true;
  loginSpinner.classList.remove('d-none');
  loginBtnText.textContent = 'Signing in...';

  try {
    const cred = await auth.signInWithEmailAndPassword(email, password);

    if (cred.user.email !== ADMIN_EMAIL) {
      await auth.signOut();
      throw new Error('not-authorized');
    }
  } catch (err) {
    console.error('Login error:', err);
    let msg = 'Sign in failed. Please check your credentials.';
    if (err.code === 'auth/user-not-found') msg = 'No account with that email.';
    else if (err.code === 'auth/wrong-password') msg = 'Incorrect password.';
    else if (err.code === 'auth/invalid-email') msg = 'Invalid email address.';
    else if (err.code === 'auth/too-many-requests') msg = 'Too many attempts. Try again later.';
    else if (err.message === 'not-authorized') msg = 'This account is not authorized to access the admin panel.';

    loginError.textContent = msg;
    loginError.classList.remove('d-none');
  } finally {
    loginBtn.disabled = false;
    loginSpinner.classList.add('d-none');
    loginBtnText.textContent = 'Sign In';
  }
});

/* Auth state listener */
auth.onAuthStateChanged((user) => {
  if (user && user.email === ADMIN_EMAIL) {
    state.user = user;
    adminUserEmail.textContent = user.email;
    loginScreen.classList.add('d-none');
    adminApp.classList.remove('d-none');
    initAdmin();
  } else {
    state.user = null;
    adminApp.classList.add('d-none');
    loginScreen.classList.remove('d-none');
  }
});

/* Logout */
document.getElementById('adminLogoutBtn').addEventListener('click', async () => {
  showConfirm('Sign out?', 'You will need to sign in again to access the admin panel.', async () => {
    try {
      await auth.signOut();
      showToast('Signed out', 'info');
    } catch (err) {
      console.error(err);
      showToast('Failed to sign out', 'error');
    }
  });
});

/* ============================================================
   TAB NAVIGATION
============================================================ */
function switchTab(tabId) {
  state.currentTab = tabId;

  document.querySelectorAll('.admin-nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tabId);
  });

  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tabContent === tabId);
  });

  // Close mobile sidebar
  document.getElementById('adminSidebar').classList.remove('open');
  document.getElementById('adminScrim').classList.remove('open');

  // Update URL hash
  history.replaceState(null, '', `#${tabId}`);

  // Load data for the tab (lazy)
  loadTabData(tabId);
}

document.querySelectorAll('.admin-nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab(item.dataset.tab);
  });
});

/* Mobile menu toggle */
document.getElementById('adminMenuBtn').addEventListener('click', () => {
  document.getElementById('adminSidebar').classList.toggle('open');
  document.getElementById('adminScrim').classList.toggle('open');
});

document.getElementById('adminScrim').addEventListener('click', () => {
  document.getElementById('adminSidebar').classList.remove('open');
  document.getElementById('adminScrim').classList.remove('open');
});

/* Handle URL hash on load */
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '');
  if (hash && document.querySelector(`[data-tab-content="${hash}"]`)) {
    switchTab(hash);
  }
});

/* ============================================================
   DASHBOARD
============================================================ */
async function loadDashboard() {
  try {
    const [newsSnap, admissionsSnap, reviewsSnap, messagesSnap] = await Promise.all([
      db.collection('news').get(),
      db.collection('admissions').get(),
      db.collection('reviews').get(),
      db.collection('contactMessages').get()
    ]);

    document.getElementById('statNews').textContent = newsSnap.size;
    document.getElementById('statAdmissions').textContent = admissionsSnap.size;
    document.getElementById('statReviews').textContent = reviewsSnap.size;
    document.getElementById('statMessages').textContent = messagesSnap.size;

    // Recent activity: latest 5 across all collections
    const activity = [];
    newsSnap.forEach(d => {
      const data = d.data();
      activity.push({
        type: 'news',
        icon: 'bi-newspaper',
        label: `News: <strong>${escapeHtml(data.title || 'Untitled')}</strong>`,
        time: data.createdAt || data.date
      });
    });
    admissionsSnap.forEach(d => {
      const data = d.data();
      activity.push({
        type: 'admission',
        icon: 'bi-mortarboard-fill',
        label: `New admission: <strong>${escapeHtml(data.studentName || 'Student')}</strong> (${escapeHtml(data.applyingClass || '—')})`,
        time: data.createdAt
      });
    });
    reviewsSnap.forEach(d => {
      const data = d.data();
      activity.push({
        type: 'review',
        icon: 'bi-star-fill',
        label: `Review from <strong>${escapeHtml(data.name || 'Anonymous')}</strong>`,
        time: data.createdAt
      });
    });
    messagesSnap.forEach(d => {
      const data = d.data();
      activity.push({
        type: 'message',
        icon: 'bi-envelope-fill',
        label: `Message from <strong>${escapeHtml(data.name || 'Anonymous')}</strong>`,
        time: data.createdAt
      });
    });

    activity.sort((a, b) => {
      const ta = a.time?.toDate ? a.time.toDate().getTime() : 0;
      const tb = b.time?.toDate ? b.time.toDate().getTime() : 0;
      return tb - ta;
    });

    const recent = activity.slice(0, 6);
    const recentEl = document.getElementById('recentActivity');

    if (!recent.length) {
      recentEl.innerHTML = `<div class="admin-empty"><i class="bi bi-inbox"></i><p>No activity yet.</p></div>`;
    } else {
      recentEl.innerHTML = recent.map(a => `
        <div class="admin-activity-item">
          <i class="bi ${a.icon}"></i>
          <div>${a.label}</div>
          <span class="admin-activity-time">${timeAgo(a.time)}</span>
        </div>
      `).join('');
    }

    // Pending reviews count
    let pendingCount = 0;
    reviewsSnap.forEach(d => { if (d.data().approved !== true) pendingCount++; });

    const badge = document.getElementById('pendingReviewsBadge');
    if (pendingCount > 0) {
      badge.textContent = pendingCount;
      badge.classList.remove('d-none');
    } else {
      badge.classList.add('d-none');
    }

    const pendingEl = document.getElementById('pendingItems');
    const pendingItems = [];
    if (pendingCount > 0) {
      pendingItems.push({
        icon: 'bi-star-fill',
        label: 'Reviews awaiting approval',
        value: pendingCount,
        action: 'reviews'
      });
    }
    if (newsSnap.empty) {
      pendingItems.push({
        icon: 'bi-newspaper',
        label: 'Publish your first news post',
        value: '+',
        action: 'news'
      });
    }

    if (!pendingItems.length) {
      pendingEl.innerHTML = `<div class="admin-empty" style="padding:1rem;"><i class="bi bi-check2-circle"></i><p>All caught up!</p></div>`;
    } else {
      pendingEl.innerHTML = pendingItems.map(p => `
        <div class="admin-pending-item" data-goto="${p.action}">
          <i class="bi ${p.icon}"></i>
          <span>${p.label}</span>
          <span class="admin-pending-value">${p.value}</span>
        </div>
      `).join('');

      pendingEl.querySelectorAll('[data-goto]').forEach(el => {
        el.addEventListener('click', () => switchTab(el.dataset.goto));
      });
    }
  } catch (err) {
    console.error('Dashboard error:', err);
    showToast('Failed to load dashboard', 'error');
  }
}

/* Quick action buttons */
document.querySelectorAll('[data-quick]').forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.quick;
    if (action === 'add-news') { switchTab('news'); setTimeout(() => document.getElementById('addNewsBtn').click(), 300); }
    else if (action === 'add-download') { switchTab('downloads'); setTimeout(() => document.getElementById('addDownloadBtn').click(), 300); }
    else if (action === 'reviews') switchTab('reviews');
    else if (action === 'admissions') switchTab('admissions');
  });
});

/* ============================================================
   NEWS
============================================================ */
async function loadNews() {
  const listEl = document.getElementById('newsList');
  const emptyEl = document.getElementById('newsEmpty');

  try {
    const snap = await db.collection('news').orderBy('order', 'asc').get();
    state.news = [];
    snap.forEach(d => state.news.push({ _id: d.id, ...d.data() }));

    renderNewsList();
  } catch (err) {
    console.error('News load error:', err);
    // Fallback without order
    try {
      const snap = await db.collection('news').get();
      state.news = [];
      snap.forEach(d => state.news.push({ _id: d.id, ...d.data() }));
      state.news.sort((a, b) => (a.order || 999) - (b.order || 999));
      renderNewsList();
    } catch (err2) {
      showToast('Failed to load news', 'error');
    }
  }
}

function renderNewsList() {
  const listEl = document.getElementById('newsList');
  const emptyEl = document.getElementById('newsEmpty');

  let filtered = state.news;

  if (state.newsFilter !== 'all') {
    filtered = filtered.filter(n => (n.category || 'News') === state.newsFilter);
  }
  if (state.newsSearch) {
    const q = state.newsSearch.toLowerCase();
    filtered = filtered.filter(n =>
      (n.title || '').toLowerCase().includes(q) ||
      (n.description || '').toLowerCase().includes(q)
    );
  }

  if (!filtered.length) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('d-none');
    return;
  }

  emptyEl.classList.add('d-none');
  listEl.innerHTML = filtered.map(n => `
    <div class="admin-list-item">
      ${n.image ? `<img src="${escapeHtml(n.image)}" alt="" class="admin-list-item-thumb" onerror="this.style.display='none'" />` : ''}
      <div class="admin-list-item-body">
        <div class="admin-list-item-title">${escapeHtml(n.title || 'Untitled')}</div>
        <div class="admin-list-item-meta">
          <span><i class="bi bi-bookmark-fill"></i> ${escapeHtml(n.category || 'News')}</span>
          <span><i class="bi bi-calendar3"></i> ${formatDate(n.date)}</span>
          <span><i class="bi bi-hash"></i> Order ${n.order ?? '—'}</span>
        </div>
        <div class="admin-list-item-desc">${escapeHtml(n.description || '')}</div>
        <div class="admin-list-item-actions">
          <button class="admin-action-btn" data-edit-news="${n._id}"><i class="bi bi-pencil-square"></i> Edit</button>
          <button class="admin-action-btn danger" data-delete-news="${n._id}"><i class="bi bi-trash3"></i> Delete</button>
        </div>
      </div>
    </div>
  `).join('');

  listEl.querySelectorAll('[data-edit-news]').forEach(btn => {
    btn.addEventListener('click', () => editNews(btn.dataset.editNews));
  });
  listEl.querySelectorAll('[data-delete-news]').forEach(btn => {
    btn.addEventListener('click', () => deleteNews(btn.dataset.deleteNews));
  });
}

document.getElementById('newsSearch')?.addEventListener('input', (e) => {
  state.newsSearch = e.target.value;
  renderNewsList();
});

document.getElementById('newsFilter')?.addEventListener('change', (e) => {
  state.newsFilter = e.target.value;
  renderNewsList();
});

document.getElementById('addNewsBtn')?.addEventListener('click', () => openNewsForm());

function openNewsForm(item = null) {
  const isEdit = !!item;

  const body = `
    <form id="newsForm" novalidate>
      <div class="admin-form-row">
        <label>Title <span class="required">*</span></label>
        <input type="text" class="admin-input" name="title" value="${escapeHtml(item?.title || '')}" required maxlength="200" />
      </div>

      <div class="admin-form-grid-2">
        <div class="admin-form-row">
          <label>Category</label>
          <select class="admin-input" name="category">
            <option value="News" ${item?.category === 'News' ? 'selected' : ''}>News</option>
            <option value="Event" ${item?.category === 'Event' ? 'selected' : ''}>Event</option>
            <option value="Sports" ${item?.category === 'Sports' ? 'selected' : ''}>Sports</option>
            <option value="Academic" ${item?.category === 'Academic' ? 'selected' : ''}>Academic</option>
            <option value="Announcement" ${item?.category === 'Announcement' ? 'selected' : ''}>Announcement</option>
          </select>
        </div>

        <div class="admin-form-row">
          <label>Date</label>
          <input type="date" class="admin-input" name="date" value="${item?.date ? String(item.date).slice(0, 10) : new Date().toISOString().slice(0, 10)}" />
        </div>
      </div>

      <div class="admin-form-row">
        <label>Image URL</label>
        <input type="url" class="admin-input" name="image" value="${escapeHtml(item?.image || '')}" placeholder="https://..." />
        <div class="admin-hint">Paste a public image URL (or leave empty).</div>
      </div>

      <div class="admin-form-row">
        <label>Short Description <span class="required">*</span></label>
        <textarea class="admin-textarea" name="description" required maxlength="300">${escapeHtml(item?.description || '')}</textarea>
        <div class="admin-hint">Shown on the news card. Max 300 characters.</div>
      </div>

      <div class="admin-form-row">
        <label>Full Content</label>
        <textarea class="admin-textarea" name="content" style="min-height: 140px;">${escapeHtml(item?.content || '')}</textarea>
      </div>

      <div class="admin-form-row">
        <label>Order (lower shows first)</label>
        <input type="number" class="admin-input" name="order" value="${item?.order ?? ''}" min="0" />
      </div>
    </form>
  `;

  const footer = `
    <button class="admin-btn admin-btn-ghost" data-close-modal>Cancel</button>
    <button class="admin-btn admin-btn-primary" id="newsSaveBtn">
      <i class="bi bi-check-lg"></i> ${isEdit ? 'Save Changes' : 'Publish'}
    </button>
  `;

  openModal({
    title: isEdit ? 'Edit News Post' : 'New News Post',
    subtitle: isEdit ? 'Update the details below' : 'Fill in the details and publish',
    body,
    footer,
    onMount: () => {
      document.querySelectorAll('[data-close-modal]').forEach(el => {
        el.addEventListener('click', closeModal);
      });

      document.getElementById('newsSaveBtn').addEventListener('click', async () => {
        await saveNews(item?._id);
      });
    }
  });
}

async function saveNews(existingId) {
  const form = document.getElementById('newsForm');
  const data = Object.fromEntries(new FormData(form));

  if (!data.title?.trim()) { showToast('Title is required', 'error'); return; }
  if (!data.description?.trim()) { showToast('Description is required', 'error'); return; }

  const payload = {
    title: data.title.trim(),
    category: data.category || 'News',
    date: data.date || new Date().toISOString().slice(0, 10),
    image: data.image?.trim() || '',
    description: data.description.trim(),
    content: data.content?.trim() || '',
    order: data.order !== '' ? parseInt(data.order, 10) : 999
  };

  const btn = document.getElementById('newsSaveBtn');
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Saving...`;

  try {
    if (existingId) {
      await db.collection('news').doc(existingId).update(payload);
      showToast('News post updated', 'success');
    } else {
      payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection('news').add(payload);
      showToast('News post published', 'success');
    }
    closeModal();
    loadNews();
  } catch (err) {
    console.error(err);
    showToast('Failed to save', 'error');
    btn.disabled = false;
    btn.innerHTML = `<i class="bi bi-check-lg"></i> Save`;
  }
}

function editNews(id) {
  const item = state.news.find(n => n._id === id);
  if (item) openNewsForm(item);
}

function deleteNews(id) {
  showConfirm('Delete this news post?', 'This cannot be undone.', async () => {
    try {
      await db.collection('news').doc(id).delete();
      showToast('News post deleted', 'success');
      loadNews();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete', 'error');
    }
  });
}

/* ============================================================
   REVIEWS
============================================================ */
async function loadReviews() {
  try {
    const snap = await db.collection('reviews').orderBy('createdAt', 'desc').get();
    state.reviews = [];
    snap.forEach(d => state.reviews.push({ _id: d.id, ...d.data() }));

    updatePendingReviewsBadge();
    renderReviewsList();
  } catch (err) {
    console.error('Reviews load error:', err);
    // Fallback
    try {
      const snap = await db.collection('reviews').get();
      state.reviews = [];
      snap.forEach(d => state.reviews.push({ _id: d.id, ...d.data() }));
      state.reviews.sort((a, b) => {
        const at = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const bt = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return bt - at;
      });
      updatePendingReviewsBadge();
      renderReviewsList();
    } catch (err2) {
      showToast('Failed to load reviews', 'error');
    }
  }
}

function updatePendingReviewsBadge() {
  const pending = state.reviews.filter(r => r.approved !== true).length;
  const badge = document.getElementById('pendingReviewsBadge');
  if (pending > 0) {
    badge.textContent = pending;
    badge.classList.remove('d-none');
  } else {
    badge.classList.add('d-none');
  }
}

function renderReviewsList() {
  const listEl = document.getElementById('reviewsList');
  const emptyEl = document.getElementById('reviewsEmpty');

  let filtered = state.reviews;
  if (state.reviewFilter === 'pending') filtered = filtered.filter(r => r.approved !== true);
  else if (state.reviewFilter === 'approved') filtered = filtered.filter(r => r.approved === true);

  if (!filtered.length) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('d-none');
    return;
  }

  emptyEl.classList.add('d-none');
  listEl.innerHTML = filtered.map(r => {
    const rating = Math.max(1, Math.min(5, parseInt(r.rating, 10) || 5));
    const stars = Array.from({ length: 5 }, (_, i) =>
      `<i class="bi bi-star-fill${i < rating ? '' : ' empty'}" style="${i < rating ? '' : 'opacity:0.3;'}"></i>`
    ).join('');
    const isApproved = r.approved === true;

    return `
      <div class="admin-list-item">
        <div class="admin-list-item-body">
          <div class="admin-review-stars">${stars}</div>
          <div class="admin-list-item-title">${escapeHtml(r.name || 'Anonymous')}</div>
          ${r.role ? `<div class="admin-list-item-meta"><span>${escapeHtml(r.role)}</span></div>` : ''}
          <div class="admin-review-message">"${escapeHtml(r.message || '')}"</div>
          <div class="admin-list-item-meta">
            <span><i class="bi bi-calendar3"></i> ${formatDate(r.createdAt)}</span>
            <span class="admin-badge ${isApproved ? 'approved' : 'pending'}">
              ${isApproved ? '<i class="bi bi-check-circle-fill"></i> Approved' : '<i class="bi bi-clock"></i> Pending'}
            </span>
          </div>
          <div class="admin-list-item-actions">
            ${isApproved
              ? `<button class="admin-action-btn warn" data-unapprove="${r._id}"><i class="bi bi-x-circle"></i> Unapprove</button>`
              : `<button class="admin-action-btn approve" data-approve="${r._id}"><i class="bi bi-check-circle-fill"></i> Approve</button>`
            }
            <button class="admin-action-btn danger" data-delete-review="${r._id}"><i class="bi bi-trash3"></i> Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  listEl.querySelectorAll('[data-approve]').forEach(btn => {
    btn.addEventListener('click', () => approveReview(btn.dataset.approve));
  });
  listEl.querySelectorAll('[data-unapprove]').forEach(btn => {
    btn.addEventListener('click', () => unapproveReview(btn.dataset.unapprove));
  });
  listEl.querySelectorAll('[data-delete-review]').forEach(btn => {
    btn.addEventListener('click', () => deleteReview(btn.dataset.deleteReview));
  });
}

async function approveReview(id) {
  try {
    await db.collection('reviews').doc(id).update({ approved: true });
    showToast('Review approved — now live on site', 'success');
    loadReviews();
  } catch (err) {
    console.error(err);
    showToast('Failed to approve', 'error');
  }
}

async function unapproveReview(id) {
  try {
    await db.collection('reviews').doc(id).update({ approved: false });
    showToast('Review unapproved', 'info');
    loadReviews();
  } catch (err) {
    console.error(err);
    showToast('Failed to unapprove', 'error');
  }
}

function deleteReview(id) {
  showConfirm('Delete this review?', 'It will be permanently removed.', async () => {
    try {
      await db.collection('reviews').doc(id).delete();
      showToast('Review deleted', 'success');
      loadReviews();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete', 'error');
    }
  });
}

document.querySelectorAll('[data-review-filter]').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('[data-review-filter]').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    state.reviewFilter = chip.dataset.reviewFilter;
    renderReviewsList();
  });
});

/* ============================================================
   DOWNLOADS
============================================================ */
async function loadDownloads() {
  try {
    const snap = await db.collection('downloads').orderBy('order', 'asc').get();
    state.downloads = [];
    snap.forEach(d => state.downloads.push({ _id: d.id, ...d.data() }));
    renderDownloadsList();
  } catch (err) {
    console.error(err);
    try {
      const snap = await db.collection('downloads').get();
      state.downloads = [];
      snap.forEach(d => state.downloads.push({ _id: d.id, ...d.data() }));
      state.downloads.sort((a, b) => (a.order || 999) - (b.order || 999));
      renderDownloadsList();
    } catch (err2) {
      showToast('Failed to load downloads', 'error');
    }
  }
}

function renderDownloadsList() {
  const listEl = document.getElementById('downloadsList');
  const emptyEl = document.getElementById('downloadsEmpty');

  let filtered = state.downloads;
  if (state.downloadFilter !== 'all') {
    filtered = filtered.filter(d => (d.class || 'misc') === state.downloadFilter);
  }

  if (!filtered.length) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('d-none');
    return;
  }

  emptyEl.classList.add('d-none');
  listEl.innerHTML = filtered.map(d => `
    <div class="admin-list-item">
      <div class="admin-list-item-body">
        <div class="admin-list-item-title">${escapeHtml(d.title || 'Untitled')}</div>
        <div class="admin-list-item-meta">
          <span><i class="bi bi-bookmark-fill"></i> ${escapeHtml(d.class || 'misc')}</span>
          <span><i class="bi bi-file-earmark"></i> ${escapeHtml(d.type || 'pdf')}</span>
          <span><i class="bi bi-hash"></i> Order ${d.order ?? '—'}</span>
        </div>
        <div class="admin-list-item-desc">${escapeHtml(d.description || '')}</div>
        <div class="admin-list-item-actions">
          <a class="admin-action-btn" href="${escapeHtml(d.url || '#')}" target="_blank" rel="noopener"><i class="bi bi-box-arrow-up-right"></i> Open</a>
          <button class="admin-action-btn" data-edit-download="${d._id}"><i class="bi bi-pencil-square"></i> Edit</button>
          <button class="admin-action-btn danger" data-delete-download="${d._id}"><i class="bi bi-trash3"></i> Delete</button>
        </div>
      </div>
    </div>
  `).join('');

  listEl.querySelectorAll('[data-edit-download]').forEach(btn => {
    btn.addEventListener('click', () => editDownload(btn.dataset.editDownload));
  });
  listEl.querySelectorAll('[data-delete-download]').forEach(btn => {
    btn.addEventListener('click', () => deleteDownload(btn.dataset.deleteDownload));
  });
}

document.getElementById('downloadFilter')?.addEventListener('change', (e) => {
  state.downloadFilter = e.target.value;
  renderDownloadsList();
});

document.getElementById('addDownloadBtn')?.addEventListener('click', () => openDownloadForm());

function openDownloadForm(item = null) {
  const isEdit = !!item;
  const classes = [
    'nursery', 'lkg', 'ukg',
    'class1', 'class2', 'class3', 'class4', 'class5',
    'class6', 'class7', 'class8', 'misc'
  ];
  const types = ['pdf', 'book', 'syllabus', 'article', 'newspaper', 'link', 'video'];

  const body = `
    <form id="downloadForm" novalidate>
      <div class="admin-form-row">
        <label>Title <span class="required">*</span></label>
        <input type="text" class="admin-input" name="title" value="${escapeHtml(item?.title || '')}" required maxlength="200" />
      </div>

      <div class="admin-form-grid-2">
        <div class="admin-form-row">
          <label>Class <span class="required">*</span></label>
          <select class="admin-input" name="class" required>
            ${classes.map(c => `<option value="${c}" ${item?.class === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="admin-form-row">
          <label>Type</label>
          <select class="admin-input" name="type">
            ${types.map(t => `<option value="${t}" ${item?.type === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="admin-form-row">
        <label>Category</label>
        <input type="text" class="admin-input" name="category" value="${escapeHtml(item?.category || 'Resource')}" maxlength="60" />
        <div class="admin-hint">e.g. "Worksheet", "Syllabus", "Past Paper"</div>
      </div>

      <div class="admin-form-row">
        <label>URL <span class="required">*</span></label>
        <input type="url" class="admin-input" name="url" value="${escapeHtml(item?.url || '')}" placeholder="https://..." required />
      </div>

      <div class="admin-form-row">
        <label>Description</label>
        <textarea class="admin-textarea" name="description" maxlength="300">${escapeHtml(item?.description || '')}</textarea>
      </div>

      <div class="admin-form-grid-2">
        <div class="admin-form-row">
          <label>File Size (optional)</label>
          <input type="text" class="admin-input" name="fileSize" value="${escapeHtml(item?.fileSize || '')}" placeholder="e.g. 2.4 MB" maxlength="20" />
        </div>
        <div class="admin-form-row">
          <label>Order</label>
          <input type="number" class="admin-input" name="order" value="${item?.order ?? ''}" min="0" />
        </div>
      </div>
    </form>
  `;

  const footer = `
    <button class="admin-btn admin-btn-ghost" data-close-modal>Cancel</button>
    <button class="admin-btn admin-btn-primary" id="downloadSaveBtn">
      <i class="bi bi-check-lg"></i> ${isEdit ? 'Save Changes' : 'Add Resource'}
    </button>
  `;

  openModal({
    title: isEdit ? 'Edit Resource' : 'Add Resource',
    subtitle: isEdit ? 'Update the details below' : 'Fill in the details',
    body,
    footer,
    onMount: () => {
      document.querySelectorAll('[data-close-modal]').forEach(el => el.addEventListener('click', closeModal));
      document.getElementById('downloadSaveBtn').addEventListener('click', () => saveDownload(item?._id));
    }
  });
}

async function saveDownload(existingId) {
  const form = document.getElementById('downloadForm');
  const data = Object.fromEntries(new FormData(form));

  if (!data.title?.trim()) { showToast('Title is required', 'error'); return; }
  if (!data.url?.trim()) { showToast('URL is required', 'error'); return; }

  const payload = {
    title: data.title.trim(),
    class: data.class || 'misc',
    type: data.type || 'pdf',
    category: data.category?.trim() || 'Resource',
    url: data.url.trim(),
    description: data.description?.trim() || '',
    fileSize: data.fileSize?.trim() || '',
    order: data.order !== '' ? parseInt(data.order, 10) : 999
  };

  const btn = document.getElementById('downloadSaveBtn');
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Saving...`;

  try {
    if (existingId) {
      await db.collection('downloads').doc(existingId).update(payload);
      showToast('Resource updated', 'success');
    } else {
      payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection('downloads').add(payload);
      showToast('Resource added', 'success');
    }
    closeModal();
    loadDownloads();
  } catch (err) {
    console.error(err);
    showToast('Failed to save', 'error');
    btn.disabled = false;
    btn.innerHTML = `<i class="bi bi-check-lg"></i> Save`;
  }
}

function editDownload(id) {
  const item = state.downloads.find(d => d._id === id);
  if (item) openDownloadForm(item);
}

function deleteDownload(id) {
  showConfirm('Delete this resource?', 'This cannot be undone.', async () => {
    try {
      await db.collection('downloads').doc(id).delete();
      showToast('Resource deleted', 'success');
      loadDownloads();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete', 'error');
    }
  });
}

/* ============================================================
   ADMISSIONS
============================================================ */
async function loadAdmissions() {
  try {
    const snap = await db.collection('admissions').orderBy('createdAt', 'desc').get();
    state.admissions = [];
    snap.forEach(d => state.admissions.push({ _id: d.id, ...d.data() }));
    renderAdmissionsList();
  } catch (err) {
    console.error(err);
    try {
      const snap = await db.collection('admissions').get();
      state.admissions = [];
      snap.forEach(d => state.admissions.push({ _id: d.id, ...d.data() }));
      state.admissions.sort((a, b) => {
        const at = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const bt = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return bt - at;
      });
      renderAdmissionsList();
    } catch (err2) {
      showToast('Failed to load admissions', 'error');
    }
  }
}

function renderAdmissionsList() {
  const listEl = document.getElementById('admissionsList');
  const emptyEl = document.getElementById('admissionsEmpty');

  let filtered = state.admissions;
  if (state.admissionFilter !== 'all') {
    filtered = filtered.filter(a => String(a.status || '1') === String(state.admissionFilter));
  }
  if (state.admissionSearch) {
    const q = state.admissionSearch.toLowerCase();
    filtered = filtered.filter(a =>
      (a.studentName || '').toLowerCase().includes(q) ||
      (a.applyingClass || '').toLowerCase().includes(q) ||
      (a.mobile || '').includes(q)
    );
  }

  if (!filtered.length) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('d-none');
    return;
  }

  emptyEl.classList.add('d-none');
  listEl.innerHTML = filtered.map(a => {
    const refId = 'GGA-' + a._id.slice(-8).toUpperCase();
    const status = String(a.status || '1');
    const statusInfo = status === '3' ? { label: 'Approved', cls: 'approved' }
      : status === '2' ? { label: 'Under Review', cls: 'pending' }
      : { label: 'Received', cls: 'received' };

    return `
      <div class="admin-list-item">
        <div class="admin-list-item-body">
          <div class="admin-list-item-title">${escapeHtml(a.studentName || 'Student')}</div>
          <div class="admin-list-item-meta">
            <span><i class="bi bi-hash"></i> ${refId}</span>
            <span><i class="bi bi-mortarboard-fill"></i> ${escapeHtml(a.applyingClass || '—')}</span>
            <span><i class="bi bi-calendar3"></i> ${formatDate(a.createdAt)}</span>
            <span class="admin-badge ${statusInfo.cls}">${statusInfo.label}</span>
          </div>
          <div class="admin-list-item-meta">
            <span><i class="bi bi-person-fill"></i> ${escapeHtml(a.fatherName || '—')}</span>
            <span><i class="bi bi-telephone-fill"></i> ${escapeHtml(a.mobile || '—')}</span>
            <span><i class="bi bi-envelope-fill"></i> ${escapeHtml(a.email || '—')}</span>
          </div>
          <div class="admin-list-item-actions">
            <button class="admin-action-btn" data-view-admission="${a._id}"><i class="bi bi-eye"></i> Details</button>
            <button class="admin-action-btn danger" data-delete-admission="${a._id}"><i class="bi bi-trash3"></i> Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  listEl.querySelectorAll('[data-view-admission]').forEach(btn => {
    btn.addEventListener('click', () => viewAdmission(btn.dataset.viewAdmission));
  });
  listEl.querySelectorAll('[data-delete-admission]').forEach(btn => {
    btn.addEventListener('click', () => deleteAdmission(btn.dataset.deleteAdmission));
  });
}

document.querySelectorAll('[data-admission-filter]').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('[data-admission-filter]').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    state.admissionFilter = chip.dataset.admissionFilter;
    renderAdmissionsList();
  });
});

document.getElementById('admissionSearch')?.addEventListener('input', (e) => {
  state.admissionSearch = e.target.value;
  renderAdmissionsList();
});

function viewAdmission(id) {
  const a = state.admissions.find(x => x._id === id);
  if (!a) return;

  const refId = 'GGA-' + a._id.slice(-8).toUpperCase();
  const status = String(a.status || '1');

  const field = (label, val) => val ? `
    <div class="admin-form-row">
      <label>${label}</label>
      <div style="padding:0.6rem 0.9rem;background:var(--ivory);border-radius:8px;font-size:0.9rem;word-break:break-word;">${escapeHtml(val)}</div>
    </div>
  ` : '';

  const body = `
    <div style="margin-bottom:1rem;">
      <span class="admin-badge received"><i class="bi bi-hash"></i> ${refId}</span>
    </div>

    <h4 style="font-family:var(--font-serif);font-size:1.05rem;color:var(--navy);margin:0.5rem 0 0.75rem;">Student</h4>
    ${field('Full Name', a.studentName)}
    ${field('Date of Birth', a.dateOfBirth)}
    ${field('Gender', a.gender)}
    ${field('Applying Class', a.applyingClass)}
    ${field('Previous School', a.previousSchool)}

    <h4 style="font-family:var(--font-serif);font-size:1.05rem;color:var(--navy);margin:1rem 0 0.75rem;">Parent / Guardian</h4>
    ${field("Father's Name", a.fatherName)}
    ${field("Mother's Name", a.motherName)}
    ${field('Guardian Name', a.guardianName)}
    ${field('Mobile', a.mobile)}
    ${field('WhatsApp', a.whatsapp)}
    ${field('Email', a.email)}

    <h4 style="font-family:var(--font-serif);font-size:1.05rem;color:var(--navy);margin:1rem 0 0.75rem;">Address</h4>
    ${field('House / Street', a.address)}
    ${field('Area', a.area)}
    ${field('City', a.city)}
    ${field('District', a.district)}
    ${field('State', a.state)}
    ${field('PIN Code', a.pinCode)}

    <h4 style="font-family:var(--font-serif);font-size:1.05rem;color:var(--navy);margin:1rem 0 0.75rem;">Additional</h4>
    ${field('Emergency Contact', a.emergencyContact)}
    ${field('Previous Academic Info', a.previousAcademicInfo)}
    ${field('Message / Notes', a.additionalInformation)}

    <div class="admin-form-row" style="margin-top:1.25rem;">
      <label>Status</label>
      <select class="admin-input" id="admissionStatusSelect">
        <option value="1" ${status === '1' ? 'selected' : ''}>1 — Received</option>
        <option value="2" ${status === '2' ? 'selected' : ''}>2 — Under Review</option>
        <option value="3" ${status === '3' ? 'selected' : ''}>3 — Approved</option>
      </select>
      <div class="admin-hint">Changes reflect instantly in the chatbot status lookup.</div>
    </div>
  `;

  const footer = `
    <button class="admin-btn admin-btn-ghost" data-close-modal>Close</button>
    <button class="admin-btn admin-btn-primary" id="admissionSaveBtn">
      <i class="bi bi-check-lg"></i> Update Status
    </button>
  `;

  openModal({
    title: 'Application Details',
    subtitle: formatDate(a.createdAt),
    body,
    footer,
    onMount: () => {
      document.querySelectorAll('[data-close-modal]').forEach(el => el.addEventListener('click', closeModal));
      document.getElementById('admissionSaveBtn').addEventListener('click', () => updateAdmissionStatus(id, refId));
    }
  });
}

async function updateAdmissionStatus(id, refId) {
  const newStatus = parseInt(document.getElementById('admissionStatusSelect').value, 10);

  const btn = document.getElementById('admissionSaveBtn');
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Updating...`;

  try {
    // Update the main admission doc
    await db.collection('admissions').doc(id).update({ status: newStatus });

    // Try to update the lookup doc too (so the chatbot sees the new status)
    try {
      await db.collection('admission_lookups').doc(refId).update({ status: newStatus });
    } catch (lookupErr) {
      console.warn('Could not update lookup doc:', lookupErr);
    }

    showToast('Status updated', 'success');
    closeModal();
    loadAdmissions();
  } catch (err) {
    console.error(err);
    showToast('Failed to update', 'error');
    btn.disabled = false;
    btn.innerHTML = `<i class="bi bi-check-lg"></i> Update Status`;
  }
}

function deleteAdmission(id) {
  showConfirm('Delete this application?', 'All data will be permanently removed.', async () => {
    try {
      await db.collection('admissions').doc(id).delete();
      showToast('Application deleted', 'success');
      loadAdmissions();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete', 'error');
    }
  });
}

/* ============================================================
   MESSAGES
============================================================ */
async function loadMessages() {
  try {
    const snap = await db.collection('contactMessages').orderBy('createdAt', 'desc').get();
    state.messages = [];
    snap.forEach(d => state.messages.push({ _id: d.id, ...d.data() }));
    renderMessagesList();
  } catch (err) {
    console.error(err);
    try {
      const snap = await db.collection('contactMessages').get();
      state.messages = [];
      snap.forEach(d => state.messages.push({ _id: d.id, ...d.data() }));
      renderMessagesList();
    } catch (err2) {
      showToast('Failed to load messages', 'error');
    }
  }
}

function renderMessagesList() {
  const listEl = document.getElementById('messagesList');
  const emptyEl = document.getElementById('messagesEmpty');

  let filtered = state.messages;
  if (state.messageFilter === 'unread') filtered = filtered.filter(m => m.status !== 'read');
  else if (state.messageFilter === 'read') filtered = filtered.filter(m => m.status === 'read');

  if (!filtered.length) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('d-none');
    return;
  }

  emptyEl.classList.add('d-none');
  listEl.innerHTML = filtered.map(m => {
    const isRead = m.status === 'read';
    return `
      <div class="admin-list-item" style="${isRead ? 'opacity:0.75;' : ''}">
        <div class="admin-list-item-body">
          <div class="admin-list-item-title">${escapeHtml(m.name || 'Anonymous')}</div>
          <div class="admin-list-item-meta">
            <span><i class="bi bi-envelope-fill"></i> ${escapeHtml(m.email || '—')}</span>
            ${m.phone ? `<span><i class="bi bi-telephone-fill"></i> ${escapeHtml(m.phone)}</span>` : ''}
            <span><i class="bi bi-calendar3"></i> ${formatDate(m.createdAt)}</span>
            ${!isRead ? `<span class="admin-badge crimson">Unread</span>` : ''}
          </div>
          ${m.subject ? `<div class="admin-list-item-meta"><span><strong>Subject:</strong> ${escapeHtml(m.subject)}</span></div>` : ''}
          <div class="admin-list-item-desc">${escapeHtml(m.message || '')}</div>
          <div class="admin-list-item-actions">
            <a class="admin-action-btn" href="mailto:${escapeHtml(m.email || '')}?subject=Re: ${escapeHtml(m.subject || 'Your message')}"><i class="bi bi-reply"></i> Reply</a>
            ${!isRead ? `<button class="admin-action-btn" data-mark-read="${m._id}"><i class="bi bi-check2"></i> Mark Read</button>` : ''}
            <button class="admin-action-btn danger" data-delete-message="${m._id}"><i class="bi bi-trash3"></i> Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  listEl.querySelectorAll('[data-mark-read]').forEach(btn => {
    btn.addEventListener('click', () => markMessageRead(btn.dataset.markRead));
  });
  listEl.querySelectorAll('[data-delete-message]').forEach(btn => {
    btn.addEventListener('click', () => deleteMessage(btn.dataset.deleteMessage));
  });
}

document.querySelectorAll('[data-message-filter]').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('[data-message-filter]').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    state.messageFilter = chip.dataset.messageFilter;
    renderMessagesList();
  });
});

async function markMessageRead(id) {
  try {
    await db.collection('contactMessages').doc(id).update({ status: 'read' });
    showToast('Marked as read', 'success');
    loadMessages();
  } catch (err) {
    console.error(err);
    showToast('Failed to update', 'error');
  }
}

function deleteMessage(id) {
  showConfirm('Delete this message?', 'This cannot be undone.', async () => {
    try {
      await db.collection('contactMessages').doc(id).delete();
      showToast('Message deleted', 'success');
      loadMessages();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete', 'error');
    }
  });
}

/* ============================================================
   TAB DATA LOADER
============================================================ */
let loadedTabs = {};

function loadTabData(tabId) {
  // Always reload dashboard stats
  if (tabId === 'dashboard') { loadDashboard(); return; }

  // Cache per tab so we don't re-fetch unnecessarily
  if (loadedTabs[tabId]) return;
  loadedTabs[tabId] = true;

  if (tabId === 'news') loadNews();
  else if (tabId === 'reviews') loadReviews();
  else if (tabId === 'downloads') loadDownloads();
  else if (tabId === 'admissions') loadAdmissions();
  else if (tabId === 'messages') loadMessages();
}

/* ============================================================
   INIT ADMIN
============================================================ */
function initAdmin() {
  loadedTabs = {};

  // Pick initial tab from URL hash
  const hash = window.location.hash.replace('#', '');
  const initialTab = hash && document.querySelector(`[data-tab-content="${hash}"]`)
    ? hash : 'dashboard';

  switchTab(initialTab);

  // Load dashboard always
  loadDashboard();
  loadReviews();       // needed for pending badge
}

/* ============================================================
   KEYBOARD SHORTCUTS
============================================================ */
document.addEventListener('keydown', (e) => {
  // Esc closes modal / confirm
  if (e.key === 'Escape') {
    if (!document.getElementById('adminConfirm').classList.contains('d-none')) {
      closeConfirm();
      return;
    }
    if (!document.getElementById('adminModal').classList.contains('d-none')) {
      closeModal();
      return;
    }
  }
});