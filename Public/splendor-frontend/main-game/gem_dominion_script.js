const socket = io(window.location.origin);


const myRoomId = localStorage.getItem('roomId');
let myLocalName = localStorage.getItem('playerName');

if (!myLocalName || myLocalName === "undefined" || myLocalName === "null") {
  alert("ข้อมูลผู้เล่นไม่ถูกต้อง กรุณาล็อกอินใหม่");
  localStorage.removeItem("playerName");
  window.location.href = "../login/index.html";
}

const GEM_TO_BACKEND = { w: 'diamond', b: 'sapphire', g: 'emerald', r: 'ruby', k: 'onyx', y: 'gold' };
const TIER_TO_BACKEND = { 1: 'tier1', 2: 'tier2', 3: 'tier3' };

const displayRoomId = document.getElementById("displayRoomId");
const waitingOverlay = document.getElementById("waitingOverlay");
const overlayRoomId = document.getElementById("overlayRoomId");
const startGameBtn = document.getElementById("startGameBtn");
const waitingTitle = document.getElementById("waitingTitle");
const waitingPlayersList = document.getElementById("waitingPlayersList");

if (startGameBtn) {
  startGameBtn.addEventListener("click", () => {
    socket.emit("startGame", myRoomId);
  });
}

socket.on('connect', () => {
  if (myRoomId && myLocalName) {
    if (displayRoomId) displayRoomId.textContent = myRoomId;
    if (overlayRoomId) overlayRoomId.textContent = myRoomId;
    socket.emit('joinRoom', { roomId: myRoomId, playerName: myLocalName });
  } else {
    alert("ไม่พบรหัสห้อง กลับไปที่ล็อบบี้");
    window.location.href = "../dashboard/index.html";
  }
});

socket.on('updateBoard', (backendState) => {
  const board = backendState.board;
  const mappedPlayers = backendState.players.map((p, index) => ({
    name: p.name,
    i: index,
    score: p.score,
    tokens: {
      w: p.tokens.diamond, b: p.tokens.sapphire, g: p.tokens.emerald,
      r: p.tokens.ruby, k: p.tokens.onyx, y: p.tokens.gold
    },
    bonus: {
      w: p.bonuses.diamond, b: p.bonuses.sapphire, g: p.bonuses.emerald,
      r: p.bonuses.ruby, k: p.bonuses.onyx
    },
    reservedCards: p.reservedCards || [],
    cards: p.cards || []
  }));

  state = {
    ...backendState,
    status: backendState.status,
    current: backendState.currentTurnIndex,
    bank: {
      w: board.tokens.diamond, b: board.tokens.sapphire, g: board.tokens.emerald,
      r: board.tokens.ruby, k: board.tokens.onyx, y: board.tokens.gold
    },
    market: { 1: board.cardsOnBoard.tier1, 2: board.cardsOnBoard.tier2, 3: board.cardsOnBoard.tier3 },
    decks: { 1: board.decks.tier1, 2: board.decks.tier2, 3: board.decks.tier3 },
    nobles: board.nobles,
    players: mappedPlayers,
    pick: state?.pick || [],
    card: state?.card || null,
    over: backendState.status === 'finished'
  };

  if (state.status === 'waiting' && waitingOverlay) {
    waitingOverlay.style.display = 'flex';
    const isHost = state.players.length > 0 && state.players[0].name === myLocalName;

    if (isHost) {
      if (waitingTitle) waitingTitle.textContent = "คุณคือหัวหน้าห้อง";
      if (startGameBtn) {
        startGameBtn.style.display = 'inline-block';
        if (state.players.length >= 2) {
          startGameBtn.disabled = false;
          startGameBtn.textContent = "▶ เริ่มเกมเลย!";
        } else {
          startGameBtn.disabled = true;
          startGameBtn.textContent = "รอคนเข้าอย่างน้อย 2 คน...";
        }
      }
    } else {
      if (waitingTitle) waitingTitle.textContent = "รอหัวหน้าห้องกดเริ่มเกม...";
      if (startGameBtn) startGameBtn.style.display = 'none';
    }

    if (waitingPlayersList) {
      waitingPlayersList.innerHTML = state.players.map((p, idx) => `
            <div class="waiting-player-item" style="color:white; margin: 10px 0;">
                <span>${p.name} ${idx === 0 ? '<span style="color:#e3b84f;font-size:12px;">(Host)</span>' : ''}</span>
            </div>
        `).join("");
    }
  } else if (waitingOverlay) {
    waitingOverlay.style.display = 'none';
  }

  if (state.players && state.players.length > 0) render();

  // 🌟 เพิ่มโค้ดชุดนี้เข้าไป เพื่อสั่งวาร์ปไปหน้า Win Page
  // ถ้า URL มีคำว่า ?view=1 แปลว่าขอกลับมาดู ห้ามเด้งกลับไปหน้า Win อีก
if (backendState.status === 'finished' && !isRedirecting && !window.location.search.includes('view=1')) {
    isRedirecting = true;

    // หน่วงเวลา 3 วินาที (3000ms) ให้ได้ดูผลลัพธ์สุดท้ายบนกระดานก่อนตัดไปหน้า Win
    setTimeout(() => {
      // เก็บข้อมูลห้องทั้งหมดส่งไปให้หน้า Win Page คำนวณผู้ชนะ
      sessionStorage.setItem("gemResult", JSON.stringify(backendState));
      window.location.href = "gem_win.html";
    }, 3000);
  }
});

