/* ============================================================
   SCHOOL WEBSITE — MAIN JAVASCRIPT
   ============================================================
   Features:
   - Firebase Firestore (compat SDK v9)
   - Always-visible bottom section rail
   - Active section highlight on scroll
   - Animated counter (450+)
   - News & Events (paginated 5/page, full-screen dialog)
   - Reviews (public submission + admin-approval gated display)
   - Faculty Directory (name + role + contact number)
   - Admission form submission
   - Contact form submission
   - Gallery journal + unified lightbox
============================================================ */

/* ============================================================
   FIREBASE CONFIG — REPLACE WITH YOUR OWN
============================================================ */
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
console.log('🔥 Firebase connected (Firestore)');

/* ============================================================
   AOS INIT
============================================================ */
AOS.init({
  duration: 800,
  once: true,
  offset: 80,
  easing: 'ease-out-cubic'
});

/* ============================================================
   SANITIZATION HELPERS
============================================================ */
function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\//g, '&#x2F;');
}

function sanitizeUrl(url) {
  if (!url) return '';
  const raw = String(url).trim();
  const lower = raw.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return '';
  }
  if (
    raw.startsWith('#') ||
    raw.startsWith('/') ||
    raw.startsWith('./') ||
    raw.startsWith('../') ||
    /^https?:\/\//i.test(raw) ||
    /^mailto:/i.test(raw) ||
    /^tel:/i.test(raw)
  ) {
    return raw;
  }
  return raw;
}

function formatDate(value) {
  if (!value) return '';
  if (typeof value.toDate === 'function') {
    return value.toDate().toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }
  if (typeof value === 'object' && typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }
  if (value instanceof Date) {
    return value.toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }
  const d = new Date(value);
  if (!isNaN(d.getTime()) && String(value).length > 4 && String(value).includes('-')) {
    return d.toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }
  return escapeHtml(String(value));
}

/* ============================================================
   GLOBAL — Suppress double-tap-to-zoom
============================================================ */
(function disableDoubleTapZoom() {
  let lastTouchEnd = 0;
  document.addEventListener('touchend', function (e) {
    const now = Date.now();
    if (now - lastTouchEnd <= 350) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });
})();

/* ============================================================
   SCROLL TOP + HEADER SCROLL STATE
============================================================ */
const siteHeader = document.getElementById('siteHeader');
const scrollTopBtn = document.getElementById('scrollTopBtn');

function handleScroll() {
  if (window.scrollY > 60) {
    siteHeader.classList.add('scrolled');
    scrollTopBtn.classList.add('visible');
  } else {
    siteHeader.classList.remove('scrolled');
    scrollTopBtn.classList.remove('visible');
  }
}
window.addEventListener('scroll', handleScroll, { passive: true });
handleScroll();

scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ============================================================
   SMOOTH SCROLL FOR ANCHOR LINKS
============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    const target = document.querySelector(targetId);
    if (target) {
      e.preventDefault();
      const headerHeight = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--header-height') || '68',
        10
      ) || 68;
      const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

/* ============================================================
   ACTIVE SECTION HIGHLIGHT (bottom rail)
============================================================ */
const trackedSections = document.querySelectorAll('section[id], header[id]');
const railTiles = document.querySelectorAll('.rail-tile');

function updateActiveSection() {
  const scrollY = window.scrollY + 140;
  let currentId = '';

  trackedSections.forEach(section => {
    if (section.offsetTop <= scrollY) {
      currentId = section.id;
    }
  });

  railTiles.forEach(t => {
    t.classList.toggle('active', t.dataset.target === currentId);
  });
}

window.addEventListener('scroll', updateActiveSection, { passive: true });
updateActiveSection();

/* Auto-scroll the rail horizontally to keep active tile centered on small screens */
const sectionRail = document.getElementById('sectionRail');
function scrollRailToActive() {
  if (!sectionRail) return;
  if (sectionRail.scrollWidth <= sectionRail.clientWidth) return;

  const activeTile = sectionRail.querySelector('.rail-tile.active');
  if (!activeTile) return;

  const tileLeft = activeTile.offsetLeft;
  const tileWidth = activeTile.offsetWidth;
  const railWidth = sectionRail.clientWidth;

  sectionRail.scrollTo({
    left: Math.max(0, tileLeft - railWidth / 2 + tileWidth / 2),
    behavior: 'smooth'
  });
}
window.addEventListener('scroll', () => {
  clearTimeout(window.__railScrollTimeout);
  window.__railScrollTimeout = setTimeout(scrollRailToActive, 120);
}, { passive: true });

/* ============================================================
   ANIMATED COUNTER (450+)
============================================================ */
function initCounters() {
  const counters = document.querySelectorAll('.counter-value');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.target, 10) || 0;
      animateCounter(el, target);
      obs.unobserve(el);
    });
  }, { threshold: 0.4 });

  counters.forEach(c => observer.observe(c));
}

function animateCounter(el, target) {
  const duration = 1800;
  const start = performance.now();

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(eased * target);
    el.textContent = value.toLocaleString('en-IN');
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target.toLocaleString('en-IN');
  }
  requestAnimationFrame(step);
}
initCounters();

/* ============================================================
   FACULTY DIRECTORY — name + role + contact number
============================================================ */
const facultyData = [
  { name: "Muntazir Mehdi", role: "Chairperson", dept: "leadership", deptLabel: "Leadership", phone: "+919622222723" },
  { name: "Sameer Hussain Mir", role: "Secretary", dept: "leadership", deptLabel: "Leadership", phone: "+917006261543" },
  { name: "Ms. Asma Bashir", role: "Principal", dept: "leadership", deptLabel: "Leadership", phone: "+917006266499" },
  { name: "Mr. Ghulam Hassan Mir", role: "VP", dept: "leadership", deptLabel: "Leadership", phone: "+919906670378" },
  { name: "Jabeena Mehdi", role: "AO", dept: "management", deptLabel: "Management", phone: "+919906852216" },
  { name: "Ahtisham Hussain", role: "Transport Head", dept: "management", deptLabel: "Management", phone: "+916006020208" }

];

const facultyGrid = document.getElementById('facultyGrid');
const facultyFilters = document.querySelectorAll('.faculty-filter');

function getInitials(name) {
  const parts = String(name || '')
    .replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.|Miss)\s+/i, '')
    .trim()
    .split(/\s+/);
  if (parts.length === 0) return '?';
  const first = parts[0]?.charAt(0) || '';
  const last = parts[parts.length - 1]?.charAt(0) || '';
  return (first + last).toUpperCase() || '?';
}

function buildFacultyCard(faculty) {
  const card = document.createElement('div');
  card.className = 'faculty-card';
  card.setAttribute('data-dept', faculty.dept);

  const name = escapeHtml(faculty.name);
  const role = escapeHtml(faculty.role);
  const phone = escapeHtml(faculty.phone);
  const telHref = 'tel:' + String(faculty.phone || '').replace(/[^\d+]/g, '');
  const initials = escapeHtml(getInitials(faculty.name));

  card.innerHTML = `
    <div class="faculty-card-top">
      <div class="faculty-avatar">${initials}</div>
      <div class="faculty-card-heading">
        <h3 class="faculty-card-name">${name}</h3>
        <span class="faculty-card-role">${role}</span>
      </div>
    </div>
    <a href="${escapeHtml(telHref)}" class="faculty-card-contact" aria-label="Call ${name} at ${phone}">
      <i class="bi bi-telephone-fill"></i>
      <span class="faculty-card-number">${phone}</span>
    </a>
  `;

  return card;
}

function renderFaculty() {
  if (!facultyGrid) return;
  facultyGrid.innerHTML = '';
  facultyData.forEach(f => {
    facultyGrid.appendChild(buildFacultyCard(f));
  });
  if (window.AOS && typeof AOS.refresh === 'function') AOS.refresh();
}

