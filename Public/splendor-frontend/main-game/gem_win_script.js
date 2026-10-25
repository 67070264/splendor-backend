/* ===== ตั้งค่า ===== */
const LOBBY_URL = "../dashboard/index.html"; // เส้นทางกลับไปหน้าเลือกล็อบบี้
const GAME_URL = "gem_dominion.html";
const avatar = (i) => `https://api.dicebear.com/9.x/adventurer/svg?seed=Miner${i}&backgroundColor=3a2a1b`;

// ดึงชื่อของคนที่กำลังเปิดจอนี้อยู่
const myName = localStorage.getItem("playerName");

/* ===== อ่านผลจากหน้าเกม ===== */
let result = null;
try {
  // ดึงข้อมูลที่เซฟมาจากหน้ากระดานเกม (backendState)
  const raw = JSON.parse(sessionStorage.getItem("gemResult"));
  if (raw && raw.players) {
      // แปลงข้อมูลให้อยู่ในรูปแบบที่หน้า Win Page ต้องการ
      result = raw.players.map((p, index) => ({
          name: p.name,
          i: index,
          score: p.score || 0,
          cards: p.cards ? p.cards.length : 0
      }));
  }
} catch (e) {}

// ถ้าไม่มีข้อมูล ให้ใช้ข้อมูลจำลอง
const isDemo = !result;
if (isDemo) {
  result = [
    { name: "Player 1", i: 0, score: 13, cards: 6 },
    { name: "Player 2", i: 1, score: 12, cards: 5 },
    { name: "Player 3", i: 2, score: 16, cards: 7 },
    { name: "Player 4", i: 3, score: 5, cards: 3 }
  ];
}

/* ===== จัดอันดับ: คะแนนมากสุดก่อน ถ้าเท่ากันคนที่ใช้การ์ดน้อยกว่าชนะ ===== */
const sorted = [...result].sort((a, b) => b.score - a.score || a.cards - b.cards);
const tied = sorted.filter((p) => p.score === sorted[0].score && p.cards === sorted[0].cards);

/* ===== จัดการข้อความแสดงความยินดี ===== */
const amIWinner = tied.some(p => p.name === myName);
const congratsText = document.querySelector(".congrats");

if (congratsText) {
    if (amIWinner) {
        congratsText.textContent = "🎉 ยินดีด้วย คุณคือผู้ชนะ! 🎉";
        congratsText.style.color = "#e3b84f"; // สีทอง
    } else {
        congratsText.textContent = "พยายามได้ดีมาก! ไว้แก้มือใหม่นะ";
        congratsText.style.color = "#bfa985"; // สีทองหม่น
    }
}

document.getElementById("who").textContent =
  tied.length > 1 ? tied.map((p) => p.name).join(" และ ") + " เสมอกัน" : `ผู้ชนะคือ: ${sorted[0].name}`;

document.getElementById("list").innerHTML = sorted.map((p, k) => `
  <li class="row ${tied.includes(p) ? "first" : ""}">
    <span class="av"><img src="${avatar(p.i)}" alt="" onerror="this.remove()"></span>
    <span class="nm">${p.name} ${p.name === myName ? `<span style="color:#a87a2a; font-size:14px;">(คุณ)</span>` : ""}</span>
    <span class="pt">${p.score} คะแนน</span>
  </li>`).join("");

/* ===== ตั้งค่าการกดปุ่ม ===== */
// 1. ปุ่มกลับล็อบบี้ และ 2. ปุ่มเล่นอีกครั้ง -> ส่งกลับไปหน้า Dashboard เพื่อสร้างห้องใหม่
document.getElementById("lobbyBtn").onclick = () => { location.href = LOBBY_URL; };
document.getElementById("againBtn").onclick = () => { location.href = LOBBY_URL; };

// 3. ปุ่มรับชมเกมต่อ -> ส่งกลับไปดูกระดานที่จบแล้ว
document.getElementById("viewBtn").onclick = () => {
  if (isDemo) return alert("นี่คือหน้าตัวอย่าง ยังไม่มีเกมให้กลับไปดู");
  location.href = GAME_URL + "?view=1";
};