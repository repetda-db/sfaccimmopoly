/* ============================================
   SFACCIMMOPOLY — LOBBY LOGIC
   ============================================ */

// ── Tokens available ──────────────────────────
const TOKENS = ['🚗','🚂','🎩','👟','🐕','🎪','⛵','🚀'];

// ── State ─────────────────────────────────────
let selectedToken = null;
let roomsRef      = null;
let roomsListener = null;

// ── DOM refs ──────────────────────────────────
const inputName       = document.getElementById('input-name');
const tokenGrid       = document.getElementById('token-grid');
const tokenDisplay    = document.getElementById('token-display');
const roomList        = document.getElementById('room-list');
const btnCreateRoom   = document.getElementById('btn-create-room');
const modalCreate     = document.getElementById('modal-create');
const inputRoomName   = document.getElementById('input-room-name');
const selectMaxP      = document.getElementById('select-max-players');
const btnModalCancel  = document.getElementById('btn-modal-cancel');
const btnModalConfirm = document.getElementById('btn-modal-confirm');
const btnLogout       = document.getElementById('btn-logout');

// ══════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // ✅ Auth guard
  Auth.guard();

  // ✅ Restore saved profile
  const saved = Auth.loadPlayer();
  if (saved?.name)  inputName.value = saved.name;
  if (saved?.token) selectToken(saved.token);

  buildTokenGrid();
  startRoomsListener();
  bindEvents();
});


// ══════════════════════════════════════════════
//  TOKEN GRID
// ══════════════════════════════════════════════
function buildTokenGrid() {
  tokenGrid.innerHTML = '';
  TOKENS.forEach(emoji => {
    const btn = document.createElement('button');
    btn.className   = 'token-btn';
    btn.textContent = emoji;
    btn.title       = emoji;
    btn.addEventListener('click', () => selectToken(emoji));
    tokenGrid.appendChild(btn);
  });

  // ✅ Utilise Auth
  const saved = Auth.loadPlayer();
  if (saved?.token) highlightToken(saved.token);
}


function selectToken(emoji) {
  selectedToken = emoji;
  tokenDisplay.textContent = emoji;
  localStorage.setItem('sfx_token', emoji);
  highlightToken(emoji);
}

function highlightToken(emoji) {
  document.querySelectorAll('.token-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.textContent === emoji);
  });
}

// ══════════════════════════════════════════════
//  FIREBASE — ROOMS LISTENER
// ══════════════════════════════════════════════
function startRoomsListener() {
  roomsRef = firebase.database().ref('rooms');

  roomsListener = roomsRef.on('value', snapshot => {
    const data = snapshot.val();
    renderRooms(data);
  }, err => {
    console.error('Rooms listener error:', err);
  });
}