facultyFilters.forEach(btn => {
  btn.addEventListener('click', () => {
    facultyFilters.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');

    const dept = btn.dataset.dept;
    document.querySelectorAll('.faculty-card').forEach(card => {
      if (dept === 'all' || card.dataset.dept === dept) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  });
});

renderFaculty();

/* ============================================================
   NEWS & EVENTS
============================================================ */
const NEWS_PER_PAGE = 5;

const newsContainer = document.getElementById('newsContainer');
const newsEmptyState = document.getElementById('newsEmptyState');
const newsErrorState = document.getElementById('newsErrorState');
const newsPagination = document.getElementById('newsPagination');
const newsPrevBtn = document.getElementById('newsPrevBtn');
const newsNextBtn = document.getElementById('newsNextBtn');
const newsPageNumbers = document.getElementById('newsPageNumbers');

const newsDialog = document.getElementById('newsDialog');
const newsDialogClose = document.getElementById('newsDialogClose');
const newsDialogCategory = document.getElementById('newsDialogCategory');
const newsDialogDate = document.getElementById('newsDialogDate');
const newsDialogTitle = document.getElementById('newsDialogTitle');
const newsDialogBody = document.getElementById('newsDialogBody');

let allNewsItems = [];
let currentNewsPage = 1;

function buildNewsCard(item) {
  const col = document.createElement('div');
  col.className = 'col-md-6 col-lg-4';
  col.setAttribute('data-aos', 'fade-up');

  const dateText = formatDate(item.date);
  const category = escapeHtml(item.category || 'News');
  const title = escapeHtml(item.title || 'Untitled');
  const description = escapeHtml(item.description || '');
  const imageUrl = item.image ? sanitizeUrl(item.image) : '';

  col.innerHTML = `
    <article class="news-card" role="button" tabindex="0" aria-label="Open news: ${title}">
      ${imageUrl ? `
        <div class="news-card-image-wrap">
          <img
            src="${escapeHtml(imageUrl)}"
            alt="${title}"
            class="news-card-image"
            loading="lazy"
            decoding="async"
            onerror="this.parentElement.style.display='none'"
          />
          <span class="news-category news-category-floating">${category}</span>
        </div>
      ` : ''}
      <div class="news-card-body">
        ${dateText ? `<div class="news-date">${dateText}</div>` : ''}
        ${!imageUrl ? `<span class="news-category">${category}</span>` : ''}
        <h4>${title}</h4>
        <p>${description}</p>
      </div>
    </article>
  `;

  const card = col.querySelector('.news-card');
  card.addEventListener('click', () => openNewsDialog(item));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openNewsDialog(item);
    }
  });

  return col;
}

function renderNewsPage(page) {
  newsContainer.innerHTML = '';

  if (!allNewsItems.length) {
    newsEmptyState.classList.remove('d-none');
    newsErrorState.classList.add('d-none');
    newsPagination.classList.add('d-none');
    return;
  }

  newsEmptyState.classList.add('d-none');
  newsErrorState.classList.add('d-none');

  const totalPages = Math.ceil(allNewsItems.length / NEWS_PER_PAGE);
  currentNewsPage = Math.min(Math.max(1, page), totalPages);

  const start = (currentNewsPage - 1) * NEWS_PER_PAGE;
  const pageItems = allNewsItems.slice(start, start + NEWS_PER_PAGE);

  pageItems.forEach(item => newsContainer.appendChild(buildNewsCard(item)));

  if (window.AOS && typeof AOS.refresh === 'function') AOS.refresh();

  if (totalPages > 1) {
    newsPagination.classList.remove('d-none');
    renderPaginationNumbers(newsPageNumbers, totalPages, currentNewsPage, renderNewsPage);
    newsPrevBtn.disabled = currentNewsPage === 1;
    newsNextBtn.disabled = currentNewsPage === totalPages;
  } else {
    newsPagination.classList.add('d-none');
  }
}

function renderNews(items) {
  allNewsItems = items || [];
  currentNewsPage = 1;
  renderNewsPage(1);
}

newsPrevBtn.addEventListener('click', () => {
  if (currentNewsPage > 1) renderNewsPage(currentNewsPage - 1);
});
newsNextBtn.addEventListener('click', () => {
  const totalPages = Math.ceil(allNewsItems.length / NEWS_PER_PAGE);
  if (currentNewsPage < totalPages) renderNewsPage(currentNewsPage + 1);
});

let dialogLastFocusedElement = null;

function openNewsDialog(item) {
  dialogLastFocusedElement = document.activeElement;

  newsDialogCategory.textContent = item.category || 'News';
  newsDialogDate.textContent = formatDate(item.date);
  newsDialogTitle.textContent = item.title || 'Untitled';

  const heroSlot = document.getElementById('newsDialogHeroSlot');
  const imageUrl = item.image ? sanitizeUrl(item.image) : '';
  if (heroSlot) {
    if (imageUrl) {
      heroSlot.innerHTML = `
        <div class="news-dialog-hero">
          <img
            src="${escapeHtml(imageUrl)}"
            alt="${escapeHtml(item.title || 'News image')}"
            class="news-dialog-image"
            loading="eager"
            decoding="async"
            onerror="this.parentElement.style.display='none'"
          />
        </div>
      `;
      heroSlot.style.display = '';
    } else {
      heroSlot.innerHTML = '';
      heroSlot.style.display = 'none';
    }
  }

  const bodyText = item.content || item.description || 'No additional details available.';
  newsDialogBody.textContent = bodyText;

  newsDialog.classList.remove('d-none');
  document.body.style.overflow = 'hidden';
  setTimeout(() => newsDialogClose.focus({ preventScroll: true }), 50);
}

function closeNewsDialog() {
  newsDialog.classList.add('d-none');
  document.body.style.overflow = '';
  if (dialogLastFocusedElement && typeof dialogLastFocusedElement.focus === 'function') {
    dialogLastFocusedElement.focus({ preventScroll: true });
  }
}

newsDialogClose.addEventListener('click', closeNewsDialog);
newsDialog.querySelector('.news-dialog-overlay').addEventListener('click', closeNewsDialog);
document.addEventListener('keydown', (e) => {
  if (newsDialog.classList.contains('d-none')) return;
  if (e.key === 'Escape') closeNewsDialog();
});

function initNews() {
  let hasReceivedData = false;
  const timeoutId = setTimeout(() => {
    if (!hasReceivedData) {
      console.warn('Firestore news fetch timed out.');
      renderNews([]);
      newsErrorState.classList.remove('d-none');
    }
  }, 10000);

  db.collection('news')
    .orderBy('order', 'asc')
    .onSnapshot(
      (snapshot) => {
        hasReceivedData = true;
        clearTimeout(timeoutId);

        if (snapshot.empty) {
          renderNews([]);
          return;
        }

        const items = [];
        snapshot.forEach(doc => items.push({ _id: doc.id, ...doc.data() }));
        console.log(`✅ Loaded ${items.length} news items`);
        renderNews(items);
      },
      (error) => {
        clearTimeout(timeoutId);
        console.error('Firestore news error:', error);

        db.collection('news').get()
          .then(snapshot => {
            if (snapshot.empty) { renderNews([]); return; }
            const items = [];
            snapshot.forEach(doc => items.push({ _id: doc.id, ...doc.data() }));
            items.sort((a, b) => {
              const ao = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
              const bo = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
              return ao - bo;
            });
            renderNews(items);
          })
          .catch(err => {
            console.error('Firestore news fallback failed:', err);
            renderNews([]);
            newsErrorState.classList.remove('d-none');
          });
      }
    );
}
initNews();

