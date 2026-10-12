/* ============================================================
   GENESIS AI — Chatbot logic
============================================================ */

/* Firebase */
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

db.enablePersistence({ synchronizeTabs: true })
  .then(() => console.log('🔥 Genesis AI: Firestore + persistence'))
  .catch(() => console.log('🔥 Genesis AI: Firestore'));

/* ============================================================
   STATIC DATA
============================================================ */
const FACULTY_DATA = [
  { name: "Mrs. Zaira Hassan", role: "Chairperson", phone: "+919622222723" },
  { name: "Mr. Sameer Hussain Mir", role: "Secretary", phone: "+917006261543" },
  { name: "Mrs. Asma Bashir", role: "Principal", phone: "+917006266499" },
  { name: "Mr. Ghulam Hassan Mir", role: "VP", phone: "+919906670378" },
  { name: "Mrs. Jabeena Mehdi", role: "AO (Accounts)", phone: "+919906852216" },
  { name: "Mr. Ahtisham Hussain", role: "Transport Head", phone: "+916006020208" }
];

const SCHOOL_INFO = {
  name: "Genesis Global Academy",
  address: "Budgam, J&K, 191111",
  phone: "+919622222723",
  email: "genesisglobalkashmir@gmail.com",
  hours: "Mon–Sat: 10:00 AM – 3:00 PM",
  lat: 34.0036886,
  lng: 74.7003737,
  mapUrl: "https://www.google.com/maps?q=34.0036886,74.7003737",
  coordsText: "34.0036886° N, 74.7003737° E"
};

const FOUNDER_STORY = `Genesis Global Academy was established upon a simple yet profound belief: that education is not merely the acquisition of knowledge, but the cultivation of minds, character, and possibility.

This school was my father’s vision—a vision rooted in the conviction that quality education should not be a privilege reserved for a few, but an opportunity made possible for all. He envisioned a place where learning would transcend textbooks and examinations; where education would cultivate curiosity, character, discipline, compassion, and purpose.

Here at Genesis Global Academy, we strive to carry that vision forward. Our endeavour is not simply to impart knowledge, but to create an environment where young minds are encouraged to question, discover, think independently, and grow into individuals who can contribute meaningfully to the world around them.

My father remained a teacher at heart wherever life took him. He gave freely of his time, listened with patience, encouraged without expectation, and found fulfilment in seeing others find their strength. For him, the true measure of education lay in what it awakened in another human being.

Imam Ja’far al-Sadiq (a.s.) said:

“Whoever teaches someone something good will receive a reward like that of the one who acts upon it, even if he dies.”

Perhaps this is the most enduring description of my father’s life.

A school, in its deepest sense, is more than a building; it is an idea entrusted to generations. Genesis Global Academy is our effort to continue his idea—that knowledge is a form of service, that education is an act of giving, and that the greatest legacy a person can leave is the light they help kindle in the minds and lives of others.

— Muntazir Mehdi, Co-founder`;

const GALLERY_VOLUMES = {
  campus: { title: "Campus", images: ["campus.jpg", "main4.jpg", "main2.jpg", "main3.jpg", "main5.jpg"] },
  classrooms: { title: "Classrooms", images: ["c1.jpg", "c2.jpg", "c3.jpg", "c4.jpg", "c5.jpg"] },
  activities: { title: "Activities", images: ["activity2.jpg", "activity8.jpg", "activity4.jpg", "activity6.jpg", "activity7.jpg"] },
  events: { title: "Events", images: ["event1.jpg", "event2.jpg", "event3.jpg", "event4.jpg", "event5.jpg"] },
  sports: { title: "Sports", images: ["sports1.jpg", "sports2.jpg", "sports3.jpg", "sports4.jpg", "sports5.jpg"] }
};

/* ============================================================
   STATE
============================================================ */
const state = {
  messages: [],
  materialCache: {}
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

function sanitizeUrl(url) {
  if (!url) return '';
  const raw = String(url).trim();
  const lower = raw.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) return '';
  return raw;
}

