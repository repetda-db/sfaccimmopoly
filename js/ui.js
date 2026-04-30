'use strict';

/* ============================================
   SFACCIMMOPOLY — UI
   All DOM manipulation, modals, panels,
   board rendering, player tokens, log
   ============================================ */

const UI = (() => {

  /* ══════════════════════════════════════════
     CACHE DOM
  ══════════════════════════════════════════ */
  const $ = id => document.getElementById(id);

  const EL = {
    /* screens */
    screenLobby:   $('screen-lobby'),
    screenGame:    $('screen-game'),

    /* board */
    board:         $('board'),
    cells:         null, // filled after board render

    /* dice */
    die1:          $('die-1'),
    die2:          $('die-2'),
    diceResult:    $('dice-result'),

    /* action buttons */
    btnRoll:       $('btn-roll'),
    btnEndTurn:    $('btn-end-turn'),
    btnBuy:        $('btn-buy'),
    btnPass:       $('btn-pass'),
    btnMortgage:   $('btn-mortgage'),
    btnBuild:      $('btn-build'),
    btnTrade:      $('btn-trade'),
    btnBankrupt:   $('btn-bankrupt'),

    /* panels */
    playerPanel:   $('player-panel'),
    logPanel:      $('log-panel'),
    logList:       $('log-list'),
    infoPanel:     $('info-panel'),

    /* player list sidebar */
    playerList:    $('player-list'),

    /* modals */
    modalOverlay:  $('modal-overlay'),
    modalBox:      $('modal-box'),
    modalTitle:    $('modal-title'),
    modalBody:     $('modal-body'),
    modalFooter:   $('modal-footer'),

    /* card draw overlay */
    cardOverlay:   $('card-overlay'),
    cardFace:      $('card-face'),
    cardText:      $('card-text'),
    cardBtn:       $('card-btn'),

    /* trade */
    tradePanel:    $('trade-panel'),

    /* auction */
    auctionPanel:  $('auction-panel'),
    auctionProp:   $('auction-prop'),
    auctionBid:    $('auction-bid'),
    auctionTimer:  $('auction-timer'),

    /* top bar */
    codeDisplay:   $('code-display'),
    langSelect:    $('lang-select'),
    modeDisplay:   $('mode-display'),
  };

  /* ══════════════════════════════════════════
     BOARD LAYOUT
     40 cells, clockwise from GO (bottom-right)
  ══════════════════════════════════════════ */

  /* Maps cell index → { row, col } on 11×11 grid */
  function cellGridPos(index) {
    // Bottom row:  cells 0–10   row=10, col=10→0
    // Left col:    cells 11–19  row=9→1, col=0
    // Top row:     cells 20–30  row=0,  col=0→10
    // Right col:   cells 31–39  row=1→9, col=10

    if (index <= 10)  return { row: 10, col: 10 - index };
    if (index <= 19)  return { row: 10 - (index - 10), col: 0 };
    if (index <= 30)  return { row: 0,  col: index - 20 };
    return             { row: index - 30, col: 10 };
  }

  /* ══════════════════════════════════════════
     RENDER BOARD
  ══════════════════════════════════════════ */
  function renderBoard(boardData) {
    const board = EL.board;
    if (!board) return;
    board.innerHTML = '';
    const cells = boardData || BoardData;
    cells.forEach((cell, i) => {
      const { row, col } = cellGridPos(i);

      const div = document.createElement('div');
      div.className = `cell cell-${cell.type}`;
      div.id        = `cell-${i}`;
      div.dataset.index = i;
      div.style.gridRow    = row + 1;
      div.style.gridColumn = col + 1;

      /* corner cells are bigger — handled by CSS class */
      if ([0, 10, 20, 30].includes(i)) div.classList.add('cell-corner');

      /* color strip for properties */
      if (cell.color) {
        const strip = document.createElement('div');
        strip.className = 'cell-color-strip';
        strip.style.background = cell.color;
        div.appendChild(strip);
      }

      /* name */
      const name = document.createElement('span');
      name.className = 'cell-name';
      name.textContent = cell.name;
      div.appendChild(name);

      /* price */
      if (cell.price) {
        const price = document.createElement('span');
        price.className = 'cell-price';
        price.textContent = `€${cell.price}`;
        div.appendChild(price);
      }

      /* icon */
      if (cell.icon) {
        const icon = document.createElement('span');
        icon.className = 'cell-icon';
        icon.textContent = cell.icon;
        div.appendChild(icon);
      }

      board.appendChild(div);
    });

    EL.cells = board.querySelectorAll('.cell');

    /* center logo */
    const center = document.createElement('div');
    center.className = 'board-center';
    center.id = 'board-center';
    center.innerHTML = `<div class="logo-center">SFACCIMMOPOLY</div>`;
    center.style.gridRow    = '2 / 11';
    center.style.gridColumn = '2 / 11';
    board.appendChild(center);
  }

  /* ══════════════════════════════════════════
     TOKENS
  ══════════════════════════════════════════ */

  /* token elements keyed by playerId */
  const tokenEls = {};

  function placeToken(playerId, position, color, token) {
    /* remove old */
    if (tokenEls[playerId]) tokenEls[playerId].remove();

    const cell = document.getElementById(`cell-${position}`);
    if (!cell) return;

    const el = document.createElement('div');
    el.className      = 'player-token';
    el.id             = `token-${playerId}`;
    el.textContent    = token;
    el.style.background = color;
    el.title          = playerId;

    /* stack tokens inside cell */
    const existing = cell.querySelectorAll('.player-token').length;
    el.style.setProperty('--token-offset', existing);

    cell.appendChild(el);
    tokenEls[playerId] = el;
  }

  function moveToken(playerId, fromPos, toPos, passing = false) {
    /* animate step by step */
    return new Promise(resolve => {
      if (!tokenEls[playerId]) { resolve(); return; }

      const steps = [];
      let pos = fromPos;

      if (passing) {
        /* passing GO: go around */
        while (pos !== toPos) {
          pos = (pos + 1) % 40;
          steps.push(pos);
        }
      } else {
        steps.push(toPos);
      }

      let i = 0;
      const interval = setInterval(() => {
        if (i >= steps.length) {
          clearInterval(interval);
          resolve();
          return;
        }
        const cell = document.getElementById(`cell-${steps[i]}`);
        if (cell) cell.appendChild(tokenEls[playerId]);
        i++;
      }, passing ? 120 : 0);
    });
  }

  function removeToken(playerId) {
    if (tokenEls[playerId]) {
      tokenEls[playerId].remove();
      delete tokenEls[playerId];
    }
  }

  /* ══════════════════════════════════════════
     DICE ANIMATION
  ══════════════════════════════════════════ */
  const DICE_FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

  function animateDice(d1, d2) {
    return new Promise(resolve => {
      let ticks = 0;
      const max  = 16;
      const interval = setInterval(() => {
        EL.die1.textContent = DICE_FACES[Math.ceil(Math.random() * 6)];
        EL.die2.textContent = DICE_FACES[Math.ceil(Math.random() * 6)];
        ticks++;
        if (ticks >= max) {
          clearInterval(interval);
          EL.die1.textContent = DICE_FACES[d1];
          EL.die2.textContent = DICE_FACES[d2];
          if (EL.diceResult) EL.diceResult.textContent = `${d1 + d2}`;
          resolve();
        }
      }, 60);
    });
  }

  /* ══════════════════════════════════════════
     PLAYER SIDEBAR
  ══════════════════════════════════════════ */
  function renderPlayerList(players, currentPlayerId, myId) {
    const list = EL.playerList;
    if (!list) return;
    list.innerHTML = '';

    Object.values(players)
      .sort((a, b) => a.joinedAt - b.joinedAt)
      .forEach(p => {
        const li = document.createElement('div');
        li.className = 'player-card';
        li.id        = `pcard-${p.id}`;
        if (p.id === currentPlayerId) li.classList.add('active');
        if (p.id === myId)           li.classList.add('mine');
        if (p.isBankrupt)            li.classList.add('bankrupt');

        li.innerHTML = `
          <span class="p-token" style="color:${p.color}">${p.token}</span>
          <span class="p-name">${escHtml(p.name)}</span>
          <span class="p-money">€${p.money}</span>
          ${p.inJail ? '<span class="p-jail">🔒</span>' : ''}
          ${p.isBetting ? '<span class="p-bet">🎲</span>' : ''}
        `;

        list.appendChild(li);
      });
  }

  function highlightCurrentPlayer(playerId) {
    document.querySelectorAll('.player-card').forEach(c => c.classList.remove('active'));
    const el = document.getElementById(`pcard-${playerId}`);
    if (el) el.classList.add('active');
  }

  function updatePlayerCard(player) {
    const el = document.getElementById(`pcard-${player.id}`);
    if (!el) return;
    el.querySelector('.p-money').textContent = `€${player.money}`;
    el.classList.toggle('bankrupt', !!player.isBankrupt);
  }

  /* ══════════════════════════════════════════
     PROPERTY OWNERSHIP on board
  ══════════════════════════════════════════ */
  function markPropertyOwner(cellIndex, color) {
    const cell = document.getElementById(`cell-${cellIndex}`);
    if (!cell) return;
    let badge = cell.querySelector('.owner-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'owner-badge';
      cell.appendChild(badge);
    }
    badge.style.background = color || 'transparent';
  }

  function markHouses(cellIndex, houses, hotel) {
    const cell = document.getElementById(`cell-${cellIndex}`);
    if (!cell) return;
    let houseEl = cell.querySelector('.house-display');
    if (!houseEl) {
      houseEl = document.createElement('div');
      houseEl.className = 'house-display';
      cell.appendChild(houseEl);
    }
    if (hotel) {
      houseEl.innerHTML = '🏨';
    } else {
      houseEl.innerHTML = '🏠'.repeat(houses);
    }
  }

  function markMortgage(cellIndex, mortgaged) {
    const cell = document.getElementById(`cell-${cellIndex}`);
    if (!cell) return;
    cell.classList.toggle('mortgaged', mortgaged);
  }

  /* ══════════════════════════════════════════
     LOG
  ══════════════════════════════════════════ */
  function addLog(entry) {
    const list = EL.logList;
    if (!list) return;

    const li = document.createElement('li');
    li.className = `log-entry log-${entry.type || 'info'}`;

    const time = new Date(entry.ts || Date.now());
    const hm   = `${String(time.getHours()).padStart(2,'0')}:${String(time.getMinutes()).padStart(2,'0')}`;

    li.innerHTML = `<span class="log-time">${hm}</span> ${escHtml(entry.msg)}`;
    list.appendChild(li);
    list.scrollTop = list.scrollHeight;

    /* cap at 200 entries */
    while (list.children.length > 200) list.removeChild(list.firstChild);
  }

  /* ══════════════════════════════════════════
     MODAL
  ══════════════════════════════════════════ */
  function showModal({ title = '', body = '', buttons = [], closable = true }) {
    EL.modalTitle.textContent  = title;
    EL.modalBody.innerHTML     = body;
    EL.modalFooter.innerHTML   = '';

    buttons.forEach(({ label, cls, cb }) => {
      const btn = document.createElement('button');
      btn.className   = `btn ${cls || ''}`;
      btn.textContent = label;
      btn.onclick     = () => { if (cb) cb(); hideModal(); };
      EL.modalFooter.appendChild(btn);
    });

    if (closable) {
      EL.modalOverlay.onclick = e => {
        if (e.target === EL.modalOverlay) hideModal();
      };
    } else {
      EL.modalOverlay.onclick = null;
    }

    EL.modalOverlay.classList.remove('hidden');
    EL.modalBox.classList.remove('hidden');
  }

  function hideModal() {
    EL.modalOverlay.classList.add('hidden');
    EL.modalBox.classList.add('hidden');
  }

  /* ── Confirm shorthand ───────────────────── */
  function confirm(msg, onYes, onNo) {
    showModal({
      title: t('confirm'),
      body:  `<p>${escHtml(msg)}</p>`,
      buttons: [
        { label: t('btn_ok'),     cls: 'btn-primary', cb: onYes },
        { label: t('btn_cancel'), cls: 'btn-secondary', cb: onNo },
      ],
    });
  }

  /* ── Alert shorthand ─────────────────────── */
  function alert(msg, type = 'info') {
    showModal({
      title: t(`alert_${type}`) || type,
      body:  `<p>${escHtml(msg)}</p>`,
      buttons: [{ label: t('btn_ok'), cls: 'btn-primary' }],
    });
  }

  /* ══════════════════════════════════════════
     CARD OVERLAY  (Chance / Community Chest)
  ══════════════════════════════════════════ */
  function showCard(card, onClose) {
    if (!EL.cardOverlay) return;

    EL.cardFace.className = `card-face card-${card.type}`;
    EL.cardText.textContent = card.text;

    EL.cardBtn.textContent = t('btn_ok');
    EL.cardBtn.onclick = () => {
      EL.cardOverlay.classList.add('hidden');
      if (onClose) onClose();
    };

    EL.cardOverlay.classList.remove('hidden');
  }

  /* ══════════════════════════════════════════
     BUY PROPERTY PROMPT
  ══════════════════════════════════════════ */
  function showBuyPrompt(property, playerMoney, onBuy, onPass) {
    const canAfford = playerMoney >= property.price;

    showModal({
      title:   t('msg_buy_prompt', { name: property.name }),
      closable: false,
      body: `
        <div class="property-card-mini">
          <div class="pcm-header" style="background:${property.color}">
            <strong>${escHtml(property.name)}</strong>
          </div>
          <div class="pcm-body">
            <p>${t('label_price')}: <strong>€${property.price}</strong></p>
            <p>${t('label_rent')}: €${property.rent[0]}</p>
            <p>${t('label_your_money')}: €${playerMoney}</p>
            ${!canAfford ? `<p class="err">${t('err_not_enough_money')}</p>` : ''}
          </div>
        </div>`,
      buttons: [
        { label: t('btn_buy'),  cls: 'btn-primary',   cb: onBuy,  disabled: !canAfford },
        { label: t('btn_pass'), cls: 'btn-secondary',  cb: onPass },
      ],
    });
  }

  /* ══════════════════════════════════════════
     AUCTION PANEL
  ══════════════════════════════════════════ */
  function showAuction(property, auction, myMoney, onBid) {
    if (!EL.auctionPanel) return;
    EL.auctionPanel.classList.remove('hidden');

    EL.auctionProp.textContent = property.name;
    EL.auctionBid.textContent  = `€${auction.highBid || 0}`;

    const bidInput = document.getElementById('auction-bid-input');
    const bidBtn   = document.getElementById('auction-bid-btn');

    if (bidBtn) {
      bidBtn.onclick = () => {
        const amount = parseInt(bidInput.value, 10);
        if (isNaN(amount) || amount <= (auction.highBid || 0)) {
          toast(t('err_invalid_bid'), 'error');
          return;
        }
        if (amount > myMoney) {
          toast(t('err_not_enough_money'), 'error');
          return;
        }
        onBid(amount);
      };
    }
  }

  function hideAuction() {
    if (EL.auctionPanel) EL.auctionPanel.classList.add('hidden');
  }

  function updateAuctionTimer(seconds) {
    if (EL.auctionTimer) EL.auctionTimer.textContent = `${seconds}s`;
  }

  /* ══════════════════════════════════════════
     TRADE PANEL
  ══════════════════════════════════════════ */
  function showTradePanel(myProps, theirProps, theirName, onPropose) {
    const panel = EL.tradePanel;
    if (!panel) return;
    panel.classList.remove('hidden');

    const myList    = document.getElementById('trade-my-props');
    const theirList = document.getElementById('trade-their-props');

    const renderProps = (props, container) => {
      container.innerHTML = '';
      props.forEach(p => {
        const li = document.createElement('label');
        li.className = 'trade-prop';
        li.innerHTML = `<input type="checkbox" value="${p.id}"> ${escHtml(p.name)} (€${p.mortgageValue})`;
        container.appendChild(li);
      });
    };

    if (myList)    renderProps(myProps, myList);
    if (theirList) renderProps(theirProps, theirList);

    const proposeBtn = document.getElementById('trade-propose-btn');
    if (proposeBtn) {
      proposeBtn.onclick = () => {
        const mySelected    = [...myList.querySelectorAll('input:checked')].map(i => i.value);
        const theirSelected = [...theirList.querySelectorAll('input:checked')].map(i => i.value);
        const myMoney    = parseInt(document.getElementById('trade-my-money').value   || 0, 10);
        const theirMoney = parseInt(document.getElementById('trade-their-money').value || 0, 10);
        onPropose({ myProps: mySelected, theirProps: theirSelected, myMoney, theirMoney });
      };
    }
  }

  function hideTradePanel() {
    if (EL.tradePanel) EL.tradePanel.classList.add('hidden');
  }

  /* ══════════════════════════════════════════
     TOAST  (non-blocking notification)
  ══════════════════════════════════════════ */
  function toast(msg, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container') || _createToastContainer();
    const el = document.createElement('div');
    el.className   = `toast toast-${type}`;
    el.textContent = msg;
    container.appendChild(el);

    /* fade in */
    requestAnimationFrame(() => el.classList.add('show'));

    setTimeout(() => {
      el.classList.remove('show');
      el.addEventListener('transitionend', () => el.remove(), { once: true });
    }, duration);
  }

  function _createToastContainer() {
    const c = document.createElement('div');
    c.id = 'toast-container';
    document.body.appendChild(c);
    return c;
  }

  /* ══════════════════════════════════════════
     BUTTONS STATE
  ══════════════════════════════════════════ */
  function setButtonState({ roll, endTurn, buy, pass, mortgage, build, trade, bankrupt }) {
    const set = (el, enabled) => {
      if (!el) return;
      el.disabled = !enabled;
      el.classList.toggle('disabled', !enabled);
    };
    set(EL.btnRoll,     roll);
    set(EL.btnEndTurn,  endTurn);
    set(EL.btnBuy,      buy);
    set(EL.btnPass,     pass);
    set(EL.btnMortgage, mortgage);
    set(EL.btnBuild,    build);
    set(EL.btnTrade,    trade);
    set(EL.btnBankrupt, bankrupt);
  }

  function resetButtons() {
    setButtonState({
      roll: false, endTurn: false, buy: false,
      pass: false, mortgage: false, build: false,
      trade: false, bankrupt: false,
    });
  }

  /* ══════════════════════════════════════════
     SCREENS
  ══════════════════════════════════════════ */
  function showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    const el = document.getElementById(`screen-${name}`);
    if (el) el.classList.remove('hidden');
  }

  /* ══════════════════════════════════════════
     INFO PANEL  (property detail)
  ══════════════════════════════════════════ */
  function showPropertyInfo(property, state) {
    const panel = EL.infoPanel;
    if (!panel) return;

    const propState = state.properties[property.id] || {};
    const ownerP    = propState.owner ? state.players[propState.owner] : null;
    const houses    = propState.houses || 0;
    const hotel     = propState.hotel  || false;

    panel.innerHTML = `
      <div class="prop-info-header" style="background:${property.color || '#ccc'}">
        <strong>${escHtml(property.name)}</strong>
      </div>
      <div class="prop-info-body">
        <p><b>${t('label_price')}:</b> €${property.price}</p>
        <p><b>${t('label_rent')}:</b>
          €${property.rent[0]}
          ${property.rent.map((r, i) => i > 0 ? `<br>+ ${i === 5 ? '🏨' : '🏠'.repeat(i)}: €${r}` : '').join('')}
        </p>
        ${property.houseCost ? `<p><b>${t('label_build_cost')}:</b> €${property.houseCost}</p>` : ''}
        <p><b>${t('label_mortgage')}:</b> €${property.mortgageValue}</p>
        <hr>
        <p><b>${t('label_owner')}:</b> ${ownerP ? escHtml(ownerP.name) : t('label_bank')}</p>
        <p><b>${t('label_houses')}:</b> ${hotel ? '🏨' : '🏠'.repeat(houses) || '—'}</p>
        ${propState.mortgaged ? `<p class="mortgaged-label">${t('label_mortgaged')}</p>` : ''}
      </div>`;

    panel.classList.remove('hidden');
  }

  function hidePropertyInfo() {
    if (EL.infoPanel) EL.infoPanel.classList.add('hidden');
  }

  /* ══════════════════════════════════════════
     LANGUAGE SELECT
  ══════════════════════════════════════════ */
  function populateLangSelect(languages, current) {
    const sel = EL.langSelect;
    if (!sel) return;
    sel.innerHTML = '';
    Object.entries(languages).forEach(([code, label]) => {
      const opt = document.createElement('option');
      opt.value = code;
      opt.textContent = label;
      if (code === current) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  /* ══════════════════════════════════════════
     i18n — apply data-i18n attributes
  ══════════════════════════════════════════ */
  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      el.placeholder = t(el.dataset.i18nPh);
    });
  }

  /* ══════════════════════════════════════════
     HELPERS
  ══════════════════════════════════════════ */
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatMoney(n) {
    return `€${Number(n).toLocaleString()}`;
  }

  /* ══════════════════════════════════════════
     PUBLIC API
  ══════════════════════════════════════════ */
  return {
    EL,

    /* board */
    renderBoard,

    /* tokens */
    placeToken,
    moveToken,
    removeToken,

    /* dice */
    animateDice,

    /* players */
    renderPlayerList,
    highlightCurrentPlayer,
    updatePlayerCard,

    /* property display */
    markPropertyOwner,
    markHouses,
    markMortgage,
    showPropertyInfo,
    hidePropertyInfo,

    /* log */
    addLog,

    /* modal */
    showModal,
    hideModal,
    confirm,
    alert,

    /* card */
    showCard,

    /* buy */
    showBuyPrompt,

    /* auction */
    showAuction,
    hideAuction,
    updateAuctionTimer,

    /* trade */
    showTradePanel,
    hideTradePanel,

    /* toast */
    toast,

    /* buttons */
    setButtonState,
    resetButtons,

    /* screens */
    showScreen,

    /* lang */
    populateLangSelect,
    applyTranslations,

    /* utils */
    escHtml,
    formatMoney,
  };

})();