/* ============================================================
   REVIEWS — only approved reviews are publicly readable
   (Firestore rules block unapproved docs from read)
============================================================ */
const REVIEWS_PER_PAGE = 5;

const reviewsContainer = document.getElementById('reviewsContainer');
const reviewsEmptyState = document.getElementById('reviewsEmptyState');
const reviewsErrorState = document.getElementById('reviewsErrorState');
const reviewsPagination = document.getElementById('reviewsPagination');
const reviewsPrevBtn = document.getElementById('reviewsPrevBtn');
const reviewsNextBtn = document.getElementById('reviewsNextBtn');
const reviewsPageNumbers = document.getElementById('reviewsPageNumbers');

const reviewForm = document.getElementById('reviewForm');
const reviewSubmitBtn = document.getElementById('reviewSubmitBtn');
const reviewSpinner = document.getElementById('reviewSpinner');
const reviewSubmitText = document.getElementById('reviewSubmitText');
const reviewSuccess = document.getElementById('reviewSuccess');
const starButtons = document.querySelectorAll('#starRating .star-btn');
const reviewStarsInput = document.getElementById('reviewStars');
const starHint = document.getElementById('starHint');

let allReviewItems = [];
let currentReviewsPage = 1;
let reviewSubmitting = false;
let selectedRating = 0;

function highlightStars(rating) {
  starButtons.forEach(btn => {
    const r = parseInt(btn.dataset.rating, 10);
    btn.classList.toggle('active', r <= rating);
  });
  if (rating > 0) {
    starHint.textContent = rating === 1 ? '1 star selected' : `${rating} stars selected`;
  } else {
    starHint.textContent = 'Tap a star to rate';
  }
}

starButtons.forEach(btn => {
  btn.addEventListener('mouseenter', () => {
    const r = parseInt(btn.dataset.rating, 10);
    starButtons.forEach(b => {
      const br = parseInt(b.dataset.rating, 10);
      b.classList.toggle('active', br <= r);
    });
  });
  btn.addEventListener('mouseleave', () => highlightStars(selectedRating));
  btn.addEventListener('click', () => {
    selectedRating = parseInt(btn.dataset.rating, 10);
    reviewStarsInput.value = selectedRating;
    highlightStars(selectedRating);
    clearReviewError('reviewStars');
  });
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      btn.click();
    }
  });
});

function buildReviewCard(item) {
  const col = document.createElement('div');
  col.className = 'col-6 col-lg-4';
  col.setAttribute('data-aos', 'fade-up');

  const name = escapeHtml(item.name || 'Anonymous');
  const role = escapeHtml(item.role || '');
  const message = escapeHtml(item.message || '');
  const rating = Math.max(1, Math.min(5, parseInt(item.rating, 10) || 5));

  let dateStr = '';
  if (item.createdAt && typeof item.createdAt.toDate === 'function') {
    dateStr = item.createdAt.toDate().toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  } else if (item.createdAt && typeof item.createdAt.seconds === 'number') {
    dateStr = new Date(item.createdAt.seconds * 1000).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  const starsHtml = Array.from({ length: 5 }, (_, i) =>
    `<i class="bi bi-star-fill${i < rating ? '' : ' empty'}"></i>`
  ).join('');

  col.innerHTML = `
    <article class="review-card">
      <div class="review-stars">${starsHtml}</div>
      <p class="review-message">"${message}"</p>
      <div class="review-meta">
        <span class="review-author">— ${name}</span>
        ${role ? `<span class="review-role">${role}</span>` : ''}
        ${dateStr ? `<span class="review-date">${escapeHtml(dateStr)}</span>` : ''}
      </div>
    </article>
  `;

  return col;
}

function renderPaginationNumbers(container, totalPages, currentPage, onPageClick) {
  container.innerHTML = '';
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  if (startPage > 1) {
    const firstBtn = document.createElement('button');
    firstBtn.className = 'news-page-num';
    firstBtn.textContent = '1';
    firstBtn.setAttribute('aria-label', 'Go to page 1');
    firstBtn.addEventListener('click', () => onPageClick(1));
    container.appendChild(firstBtn);

    if (startPage > 2) {
      const ellipsis = document.createElement('span');
      ellipsis.textContent = '…';
      ellipsis.style.color = 'var(--gray)';
      ellipsis.style.alignSelf = 'center';
      ellipsis.style.padding = '0 0.2rem';
      container.appendChild(ellipsis);
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement('button');
    btn.className = 'news-page-num' + (i === currentPage ? ' active' : '');
    btn.textContent = i;
    btn.setAttribute('aria-label', `Go to page ${i}`);
    if (i === currentPage) btn.setAttribute('aria-current', 'page');
    btn.addEventListener('click', () => onPageClick(i));
    container.appendChild(btn);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const ellipsis = document.createElement('span');
      ellipsis.textContent = '…';
      ellipsis.style.color = 'var(--gray)';
      ellipsis.style.alignSelf = 'center';
      ellipsis.style.padding = '0 0.2rem';
      container.appendChild(ellipsis);
    }
    const lastBtn = document.createElement('button');
    lastBtn.className = 'news-page-num';
    lastBtn.textContent = totalPages;
    lastBtn.setAttribute('aria-label', `Go to page ${totalPages}`);
    lastBtn.addEventListener('click', () => onPageClick(totalPages));
    container.appendChild(lastBtn);
  }
}

function renderReviewsPage(page) {
  reviewsContainer.innerHTML = '';

  if (!allReviewItems.length) {
    reviewsEmptyState.classList.remove('d-none');
    reviewsErrorState.classList.add('d-none');
    reviewsPagination.classList.add('d-none');
    return;
  }

  reviewsEmptyState.classList.add('d-none');
  reviewsErrorState.classList.add('d-none');

  const totalPages = Math.ceil(allReviewItems.length / REVIEWS_PER_PAGE);
  currentReviewsPage = Math.min(Math.max(1, page), totalPages);

  const start = (currentReviewsPage - 1) * REVIEWS_PER_PAGE;
  const pageItems = allReviewItems.slice(start, start + REVIEWS_PER_PAGE);

  pageItems.forEach(item => reviewsContainer.appendChild(buildReviewCard(item)));

  if (window.AOS && typeof AOS.refresh === 'function') AOS.refresh();

  if (totalPages > 1) {
    reviewsPagination.classList.remove('d-none');
    renderPaginationNumbers(reviewsPageNumbers, totalPages, currentReviewsPage, renderReviewsPage);
    reviewsPrevBtn.disabled = currentReviewsPage === 1;
    reviewsNextBtn.disabled = currentReviewsPage === totalPages;
  } else {
    reviewsPagination.classList.add('d-none');
  }
}

function renderReviews(items) {
  allReviewItems = items || [];
  currentReviewsPage = 1;
  renderReviewsPage(1);
}

reviewsPrevBtn.addEventListener('click', () => {
  if (currentReviewsPage > 1) renderReviewsPage(currentReviewsPage - 1);
});
reviewsNextBtn.addEventListener('click', () => {
  const totalPages = Math.ceil(allReviewItems.length / REVIEWS_PER_PAGE);
  if (currentReviewsPage < totalPages) renderReviewsPage(currentReviewsPage + 1);
});

function initReviews() {
  let hasReceivedData = false;
  const timeoutId = setTimeout(() => {
    if (!hasReceivedData) {
      console.warn('Firestore reviews fetch timed out.');
      renderReviews([]);
      reviewsErrorState.classList.remove('d-none');
    }
  }, 10000);

  // Only fetch reviews where approved == true
  db.collection('reviews')
    .where('approved', '==', true)
    .onSnapshot(
      (snapshot) => {
        hasReceivedData = true;
        clearTimeout(timeoutId);

        if (snapshot.empty) {
          renderReviews([]);
          return;
        }

        const items = [];
        snapshot.forEach(doc => items.push({ _id: doc.id, ...doc.data() }));

        // Sort by createdAt desc on the client
        items.sort((a, b) => {
          const at = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate().getTime() : 0;
          const bt = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate().getTime() : 0;
          return bt - at;
        });

        console.log(`✅ Loaded ${items.length} approved reviews`);
        renderReviews(items);
      },
      (error) => {
        clearTimeout(timeoutId);
        console.error('Firestore reviews error:', error);
        renderReviews([]);
        reviewsErrorState.classList.remove('d-none');
      }
    );
}
initReviews();

function showReviewError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorDiv = document.getElementById(fieldId + 'Error');
  if (field) field.classList.add('is-invalid');
  if (errorDiv) errorDiv.textContent = message;
}
function clearReviewError(fieldId) {
  const field = document.getElementById(fieldId);
  const errorDiv = document.getElementById(fieldId + 'Error');
  if (field) field.classList.remove('is-invalid');
  if (errorDiv) errorDiv.textContent = '';
}

