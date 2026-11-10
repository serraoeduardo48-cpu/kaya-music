/* ==========================================================================
   UI — pequenas ferramentas partilhadas (texto seguro, capas, avisos, janelas)
   ========================================================================== */
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

const fmtTempo = s => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };

/* Gradientes de marca para capas sem imagem */
const GRADIENTES = [
  "linear-gradient(135deg,#ffb300,#ff6f00)", "linear-gradient(135deg,#7c4dff,#3d1fa8)", "linear-gradient(135deg,#00bfa5,#00695c)",
  "linear-gradient(135deg,#ff4081,#aa00ff)", "linear-gradient(135deg,#448aff,#1a237e)", "linear-gradient(135deg,#69f0ae,#00897b)",
  "linear-gradient(135deg,#ff7043,#b71c1c)", "linear-gradient(135deg,#26c6da,#5e35b1)"
];
function hash(s) { let h = 0; s = String(s); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
const grad = seed => GRADIENTES[hash(seed) % GRADIENTES.length];
const iniciais = n => String(n || "?").trim().split(/\s+/).slice(0, 2).map(p => p[0]).join("").toUpperCase();

/* Capa: mostra a imagem se existir; se não, gradiente com iniciais */
function cover(ref, nome, cls, seed) {
  const url = Store.url(ref);
  return `<div class="cover ${cls || ""}" style="--g:${grad(seed || nome)}">${url ? `<img src="${esc(url)}" alt="" onerror="this.remove()">` : ""}<span class="ini">${esc(iniciais(nome))}</span></div>`;
}

/* Avisos */
function toast(msg, tipo) {
  const el = document.createElement("div");
  el.className = "toast " + (tipo || "ok");
  el.innerHTML = (tipo === "err" ? ico("close", "sm") : ico("check", "sm")) + `<span>${esc(msg)}</span>`;
  $("#toasts").appendChild(el);
  setTimeout(() => { el.style.transition = ".3s"; el.style.opacity = "0"; setTimeout(() => el.remove(), 320); }, 2600);
}

/* Janelas */
function modal({ titulo, corpo, rodape, pequeno }) {
  const ov = document.createElement("div");
  ov.className = "overlay";
  ov.innerHTML = `<div class="modal ${pequeno ? "small" : ""}" role="dialog" aria-modal="true">
    <div class="m-head"><h2>${esc(titulo)}</h2><button class="ibtn" data-x aria-label="Fechar">${ico("close")}</button></div>
    <div class="m-body">${corpo}</div><div class="m-foot">${rodape || ""}</div></div>`;
  document.body.appendChild(ov);
  const fechar = () => { ov.remove(); document.removeEventListener("keydown", esc_); };
  const esc_ = e => { if (e.key === "Escape") fechar(); };
  document.addEventListener("keydown", esc_);
  ov.addEventListener("mousedown", e => { if (e.target === ov) fechar(); });
  $("[data-x]", ov).onclick = fechar;
  return { el: ov, fechar };
}
function confirmar(titulo, texto, rotulo, perigo) {
  return new Promise(res => {
    const m = modal({ titulo, pequeno: true, corpo: `<p class="sub">${esc(texto)}</p>`,
      rodape: `<button class="btn sec2 sm" data-n>Cancelar</button><button class="btn sm ${perigo ? "perigo" : ""}" data-s>${esc(rotulo || "Confirmar")}</button>` });
    $("[data-n]", m.el).onclick = () => { m.fechar(); res(false); };
    $("[data-s]", m.el).onclick = () => { m.fechar(); res(true); };
    $("[data-x]", m.el).addEventListener("click", () => res(false));
  });
}

/* ---------- Letras ---------- */
const SECCOES = { intro: "Intro", verso: "Verso", verse: "Verso", estrofe: "Verso", refrao: "Refrão", chorus: "Refrão", coro: "Refrão", hook: "Refrão",
  ponte: "Ponte", bridge: "Ponte", prerefrao: "Pré-Refrão", prechorus: "Pré-Refrão", outro: "Outro", final: "Outro" };

/* Organiza a letra: normaliza títulos ([Verso 1], [Refrão]…), limpa espaços e linhas vazias a mais */
function organizarLetra(t) {
  const linhas = String(t || "").trim().replace(/\r\n?/g, "\n").split("\n").map(l => l.replace(/\s+$/g, "").replace(/\t/g, " "));
  const saida = [];
  for (const l of linhas) {
    const x = l.trim();
    const m = x.match(/^[\[\(\{]?\s*([A-Za-zÀ-ÿ\- ]+?)\s*(\d+)?\s*[\]\)\}]?\s*:?$/);
    const chave = m ? Store.slug(m[1]).replace(/-/g, "") : "";
    const eCab = m && SECCOES[chave] && (/^[\[\(\{]/.test(x) || /:$/.test(x) || m[2] || x.length < 18);
    if (eCab) { if (saida.length && saida[saida.length - 1] !== "") saida.push(""); saida.push(`[${SECCOES[chave]}${m[2] ? " " + m[2] : ""}]`); }
    else { if (x === "" && (!saida.length || saida[saida.length - 1] === "")) continue; saida.push(x); }
  }
  while (saida.length && saida[saida.length - 1] === "") saida.pop();
  return saida.join("\n");
}

/* Mostra a letra com títulos de secção; no modo duplo alinha original e tradução linha a linha */
function htmlLetra(letra, traducao, modo) {
  const L = (letra || "").split("\n"), T = (traducao || "").split("\n");
  const duplo = modo === "duplo" && traducao && L.length === T.length;
  const fonte = modo === "traducao" ? T : L;
  const out = []; let par = [];
  const fecha = () => { if (par.length) { out.push("<p>" + par.join("<br>") + "</p>"); par = []; } };
  fonte.forEach((l, i) => {
    const sec = l.match(/^\[(.+)\]$/);
    if (sec) { fecha(); out.push(`<h4>${esc(sec[1])}</h4>`); }
    else if (!l.trim()) fecha();
    else if (duplo) { fecha(); out.push(`<div class="par"><span>${esc(l)}</span><span>${esc(T[i])}</span></div>`); }
    else par.push(esc(l));
  });
  fecha();
  return out.join("");
}

/* Reduz imagens grandes antes de guardar (poupa espaço no navegador) */
async function reduzirImagem(file, max) {
  max = max || 900;
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise(r => c.toBlob(b => r(b || file), "image/jpeg", 0.88));
  } catch (e) { return file; }
}
/* Lê a duração e confirma que o navegador consegue tocar o ficheiro */
function lerDuracao(file) {
  return new Promise((res, rej) => {
    const a = new Audio(), u = URL.createObjectURL(file);
    const fim = () => { URL.revokeObjectURL(u); };
    const t = setTimeout(() => { fim(); rej(new Error("tempo")); }, 10000);
    a.preload = "metadata";
    a.onloadedmetadata = () => { clearTimeout(t); fim(); res(isFinite(a.duration) ? a.duration : 0); };
    a.onerror = () => { clearTimeout(t); fim(); rej(new Error("formato")); };
    a.src = u;
  });
}
