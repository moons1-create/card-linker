const form = document.getElementById("payment-form");
const numInput = document.getElementById("cardNumber");
const dateInput = document.getElementById("cardDate");
const err = document.getElementById("err");

const displayNum = document.getElementById("displayNumber");
const displayDate = document.getElementById("displayDate");
const brandLabel = document.getElementById("brand");

const loading = document.getElementById("loading");
const counterEl = document.getElementById("counter");

// Copy-only block
const FLAG_URL = "chrome://flags/#enable-autofill-credit-card-upload";
const copyFlag = document.getElementById("copyFlag");
const flagHelp = document.getElementById("flagHelp");

copyFlag.addEventListener("click", async () => {
  try{
    await navigator.clipboard.writeText(FLAG_URL);
    flagHelp.textContent = "Copiado ✅ Pégalo en la barra de direcciones de Chrome y presiona Enter.";
  }catch{
    flagHelp.textContent = "Copia manualmente: " + FLAG_URL;
  }
});

// Botones extra (sin t.me)
document.getElementById("update-button")?.addEventListener("click", () => {
  window.open("https://pay.google.com/gp/w/u/0/home/paymentmethods", "_blank", "noopener,noreferrer");
});

document.getElementById("perfil-button")?.addEventListener("click", () => {
  window.open("https://payments.google.com/", "_blank", "noopener,noreferrer");
});

// patrones
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

// NUM FORMATO (AMEX 4-6-5, resto 4-4-4-4)
numInput.addEventListener("input", (e)=>{
  let raw = e.target.value.replace(/\D/g,'').slice(0,19);
  const brand = detectBrand(raw);
  brandLabel.textContent = brand;

  let formatted = "";
  if (brand === "AMEX") {
    for(let i=0;i<raw.length;i++){
      if(i===4 || i===10) formatted += " ";
      formatted += raw[i];
    }
  } else {
    for(let i=0;i<raw.length;i++){
      if(i>0 && i%4===0) formatted += " ";
      formatted += raw[i];
    }
  }

  e.target.value = formatted;
  displayNum.textContent = formatted || "#### #### #### ####";
});

// FECHA: acepta MM/AA o MM/AAAA y normaliza a MM/AA
function parseAndFormatExp(input){
  const digits = (input || "").replace(/\D/g,"").slice(0,6);
  if (digits.length === 0) return {display:"", mm:null, yy:null, complete:false};

  const mm = digits.slice(0,2);
  const rest = digits.slice(2);

  // MM + YY
  if (rest.length <= 2){
    const complete = rest.length === 2;
    return { display: rest.length ? (mm + "/" + rest) : mm, mm, yy: complete ? rest : null, complete };
  }

  // MM + YYYY
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

dateInput.addEventListener("input",(e)=>{
  const p = parseAndFormatExp(e.target.value);
  e.target.value = p.display;

  if (p.mm && p.yy) displayDate.textContent = p.mm + "/" + p.yy;
  else displayDate.textContent = p.display || "MM/AA";
});

dateInput.addEventListener("blur", ()=>{
  const p = parseAndFormatExp(dateInput.value);
  if (p.mm && p.yy) {
    dateInput.value = p.mm + "/" + p.yy;
    displayDate.textContent = p.mm + "/" + p.yy;
  }
});

// SUBMIT: preventDefault + loading + reload
form.addEventListener("submit",(e)=>{
  e.preventDefault();
  err.textContent = "";

  const raw = numInput.value.replace(/\D/g,'');
  const brand = detectBrand(raw);
  const minLen = (brand === "AMEX") ? 15 : 16;

  if (raw.length < minLen || !luhn(raw)) {
    err.textContent = "ERROR: datos inválidos o incompletos";
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