function validateReviewForm() {
  let isValid = true;

  const name = document.getElementById('reviewName').value.trim();
  if (!name) { showReviewError('reviewName', 'Please enter your name.'); isValid = false; }
  else if (name.length < 2) { showReviewError('reviewName', 'Name must be at least 2 characters.'); isValid = false; }
  else if (name.length > 60) { showReviewError('reviewName', 'Name must be 60 characters or fewer.'); isValid = false; }
  else clearReviewError('reviewName');

  const rating = parseInt(reviewStarsInput.value, 10) || 0;
  if (rating < 1) {
    showReviewError('reviewStars', 'Please select a star rating.');
    isValid = false;
  } else clearReviewError('reviewStars');

  const message = document.getElementById('reviewMessage').value.trim();
  if (!message) { showReviewError('reviewMessage', 'Please write your review.'); isValid = false; }
  else if (message.length < 10) { showReviewError('reviewMessage', 'Review must be at least 10 characters.'); isValid = false; }
  else if (message.length > 1000) { showReviewError('reviewMessage', 'Review must be 1000 characters or fewer.'); isValid = false; }
  else clearReviewError('reviewMessage');

  return isValid;
}

['reviewName', 'reviewMessage'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', () => clearReviewError(id));
});

reviewForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (reviewSubmitting) return;
  if (!validateReviewForm()) return;

  reviewSubmitting = true;
  reviewSubmitBtn.disabled = true;
  reviewSpinner.classList.remove('d-none');
  reviewSubmitText.textContent = 'Submitting...';

  // Cap role to 100 characters (matches Firestore rule)
  const roleValue = document.getElementById('reviewRole').value.trim().slice(0, 100);

  const reviewData = {
    name: document.getElementById('reviewName').value.trim().slice(0, 60),
    role: roleValue,
    rating: parseInt(reviewStarsInput.value, 10) || 0,
    message: document.getElementById('reviewMessage').value.trim().slice(0, 1000),
    approved: false, // Requires admin approval before appearing publicly
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    const docRef = await db.collection('reviews').add(reviewData);
    console.log('✅ Review submitted (pending approval):', docRef.id);

    reviewForm.classList.add('d-none');
    reviewSuccess.classList.remove('d-none');
    reviewSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });

    reviewForm.reset();
    selectedRating = 0;
    reviewStarsInput.value = 0;
    highlightStars(0);
  } catch (error) {
    console.error('Review submission error:', error);
    let msg = 'Something went wrong. Please try again later.';
    if (error.code === 'permission-denied') msg = 'Submission blocked. Please check the form and try again.';
    else if (error.code === 'unavailable') msg = 'Network error. Please check your connection.';
    else if (error.code === 'deadline-exceeded') msg = 'Request timed out. Please try again.';
    alert(msg);
  } finally {
    reviewSubmitting = false;
    reviewSubmitBtn.disabled = false;
    reviewSpinner.classList.add('d-none');
    reviewSubmitText.textContent = 'Submit Review';
  }
});

