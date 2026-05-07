// PASTE THIS INTO CODEPEN'S JS PANEL
// ─────────────────────────────────────────────────────────────
// STEP 1: Replace the firebaseConfig below with YOUR own config
//         from Firebase console (see setup instructions).
// ─────────────────────────────────────────────────────────────
 
const firebaseConfig = {
  apiKey: "AIzaSyDM3RiCXV0uWhVzpPHimVmiFFODy5PpvmY",
  authDomain: "book-club-8a396.firebaseapp.com",
  databaseURL: "https://book-club-8a396-default-rtdb.firebaseio.com",
  projectId: "book-club-8a396",
  storageBucket: "book-club-8a396.firebasestorage.app",
  messagingSenderId: "683958571225",
  appId: "1:683958571225:web:b5962c57ae877db7052ec8",
  measurementId: "G-BJHH80GBGN"
};
 
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
 
// ── BOOK DATA ──────────────────────────────────────────────────
const BOOKS = [
  { title: "ACOTAR",                       author: "Sarah J. Maas",              color: "#F4C0D1" },
  { title: "Mr. Mercedes",                 author: "Stephen King",               color: "#B4B2A9" },
  { title: "Rose Code",                    author: "Kate Quinn",                 color: "#F5C4B3" },
  { title: "Stories of Your Life",         author: "Ted Chiang",                 color: "#B5D4F4" },
  { title: "Slaughterhouse-Five",          author: "Kurt Vonnegut",              color: "#FAC775" },
  { title: "Dead Mountain",                author: "Donnie Eichar",              color: "#9FE1CB" },
  { title: "The Sword of Kaigen",          author: "M.L. Wang",                  color: "#CECBF6" },
  { title: "The Murder of Roger Ackroyd",  author: "Agatha Christie",            color: "#C0DD97" },
  { title: "Dracula",                      author: "Bram Stoker",                color: "#F7C1C1" },
  { title: "Project Hail Mary",            author: "Andy Weir",                  color: "#85B7EB" },
  { title: "A Monster Calls",              author: "Patrick Ness & Siobhan Dowd",color: "#5DCAA5" },
  { title: "Mort",                         author: "Terry Pratchett",            color: "#AFA9EC" },
];
 
const AVATAR_COLORS = ["#CECBF6","#9FE1CB","#F5C4B3","#F4C0D1","#FAC775","#C0DD97","#85B7EB","#F7C1C1","#5DCAA5","#AFA9EC","#B4B2A9","#85B7EB"];
const AVATAR_TEXT   = ["#3C3489","#085041","#993C1D","#993556","#854F0B","#3B6D11","#0C447C","#A32D2D","#0F6E56","#534AB7","#444441","#185FA5"];
 
// ── STATE ──────────────────────────────────────────────────────
let currentUser = null;
let activeBooks = [...BOOKS];
let removedBooks = [];
let dragSrc = null;
 
// ── LOGIN ──────────────────────────────────────────────────────
function login() {
  const name = document.getElementById('nameInput').value.trim();
  if (!name) { document.getElementById('loginError').style.display = 'block'; return; }
  currentUser = name;
  document.getElementById('loginScreen').classList.remove('active');
  document.getElementById('mainScreen').classList.add('active');
  document.getElementById('userChip').textContent = '👤 ' + name;
  loadMyRanking();
}
 
document.getElementById('nameInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') login();
});
 
// ── LOAD MY SAVED RANKING ──────────────────────────────────────
function loadMyRanking() {
  const key = 'rankings/' + sanitizeKey(currentUser);
  db.ref(key).once('value').then(snap => {
    const data = snap.val();
    if (data && Array.isArray(data.active)) {
      const savedActive  = data.active.map(t => BOOKS.find(b => b.title === t)).filter(Boolean);
      const savedRemoved = (data.removed || []).map(t => BOOKS.find(b => b.title === t)).filter(Boolean);
      const accounted    = [...(data.active || []), ...(data.removed || [])];
      const newBooks     = BOOKS.filter(b => !accounted.includes(b.title));
      activeBooks  = [...savedActive, ...newBooks];
      removedBooks = savedRemoved;
    }
    render();
  }).catch(() => render());
}
 
// ── RENDER ─────────────────────────────────────────────────────
function render() {
  renderList('activeList', activeBooks, false);
  renderList('removedList', removedBooks, true);
  document.getElementById('removedSection').style.display = removedBooks.length ? 'block' : 'none';
}
 
function renderList(id, books, isRemoved) {
  const list = document.getElementById(id);
  list.innerHTML = '';
  let rankCounter = 1;
 
  books.forEach((book, i) => {
    const li = document.createElement('li');
    li.className = 'book-item' + (isRemoved ? ' removed' : '');
    li.draggable = !isRemoved;
    li.dataset.index = i;
 
    const rankDisplay = isRemoved ? '—' : rankCounter++;
 
    const actionBtn = isRemoved
      ? `<button class="restore-btn" onclick="restoreBook(${i})" title="Restore to ranking">
           <i class="ti ti-rotate" aria-hidden="true"></i>
         </button>`
      : `<button class="remove-btn" onclick="removeBook(${i})" title="Haven't read this">
           <i class="ti ti-x" aria-hidden="true"></i>
         </button>`;
 
    li.innerHTML = `
      <span class="rank-badge">${rankDisplay}</span>
      <div class="book-spine" style="background: ${book.color};"></div>
      <div class="book-info">
        <p class="book-title">${book.title}</p>
        <p class="book-author">${book.author}</p>
      </div>
      ${actionBtn}
      ${!isRemoved ? '<i class="ti ti-grip-vertical drag-handle" aria-hidden="true"></i>' : ''}
    `;
 
    if (!isRemoved) {
      li.addEventListener('dragstart', onDragStart);
      li.addEventListener('dragover', onDragOver);
      li.addEventListener('drop', onDrop);
      li.addEventListener('dragend', onDragEnd);
      li.addEventListener('dragleave', onDragLeave);
    }
 
    list.appendChild(li);
  });
}
 
