/* ===== ละอองสีทองตกลงมา (ประกายระยิบระยับ) — ใช้ร่วมกันทุกหน้า =====
   ใส่ในหน้า HTML ด้วย <script src="gem_dust.js"></script>
   ปรับความหนาแน่นได้: <script src="gem_dust.js" data-scale="0.6"></script> (1 = ปกติ, น้อยกว่า = เบาบางลง) */
(function goldDust() {
  const scale = parseFloat((document.currentScript && document.currentScript.dataset.scale) || "1");
  const cv = document.createElement("canvas");
  cv.id = "dust"; cv.setAttribute("aria-hidden", "true");
  cv.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:25";
  document.body.appendChild(cv);
  const ctx = cv.getContext("2d");
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let W, H, dpr, parts = [];

  const make = (initial) => ({
    x: Math.random() * W,
    y: initial ? Math.random() * H : -10,
    r: 0.8 + Math.random() * 2.2,            // ขนาดเม็ด
    vy: 0.25 + Math.random() * 0.9,          // ความเร็วตก
    amp: 8 + Math.random() * 22,             // แกว่งซ้ายขวา
    ph: Math.random() * Math.PI * 2,
    tw: 1.2 + Math.random() * 2.2,           // ความถี่การระยิบ
    star: Math.random() < 0.18               // บางเม็ดเป็นประกายรูปดาว 4 แฉก
  });

  function resize() {
    dpr = window.devicePixelRatio || 1;
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.max(50, Math.min(130, W / 14)) * scale);
    parts = Array.from({ length: n }, () => make(true));
  }

  function glint(x, y, s, a) {            // ดาว 4 แฉกเรียวๆ
    ctx.globalAlpha = a; ctx.fillStyle = "#fff3b0";
    ctx.beginPath();
    ctx.moveTo(x, y - s * 2.6); ctx.quadraticCurveTo(x, y, x + s * 2.6, y);
    ctx.quadraticCurveTo(x, y, x, y + s * 2.6); ctx.quadraticCurveTo(x, y, x - s * 2.6, y);
    ctx.quadraticCurveTo(x, y, x, y - s * 2.6); ctx.fill();
  }

  function frame(t) {
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      if (!still) { p.y += p.vy; if (p.y > H + 10) Object.assign(p, make(false)); }
      const x = p.x + Math.sin(t / 1000 * 0.8 + p.ph) * p.amp;
      const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t / 1000 * p.tw + p.ph)); // ระยิบ
      const g = ctx.createRadialGradient(x, p.y, 0, x, p.y, p.r * 4);
      g.addColorStop(0, `rgba(255,226,120,${0.9 * a})`);
      g.addColorStop(0.35, `rgba(240,184,60,${0.35 * a})`);
      g.addColorStop(1, "rgba(240,184,60,0)");
      ctx.globalAlpha = 1; ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, p.y, p.r * 4, 0, 7); ctx.fill();
      if (p.star) glint(x, p.y, p.r, a);
    }
    ctx.globalAlpha = 1;
    if (!still) requestAnimationFrame(frame);
  }

  resize(); addEventListener("resize", resize);
  requestAnimationFrame(frame);
})();