document.getElementById('reviewAgainBtn')?.addEventListener('click', () => {
  reviewSuccess.classList.add('d-none');
  reviewForm.classList.remove('d-none');
  reviewForm.reset();
  selectedRating = 0;
  reviewStarsInput.value = 0;
  highlightStars(0);
  reviewForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

highlightStars(0);




/* ============================================================
   DOWNLOADS JOURNAL — Firestore, filterable, paginated
   ============================================================
   Firestore document structure for /downloads/{docId}:

   {
     title: "Class 5 Maths Syllabus",
     description: "Complete syllabus for Class 5 Mathematics.",
     category: "Syllabus",
     class: "class5",
     classLabel: "Class 5",
     type: "pdf",
     url: "https://example.com/class5-maths.pdf",
     fileSize: "1.2 MB",
     order: 1
   }

   Rules:
   match /downloads/{docId} {
     allow read: if true;
     allow write: if isAdmin();
   }
============================================================ */

const DOWNLOADS_PER_PAGE = 6;

const downloadsGrid = document.getElementById('downloadsGrid');
const downloadsEmptyState = document.getElementById('downloadsEmptyState');
const downloadsErrorState = document.getElementById('downloadsErrorState');
const downloadsPagination = document.getElementById('downloadsPagination');
const downloadsPrevBtn = document.getElementById('downloadsPrevBtn');
const downloadsNextBtn = document.getElementById('downloadsNextBtn');
const downloadsPageNumbers = document.getElementById('downloadsPageNumbers');
const downloadFilters = document.querySelectorAll('.download-filter');

let allDownloadItems = [];
let filteredDownloadItems = [];
let currentDownloadsPage = 1;
let activeDownloadClass = 'all';

/* Map file type → Bootstrap icon + label */
function downloadIconFor(type) {
  switch ((type || '').toLowerCase()) {
    case 'pdf': return { icon: 'bi-file-earmark-pdf-fill', label: 'PDF' };
    case 'book': return { icon: 'bi-book-fill', label: 'Book' };
    case 'newspaper': return { icon: 'bi-newspaper', label: 'Newspaper' };
    case 'article': return { icon: 'bi-journal-text', label: 'Article' };
    case 'syllabus': return { icon: 'bi-list-check', label: 'Syllabus' };
    case 'link': return { icon: 'bi-link-45deg', label: 'Link' };
    case 'video': return { icon: 'bi-play-btn-fill', label: 'Video' };
    default: return { icon: 'bi-file-earmark-text-fill', label: 'File' };
  }
}

function buildDownloadCard(item) {
  const card = document.createElement('a');
  card.className = 'download-card';
  card.setAttribute('data-class', item.class || 'misc');
  card.setAttribute('data-type', (item.type || 'pdf').toLowerCase());

  const safeUrl = sanitizeUrl(item.url || '#');
  const typeInfo = downloadIconFor(item.type);
  const title = escapeHtml(item.title || 'Untitled resource');
  const description = escapeHtml(item.description || '');
  const category = escapeHtml(item.category || 'Resource');
  const fileSize = item.fileSize ? escapeHtml(item.fileSize) : '';

  card.href = safeUrl || '#';
  card.target = '_blank';
  card.rel = 'noopener noreferrer';

  card.innerHTML = `
    <div class="download-card-icon">
      <i class="bi ${typeInfo.icon}"></i>
    </div>
    <span class="download-card-category">${category}</span>
    <h3 class="download-card-title">${title}</h3>
    <p class="download-card-desc">${description}</p>
    <div class="download-card-footer">
      <div class="download-card-meta">
        <span class="download-card-filetype">${escapeHtml(typeInfo.label)}</span>
        ${fileSize ? `<span class="download-card-size">${fileSize}</span>` : ''}
      </div>
      <span class="download-card-action">
        <i class="bi bi-arrow-down-circle-fill"></i>
        Open
      </span>
    </div>
  `;

  return card;
}

/* ---------- Filter with page preservation ---------- */
function applyDownloadsFilter(preservePage = false) {
  const previousPage = currentDownloadsPage;

  if (activeDownloadClass === 'all') {
    filteredDownloadItems = allDownloadItems.slice();
  } else {
    filteredDownloadItems = allDownloadItems.filter(
      item => (item.class || 'misc') === activeDownloadClass
    );
  }

  if (preservePage && previousPage > 0) {
    renderDownloadsPage(previousPage);
  } else {
    currentDownloadsPage = 1;
    renderDownloadsPage(1);
  }
}

function renderDownloadsPage(page) {
  downloadsGrid.innerHTML = '';

  if (!filteredDownloadItems.length) {
    downloadsEmptyState.classList.remove('d-none');
    downloadsErrorState.classList.add('d-none');
    downloadsPagination.classList.add('d-none');
    return;
  }

  downloadsEmptyState.classList.add('d-none');
  downloadsErrorState.classList.add('d-none');

  const totalPages = Math.ceil(filteredDownloadItems.length / DOWNLOADS_PER_PAGE);
  currentDownloadsPage = Math.min(Math.max(1, page), totalPages);

  const start = (currentDownloadsPage - 1) * DOWNLOADS_PER_PAGE;
  const pageItems = filteredDownloadItems.slice(start, start + DOWNLOADS_PER_PAGE);

  pageItems.forEach(item => downloadsGrid.appendChild(buildDownloadCard(item)));

  if (window.AOS && typeof AOS.refresh === 'function') AOS.refresh();

  if (totalPages > 1) {
    downloadsPagination.classList.remove('d-none');
    renderPaginationNumbers(downloadsPageNumbers, totalPages, currentDownloadsPage, renderDownloadsPage);
    downloadsPrevBtn.disabled = currentDownloadsPage === 1;
    downloadsNextBtn.disabled = currentDownloadsPage === totalPages;
  } else {
    downloadsPagination.classList.add('d-none');
  }
}

downloadsPrevBtn.addEventListener('click', () => {
  if (currentDownloadsPage > 1) renderDownloadsPage(currentDownloadsPage - 1);
});
downloadsNextBtn.addEventListener('click', () => {
  const totalPages = Math.ceil(filteredDownloadItems.length / DOWNLOADS_PER_PAGE);
  if (currentDownloadsPage < totalPages) renderDownloadsPage(currentDownloadsPage + 1);
});

/* ---------- Filter chip clicks ---------- */
downloadFilters.forEach(btn => {
  btn.addEventListener('click', () => {
    downloadFilters.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    activeDownloadClass = btn.dataset.class || 'all';
    applyDownloadsFilter(false);   // reset to page 1 on filter change
  });
});

/* ---------- Firestore live subscription ---------- */
function initDownloads() {
  let hasReceivedData = false;
  const timeoutId = setTimeout(() => {
    if (!hasReceivedData) {
      console.warn('Firestore downloads fetch timed out.');
      allDownloadItems = [];
      applyDownloadsFilter(false);
      downloadsErrorState.classList.remove('d-none');
    }
  }, 10000);

  db.collection('downloads')
    .orderBy('order', 'asc')
    .onSnapshot(
      (snapshot) => {
        hasReceivedData = true;
        clearTimeout(timeoutId);

        const items = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.url && sanitizeUrl(data.url)) {
            items.push({ _id: doc.id, ...data });
          }
        });

        console.log(`✅ Loaded ${items.length} downloads`);
        allDownloadItems = items;
        applyDownloadsFilter(true);   // preserve page on live updates
      },
      (error) => {
        clearTimeout(timeoutId);
        console.error('Firestore downloads error:', error);

        db.collection('downloads').get()
          .then(snapshot => {
            const items = [];
            snapshot.forEach(doc => {
              const data = doc.data();
              if (data.url && sanitizeUrl(data.url)) {
                items.push({ _id: doc.id, ...data });
              }
            });
            items.sort((a, b) => {
              const ao = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
              const bo = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
              return ao - bo;
            });
            allDownloadItems = items;
            applyDownloadsFilter(false);
          })
          .catch(err => {
            console.error('Firestore downloads fallback failed:', err);
            allDownloadItems = [];
            applyDownloadsFilter(false);
            downloadsErrorState.classList.remove('d-none');
          });
      }
    );
}
initDownloads();

/* ============================================================
   GALLERY — Journal
============================================================ */
const galleryVolumes = [
  {
    number: "Volume I",
    title: "Campus",
    subtitle: "Our grounds, our pride",
    images: [
      { src: "campus.jpg", alt: "Main campus building" },
      { src: "main4.jpg", alt: "Library interior" },
      { src: "main2.jpg", alt: "Safe campus grounds" },
      { src: "main3.jpg", alt: "Creative learning space" },
      { src: "main5.jpg", alt: "Outdoor activity area" }
    ]
  },
  {
    number: "Volume II",
    title: "Classrooms",
    subtitle: "Where curiosity begins",
    images: [
      { src: "c1.jpg", alt: "Smart classroom" },
      { src: "c2.jpg", alt: "Computer lab" },
      { src: "c3.jpg", alt: "Science lab" },
      { src: "c4.jpg", alt: "Reading corner" },
      { src: "c5.jpg", alt: "Creative classroom" }
    ]
  },
  {
    number: "Volume III",
    title: "Activities",
    subtitle: "Learning beyond books",
    images: [
      { src: "activity2.jpg", alt: "Art activity" },
      { src: "activity8.jpg", alt: "Activity area" },
      { src: "activity4.jpg", alt: "Creative workshop" },
      { src: "activity6.jpg", alt: "Sports activity" },
      { src: "activity7.jpg", alt: "Reading session" }
    ]
  },
  {
    number: "Volume IV",
    title: "Events",
    subtitle: "Celebrations and milestones",
    images: [
      { src: "event1.jpg", alt: "Annual day" },
      { src: "event2.jpg", alt: "Campus event" },
      { src: "event3.jpg", alt: "Art showcase" },
      { src: "event4.jpg", alt: "Sports day" },
      { src: "event5.jpg", alt: "Gathering" }
    ]
  },
  {
    number: "Volume V",
    title: "Sports",
    subtitle: "Strength in motion",
    images: [
      { src: "sports1.jpg", alt: "Sports day" },
      { src: "sports2.jpg", alt: "Sports ground" },
      { src: "sports3.jpg", alt: "Activity field" },
      { src: "sports4.jpg", alt: "Campus grounds" },
      { src: "sports5.jpg", alt: "Outdoor area" }
    ]
  }
];

function shuffleArray(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildJournalVolume(volume, volumeIndex) {
  const wrapper = document.createElement('div');
  wrapper.className = 'journal-volume';
  wrapper.setAttribute('data-aos', 'fade-up');
  wrapper.setAttribute('data-aos-delay', String(volumeIndex * 80));

  const shuffled = shuffleArray(volume.images);

  const stack = document.createElement('div');
  stack.className = 'journal-stack';

  shuffled.forEach((img, idx) => {
    const safeSrc = sanitizeUrl(img.src) || img.src;
    const safeAlt = escapeHtml(img.alt || 'Gallery image');

    const card = document.createElement('div');
    card.className = `journal-card pos-${idx + 1} lightbox-trigger`;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `View ${safeAlt}`);

    card.innerHTML = `
      <img src="${escapeHtml(safeSrc)}" alt="${safeAlt}" loading="lazy" draggable="false" />
      <div class="journal-card-label">${safeAlt}</div>
    `;

    stack.appendChild(card);
  });

  const header = document.createElement('div');
  header.className = 'journal-header';
  header.innerHTML = `
    <div class="journal-title-wrap">
      <span class="journal-volume-number">${escapeHtml(volume.number)}</span>
      <h3 class="journal-title">${escapeHtml(volume.title)}</h3>
      <p class="journal-subtitle">${escapeHtml(volume.subtitle || '')}</p>
    </div>
    <span class="journal-count">${volume.images.length} photos</span>
  `;

  wrapper.appendChild(header);
  wrapper.appendChild(stack);

  return wrapper;
}