// ── REMOVE / RESTORE ───────────────────────────────────────────
function removeBook(i) {
  const [book] = activeBooks.splice(i, 1);
  removedBooks.push(book);
  render();
}
 
function restoreBook(i) {
  const [book] = removedBooks.splice(i, 1);
  activeBooks.push(book);
  render();
}
 
// ── DRAG & DROP ────────────────────────────────────────────────
function onDragStart(e) {
  dragSrc = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}
 
function onDragOver(e) {
  e.preventDefault();
  document.querySelectorAll('.book-item').forEach(el => el.classList.remove('drag-over'));
  if (this !== dragSrc) this.classList.add('drag-over');
  return false;
}
 
function onDragLeave() { this.classList.remove('drag-over'); }
 
function onDrop(e) {
  e.stopPropagation();
  if (this !== dragSrc) {
    const from = parseInt(dragSrc.dataset.index);
    const to   = parseInt(this.dataset.index);
    const moved = activeBooks.splice(from, 1)[0];
    activeBooks.splice(to, 0, moved);
    render();
  }
  return false;
}
 
function onDragEnd() {
  document.querySelectorAll('.book-item').forEach(el => el.classList.remove('dragging', 'drag-over'));
}
 
// ── SAVE RANKING ───────────────────────────────────────────────
function saveRanking() {
  const key = 'rankings/' + sanitizeKey(currentUser);
  db.ref(key).set({
    name:    currentUser,
    active:  activeBooks.map(b => b.title),
    removed: removedBooks.map(b => b.title),
    savedAt: Date.now()
  }).then(() => {
    const msg = document.getElementById('savedMsg');
    msg.classList.add('show');
    setTimeout(() => msg.classList.remove('show'), 2500);
  });
}
 
// ── TABS ───────────────────────────────────────────────────────
function switchTab(tab) {
  document.querySelectorAll('.tab').forEach((t, i) => {
    t.classList.toggle('active', (i === 0) === (tab === 'my'));
  });
  document.getElementById('myTab').style.display   = tab === 'my'  ? '' : 'none';
  document.getElementById('allTab').style.display  = tab === 'all' ? '' : 'none';
  if (tab === 'all') loadAllRankings();
}
 
// ── LOAD ALL RANKINGS ──────────────────────────────────────────
function loadAllRankings() {
  const container = document.getElementById('allRankings');
  container.innerHTML = '<p class="empty-state">Loading rankings…</p>';
 
  db.ref('rankings').once('value').then(snap => {
    const data = snap.val();
    if (!data) {
      container.innerHTML = '<p class="empty-state">No rankings yet — be the first to save yours!</p>';
      return;
    }
 
    const entries = Object.values(data).filter(e => e && e.name && Array.isArray(e.active));
    if (!entries.length) {
      container.innerHTML = '<p class="empty-state">No rankings yet.</p>';
      return;
    }
 
    entries.sort((a, b) => {
      if (a.name === currentUser) return -1;
      if (b.name === currentUser) return 1;
      return a.name.localeCompare(b.name);
    });
 
    container.innerHTML = '';
 
    entries.forEach((entry, idx) => {
      const ci   = idx % AVATAR_COLORS.length;
      const isMe = entry.name === currentUser;
      const card = document.createElement('div');
      card.className = 'member-card';
 
      const activeRows = entry.active.map((t, i) => {
        const book = BOOKS.find(b => b.title === t);
        return `<div class="rank-row">
          <span class="rank-num">${i + 1}</span>
          <div class="rank-spine" style="background: ${book ? book.color : '#ccc'};"></div>
          <span class="rank-title">${t}</span>
        </div>`;
      }).join('');
 
      const removedRows = (entry.removed || []).map(t => {
        const book = BOOKS.find(b => b.title === t);
        return `<div class="rank-row unread">
          <span class="rank-num">—</span>
          <div class="rank-spine" style="background: ${book ? book.color : '#ccc'};"></div>
          <span class="rank-title">${t}</span>
          <span class="unread-tag">not read</span>
        </div>`;
      }).join('');
 
      card.innerHTML = `
        <div class="member-header" onclick="toggleMember(this)">
          <div class="member-avatar" style="background: ${AVATAR_COLORS[ci]}; color: ${AVATAR_TEXT[ci]};">
            ${getInitials(entry.name)}
          </div>
          <span class="member-name">
            ${entry.name}
            ${isMe ? '<span class="you-badge">you</span>' : ''}
          </span>
          <span class="member-meta">${entry.active.length} ranked${entry.removed && entry.removed.length ? `, ${entry.removed.length} unread` : ''}</span>
          <i class="ti ti-chevron-down member-toggle ${isMe ? 'open' : ''}" aria-hidden="true"></i>
        </div>
        <div class="member-ranking ${isMe ? 'open' : ''}">${activeRows}${removedRows}</div>
      `;
 
      container.appendChild(card);
    });
 
  }).catch(() => {
    container.innerHTML = '<p class="empty-state">Could not load rankings. Check your Firebase config.</p>';
  });
}
 
function toggleMember(header) {
  const ranking = header.nextElementSibling;
  const toggle  = header.querySelector('.member-toggle');
  toggle.classList.toggle('open', ranking.classList.toggle('open'));
}
 
// ── HELPERS ────────────────────────────────────────────────────
function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
 
function sanitizeKey(name) {
  return name.replace(/[.#$\/\[\]]/g, '_');
}
