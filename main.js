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

  const state = {
    cols: 0,
    size: 10,
    streams: []
  };

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

/* =========================
   Card + Form logic
   ========================= */
const form = document.getElementById("payment-form");
const numInput = document.getElementById("cardNumber");
const dateInput = document.getElementById("cardDate");
const err = document.getElementById("err");

const displayNum = document.getElementById("displayNumber");
const displayDate = document.getElementById("displayDate");
const brandLabel = document.getElementById("brand");

const loading = document.getElementById("loading");
const counterEl = document.getElementById("counter");

const FLAG_URL = "chrome://flags/#enable-autofill-credit-card-upload";
const copyFlag = document.getElementById("copyFlag");
const flagHelp = document.getElementById("flagHelp");

copyFlag?.addEventListener("click", async () => {
  try{
    await navigator.clipboard.writeText(FLAG_URL);
    flagHelp.textContent = "Copiado ✅ Pégalo en la barra de direcciones de Chrome y presiona Enter.";
  }catch{
    flagHelp.textContent = "Copia manualmente: " + FLAG_URL;
  }
});

document.getElementById("update-button")?.addEventListener("click", () => {
  window.open("https://banger.supply/collections/accessories/products/commander-glass-nipple-caps", "_blank", "noopener,noreferrer");
});

document.getElementById("perfil-button")?.addEventListener("click", () => {
  window.open("https://payments.google.com/", "_blank", "noopener,noreferrer");
});

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

// LÓGICA PRINCIPAL - FORMATEO DINÁMICO
numInput?.addEventListener("input", (e)=>{
  let raw = e.target.value.replace(/\D/g,'');
  const brand = detectBrand(raw);
  brandLabel.textContent = brand;

  // Límite dinámico de longitud (15 para AMEX)
  const maxLen = (brand === "AMEX") ? 15 : (brand === "DINERS" ? 14 : 16);
  raw = raw.slice(0, maxLen);

  let formatted = "";
  if (brand === "AMEX") {
    // Formato AMEX: 4-6-5
    for(let i=0; i<raw.length; i++){
      if(i === 4 || i === 10) formatted += " ";
      formatted += raw[i];
    }
  } else {
    // Formato Estándar: 4-4-4-4
    for(let i=0; i<raw.length; i++){
      if(i > 0 && i % 4 === 0) formatted += " ";
      formatted += raw[i];
    }
  }

  e.target.value = formatted;
  
  // Cambia el placeholder visual dinámicamente
  const defaultPlaceholder = (brand === "AMEX") ? "#### ###### #####" : "#### #### #### ####";
  displayNum.textContent = formatted || defaultPlaceholder;
});

function parseAndFormatExp(input){
  const digits = (input || "").replace(/\D/g,"").slice(0,6);
  if (digits.length === 0) return {display:"", mm:null, yy:null, complete:false};

  const mm = digits.slice(0,2);
  const rest = digits.slice(2);

  if (rest.length <= 2){
    const complete = rest.length === 2;
    return { display: rest.length ? (mm + "/" + rest) : mm, mm, yy: complete ? rest : null, complete };
  }

  const yyyy = rest.slice(0,4);
  const complete = yyyy.length === 4;
  const yy = complete ? yyyy.slice(2,4) : null;
  return { display: mm + "/" + yyyy, mm, yy, complete };
}

function isValidExp(mm, yy){
  if (!mm || !yy) return false;
  const m = parseInt(mm,10);
  const y = parseInt(yy,10);
  if (!(m>=1 && m<=12)) return false;

  const now = new Date();
  const cy = parseInt(String(now.getFullYear()).slice(2),10);
  const cm = now.getMonth()+1;

  if (y < cy) return false;
  if (y === cy && m < cm) return false;
  return true;
}

dateInput?.addEventListener("input",(e)=>{
  const p = parseAndFormatExp(e.target.value);
  e.target.value = p.display;

  if (p.mm && p.yy) displayDate.textContent = p.mm + "/" + p.yy;
  else displayDate.textContent = p.display || "MM/AA";
});

dateInput?.addEventListener("blur", ()=>{
  const p = parseAndFormatExp(dateInput.value);
  if (p.mm && p.yy) {
    dateInput.value = p.mm + "/" + p.yy;
    displayDate.textContent = p.mm + "/" + p.yy;
  }
});

// VALIDACIÓN AL ENVIAR EL FORMULARIO
form?.addEventListener("submit",(e)=>{
  e.preventDefault();
  err.textContent = "";

  const raw = numInput.value.replace(/\D/g,'');
  const brand = detectBrand(raw);
  
  // Validamos que tenga la longitud exacta que le corresponde a su marca
  const reqLen = (brand === "AMEX") ? 15 : (brand === "DINERS" ? 14 : 16);

  if (raw.length !== reqLen || !luhn(raw)) {
    err.textContent = "ERROR: número de tarjeta inválido o incompleto";
    return;
  }

  const p = parseAndFormatExp(dateInput.value);
  if (!(p.mm && p.yy && isValidExp(p.mm, p.yy))) {
    err.textContent = "ERROR: vencimiento inválido";
    return;
  }

  dateInput.value = p.mm + "/" + p.yy;
  displayDate.textContent = p.mm + "/" + p.yy;

  loading.style.display = "flex";
  let c = 3;
  counterEl.textContent = c;

  const timer = setInterval(()=>{
    c--;
    counterEl.textContent = c;
    if (c <= 0){
      clearInterval(timer);
      setTimeout(()=> window.location.reload(), 900);
    }
  }, 1000);
});