function renderJournal() {
  const grid = document.getElementById('journalGrid');
  if (!grid) return;

  grid.innerHTML = '';

  galleryVolumes.forEach((volume, idx) => {
    grid.appendChild(buildJournalVolume(volume, idx));
  });

  if (window.AOS && typeof AOS.refresh === 'function') {
    AOS.refresh();
  }

  attachLightboxTriggers();
}

/* ============================================================
   LIGHTBOX
============================================================ */
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');
const lightboxCounter = document.getElementById('lightboxCounter');

let lightboxItems = [];
let lightboxIndex = 0;
let lastFocusedLightbox = null;
let scrollLockY = 0;

function collectLightboxItems() {
  return Array.from(document.querySelectorAll('.lightbox-trigger'))
    .filter(el => !el.classList.contains('hide'))
    .map(el => {
      const img = el.querySelector('img');
      return img ? { src: img.src, alt: img.alt } : null;
    })
    .filter(Boolean);
}

function openLightboxAt(index) {
  lightboxItems = collectLightboxItems();
  if (!lightboxItems.length) return;
  lightboxIndex = Math.max(0, Math.min(index, lightboxItems.length - 1));
  updateLightboxImage();
  lastFocusedLightbox = document.activeElement;

  scrollLockY = window.scrollY || window.pageYOffset || 0;
  document.body.style.setProperty('--scroll-lock-y', `-${scrollLockY}px`);
  document.body.classList.add('lightbox-open');

  lightbox.classList.remove('d-none');

  if (document.activeElement && typeof document.activeElement.blur === 'function') {
    document.activeElement.blur();
  }

  setTimeout(() => lightboxClose.focus({ preventScroll: true }), 40);
}

function updateLightboxImage() {
  const item = lightboxItems[lightboxIndex];
  if (!item) return;
  lightboxImg.src = item.src;
  lightboxImg.alt = item.alt || 'Enlarged image';
  if (lightboxCounter) {
    lightboxCounter.textContent = `${lightboxIndex + 1} / ${lightboxItems.length}`;
  }
}

function closeLightbox() {
  lightbox.classList.add('d-none');
  document.body.classList.remove('lightbox-open');
  document.body.style.removeProperty('--scroll-lock-y');

  window.scrollTo({ top: scrollLockY, left: 0, behavior: 'instant' });

  if (document.activeElement && typeof document.activeElement.blur === 'function') {
    document.activeElement.blur();
  }

  if (lastFocusedLightbox && typeof lastFocusedLightbox.focus === 'function') {
    lastFocusedLightbox.focus({ preventScroll: true });
  }
}

function attachLightboxTriggers() {
  document.querySelectorAll('.lightbox-trigger').forEach(trigger => {
    if (trigger.dataset.lightboxBound === '1') return;
    trigger.dataset.lightboxBound = '1';

    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const all = Array.from(document.querySelectorAll('.lightbox-trigger'))
        .filter(el => !el.classList.contains('hide'));
      const index = all.indexOf(trigger);
      if (index < 0) return;
      openLightboxAt(index);
    });

    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const all = Array.from(document.querySelectorAll('.lightbox-trigger'))
          .filter(el => !el.classList.contains('hide'));
        const index = all.indexOf(trigger);
        if (index < 0) return;
        openLightboxAt(index);
      }
    });
  });
}

lightboxClose.addEventListener('click', (e) => {
  e.stopPropagation();
  closeLightbox();
});
lightboxClose.addEventListener('pointerdown', (e) => {
  e.stopPropagation();
});

lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

lightboxPrev.addEventListener('click', (e) => {
  e.stopPropagation();
  if (!lightboxItems.length) return;
  lightboxIndex = (lightboxIndex - 1 + lightboxItems.length) % lightboxItems.length;
  updateLightboxImage();
});

lightboxNext.addEventListener('click', (e) => {
  e.stopPropagation();
  if (!lightboxItems.length) return;
  lightboxIndex = (lightboxIndex + 1) % lightboxItems.length;
  updateLightboxImage();
});

document.addEventListener('keydown', (e) => {
  if (lightbox.classList.contains('d-none')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') lightboxPrev.click();
  if (e.key === 'ArrowRight') lightboxNext.click();
});

/* ============================================================
   INITIALIZE
============================================================ */
attachLightboxTriggers();
renderJournal();

/* ============================================================
   ADMISSION FORM
============================================================ */
const admissionForm = document.getElementById('admissionFormElement');
const successMessage = document.getElementById('successMessage');
const submitBtn = document.getElementById('submitBtn');
const submitSpinner = document.getElementById('submitSpinner');
const submitText = document.getElementById('submitText');
let admissionSubmitting = false;

function showError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorDiv = document.getElementById(fieldId + 'Error');
  if (field) field.classList.add('is-invalid');
  if (errorDiv) errorDiv.textContent = message;
}
function clearError(fieldId) {
  const field = document.getElementById(fieldId);
  const errorDiv = document.getElementById(fieldId + 'Error');
  if (field) field.classList.remove('is-invalid');
  if (errorDiv) errorDiv.textContent = '';
}
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validatePhone(phone) {
  return /^[0-9+\-\s()]{7,20}$/.test(phone);
}

function validateAdmissionForm() {
  let isValid = true;

  if (!document.getElementById('studentName').value.trim()) {
    showError('studentName', 'Student name is required.'); isValid = false;
  } else clearError('studentName');

  if (!document.getElementById('dateOfBirth').value) {
    showError('dateOfBirth', 'Date of birth is required.'); isValid = false;
  } else clearError('dateOfBirth');

  if (!document.getElementById('gender').value) {
    showError('gender', 'Please select gender.'); isValid = false;
  } else clearError('gender');

  if (!document.getElementById('applyingClass').value) {
    showError('applyingClass', 'Please select a class.'); isValid = false;
  } else clearError('applyingClass');

  if (!document.getElementById('fatherName').value.trim()) {
    showError('fatherName', "Father's name is required."); isValid = false;
  } else clearError('fatherName');

  if (!document.getElementById('motherName').value.trim()) {
    showError('motherName', "Mother's name is required."); isValid = false;
  } else clearError('motherName');

  const mobile = document.getElementById('mobile').value.trim();
  if (!mobile) { showError('mobile', 'Mobile number is required.'); isValid = false; }
  else if (!validatePhone(mobile)) { showError('mobile', 'Enter a valid phone number (7–20 digits).'); isValid = false; }
  else clearError('mobile');

  const email = document.getElementById('email').value.trim();
  if (!email) { showError('email', 'Email is required.'); isValid = false; }
  else if (!validateEmail(email)) { showError('email', 'Enter a valid email address.'); isValid = false; }
  else clearError('email');

  if (!document.getElementById('address').value.trim()) {
    showError('address', 'Address is required.'); isValid = false;
  } else clearError('address');

  if (!document.getElementById('city').value.trim()) {
    showError('city', 'City is required.'); isValid = false;
  } else clearError('city');

  if (!document.getElementById('consent').checked) {
    showError('consent', 'You must confirm the information is accurate.'); isValid = false;
  } else clearError('consent');

  return isValid;
}