function formatDate(value) {
  if (!value) return '';
  let d;
  if (typeof value.toDate === 'function') d = value.toDate();
  else if (typeof value === 'object' && typeof value.seconds === 'number') d = new Date(value.seconds * 1000);
  else if (value instanceof Date) d = value;
  else d = new Date(value);
  if (isNaN(d.getTime())) return escapeHtml(String(value));
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function timeNow() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function scrollToBottom() {
  const body = document.getElementById('chatBody');
  body.scrollTop = body.scrollHeight;
}

function detectClass(text) {
  const t = text.toLowerCase();
  const map = [
    { keys: ['nursery', 'play group', 'playgroup'], value: 'nursery', label: 'Nursery' },
    { keys: ['lkg'], value: 'lkg', label: 'LKG' },
    { keys: ['ukg'], value: 'ukg', label: 'UKG' },
    { keys: ['class 1', 'class1'], value: 'class1', label: 'Class 1' },
    { keys: ['class 2', 'class2'], value: 'class2', label: 'Class 2' },
    { keys: ['class 3', 'class3'], value: 'class3', label: 'Class 3' },
    { keys: ['class 4', 'class4'], value: 'class4', label: 'Class 4' },
    { keys: ['class 5', 'class5'], value: 'class5', label: 'Class 5' },
    { keys: ['class 6', 'class6'], value: 'class6', label: 'Class 6' },
    { keys: ['class 7', 'class7'], value: 'class7', label: 'Class 7' },
    { keys: ['class 8', 'class8'], value: 'class8', label: 'Class 8' }
  ];
  for (const e of map) if (e.keys.some(k => t.includes(k))) return { key: e.value, label: e.label };
  return null;
}

/* ============================================================
   MESSAGE RENDERING
============================================================ */
function addMessage(role, html, opts = {}) {
  const body = document.getElementById('chatBody');
  const msg = document.createElement('div');
  msg.className = `msg msg--${role}`;

  // Note: bot avatar is drawn via CSS ::after on the bubble,
  // so we only create the avatar element for user messages.
  if (role === 'user') {
    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.innerHTML = `<i class="bi bi-person-fill"></i>`;
    msg.appendChild(avatar);
  }

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.innerHTML = html;

  if (opts.noTime !== true) {
    const time = document.createElement('span');
    time.className = 'msg-time';
    time.textContent = timeNow();
    bubble.appendChild(time);
  }

  msg.appendChild(bubble);
  body.appendChild(msg);
  scrollToBottom();
  state.messages.push({ role, html });
  if (typeof opts.afterRender === 'function') opts.afterRender(bubble);
  return bubble;
}

function showTyping() {
  const body = document.getElementById('chatBody');
  const msg = document.createElement('div');
  msg.className = 'msg msg--bot';
  msg.id = 'typingIndicator';
  msg.innerHTML = `
    <div class="msg-bubble">
      <div class="msg-typing"><span></span><span></span><span></span></div>
    </div>`;
  body.appendChild(msg);
  scrollToBottom();
}

function hideTyping() {
  document.getElementById('typingIndicator')?.remove();
}

function botReply(html, opts) {
  hideTyping();
  return addMessage('bot', html, opts);
}

function chip(label, action, opts = {}) {
  const cls = opts.crimson ? 'chat-chip chat-chip--crimson' : 'chat-chip';
  const icon = opts.icon ? `<i class="bi bi-${opts.icon}"></i>` : '';
  const disabled = opts.disabled ? 'disabled' : '';
  return `<button class="${cls}" data-action="${escapeHtml(action)}" ${disabled}>${icon} ${escapeHtml(label)}</button>`;
}

/* ============================================================
   INTENT ROUTER
============================================================ */
async function handleUserInput(text) {
  const raw = text.trim();
  if (!raw) return;

  addMessage('user', escapeHtml(raw));
  document.getElementById('chatSuggestions')?.classList.add('hidden');
  showTyping();
  await new Promise(r => setTimeout(r, 350));

  const intent = classifyIntent(raw);
  try {
    await intent.handler(raw, intent.match);
  } catch (err) {
    console.error(err);
    botReply(`<p>Sorry, I hit a snag. Please try again.</p>`);
  }
}

function classifyIntent(text) {
  const t = text.toLowerCase().trim();

  if (/status|adm[- ]|check.*admission|application status|track/.test(t)) {
    return { intent: 'status', handler: handleAdmissionStatus };
  }
  if (/material|syllabus|notes|study|worksheet|download/.test(t)) {
    return { intent: 'material', handler: handleStudyMaterial, match: detectClass(t) };
  }
  if (/principal|chairperson|secretary|vp|vice.?principal|faculty|teacher|staff|who is|contact.*person/.test(t)) {
    return { intent: 'faculty', handler: handleFacultyLookup };
  }
  if (/hours|timing|location|address|where|map|direction|office/.test(t)) {
    return { intent: 'location', handler: handleLocation };
  }
  if (/news|event|happening|recent|latest|update|announcement/.test(t)) {
    return { intent: 'news', handler: handleNews };
  }
  if (/gallery|photo|picture|image|sports|campus|classroom|activity/.test(t)) {
    return { intent: 'gallery', handler: handleGallery };
  }
  if (/founder|story|history|chairman|legacy/.test(t)) {
    return { intent: 'founder', handler: handleFounder };
  }
  if (/review|testimonial|parents.*say|feedback|rating/.test(t)) {
    return { intent: 'reviews', handler: handleReviews };
  }
  if (/email|whatsapp|message|reach|enquir|inquir|call/.test(t)) {
    return { intent: 'contact', handler: handleContact };
  }
  if (/help|what can|menu|option|capabilit|feature/.test(t)) {
    return { intent: 'help', handler: handleHelp };
  }
  if (/^(hi|hello|hey|assalam|salam|namaste|good morning|good evening)/.test(t)) {
    return { intent: 'greeting', handler: handleGreeting };
  }
  return { intent: 'fallback', handler: handleFallback };
}

/* ============================================================
   ADMISSION STATUS — public lookup via admission_lookups
============================================================ */
async function handleAdmissionStatus() {
  botReply(`
    <p>I can look up your admission status right here.</p>
    <p>Please enter your <strong>GGA reference ID</strong> (e.g. GGA-1A2B3C4D).</p>
    <div class="chat-chip-row">
      ${chip('Open status lookup', 'openStatusModal', { icon: 'search', crimson: true })}
    </div>
  `);
}

async function lookupAdmissionStatus(refId) {
  let clean = refId.trim().toUpperCase();

  // Support both the new GGA- prefix and the legacy ADM- prefix
  // so parents with old reference IDs can still check status.
  if (!/^(GGA|ADM)-[A-Z0-9]{4,12}$/.test(clean)) {
    return { error: 'Invalid format. Please use GGA-XXXXXXXX (e.g. GGA-1A2B3C4D).' };
  }

  // If the parent enters an old ADM- ID, no lookup doc will exist
  // for it in admission_lookups. Try both ID forms just in case.
  try {
    let docSnap = await db.collection('admission_lookups').doc(clean).get();

    // Legacy fallback: if GGA- was entered but only ADM- exists,
    // try the ADM- version too.
    if (!docSnap.exists && clean.startsWith('GGA-')) {
      const legacyId = clean.replace(/^GGA-/, 'ADM-');
      const legacySnap = await db.collection('admission_lookups').doc(legacyId).get();
      if (legacySnap.exists) {
        docSnap = legacySnap;
        clean = legacyId;
      }
    }

    if (docSnap.exists) {
      const d = docSnap.data();
      return {
        ref: clean,
        studentName: d.studentName || '—',
        applyingClass: d.applyingClass || '—',
        session: d.academicSession || '—',
        submittedAt: formatDate(d.submittedAt || d.createdAt) || '—',
        status: d.status || 1
      };
    }

    return {
      error: `No application found for ${clean}. Please double-check your reference ID.`
    };

  } catch (err) {
    console.warn('Status lookup failed:', err);

    if (err.code === 'permission-denied') {
      return { error: 'Status lookup is temporarily unavailable. Please try again shortly or contact the school office.' };
    }
    if (err.code === 'unavailable') {
      return { error: 'Network error. Please check your connection and try again.' };
    }
    if (err.code === 'deadline-exceeded') {
      return { error: 'Request timed out. Please try again.' };
    }
    return { error: 'Unable to check right now. Please try again in a moment.' };
  }
}

function statusLabel(statusRaw) {
  const s = String(statusRaw || '').toLowerCase();
  if (s === '1' || s === 'new' || s === 'pending') return { label: 'Received', cls: 'new' };
  if (s === '2' || s === 'in-progress' || s === 'progress' || s === 'reviewing') return { label: 'Under Review', cls: 'progress' };
  if (s === '3' || s === 'approved' || s === 'accepted') return { label: 'Approved', cls: 'new' };
  if (s === 'closed' || s === 'rejected' || s === 'done') return { label: 'Closed', cls: 'closed' };
  return { label: statusRaw || 'Unknown', cls: 'progress' };
}

/* ============================================================
   STUDY MATERIAL (paginated 5/page)
============================================================ */
async function handleStudyMaterial(text, match) {
  const cls = match || detectClass(text);
  if (!cls) {
    botReply(`
      <p>Which class are you looking for?</p>
      <div class="chat-chip-row">
        ${chip('Nursery', 'material:nursery')}
        ${chip('LKG', 'material:lkg')}
        ${chip('UKG', 'material:ukg')}
        ${chip('Class 1', 'material:class1')}
        ${chip('Class 2', 'material:class2')}
        ${chip('Class 3', 'material:class3')}
        ${chip('Class 4', 'material:class4')}
        ${chip('Class 5', 'material:class5')}
        ${chip('Class 6', 'material:class6')}
        ${chip('Class 7', 'material:class7')}
        ${chip('Class 8', 'material:class8')}
      </div>
    `);
    return;
  }
  await loadMaterialPage(cls.key, cls.label, 1);
}

async function loadMaterialPage(classKey, classLabel, page) {
  const items = await fetchMaterialsForClass(classKey);
  const perPage = 5;
  const start = (page - 1) * perPage;
  const slice = items.slice(start, start + perPage);
  const hasMore = start + perPage < items.length;

  if (!items.length) {
    botReply(`<p>No materials are published for <strong>${escapeHtml(classLabel)}</strong> yet. Please check back soon.</p>`);
    return;
  }

  let html = `<p><strong>${escapeHtml(classLabel)} — Study Material</strong></p><div class="chat-cards">`;
  slice.forEach(item => {
    html += `
      <a class="chat-card" href="${escapeHtml(sanitizeUrl(item.url) || '#')}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit;">
        <div class="chat-card-meta"><i class="bi bi-file-earmark-text"></i> ${escapeHtml(item.type || 'Resource')}</div>
        <div class="chat-card-title">${escapeHtml(item.title || 'Untitled')}</div>
        <div class="chat-card-body">${escapeHtml(item.description || '')}</div>
        <span class="chat-card-cta">Open <i class="bi bi-arrow-right"></i></span>
      </a>`;
  });
  html += `</div>`;

  html += `<div class="chat-chip-row">
    <span style="font-size:0.75rem;color:var(--gray);align-self:center;">Page ${page} · ${items.length} item${items.length > 1 ? 's' : ''}</span>
    ${hasMore ? chip('Load more', `material-more:${classKey}:${classLabel}:${page + 1}`, { crimson: true, icon: 'arrow-down-circle' }) : ''}
  </div>`;

  botReply(html);
}

async function fetchMaterialsForClass(classKey) {
  if (state.materialCache[classKey]) return state.materialCache[classKey];
  try {
    const snap = await db.collection('downloads').get();
    const items = [];
    snap.forEach(doc => {
      const d = doc.data();
      if ((d.class || 'misc') === classKey && d.url) items.push(d);
    });
    items.sort((a, b) => {
      const ao = typeof a.order === 'number' ? a.order : 999;
      const bo = typeof b.order === 'number' ? b.order : 999;
      return ao - bo;
    });
    state.materialCache[classKey] = items;
    return items;
  } catch (e) {
    console.warn('Material fetch failed', e);
    return [];
  }
}

/* ============================================================
   FACULTY
============================================================ */
async function handleFacultyLookup(text) {
  const t = (text || '').toLowerCase();
  const specific = FACULTY_DATA.find(f =>
    t.includes(f.role.toLowerCase().split(' ')[0]) ||
    t.includes(f.name.toLowerCase().split(' ')[0])
  );
  if (specific) {
    botReply(`
      <p><strong>${escapeHtml(specific.name)}</strong></p>
      <p>${escapeHtml(specific.role)}</p>
      <a class="chat-contact-card" href="tel:${escapeHtml(specific.phone.replace(/[^\d+]/g, ''))}">
        <i class="bi bi-telephone-fill"></i>
        <div class="chat-contact-card-text"><strong>Call directly</strong><span>${escapeHtml(specific.phone)}</span></div>
      </a>
    `);
    return;
  }
  let html = `<p><strong>Faculty & Department Directory</strong></p><div class="chat-cards">`;
  FACULTY_DATA.forEach(f => {
    const tel = f.phone.replace(/[^\d+]/g, '');
    html += `
      <a class="chat-contact-card" href="tel:${escapeHtml(tel)}">
        <i class="bi bi-telephone-fill"></i>
        <div class="chat-contact-card-text"><strong>${escapeHtml(f.name)}</strong><span>${escapeHtml(f.role)} · ${escapeHtml(f.phone)}</span></div>
      </a>`;
  });
  html += `</div>`;
  botReply(html);
}

/* ============================================================
   LOCATION
============================================================ */
async function handleLocation() {
  botReply(`
    <p><strong>${escapeHtml(SCHOOL_INFO.name)}</strong></p>
    <p>📍 ${escapeHtml(SCHOOL_INFO.address)}</p>
    <p>🕒 ${escapeHtml(SCHOOL_INFO.hours)}</p>
    <p>🧭 Coordinates: ${escapeHtml(SCHOOL_INFO.coordsText)}</p>
    <div class="chat-chip-row">
      ${chip('Open in Maps', 'openMap', { icon: 'geo-alt-fill', crimson: true })}
      ${chip('Call office', 'callOffice', { icon: 'telephone-fill' })}
    </div>
  `);
}

/* ============================================================
   NEWS
============================================================ */
async function handleNews() {
  try {
    const snap = await db.collection('news').limit(20).get();
    const items = [];
    snap.forEach(doc => items.push({ _id: doc.id, ...doc.data() }));
    if (!items.length) { botReply(`<p>No news yet. Please check back soon.</p>`); return; }
    items.sort((a, b) => {
      const ao = typeof a.order === 'number' ? a.order : 999;
      const bo = typeof b.order === 'number' ? b.order : 999;
      return ao - bo;
    });
    const top = items.slice(0, 3);
    let html = `<p><strong>Recent News & Events</strong></p><div class="chat-cards">`;
    top.forEach(item => {
      html += `
        <div class="chat-card" data-action="news-item:${escapeHtml(item._id)}">
          <div class="chat-card-meta">
            <i class="bi bi-newspaper"></i> ${escapeHtml(item.category || 'News')}
            <span style="color:var(--gray);font-weight:500;text-transform:none;letter-spacing:0;">· ${escapeHtml(formatDate(item.date))}</span>
          </div>
          <div class="chat-card-title">${escapeHtml(item.title || 'Untitled')}</div>
          <div class="chat-card-body">${escapeHtml((item.description || '').slice(0, 140))}${(item.description || '').length > 140 ? '…' : ''}</div>
          <span class="chat-card-cta">Read more <i class="bi bi-arrow-right"></i></span>
        </div>`;
    });
    html += `</div>`;
    botReply(html, {
      afterRender: (bubble) => {
        bubble.querySelectorAll('.chat-card[data-action]').forEach(card => {
          card.addEventListener('click', () => {
            const id = card.getAttribute('data-action').split(':')[1];
            showNewsDetail(id, items);
          });
        });
      }
    });
  } catch (err) {
    console.error('News failed:', err);
    botReply(`<p>I couldn't reach the news right now.</p>`);
  }
}

function showNewsDetail(id, allItems) {
  const item = allItems.find(x => x._id === id);
  if (!item) return;
  addMessage('user', `Tell me about: ${escapeHtml(item.title)}`);
  showTyping();
  setTimeout(() => {
    let html = `<p><strong>${escapeHtml(item.title || 'Untitled')}</strong></p>
      <p style="font-size:0.78rem;color:var(--crimson);text-transform:uppercase;letter-spacing:0.5px;font-weight:700;">${escapeHtml(item.category || 'News')} · ${escapeHtml(formatDate(item.date))}</p>`;
    if (item.image) {
      const safe = sanitizeUrl(item.image);
      if (safe) html += `<img src="${escapeHtml(safe)}" alt="" style="border-radius:10px;margin:0.5rem 0;width:100%;" onerror="this.style.display='none'" />`;
    }
    html += `<p>${escapeHtml(item.content || item.description || '')}</p>`;
    botReply(html);
  }, 300);
}

/* ============================================================
   GALLERY
============================================================ */
async function handleGallery(text) {
  const t = (text || '').toLowerCase();
  let key = 'campus';
  if (/sport/.test(t)) key = 'sports';
  else if (/classroom|class room/.test(t)) key = 'classrooms';
  else if (/activity|activities/.test(t)) key = 'activities';
  else if (/event|festival|celebration/.test(t)) key = 'events';
  const volume = GALLERY_VOLUMES[key];
  botReply(`
    <p>Opening the <strong>${escapeHtml(volume.title)}</strong> gallery…</p>
    <div class="chat-chip-row">
      ${chip(`View ${volume.images.length} photos`, `gallery:${key}`, { icon: 'images', crimson: true })}
    </div>
  `);
}

/* ============================================================
   FOUNDER'S STORY — text only (read-aloud removed)
============================================================ */
async function handleFounder() {
  let html = `<p><strong>The Founder's Story</strong></p>`;
  html += `<p style="line-height:1.7;">${escapeHtml(FOUNDER_STORY).replace(/\n\n/g, '</p><p style="line-height:1.7;">')}</p>`;
  botReply(html);
}

/* ============================================================
   REVIEWS
============================================================ */
async function handleReviews() {
  try {
    const snap = await db.collection('reviews').where('approved', '==', true).limit(20).get();
    const items = [];
    snap.forEach(doc => items.push({ _id: doc.id, ...doc.data() }));
    if (!items.length) { botReply(`<p>No reviews published yet.</p>`); return; }
    items.sort((a, b) => (parseInt(b.rating, 10) || 0) - (parseInt(a.rating, 10) || 0));
    const top = items.slice(0, 3);
    let html = `<p><strong>What parents & students say</strong></p><div class="chat-cards">`;
    top.forEach(r => {
      const rating = Math.max(1, Math.min(5, parseInt(r.rating, 10) || 5));
      const stars = Array.from({ length: 5 }, (_, i) => `<i class="bi bi-star-fill${i < rating ? '' : ' empty'}"></i>`).join('');
      html += `
        <div class="chat-card">
          <div class="chat-stars">${stars}</div>
          <div class="chat-card-body" style="margin-top:0.4rem;font-style:italic;">"${escapeHtml(r.message || '')}"</div>
          <div class="chat-card-meta" style="margin-top:0.5rem;">— ${escapeHtml(r.name || 'Anonymous')}${r.role ? `<span style="color:var(--gray);text-transform:none;letter-spacing:0;font-weight:500;"> · ${escapeHtml(r.role)}</span>` : ''}</div>
        </div>`;
    });
    html += `</div>`;
    botReply(html);
  } catch (err) {
    console.error('Reviews failed:', err);
    botReply(`<p>I couldn't load reviews right now.</p>`);
  }
}

/* ============================================================
   CONTACT
============================================================ */
async function handleContact() {
  botReply(`
    <p><strong>Reach out to us:</strong></p>
    <a class="chat-contact-card" href="tel:${escapeHtml(SCHOOL_INFO.phone.replace(/[^\d+]/g, ''))}">
      <i class="bi bi-telephone-fill"></i>
      <div class="chat-contact-card-text"><strong>Phone</strong><span>${escapeHtml(SCHOOL_INFO.phone)}</span></div>
    </a>
    <a class="chat-contact-card" href="mailto:${escapeHtml(SCHOOL_INFO.email)}">
      <i class="bi bi-envelope-fill"></i>
      <div class="chat-contact-card-text"><strong>Email</strong><span>${escapeHtml(SCHOOL_INFO.email)}</span></div>
    </a>
    <a class="chat-contact-card" href="${escapeHtml(SCHOOL_INFO.mapUrl)}" target="_blank" rel="noopener">
      <i class="bi bi-geo-alt-fill"></i>
      <div class="chat-contact-card-text"><strong>Visit us</strong><span>${escapeHtml(SCHOOL_INFO.address)}</span></div>
    </a>
  `);
}

/* ============================================================
   HELP / FALLBACK / GREETING
============================================================ */
async function handleFallback() {
  botReply(`
    <p>I'm not sure I understood that. Try one of these:</p>
    <div class="chat-chip-row">
      ${chip('Recent news', 'news', { icon: 'newspaper' })}
      ${chip('Study material', 'material', { icon: 'book' })}
      ${chip('Faculty', 'faculty', { icon: 'people' })}
      ${chip('Admission status', 'status', { icon: 'search' })}
      ${chip('Location', 'location', { icon: 'geo-alt' })}
      ${chip('Sports photos', 'gallery-sports', { icon: 'images' })}
      ${chip('Founder story', 'founder', { icon: 'award' })}
      ${chip('Reviews', 'reviews', { icon: 'star' })}
    </div>
  `);
}

async function handleHelp() {
  botReply(`
    <p><strong>Here's what I can do:</strong></p>
    <div class="chat-cards">
      <div class="chat-card" data-help-action="status">
        <div class="chat-card-meta"><i class="bi bi-search"></i> Admission</div>
        <div class="chat-card-title">Check admission status</div>
        <div class="chat-card-body">Look up your GGA reference ID.</div>
      </div>
      <div class="chat-card" data-help-action="material">
        <div class="chat-card-meta"><i class="bi bi-book"></i> Study Material</div>
        <div class="chat-card-title">Browse class-wise resources</div>
        <div class="chat-card-body">Ask "Show me nursery material". 5 per page with load more.</div>
      </div>
      <div class="chat-card" data-help-action="faculty">
        <div class="chat-card-meta"><i class="bi bi-people"></i> Faculty</div>
        <div class="chat-card-title">Reach the right person</div>
        <div class="chat-card-body">Tap-to-call all contacts.</div>
      </div>
      <div class="chat-card" data-help-action="news">
        <div class="chat-card-meta"><i class="bi bi-newspaper"></i> News & Events</div>
        <div class="chat-card-title">Stay updated</div>
        <div class="chat-card-body">3 most recent posts inline.</div>
      </div>
      <div class="chat-card" data-help-action="gallery-sports">
        <div class="chat-card-meta"><i class="bi bi-images"></i> Gallery</div>
        <div class="chat-card-title">View photos</div>
        <div class="chat-card-body">Sports, campus, classrooms, events.</div>
      </div>
      <div class="chat-card" data-help-action="founder">
        <div class="chat-card-meta"><i class="bi bi-award"></i> Founder</div>
        <div class="chat-card-title">Read the story</div>
        <div class="chat-card-body">The founder's message.</div>
      </div>
      <div class="chat-card" data-help-action="reviews">
        <div class="chat-card-meta"><i class="bi bi-star"></i> Reviews</div>
        <div class="chat-card-title">Parent feedback</div>
        <div class="chat-card-body">Top-rated testimonials.</div>
      </div>
      <div class="chat-card" data-help-action="location">
        <div class="chat-card-meta"><i class="bi bi-geo-alt"></i> Location</div>
        <div class="chat-card-title">Find the school</div>
        <div class="chat-card-body">Address, hours, coordinates, map link.</div>
      </div>
    </div>
  `, {
    afterRender: (bubble) => {
      bubble.querySelectorAll('[data-help-action]').forEach(card => {
        card.addEventListener('click', () => {
          handleUserInputByAction(card.getAttribute('data-help-action'));
        });
      });
    }
  });
}

async function handleGreeting() {
  botReply(`
    <p>Hello! 👋 I'm <strong>Genesis</strong>.</p>
    <div class="chat-chip-row">
      ${chip('Recent news', 'news', { icon: 'newspaper' })}
      ${chip('Study material', 'material', { icon: 'book' })}
      ${chip('Faculty', 'faculty', { icon: 'people' })}
      ${chip('Admission status', 'status', { icon: 'search' })}
      ${chip('Location', 'location', { icon: 'geo-alt' })}
    </div>
  `);
}

/* ============================================================
   ACTION ROUTER
============================================================ */
async function handleUserInputByAction(action) {
  if (!action) return;

  if (action === 'openStatusModal') { openModal('statusModal'); return; }
  if (action === 'openMap') { window.open(SCHOOL_INFO.mapUrl, '_blank'); return; }
  if (action === 'callOffice') { window.location.href = 'tel:' + SCHOOL_INFO.phone.replace(/[^\d+]/g, ''); return; }

  if (action.startsWith('material-more:')) {
    const parts = action.split(':');
    const classKey = parts[1], classLabel = parts[2], page = parseInt(parts[3], 10);
    addMessage('user', `Load more — ${classLabel}`);
    showTyping();
    await new Promise(r => setTimeout(r, 300));
    return loadMaterialPage(classKey, classLabel, page);
  }
  if (action.startsWith('material:')) {
    const key = action.split(':')[1];
    const labels = {
      nursery: 'Nursery', lkg: 'LKG', ukg: 'UKG',
      class1: 'Class 1', class2: 'Class 2', class3: 'Class 3', class4: 'Class 4',
      class5: 'Class 5', class6: 'Class 6', class7: 'Class 7', class8: 'Class 8'
    };
    const label = labels[key] || key;
    addMessage('user', `Show me ${label} material`);
    showTyping();
    await new Promise(r => setTimeout(r, 300));
    return loadMaterialPage(key, label, 1);
  }
  if (action.startsWith('gallery:')) { openGalleryModal(action.split(':')[1]); return; }
  if (action.startsWith('gallery-')) { openGalleryModal(action.split('-')[1]); return; }
  if (action.startsWith('news-item:')) { return; }

  const map = {
    'news': "What's happening recently?",
    'material': 'Show me study material',
    'faculty': 'Show faculty directory',
    'status': 'Check my admission status',
    'location': 'Office hours and location',
    'gallery': 'Show me photos',
    'founder': "Tell me the founder's story",
    'reviews': 'What do parents say?',
    'contact': 'How do I reach the school?',
    'help': 'What can you do?'
  };
  if (map[action]) return handleUserInput(map[action]);

  handleUserInput(action);
}

/* ============================================================
   GALLERY MODAL
============================================================ */
function openGalleryModal(key) {
  const volume = GALLERY_VOLUMES[key] || GALLERY_VOLUMES.campus;
  document.getElementById('galleryModalTitle').innerHTML = `<i class="bi bi-images me-2"></i>${escapeHtml(volume.title)}`;
  const grid = document.getElementById('galleryModalGrid');
  grid.innerHTML = '';
  volume.images.forEach((src, i) => {
    const tile = document.createElement('div');
    tile.className = 'chat-gallery-tile';
    tile.innerHTML = `<img src="${escapeHtml(src)}" alt="${escapeHtml(volume.title)} ${i + 1}" loading="lazy" />`;
    tile.addEventListener('click', () => openLightbox(volume.images, i));
    grid.appendChild(tile);
  });
  openModal('galleryModal');
}

/* ============================================================
   LIGHTBOX
============================================================ */
let lightboxState = { images: [], index: 0 };

function openLightbox(images, index) {
  lightboxState = { images, index };
  updateLightbox();
  document.getElementById('chatLightbox').classList.remove('d-none');
}
function updateLightbox() {
  const { images, index } = lightboxState;
  const img = document.getElementById('chatLightboxImg');
  img.src = images[index];
  img.alt = `Photo ${index + 1}`;
}
function closeLightbox() { document.getElementById('chatLightbox').classList.add('d-none'); }
function lightboxPrev() { lightboxState.index = (lightboxState.index - 1 + lightboxState.images.length) % lightboxState.images.length; updateLightbox(); }
function lightboxNext() { lightboxState.index = (lightboxState.index + 1) % lightboxState.images.length; updateLightbox(); }

/* ============================================================
   MODALS
============================================================ */
function openModal(id) { document.getElementById(id).classList.remove('d-none'); }
function closeModal(id) { document.getElementById(id).classList.add('d-none'); }

/* ============================================================
   EVENT WIRING
============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Suggestion chips ---------- */
  document.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => handleUserInput(chip.getAttribute('data-suggest')));
  });

  /* ---------- Composer ---------- */
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = input.value.trim();
    if (!v) return;
    input.value = '';
    handleUserInput(v);
  });

  /* ---------- Delegated chip/card actions inside bubbles ---------- */
  document.getElementById('chatBody').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.classList.contains('chat-card') && btn.getAttribute('data-action')?.startsWith('news-item:')) return;
    e.preventDefault();
    handleUserInputByAction(btn.getAttribute('data-action'));
  });

  /* ---------- Menu drawer + scrim ---------- */
  const menuBtn = document.getElementById('chatMenuBtn');
  const menuDrawer = document.getElementById('chatMenuDrawer');
  const menuScrim = document.getElementById('chatDrawerScrim');

  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menuDrawer.classList.toggle('open');
    menuScrim?.classList.toggle('open');
  });

  menuScrim?.addEventListener('click', () => {
    menuDrawer.classList.remove('open');
    menuScrim.classList.remove('open');
  });

  document.addEventListener('click', (e) => {
    if (!menuDrawer.contains(e.target) && e.target !== menuBtn) {
      menuDrawer.classList.remove('open');
      menuScrim?.classList.remove('open');
    }
  });

  menuDrawer.querySelectorAll('.chat-menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const action = item.getAttribute('data-action');
      menuDrawer.classList.remove('open');
      menuScrim?.classList.remove('open');

      if (action === 'clear') {
        document.getElementById('chatBody').innerHTML = '';
        state.messages = [];
        document.getElementById('chatSuggestions')?.classList.remove('hidden');
        greet();
      } else if (action === 'help') {
        handleHelp();
      }
    });
  });

  /* ---------- Plus button ---------- */
  document.getElementById('chatPlusBtn').addEventListener('click', () => handleHelp());

  /* ---------- Modal close ---------- */
  document.querySelectorAll('[data-close-modal]').forEach(el => {
    el.addEventListener('click', () => {
      const modal = el.closest('.chat-modal');
      if (modal) modal.classList.add('d-none');
    });
  });

  /* ---------- Admission status form ---------- */
  document.getElementById('statusForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const val = document.getElementById('statusInput').value.trim();
    const result = document.getElementById('statusResult');
    result.innerHTML = `<p style="color:var(--gray);font-size:0.85rem;">Checking…</p>`;
    const res = await lookupAdmissionStatus(val);
    if (res.error) {
      result.innerHTML = `
        <div class="chat-status-card" style="border-left-color:var(--crimson);">
          <h4><i class="bi bi-exclamation-triangle me-2"></i>Not Found</h4>
          <p style="font-size:0.9rem;color:var(--gray);">${escapeHtml(res.error)}</p>
        </div>`;
      return;
    }
    const status = statusLabel(res.status);
    result.innerHTML = `
      <div class="chat-status-card">
        <h4>${escapeHtml(res.ref)}</h4>
        <div class="chat-status-row"><span class="chat-status-label">Student</span><span class="chat-status-value">${escapeHtml(res.studentName)}</span></div>
        <div class="chat-status-row"><span class="chat-status-label">Applying for</span><span class="chat-status-value">${escapeHtml(res.applyingClass)}</span></div>
        <div class="chat-status-row"><span class="chat-status-label">Session</span><span class="chat-status-value">${escapeHtml(res.session)}</span></div>
        <div class="chat-status-row"><span class="chat-status-label">Submitted</span><span class="chat-status-value">${escapeHtml(res.submittedAt)}</span></div>
        <div class="chat-status-row"><span class="chat-status-label">Status</span><span class="chat-status-value"><span class="chat-status-badge chat-status-badge--${status.cls}">${escapeHtml(status.label)}</span></span></div>
      </div>`;
  });

  /* ---------- Lightbox ---------- */
  document.getElementById('chatLightboxClose').addEventListener('click', closeLightbox);
  document.getElementById('chatLightboxPrev').addEventListener('click', lightboxPrev);
  document.getElementById('chatLightboxNext').addEventListener('click', lightboxNext);
  document.addEventListener('keydown', (e) => {
    if (!document.getElementById('chatLightbox').classList.contains('d-none')) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') lightboxPrev();
      if (e.key === 'ArrowRight') lightboxNext();
    }
  });

  /* ============================================================
   PAGE FADE — chatbot side (fade-in on load, fade-out on back)
============================================================ */
(function initPageFade() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. On first load, fade the page IN
  if (!reduced) {
    const isFreshLoad = !performance.getEntriesByType('navigation')[0]?.type ||
                        performance.getEntriesByType('navigation')[0]?.type !== 'back_forward';

    if (isFreshLoad) {
      document.body.classList.add('page-fade-in');
      document.body.addEventListener('animationend', () => {
        document.body.classList.remove('page-fade-in');
      }, { once: true });
    }
  }

  // 2. When bfcache restores the page, force body visible
  window.addEventListener('pageshow', () => {
    document.body.classList.remove('page-fade-in', 'page-fading-out');
    document.body.style.opacity = '1';
  });
})();

/* ============================================================
   BACK NAVIGATION — history-aware with fade
============================================================ */
(function initBackNavigation() {
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const backLinks = document.querySelectorAll(
    'a[href="index.html"], .chat-back, a[href="./"], a[href="/"]'
  );

  backLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();

      const goBack = () => {
        const hasHistory = window.history.length > 1;

        if (hasHistory) {
          window.history.back();
          return;
        }

        if (isStandalone) {
          window.location.replace('index.html');
        } else {
          window.location.href = 'index.html';
        }
      };

      if (reduced) {
        goBack();
        return;
      }

      document.body.classList.add('page-fading-out');
      setTimeout(goBack, 300);
    });
  });
})();
   
   greet();
});

/* ============================================================
   GREETING
============================================================ */
function greet() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  botReply(`
    <p><strong>${greeting}! 👋 I'm Genesis.</strong></p>
    <p>I can help with admissions, academics, faculty, events, and more.</p>
    <p style="font-size:0.85rem;color:var(--gray);">Try: <em>"Show me nursery material"</em>, <em>"Check admission status"</em>, or <em>"What's happening recently?"</em></p>
  `);
}