socket.on('gameOver', (result) => {
  sessionStorage.setItem("gemResult", JSON.stringify(result));
  window.location.href = "gem_win.html";
});
socket.on('errorMsg', (msg) => toast(msg));

/* ===== CONFIG & ASSETS ===== */
let isRedirecting = false; // 🌟 เพิ่มตัวแปรนี้ดักไว้
const GEM_COLORS = { w: 'white', b: 'blue', g: 'green', r: 'red', k: 'black' };

const extractNum = (id) => {
  const num = String(id || 0).replace(/\D/g, '');
  return num ? Number(num) : 0;
};

const IMG = {
  card: (c) => {
    const rawBonus = Object.keys(GEM_TO_BACKEND).find(key => GEM_TO_BACKEND[key] === c.gem) || c.bonus || 'w';
    const colorName = GEM_COLORS[rawBonus] || 'white';
    return `img_incard/town/${colorName}.png`;
  },
  noble: (n) => {
    const num = (extractNum(n.id) % 5) + 1;
    return `img_incard/kun-nang/${num}.png`;
  },
  avatar: (i) => `https://api.dicebear.com/9.x/adventurer/svg?seed=Miner${i}&backgroundColor=3a2a1b`
};

const FALLBACK = {
  card: (c) => cardArt(c),
  noble: (n) => `https://api.dicebear.com/9.x/personas/svg?seed=Noble${n.id || 0}&backgroundColor=d9c29a`
};
const img = (src, fb = "") => `<img src="${src}" data-fb="${fb}" loading="lazy" onerror="if(this.dataset.fb&&this.src!==this.dataset.fb){this.src=this.dataset.fb}else{this.remove()}">`;
const cardImg = (c) => img(IMG.card(c), FALLBACK.card(c));
const nobleImg = (n) => img(IMG.noble(n), FALLBACK.noble(n));