document.querySelectorAll('#admissionFormElement input, #admissionFormElement select, #admissionFormElement textarea').forEach(el => {
  el.addEventListener('input', () => { if (el.id) clearError(el.id); });
  el.addEventListener('change', () => { if (el.id) clearError(el.id); });
});

admissionForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (admissionSubmitting) return;
  if (!validateAdmissionForm()) return;

  admissionSubmitting = true;
  submitBtn.disabled = true;
  submitSpinner.classList.remove('d-none');
  submitText.textContent = 'Submitting...';

  const formData = {
    studentName: document.getElementById('studentName').value.trim(),
    dateOfBirth: document.getElementById('dateOfBirth').value,
    gender: document.getElementById('gender').value,
    applyingClass: document.getElementById('applyingClass').value,
    previousSchool: document.getElementById('previousSchool').value.trim(),
    academicSession: document.getElementById('academicSession').value,
    fatherName: document.getElementById('fatherName').value.trim(),
    motherName: document.getElementById('motherName').value.trim(),
    guardianName: document.getElementById('guardianName').value.trim(),
    mobile: document.getElementById('mobile').value.trim(),
    whatsapp: document.getElementById('whatsapp').value.trim(),
    email: document.getElementById('email').value.trim(),
    address: document.getElementById('address').value.trim(),
    area: document.getElementById('area').value.trim(),
    city: document.getElementById('city').value.trim(),
    district: document.getElementById('district').value.trim(),
    state: document.getElementById('state').value.trim(),
    pinCode: document.getElementById('pinCode').value.trim(),
    emergencyContact: document.getElementById('emergencyContact').value.trim(),
    previousAcademicInfo: document.getElementById('previousAcademicInfo').value.trim(),
    additionalInformation: document.getElementById('additionalInformation').value.trim().slice(0, 2000),
    status: 'new',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    const docRef = await db.collection('admissions').add(formData);
    console.log('✅ Admission submitted:', docRef.id);

    document.getElementById('refId').textContent = 'ADM-' + docRef.id.slice(-8).toUpperCase();
    document.getElementById('refDate').textContent = new Date().toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    admissionForm.classList.add('d-none');
    successMessage.classList.remove('d-none');
    successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (error) {
    console.error('Admission submission error:', error);
    let msg = 'Something went wrong. Please try again later.';
    if (error.code === 'permission-denied') msg = 'Submission blocked. Please check the form and try again.';
    else if (error.code === 'unavailable') msg = 'Network error. Please check your connection.';
    else if (error.code === 'deadline-exceeded') msg = 'Request timed out. Please try again.';
    alert(msg);
  } finally {
    admissionSubmitting = false;
    submitBtn.disabled = false;
    submitSpinner.classList.add('d-none');
    submitText.textContent = 'Submit Admission Application';
  }
});

/* ============================================================
   ADMISSION PDF DOWNLOAD
   Generates a clean PDF with all submitted admission details.
============================================================ */
document.getElementById('printBtn')?.addEventListener('click', () => {
  try {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
      alert('PDF library failed to load. Please refresh the page and try again.');
      return;
    }

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    // Colors
    const navy = [1, 25, 89];
    const crimson = [199, 0, 55];
    const gold = [194, 183, 119];
    const gray = [107, 114, 128];

    // Page dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    let y = margin;

    // ---------- Header band ----------
    doc.setFillColor(navy[0], navy[1], navy[2]);
    doc.rect(0, 0, pageWidth, 90, 'F');

    // Gold accent line
    doc.setFillColor(gold[0], gold[1], gold[2]);
    doc.rect(0, 90, pageWidth, 3, 'F');

    // School name
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Genesis Global Academy', margin, 40);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(194, 183, 119);
    doc.text('Admission Application Confirmation', margin, 60);

    y = 120;

    // ---------- Reference badge ----------
    const refId = document.getElementById('refId').textContent || '';
    const refDate = document.getElementById('refDate').textContent || '';

    doc.setFillColor(248, 247, 242);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 55, 6, 6, 'F');

    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('REFERENCE ID', margin + 15, y + 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(crimson[0], crimson[1], crimson[2]);
    doc.text(refId, margin + 15, y + 40);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text('SUBMITTED ON', pageWidth / 2 + 15, y + 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text(refDate, pageWidth / 2 + 15, y + 40);

    y += 80;

    // ---------- Helper to draw sections ----------
    function drawSection(title, rows) {
      // Section title with gold underline
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(navy[0], navy[1], navy[2]);
      doc.text(title, margin, y);

      doc.setFillColor(gold[0], gold[1], gold[2]);
      doc.rect(margin, y + 5, 40, 2, 'F');

      y += 22;

      // Rows
      doc.setFontSize(10);
      rows.forEach(([label, value]) => {
        if (y > pageHeight - 60) {
          doc.addPage();
          y = margin;
        }

        // Label column
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(gray[0], gray[1], gray[2]);
        doc.text(label, margin, y);

        // Value column
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(17, 24, 39);

        // Wrap long values
        const valueText = value || '—';
        const maxValueWidth = pageWidth - margin * 2 - 160;
        const lines = doc.splitTextToSize(valueText, maxValueWidth);
        doc.text(lines, margin + 160, y);

        y += Math.max(16, lines.length * 13);
      });

      y += 12;
    }

    // ---------- Pull form values ----------
    const getVal = (id) => {
      const el = document.getElementById(id);
      return el && el.value ? el.value.trim() : '';
    };

    // ---------- Sections ----------
    drawSection('STUDENT INFORMATION', [
      ['Student Name',   getVal('studentName')],
      ['Date of Birth',  getVal('dateOfBirth')],
      ['Gender',         getVal('gender')],
      ['Applying Class', getVal('applyingClass')],
      ['Academic Session', getVal('academicSession')],
      ['Previous School', getVal('previousSchool')]
    ]);

    drawSection('PARENT / GUARDIAN', [
      ["Father's Name",  getVal('fatherName')],
      ["Mother's Name",  getVal('motherName')],
      ['Guardian Name',  getVal('guardianName')],
      ['Mobile Number',  getVal('mobile')],
      ['WhatsApp',       getVal('whatsapp')],
      ['Email Address',  getVal('email')]
    ]);

    drawSection('ADDRESS', [
      ['House / Street', getVal('address')],
      ['Area',           getVal('area')],
      ['City',           getVal('city')],
      ['District',       getVal('district')],
      ['State',          getVal('state')],
      ['PIN Code',       getVal('pinCode')]
    ]);

    drawSection('ADDITIONAL INFORMATION', [
      ['Emergency Contact',   getVal('emergencyContact')],
      ['Previous Academic Info', getVal('previousAcademicInfo')],
      ['Message / Notes',     getVal('additionalInformation')]
    ]);

    // ---------- Footer ----------
    const footerY = pageHeight - 50;

    doc.setDrawColor(194, 183, 119);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.text(
      'This is a system-generated admission confirmation. The school administration will contact you using the details provided.',
      margin,
      footerY,
      { maxWidth: pageWidth - margin * 2 }
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(
      '© 2026 Genesis Global Academy',
      pageWidth - margin,
      pageHeight - 20,
      { align: 'right' }
    );

    // ---------- Save ----------
    const fileName = `Admission_${(getVal('studentName') || 'Application').replace(/\s+/g, '_')}_${refId.slice(-8) || 'GGA'}.pdf`;
    doc.save(fileName);

    console.log('✅ PDF downloaded:', fileName);

  } catch (error) {
    console.error('PDF generation failed:', error);
    alert('Could not generate PDF. Please try again.');
  }
});
document.getElementById('backBtn')?.addEventListener('click', () => {
  successMessage.classList.add('d-none');
  admissionForm.classList.remove('d-none');
  admissionForm.reset();
  document.getElementById('admissions').scrollIntoView({ behavior: 'smooth' });
});

/* ============================================================
   CONTACT FORM
============================================================ */
const contactForm = document.getElementById('contactForm');
const contactSuccess = document.getElementById('contactSuccess');
const contactSubmitBtn = document.getElementById('contactSubmitBtn');
const contactSpinner = document.getElementById('contactSpinner');
const contactSubmitText = document.getElementById('contactSubmitText');
let contactSubmitting = false;

function showContactError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorDiv = document.getElementById(fieldId + 'Error');
  if (field) field.classList.add('is-invalid');
  if (errorDiv) errorDiv.textContent = message;
}
function clearContactError(fieldId) {
  const field = document.getElementById(fieldId);
  const errorDiv = document.getElementById(fieldId + 'Error');
  if (field) field.classList.remove('is-invalid');
  if (errorDiv) errorDiv.textContent = '';
}