// ══════════════════════════════════════════════
//  RENDER ROOMS
// ══════════════════════════════════════════════
function renderRooms(data) {
  roomList.innerHTML = '';

  if (!data) {
    roomList.innerHTML = `<p class="empty-state" data-i18n="lobby.noRooms">
      Nessuna stanza aperta. Creane una!</p>`;
    applyI18n(); // re-translate
    return;
  }

  const rooms = Object.entries(data)
    .map(([id, room]) => ({ id, ...room }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); // newest first

  rooms.forEach(room => {
    const card = buildRoomCard(room);
    roomList.appendChild(card);
  });
}

function buildRoomCard(room) {
  const playerCount = room.players ? Object.keys(room.players).length : 0;
  const isFull      = playerCount >= room.maxPlayers;
  const status      = room.status || 'waiting';

  const card = document.createElement('div');
  card.className = 'room-card';

  // Status label
  const statusLabels = {
    waiting:  { key: 'lobby.status.waiting',  fallback: 'In attesa' },
    playing:  { key: 'lobby.status.playing',  fallback: 'In gioco'  },
    finished: { key: 'lobby.status.finished', fallback: 'Finita'    },
  };
  const sl = statusLabels[status] || statusLabels.waiting;

  // Player tokens preview
  const tokenPreview = room.players
    ? Object.values(room.players).map(p => p.token || '?').join(' ')
    : '';

  card.innerHTML = `
    <div class="room-info">
      <span class="room-name">${escapeHtml(room.name)}</span>
      <div class="room-meta">
        <span>👥 ${playerCount}/${room.maxPlayers}</span>
        <span>${tokenPreview}</span>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:0.75rem;">
      <span class="room-status ${status}" data-i18n="${sl.key}">${sl.fallback}</span>
      ${canJoin(status, isFull)
        ? `<button class="btn-primary btn-join" data-id="${room.id}"
                   data-i18n="lobby.join">Entra</button>`
        : ''}
    </div>
  `;

  // Bind join button
  const joinBtn = card.querySelector('.btn-join');
  if (joinBtn) {
    joinBtn.addEventListener('click', () => joinRoom(room.id));
  }

  return card;
}

function canJoin(status, isFull) {
  return status === 'waiting' && !isFull;
}

// ══════════════════════════════════════════════
//  CREATE ROOM
// ══════════════════════════════════════════════
function openCreateModal() {
  inputRoomName.value = '';
  selectMaxP.value    = '4';
  modalCreate.classList.remove('hidden');
  inputRoomName.focus();
}

function closeCreateModal() {
  modalCreate.classList.add('hidden');
}

async function createRoom() {
  const name       = inputRoomName.value.trim();
  const maxPlayers = parseInt(selectMaxP.value, 10);

  if (!name) {
    inputRoomName.focus();
    return;
  }

  if (!validateProfile()) return;

  btnModalConfirm.disabled = true;

  try {
    const newRoomRef = firebase.database().ref('rooms').push();
    const playerId   = getPlayerId();

    const roomData = {
      name,
      maxPlayers,
      status:    'waiting',
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      hostId:    playerId,
      players: {
        [playerId]: {
          name:     getPlayerName(),
          token:    selectedToken,
          isHost:   true,
          joinedAt: firebase.database.ServerValue.TIMESTAMP,
        }
      }
    };

    await newRoomRef.set(roomData);

    // Save identity
    function saveProfile() {
      Auth.savePlayer(inputName.value.trim(), selectedToken);
    }

    // Go to game room
    window.location.href = `game.html?room=${newRoomRef.key}`;

  } catch (err) {
    console.error('Create room error:', err);
    alert('Errore nella creazione della stanza. Riprova.');
  } finally {
    btnModalConfirm.disabled = false;
  }
}

// ══════════════════════════════════════════════
//  JOIN ROOM
// ══════════════════════════════════════════════
async function joinRoom(roomId) {
  if (!validateProfile()) return;

  try {
    const playerId  = getPlayerId();
    const playerRef = firebase.database()
                        .ref(`rooms/${roomId}/players/${playerId}`);

    await playerRef.set({
      name:     getPlayerName(),
      token:    selectedToken,
      isHost:   false,
      joinedAt: firebase.database.ServerValue.TIMESTAMP,
    });

    saveProfile();
    window.location.href = `game.html?room=${roomId}`;

  } catch (err) {
    console.error('Join room error:', err);
    alert('Errore nell\'accesso alla stanza. Riprova.');
  }
}

// ══════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════
function validateProfile() {
  const name = inputName.value.trim();
  if (!name) {
    inputName.focus();
    inputName.style.borderColor = 'var(--red)';
    setTimeout(() => inputName.style.borderColor = '', 1500);
    return false;
  }
  if (!selectedToken) {
    tokenGrid.style.outline = '2px solid var(--red)';
    setTimeout(() => tokenGrid.style.outline = '', 1500);
    return false;
  }
  return true;
}

function saveProfile() {
  Auth.savePlayer(inputName.value.trim(), selectedToken);
}


function getPlayerName() {
  return inputName.value.trim();
}

function getPlayerId() {
  // Stable anonymous ID per browser session
  let id = localStorage.getItem('sfx_player_id');
  if (!id) {
    id = 'p_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('sfx_player_id', id);
  }
  return id;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ══════════════════════════════════════════════
//  EVENTS
// ══════════════════════════════════════════════
function bindEvents() {
  btnCreateRoom.addEventListener('click', openCreateModal);
  btnModalCancel.addEventListener('click', closeCreateModal);
  btnModalConfirm.addEventListener('click', createRoom);

  // Close modal on overlay click
  modalCreate.addEventListener('click', e => {
    if (e.target === modalCreate) closeCreateModal();
  });

  // Enter key in room name input
  inputRoomName.addEventListener('keydown', e => {
    if (e.key === 'Enter') createRoom();
  });

  // Save name on change
  inputName.addEventListener('input', () => {
    localStorage.setItem('sfx_name', inputName.value.trim());
  });

  // Logout
  btnLogout.addEventListener('click', () => {
    Auth.logout();
  });
}