function cardArt(c) {
  if (!c) return "";

  const id = Math.abs(Number(c.id) || 0);
  const level = c.level || c.tier || 1;
  const rawBonus = Object.keys(GEM_TO_BACKEND).find(key => GEM_TO_BACKEND[key] === c.gem) || c.bonus || 'w';

  const gc = { w: "#f4f4f4", b: "#3b8cff", g: "#3fd45a", r: "#ff4a4a", k: "#6a6a6a" }[rawBonus] || "#fff";
  const skies = [["#5d8aa8", "#e3c27e"], ["#a8523b", "#f0be70"], ["#3f5a78", "#9fbad2"], ["#6d4a5c", "#e6a870"]];

  const [s1, s2] = skies[id % 4] || skies[0];
  const ground = { 1: "#3b2a1e", 2: "#3d4a2f", 3: "#4a3a2c" }[level] || "#3b2a1e";
  const o = id % 23;
  const scenes = [
    `<path d="M${40 + o} 130V78Q${70 + o} 40 ${100 + o} 78V130Z" fill="#121214" stroke="#8b633c" stroke-width="6"/><path d="M${52 + o} 124L${70 + o} 88 ${88 + o} 124Z" fill="${gc}" opacity=".9"/>`,
    `<rect x="${70 + o}" y="62" width="70" height="68" fill="#a07a4d"/><path d="M${62 + o} 64L${105 + o} 24 ${148 + o} 64Z" fill="#5a3a2a"/><rect x="${98 + o}" y="92" width="14" height="38" fill="#2a2320"/><circle cx="${105 + o}" cy="48" r="6" fill="${gc}"/>`,
    `<path d="M${50 + o} 130L${72 + o} 70 ${94 + o} 130ZM${88 + o} 130L${116 + o} 42 ${142 + o} 130Z" fill="${gc}" stroke="#fff" stroke-width="2" opacity=".92"/>`
  ];

  const selectedScene = scenes[id % 3] || scenes[0];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 150"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s1}"/><stop offset="1" stop-color="${s2}"/></linearGradient></defs><rect width="240" height="150" fill="url(#s)"/><circle cx="${190 - o}" cy="30" r="13" fill="#f6dc94"/><path d="M0 105L${40 + o} 62 90 100 ${140 + (o % 9) * 3} 54 190 98 240 70V150H0Z" fill="${ground}" opacity=".85"/><rect y="124" width="240" height="26" fill="${ground}"/>${selectedScene}<circle cx="${30 + o * 2}" cy="136" r="5" fill="${gc}"/><circle cx="${190 - o}" cy="140" r="4" fill="${gc}"/></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

const COLORS = ["w", "b", "g", "r", "k"];
const MAX_TOKENS = 10;
let state = null;
const gem = (c, n = "", size = "") => `<i class="gem ${c} ${size}">${n}</i>`;
const me = () => state?.players ? state.players.find(p => p.name === myLocalName) : null;
const isMyTurn = () => state?.players && state.players[state.current]?.name === myLocalName;

/* ===== HELPER FUNCTIONS ===== */
function shortage(c, p) {
  if (!p) return 0;
  let s = 0;
  for (const [col, n] of Object.entries(c.cost || {})) {
    // 🌟 แปลงชื่อเต็ม (backend) เป็นชื่อย่อ (frontend)
    const shortCol = Object.keys(GEM_TO_BACKEND).find(key => GEM_TO_BACKEND[key] === col) || col;

    const pBonus = p.bonus ? (p.bonus[shortCol] || 0) : 0;
    const pTokens = p.tokens ? (p.tokens[shortCol] || 0) : 0;
    s += Math.max(0, n - pBonus - pTokens);
  }
  return s;
}

function missing(c, p) {
  if (!p) return [];
  return Object.entries(c.cost || {}).map(([col, n]) => {
    // 🌟 แปลงชื่อเต็ม (backend) เป็นชื่อย่อ (frontend) เช่น onyx -> k
    const shortCol = Object.keys(GEM_TO_BACKEND).find(key => GEM_TO_BACKEND[key] === col) || col;

    const pBonus = p.bonus ? (p.bonus[shortCol] || 0) : 0;
    const pTokens = p.tokens ? (p.tokens[shortCol] || 0) : 0;
    return [shortCol, Math.max(0, n - pBonus - pTokens)];
  }).filter(([, v]) => v > 0);
}

function buyInfo(c, p) {
  if (!p) return "";
  const miss = missing(c, p), need = shortage(c, p), gold = p.tokens?.y || 0;
  const row = (arr) => `<div class="picked">${arr.map(([col, v]) => gem(col, v, "lg")).join("")}</div>`;
  if (!miss.length) return `<p>ซื้อได้เลย — เหรียญและโบนัสครบแล้ว</p>`;
  if (need <= gold) return `<p>ซื้อได้ โดยใช้เหรียญทอง ${need} เหรียญแทนสีที่ขาด:</p>${row(miss)}`;
  return `<p>ยังขาดเหรียญสีเหล่านี้:</p>${row(miss)}` + (gold ? `<p>ใช้เหรียญทองที่มี (${gold}) แทนได้ ยังเหลือขาดอีก ${need - gold} เหรียญ</p>` : "");
}
const canBuy = (c, p) => p ? shortage(c, p) <= (p.tokens?.y || 0) : false;

/* ===== ACTION EMITTERS ===== */
function toggleToken(c) {
  if (!isMyTurn()) return toast("ยังไม่ถึงตาของคุณ");
  if (state?.over) return toast("เกมจบแล้ว");
  if (c === "y") return toast("เหรียญทองได้จากการจองการ์ดเท่านั้น");
  if (!state?.bank || state.bank[c] <= 0) return;
  state.card = null;
  const s = state.pick, n = s.filter((x) => x === c).length;
  if (s.length === 2 && s[0] === s[1]) {
    if (c === s[0]) state.pick = [];
    else toast("หยิบสีเดียวกัน 2 เหรียญแล้ว เลือกสีอื่นเพิ่มไม่ได้");
  } else if (n === 1) {
    if (s.length === 1) {
      if (state.bank[c] >= 4) s.push(c);
      else toast("หยิบสีเดียวกัน 2 เหรียญ ต้องเหลือในกองอย่างน้อย 4");
    } else state.pick = s.filter((x) => x !== c);
  } else if (s.length < 3) s.push(c);
  render();
}

const resetPick = () => { if (state) state.pick = []; render(); };

function takeTokens() {
  if (!isMyTurn()) return toast("ยังไม่ถึงตาของคุณ");
  if (!state || state.pick.length === 0) return;
  const backendGems = state.pick.map(c => GEM_TO_BACKEND[c]);
  socket.emit('playerTakeGems', { roomId: myRoomId, selectedGems: backendGems });
  state.pick = [];
}

function pickCard(kind, a, b) {
  if (state?.over) return toast("เกมจบแล้ว");
  if (state) state.pick = [];
  const same = state?.card && state.card.kind === kind && state.card.a === a && state.card.b === b;
  if (state) state.card = same ? null : { kind, a, b };
  render();
}

function selCard() {
  const s = state?.card;
  if (!s) return null;
  return s.kind === "m" ? state.market[s.a]?.[s.b] : me()?.reservedCards?.[s.b] || me()?.reserved?.[s.b];
}

function buySel() {
  if (!isMyTurn()) return toast("ยังไม่ถึงตาของคุณ");
  const s = state?.card;
  if (!s) return;
  socket.emit('buyCard', {
    roomId: myRoomId,
    tier: TIER_TO_BACKEND[s.a],
    cardIndex: s.b,
    isReserved: s.kind === "r"
  });
  state.card = null;
}

function reserveSel() {
  if (!isMyTurn()) return toast("ยังไม่ถึงตาของคุณ");
  const s = state?.card;
  if (!s || s.kind !== "m") return;
  socket.emit('reserveCard', {
    roomId: myRoomId,
    tier: TIER_TO_BACKEND[s.a],
    cardIndex: s.b
  });
  state.card = null;
}

function reserveDeck(l) {
  if (!isMyTurn()) return toast("ยังไม่ถึงตาของคุณ");
  if (state?.over) return toast("เกมจบแล้ว");
  socket.emit('reserveCard', { roomId: myRoomId, tier: TIER_TO_BACKEND[l], cardIndex: -1 });
}

function leaveGame() {
  if (confirm("คุณต้องการออกจากเกมหรือไม่?")) window.location.href = "../dashboard/index.html";
}

/* ===== UI RENDERER ===== */
function cardHtml(c, kind, a, b) {
  if (!c) return `<div class="card empty"></div>`;
  const p = me();
  const sel = state.card && state.card.kind === kind && state.card.a === a && state.card.b === b;
  const ok = canBuy(c, p);

  // 🌟 แปลง gem ของการ์ดให้เป็นชื่อย่อสำหรับแสดงผลไอคอนมุมขวาบน
  const rawBonus = Object.keys(GEM_TO_BACKEND).find(key => GEM_TO_BACKEND[key] === c.gem) || c.bonus || 'w';

  return `<div class="card ${sel ? "sel" : ""} ${ok ? "ok" : ""}" onclick="pickCard('${kind}',${a},${b})">
    <b class="pts">${c.point || c.points || 0}</b>
    <!-- 🌟 เพิ่มไอคอนประเภทเพชรที่มุมขวาบนตรงนี้ -->
    <div class="card-gem-badge">${gem(rawBonus, "", "sm")}</div>
    <div class="art">${cardImg(c)}</div>
    <div class="cost">${Object.entries(c.cost || {}).map(([k, v]) => {
      const shortCol = Object.keys(GEM_TO_BACKEND).find(key => GEM_TO_BACKEND[key] === k) || k;
      return gem(shortCol, v, "sm");
    }).join("")}</div></div>`;
}

function render() {
  if (!state || !state.players) return;
  const p = me();
  if (!p) return;

  const turnPill = document.getElementById("turnPill");
  if (turnPill) {
    turnPill.textContent = state.over ? "เกมจบแล้ว" : "ตาของ " + state.players[state.current].name;
    turnPill.className = "pill" + (state.over ? " done" : "");
  }

  const players = document.getElementById("players");
  if (players) {
    players.innerHTML = state.players.map((q, i) => `
        <div class="pl ${i === state.current ? "active" : ""}">
          <div class="av">${img(IMG.avatar(i))}</div>
          <span class="nm">${q.name}</span>
          <span class="sc">${q.score || 0}</span>
          <div class="coins">${[...COLORS, "y"].map((c) => `<span class="coin">${gem(c, "", "sm")}${q.tokens?.[c] || 0}</span>`).join("")}</div>
        </div>`).join("");
  }

  const market = document.getElementById("market");
  if (market) {
    market.innerHTML = [3, 2, 1].map((l) => `
        <div class="tier">
          <div class="deck l${l}" onclick="reserveDeck(${l})" title="จองการ์ดจากกอง">
            <em>ระดับ ${l}</em>${"I".repeat(l)}<small>${state.decks?.[l]?.length || 0} ใบ</small>
          </div>
          <div class="row">
            ${[0, 1, 2, 3].map((i) => cardHtml(state.market?.[l]?.[i], "m", l, i)).join("")}
          </div>
        </div>`).join("");
  }

  const nobles = document.getElementById("nobles");
  if (nobles) {
    nobles.innerHTML = (state.nobles || []).map((n) => `<div class="noble"><b class="pts">${n.point || 3}</b>${nobleImg(n)}
        <div class="cost">${Object.entries(n.requirement || n.cost || {}).map(([k, v]) => gem(Object.keys(GEM_TO_BACKEND).find(key => GEM_TO_BACKEND[key] === k) || k, v, "sm")).join("")}</div></div>`).join("");
  }

  const tokens = document.getElementById("tokens");
  if (tokens) {
    tokens.innerHTML = [...COLORS, "y"].map((c) => `<div class="tk ${c} ${state.pick.includes(c) ? "on" : ""} ${(state.bank?.[c] || 0) <= 0 ? "out" : ""}" onclick="toggleToken('${c}')"><b>${state.bank?.[c] || 0}</b></div>`).join("");
  }

  const me_ = document.getElementById("me");
  if (me_) {
    const thumb = (c, extra = "") => `<div class="th ${extra}">${cardImg(c)}${gem(Object.keys(GEM_TO_BACKEND).find(key => GEM_TO_BACKEND[key] === c.gem) || c.gem, "", "sm")}</div>`;
    const reservedCards = p.reservedCards || [];
    const boughtCards = p.cards || [];
    const currentTokensCount = Object.values(p.tokens || {}).reduce((a, b) => a + b, 0);

    me_.innerHTML = `<div class="me-head">${img(IMG.avatar(p.i))}<b>${p.name}</b><span class="sc">${p.score || 0}</span></div>
        <h3>เหรียญที่ถืออยู่ (${currentTokensCount}/${MAX_TOKENS})</h3>
        <div class="gems-row">${["r", "b", "g", "k", "w", "y"].map((c) => `<div>${gem(c, "", "lg")}${p.tokens?.[c] || 0}</div>`).join("")}</div>
        <h3>โบนัสการ์ด</h3>
        <div class="gems-row">${["r", "b", "g", "k", "w"].map((c) => `<div>${gem(c, "", "lg")}${p.bonus?.[c] || 0}</div>`).join("")}</div>
        <h3>การ์ดที่จองไว้ (${reservedCards.length}/3)</h3>
        <div class="thumbs">${[0, 1, 2].map((i) => reservedCards[i]
      ? `<div class="th ${state.card && state.card.kind === "r" && state.card.b === i ? "sel" : ""}" onclick="pickCard('r', 0, ${i})">${cardImg(reservedCards[i])}${gem(Object.keys(GEM_TO_BACKEND).find(key => GEM_TO_BACKEND[key] === reservedCards[i].gem) || reservedCards[i].gem, "", "sm")}</div>`
      : `<div class="th slot"></div>`).join("")}</div>
        <h3>การ์ดที่ซื้อแล้ว (${boughtCards.length})</h3>
        <div class="thumbs">${boughtCards.slice(-8).map((c) => thumb(c)).join("") || '<span style="font-size:12px">ยังไม่มี</span>'}</div>`;
  }

  const action = document.getElementById("action");
  if (action) {
    const c = selCard();
    if (c) {
      const ok = canBuy(c, p);
      // 🌟 แก้ตรงนี้: ถ้า c.level ไม่มี ให้ไปดึงจาก state.card.a (Tier ที่เรากดเลือก) มาแทน
      const tierLevel = c.level || c.tier || (state.card ? state.card.a : "?");

      action.innerHTML = `<h3>การ์ด Lv.${tierLevel} · ${c.point || c.points || 0} คะแนน</h3>
          ${buyInfo(c, p)}
          <div class="btns">
            <button class="btn" onclick="reserveSel()" ${state.card.kind === "r" ? "disabled" : ""}>จอง</button>
            <button class="btn primary" onclick="buySel()" ${ok ? "" : "disabled"}>ซื้อการ์ด</button>
          </div>`;
    } else {
      const s = state.pick, valid = s.length > 0;
      action.innerHTML = `<h3>เลือกเหรียญ (${s.length}/3)</h3><p>เลือก 3 สีต่างกัน หรือสีเดียวกัน 2 เหรียญ</p>
          <div class="picked">${s.map((x) => gem(x, "", "lg")).join("")}</div>
          <div class="btns">
            <button class="btn" onclick="resetPick()" ${valid ? "" : "disabled"}>↺ รีเซ็ต</button>
            <button class="btn primary" onclick="takeTokens()" ${valid ? "" : "disabled"}>เก็บเหรียญ</button>
          </div>`;
    }
  }
}

const toastEl = document.getElementById("toast");
function toast(t) {
  if (!toastEl) return;
  toastEl.textContent = t;
  toastEl.classList.add("show");
  clearTimeout(window.tt);
  window.tt = setTimeout(() => toastEl.classList.remove("show"), 2000);
}