function validateContactForm() {
  let isValid = true;

  if (!document.getElementById('contactName').value.trim()) {
    showContactError('contactName', 'Name is required.'); isValid = false;
  } else clearContactError('contactName');

  const email = document.getElementById('contactEmail').value.trim();
  if (!email) { showContactError('contactEmail', 'Email is required.'); isValid = false; }
  else if (!validateEmail(email)) { showContactError('contactEmail', 'Enter a valid email address.'); isValid = false; }
  else clearContactError('contactEmail');

  // Optional phone: only validate if something was entered
  const phone = document.getElementById('contactPhone').value.trim();
  if (phone && (phone.length < 7 || phone.length > 20 || !/^[0-9+\-\s()]+$/.test(phone))) {
    showContactError('contactPhone', 'Enter a valid phone number (7–20 digits).');
    isValid = false;
  } else clearContactError('contactPhone');

  if (!document.getElementById('contactMessage').value.trim()) {
    showContactError('contactMessage', 'Message is required.'); isValid = false;
  } else clearContactError('contactMessage');

  return isValid;
}

document.querySelectorAll('#contactForm input, #contactForm textarea').forEach(el => {
  el.addEventListener('input', () => {
    if (el.id) {
      const errorDiv = document.getElementById(el.id + 'Error');
      if (errorDiv) {
        el.classList.remove('is-invalid');
        errorDiv.textContent = '';
      }
    }
  });
});

contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (contactSubmitting) return;
  if (!validateContactForm()) return;

  contactSubmitting = true;
  contactSubmitBtn.disabled = true;
  contactSpinner.classList.remove('d-none');
  contactSubmitText.textContent = 'Sending...';

  const contactData = {
    name: document.getElementById('contactName').value.trim().slice(0, 100),
    email: document.getElementById('contactEmail').value.trim(),
    phone: document.getElementById('contactPhone').value.trim().slice(0, 20),
    subject: document.getElementById('contactSubject').value.trim().slice(0, 150),
    message: document.getElementById('contactMessage').value.trim().slice(0, 2000),
    status: 'new',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    const docRef = await db.collection('contactMessages').add(contactData);
    console.log('✅ Contact message submitted:', docRef.id);

    contactForm.classList.add('d-none');
    contactSuccess.classList.remove('d-none');
    contactSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (error) {
    console.error('Contact submission error:', error);
    let msg = 'Something went wrong. Please try again later.';
    if (error.code === 'permission-denied') msg = 'Message blocked. Please check the form and try again.';
    else if (error.code === 'unavailable') msg = 'Network error. Please check your connection.';
    else if (error.code === 'deadline-exceeded') msg = 'Request timed out. Please try again.';
    alert(msg);
  } finally {
    contactSubmitting = false;
    contactSubmitBtn.disabled = false;
    contactSpinner.classList.add('d-none');
    contactSubmitText.textContent = 'Send Message';
  }
});

document.getElementById('contactBackBtn')?.addEventListener('click', () => {
  contactSuccess.classList.add('d-none');
  contactForm.classList.remove('d-none');
  contactForm.reset();
});

/* ============================================================
   DEBOUNCED RESIZE
============================================================ */
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (window.AOS && typeof AOS.refresh === 'function') AOS.refresh();
    updateActiveSection();
  }, 200);
});


/* ============================================================
   PWA — Service Worker Registration + Install Prompt
   ============================================================ */
(function initPWA() {
  // Bail out if service workers aren't supported
  if (!('serviceWorker' in navigator)) {
    console.log('[PWA] Service Worker not supported');
    return;
  }

  let deferredInstallPrompt = null;
  let registration = null;

  /* ---------- Register the service worker ---------- */
  window.addEventListener('load', async () => {
    try {
      registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('[PWA] Service Worker registered:', registration.scope);

      // Check for updates every hour
      setInterval(() => {
        registration.update().catch(() => {});
      }, 60 * 60 * 1000);

      // Detect when a new SW has been installed and is waiting
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateBanner(newWorker);
          }
        });
      });

    } catch (err) {
      console.warn('[PWA] Service Worker registration failed:', err);
    }
  });

  /* ---------- Handle service worker updates from the page ---------- */
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  function showUpdateBanner(worker) {
  // Update banner disabled — the service worker auto-updates silently
  // as soon as a new version is deployed.
  if (worker) {
    worker.postMessage({ type: 'SKIP_WAITING' });
  }
}

  /* ---------- Install prompt (Android/Chrome/Edge) ---------- */
  const installBanner = document.getElementById('pwaInstallBanner');
  const installBtn = document.getElementById('pwaInstallBtn');
  const installClose = document.getElementById('pwaInstallClose');

  // Don't show if the user already dismissed it recently
  const DISMISS_KEY = 'wol_pwa_dismissed_at';
  const DISMISS_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days

  function wasRecentlyDismissed() {
    try {
      const ts = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10);
      return Date.now() - ts < DISMISS_TTL;
    } catch (e) {
      return false;
    }
  }

  function rememberDismissal() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch (e) {}
  }

  // Don't show if already running as an installed app
  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing
    e.preventDefault();
    deferredInstallPrompt = e;

    if (isStandalone() || wasRecentlyDismissed()) return;

    // Show our custom banner after a short delay
    setTimeout(() => {
      if (installBanner) installBanner.classList.remove('d-none');
    }, 4000);
  });

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      console.log('[PWA] Install prompt result:', outcome);
      deferredInstallPrompt = null;
      if (installBanner) installBanner.classList.add('d-none');
    });
  }

  if (installClose) {
    installClose.addEventListener('click', () => {
      if (installBanner) installBanner.classList.add('d-none');
      rememberDismissal();
    });
  }

  // Hide banner once installed
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed');
    if (installBanner) installBanner.classList.add('d-none');
    deferredInstallPrompt = null;
  });

  /* ---------- iOS manual instructions ---------- */
  // iOS doesn't support beforeinstallprompt. Show a one-time hint.
  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }

  function isSafari() {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }

  if (isIOS() && isSafari() && !isStandalone() && !wasRecentlyDismissed()) {
    // Show a subtle banner with iOS-specific instructions
    setTimeout(() => {
      if (installBanner) {
        const textEl = installBanner.querySelector('.pwa-install-text span');
        if (textEl) {
          textEl.textContent = 'Tap the Share icon then "Add to Home Screen"';
        }
        const btnEl = installBtn;
        if (btnEl) {
          btnEl.innerHTML = '<i class="bi bi-box-arrow-up"></i> How to';
          btnEl.addEventListener('click', () => {
            alert(
              'To install this app on your iPhone or iPad:\n\n' +
              '1. Tap the Share icon at the bottom of Safari\n' +
              '2. Scroll down and tap "Add to Home Screen"\n' +
              '3. Tap "Add" in the top-right corner'
            );
          }, { once: true });
        }
        installBanner.classList.remove('d-none');
      }
    }, 6000);
  }
})();