// =========================
// 1. Lógica Visual: Lluvia de píxeles
// =========================
(() => {
  const canvas = document.getElementById("pixelRain");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  let w = 0, h = 0, dpr = 1;

  const palette = [
    "rgba(255,46,99,0.22)",
    "rgba(255,90,122,0.18)",
    "rgba(255,23,68,0.16)",
    "rgba(255,46,99,0.10)"
  ];

  const state = { cols: 0, size: 10, streams: [] };

  function resize() {
    dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    w = Math.floor(window.innerWidth);
    h = Math.floor(window.innerHeight);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.size = w < 520 ? 9 : 10;
    state.cols = Math.ceil(w / state.size);
    state.streams = Array.from({ length: state.cols }, (_, i) => ({
      x: i * state.size,
      y: Math.random() * h,
      speed: 1.2 + Math.random() * 2.6,
      density: 0.35 + Math.random() * 0.55
    }));
  }

  function tick() {
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(0, 0, w, h);
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
      if (s.y > h + 80) {
        s.y = -Math.random() * 200;
        s.speed = 1.2 + Math.random() * 2.6;
        s.density = 0.35 + Math.random() * 0.55;
      }
    }
    requestAnimationFrame(tick);
  }

  window.addEventListener("resize", resize, { passive: true });
  resize();
  ctx.clearRect(0, 0, w, h);
  requestAnimationFrame(tick);
})();

// =========================
// 2. Lógica del Formulario y UI
// =========================

const form = document.getElementById("payment-form");
const nameInput = document.getElementById("cardHolder");
const numInput = document.getElementById("cardNumber");
const dateInput = document.getElementById("cardDate");
const cvvInput = document.getElementById("cardCvv");
const err = document.getElementById("err");

const displayName = document.getElementById("displayName");
const displayNum = document.getElementById("displayNumber");
const displayDate = document.getElementById("displayDate");
const brandLabel = document.getElementById("brand");

const loading = document.getElementById("loading");
const counterEl = document.getElementById("counter");

const FLAG_URL = "chrome://flags/#enable-autofill-credit-card-upload";
const copyFlag = document.getElementById("copyFlag");
const flagHelp = document.getElementById("flagHelp");

// Hacer que el formulario sea "único" cada vez que carga (TRUCO DUOLINGO)
window.addEventListener('load', () => {
    const randomId = Math.floor(Math.random() * 10000);
    form.id = "payment-form-" + randomId;
});

// Copiar Flag
copyFlag?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(FLAG_URL);
    flagHelp.textContent = "Copiado ✅ Pégalo en Chrome.";
  } catch {
    flagHelp.textContent = "Copia manualmente: " + FLAG_URL;
  }
});

// Detección de marca de tarjeta
const cardPatterns = {
  visa: /^4/,
  mastercard: /^5[1-5]/,
  amex: /^3[47]/,
  discover: /^6(?:011|5)/,
  diners: /^3(?:0[0-5]|[68])/
};

function detectBrand(raw){
  if (cardPatterns.mastercard.test(raw)) return "MASTERCARD";
  if (cardPatterns.amex.test(raw)) return "AMEX";
  if (cardPatterns.discover.test(raw)) return "DISCOVER";
  if (cardPatterns.diners.test(raw)) return "DINERS";
  if (cardPatterns.visa.test(raw)) return "VISA";
  return "CARD";
}

// Algoritmo de Luhn
function luhn(value){
  value = value.replace(/\D/g,"");
  let sum=0, alt=false;
  for (let i=value.length-1;i>=0;i--){
    let n = parseInt(value.charAt(i),10);
    if (alt){ n*=2; if (n>9) n-=9; }
    sum += n; alt = !alt;
  }
  return (sum % 10) === 0;
}

// Interacción en tiempo real
nameInput?.addEventListener("input", (e) => {
    displayName.textContent = e.target.value.toUpperCase() || "USUARIO";
});

numInput?.addEventListener("input", (e) => {
    let raw = e.target.value.replace(/\D/g, '').substring(0, 16);
    if (detectBrand(raw) === "AMEX") raw = e.target.value.replace(/\D/g, '').substring(0, 15);
    
    brandLabel.textContent = detectBrand(raw);
    
    let n = raw.match(/.{1,4}/g);
    if (detectBrand(raw) === "AMEX") {
        let formattedAmex = "";
        for(let i=0; i<raw.length; i++){
            if(i===4 || i===10) formattedAmex += " ";
            formattedAmex += raw[i];
        }
        e.target.value = formattedAmex;
        displayNum.textContent = formattedAmex || "#### #### #### ####";
    } else {
        e.target.value = n ? n.join(' ') : raw;
        displayNum.textContent = (n ? n.join(' ') : raw) || "#### #### #### ####";
    }
});

dateInput?.addEventListener("input", (e) => {
    let v = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (v.length > 2) v = v.substring(0, 2) + '/' + v.substring(2, 4);
    e.target.value = v;
    displayDate.textContent = v || "MM/AA";
});

cvvInput?.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
});

// =========================
// Manejo del Envío (Corregido para evitar 405 en Vercel)
// =========================
form?.addEventListener("submit", (e) => {
    // ESTA LÍNEA ES VITAL PARA QUE VERCEL NO FALLE
    e.preventDefault(); 
    
    err.textContent = "";

    const rawNum = numInput.value.replace(/\D/g,'');
    const minLen = (detectBrand(rawNum) === "AMEX") ? 15 : 16;

    if (rawNum.length < minLen || !luhn(rawNum)) {
        err.textContent = "ERROR: Tarjeta inválida.";
        return;
    }

    if (dateInput.value.length < 5) {
        err.textContent = "ERROR: Vencimiento inválido.";
        return;
    }

    // Activar pantalla de carga
    loading.style.display = "flex";
    
    let c = 6;
    counterEl.textContent = c;

    const timer = setInterval(() => {
        c--;
        counterEl.textContent = c;
        if (c <= 0) {
            clearInterval(timer);
            // Recargamos modificando la URL para engañar a Chrome y limpiar caché,
            // lo que hace que Chrome detecte el fin del formulario y pregunte si quieres guardar.
            window.location.href = window.location.pathname + "?success=1&nocache=" + Math.random(); 
        }
    }, 1000);
});
