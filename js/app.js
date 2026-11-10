/* ==========================================================================
   App — arranque, início de sessão (perfis), estrutura, rotas e leitor
   ========================================================================== */
const App = (() => {
  let modoLetra = "letra";

  /* ---------- Início de sessão: dois perfis ---------- */
  function mostrarLogin() {
    $("#app").hidden = true;
    const el = $("#login"); el.hidden = false;
    el.innerHTML = `<div class="login-in"><img class="logo" src="assets/logo.png" alt="Kaya Music">
      <h1>Quem vai usar o Kaya?</h1><p class="sub">Escolhe o teu perfil para entrar.</p>
      <div class="perfis">
        <div class="perfil ouv" id="p-ouv" tabindex="0" role="button"><div class="big">${ico("headphones", "xl")}</div><h2>Ouvinte</h2>
          <p>Descobre, escuta e guarda as tuas músicas favoritas. Não precisa de palavra-passe.</p><span class="go">Entrar ${ico("right", "sm")}</span></div>
        <div class="perfil adm" id="p-adm" tabindex="0" role="button"><div class="big">${ico("shield", "xl")}</div><h2>Administrador</h2>
          <p>Adiciona músicas, letras, capas e artistas. Gere tudo o que os ouvintes veem.</p><span class="go">Entrar ${ico("right", "sm")}</span>
          <form class="senha" id="f-login" autocomplete="off"><input class="inp" type="password" id="l-senha" placeholder="Palavra-passe" aria-label="Palavra-passe">
            <div class="err-box" id="l-erro" hidden>Palavra-passe errada. Tenta outra vez.</div>
            <button class="btn" type="submit">${ico("lock", "sm")}Entrar como administrador</button>
            <span class="hint">Demonstração: a palavra-passe é <code>${esc(senhaAtual())}</code></span></form></div>
      </div></div>`;
    const entrar = perfil => { Store.pref.set("perfil", perfil); Sessao.perfil = perfil; Sessao.visita = false; sessionStorage.removeItem("kaya.visita"); el.hidden = true; abrirApp(); };
    $("#p-ouv").onclick = () => entrar("ouvinte");
    $("#p-ouv").onkeydown = e => { if (e.key === "Enter") entrar("ouvinte"); };
    const adm = $("#p-adm");
    const abre = () => { adm.classList.add("abre"); $("#l-senha").focus(); };
    adm.addEventListener("click", e => { if (!adm.classList.contains("abre")) abre(); });
    adm.addEventListener("keydown", e => { if (e.key === "Enter" && !adm.classList.contains("abre")) abre(); });
    $("#f-login").onsubmit = e => {
      e.preventDefault();
      if ($("#l-senha").value.trim() === senhaAtual()) entrar("admin");
      else { $("#l-erro").hidden = false; adm.classList.remove("shake"); void adm.offsetWidth; adm.classList.add("shake"); $("#l-senha").select(); }
    };
  }

  /* ---------- Estrutura ---------- */
  const NAV = [["#/", "home", "Início"], ["#/explorar", "compass", "Explorar"], ["#/albuns", "disc", "Álbuns"], ["#/artistas", "mic", "Artistas"], ["#/playlists", "list", "Playlists"], ["#/favoritos", "heart", "Favoritos"]];

  function desenharEstrutura() {
    $("#side").innerHTML = `<div class="brand"><a href="#/"><img src="assets/logo.png" alt="Kaya Music"></a></div>
      <div class="nav-title">Menu</div><nav class="nav" id="nav">${NAV.map(([h, i, t]) => `<a href="${h}" data-nav="${h}">${ico(i)}<span>${t}</span></a>`).join("")}</nav>
      ${Sessao.admin ? `<div class="nav-title">Administração</div><nav class="nav"><a href="#/admin" data-nav="#/admin">${ico("dashboard")}<span>Painel</span></a></nav>` : ""}
      <div class="side-foot">Kaya Music<br>A casa da música</div>`;
    $("#tabs").innerHTML = [["#/", "home", "Início"], ["#/explorar", "compass", "Explorar"], ["#/favoritos", "heart", "Favoritos"], ["#/playlists", "list", "Biblioteca"]]
      .map(([h, i, t]) => `<a href="${h}" data-nav="${h}">${ico(i)}<span>${t}</span></a>`).join("") + (Sessao.admin ? `<a href="#/admin" data-nav="#/admin">${ico("dashboard")}<span>Painel</span></a>` : `<button data-act="menu-perfil">${ico("user")}<span>Perfil</span></button>`);

    const adm = Sessao.perfil === "admin";
    $("#main").innerHTML = `<header class="top"><button class="nav-btn" data-act="voltar" aria-label="Voltar">${ico("left")}</button><button class="nav-btn" data-act="avancar" aria-label="Avançar">${ico("right")}</button>
      <div class="search">${ico("search")}<input id="busca" type="search" placeholder="Pesquisar músicas, artistas…" autocomplete="off" aria-label="Pesquisar"></div>
      <div class="top-right"><button class="profile-btn" data-act="menu-perfil"><span class="avatar ${adm ? "" : "ouvinte"}">${ico(adm ? "shield" : "headphones", "sm")}</span>
        <span style="text-align:left"><b>${adm ? (Sessao.visita ? "Admin (visita)" : "Administrador") : "Ouvinte"}</b><small>${Sessao.visita ? "a ver como ouvinte" : "Perfil"}</small></span>${ico("down", "sm")}</button><div id="menu-slot"></div></div></header>
      ${Sessao.visita ? `<div class="banner-visita">${ico("eye", "sm")}<span>Estás a ver o site <b>como um ouvinte</b>. O que o administrador gere não aparece aqui.</span><button data-act="sair-visita">Voltar ao admin</button></div>` : ""}
      <div id="view"></div>`;
    ligarBusca();
    if (matchMedia("(max-width:860px)").matches) $("#busca").placeholder = "Pesquisar…";
  }

  function ligarBusca() {
    const b = $("#busca"); let t;
    b.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => { const v = b.value.trim(); location.hash = v ? "#/explorar?q=" + encodeURIComponent(v) : "#/explorar"; }, 260); });
    b.addEventListener("keydown", e => { if (e.key === "Enter") { clearTimeout(t); const v = b.value.trim(); location.hash = v ? "#/explorar?q=" + encodeURIComponent(v) : "#/explorar"; } });
  }

  function menuPerfil() {
    const slot = $("#menu-slot");
    if (slot.innerHTML) { slot.innerHTML = ""; return; }
    const adm = Sessao.perfil === "admin";
    slot.innerHTML = `<div class="menu"><div class="tit">${adm ? "Administrador" : "Ouvinte"}</div>
      ${adm && !Sessao.visita ? `<a href="#/admin" data-act="fechar-menu">${ico("dashboard")}Painel de administração</a><button data-act="visitar">${ico("eye")}Ver site como ouvinte</button>` : ""}
      ${adm && Sessao.visita ? `<button data-act="sair-visita">${ico("shield")}Voltar ao painel de admin</button>` : ""}
      <hr><button data-act="trocar-perfil">${ico("logout")}Trocar de perfil</button></div>`;
    setTimeout(() => document.addEventListener("click", function f(e) { if (!e.target.closest(".top-right")) { slot.innerHTML = ""; document.removeEventListener("click", f); } else if (e.target.closest(".menu a, .menu button")) { slot.innerHTML = ""; document.removeEventListener("click", f); } }), 0);
  }

  /* ---------- Rotas ---------- */
  function rota() {
    if (!Sessao.perfil) return;
    const raw = location.hash.replace(/^#\/?/, "");
    const [caminho, consulta] = raw.split("?");
    const partes = caminho.split("/").filter(Boolean).map(decodeURIComponent);
    const qs = new URLSearchParams(consulta || "");
    const r = partes[0] || "inicio";
    let html, nav = "#/" + (partes[0] || "");
    if (r === "admin") {
      if (!Sessao.admin) { html = Views.naoEncontrado(); nav = ""; }
      else { html = Admin.render(partes[1]); nav = "#/admin"; }
    }
    else if (r === "inicio") { html = Views.inicio(); nav = "#/"; }
    else if (Views[r] && r !== "naoEncontrado") html = Views[r](partes[1], qs, modoLetra);
    else html = Views.naoEncontrado();
    fpFechar();
    const view = $("#view"); view.innerHTML = html;
    $("#main").scrollTop = 0;
    const mapa = { "#/album": "#/albuns", "#/artista": "#/artistas", "#/playlist": "#/playlists" };
    nav = mapa[nav] || nav;
    $$("[data-nav]").forEach(a => a.classList.toggle("on", a.dataset.nav === nav));
    const busca = $("#busca"); if (busca && r !== "explorar" && document.activeElement !== busca) busca.value = "";
    if (busca && r === "explorar" && document.activeElement !== busca) busca.value = qs.get("q") || "";
    document.title = "Kaya Music · A casa da música";
    refrescarEstado();
  }

  function recarregar() { if ($("#view")) { const y = $("#main").scrollTop; rota(); $("#main").scrollTop = y; } }

  /* ---------- Leitor (barra inferior) ---------- */
  function desenharLeitor() {
    $("#player").innerHTML = `<div class="p-info" id="p-info"></div>
      <div class="p-mid"><div class="ctrls"><button class="ibtn hide-m b-shuffle" data-act="aleatorio" title="Aleatório" aria-label="Aleatório">${ico("shuffle", "sm")}</button>
        <button class="ibtn" data-act="anterior" title="Anterior" aria-label="Anterior">${ico("prev")}</button>
        <button class="play b-play" data-act="alternar" title="Tocar / pausar" aria-label="Tocar ou pausar">${ico("play")}</button>
        <button class="ibtn" data-act="seguinte" title="Seguinte" aria-label="Seguinte">${ico("next")}</button>
        <button class="ibtn hide-m b-repeat" data-act="repetir" title="Repetir" aria-label="Repetir">${ico("repeat", "sm")}</button></div>
        <div class="prog"><span class="b-cur">0:00</span><input type="range" class="b-prog" min="0" max="1000" value="0" aria-label="Progresso"><span class="b-dur">0:00</span></div></div>
      <div class="p-right"><button class="ibtn" data-act="ir-musica" title="Letra e história" aria-label="Letra">${ico("lyrics", "sm")}</button>
        <button class="ibtn" data-act="baixar-atual" title="Descarregar" aria-label="Descarregar">${ico("download", "sm")}</button>
        <div class="vol"><button class="ibtn b-mute" data-act="mudo" aria-label="Volume">${ico("volume", "sm")}</button><input type="range" class="b-vol" min="0" max="100" aria-label="Volume"></div></div>`;
    ligarSeek($(".b-prog"));
    const vol = $(".b-vol");
    vol.addEventListener("input", () => Player.volume(vol.value / 100));
    pintarInfo(); pintarModo(); pintarVolume(); pintarEstado(); pintarTempo();
  }


  /* ---------- Leitor em ecrã inteiro (telemóvel) ---------- */
  const movel = () => matchMedia("(max-width:860px)").matches;
  function fpCriar() {
    let fp = $("#fp"); if (fp) return fp;
    fp = document.createElement("div"); fp.id = "fp"; fp.className = "fp";
    fp.innerHTML = `<div class="fp-top"><button class="ibtn" data-act="fechar-fp" aria-label="Fechar">${ico("down", "lg")}</button><b>A tocar agora</b><span style="width:40px"></span></div><div class="fp-body" id="fp-body"></div>`;
    document.body.appendChild(fp);
    let y0 = 0, dy = 0;
    fp.addEventListener("touchstart", e => { y0 = e.touches[0].clientY; dy = 0; fp.style.transition = "none"; }, { passive: true });
    fp.addEventListener("touchmove", e => { dy = e.touches[0].clientY - y0; if (dy > 0 && $("#fp-body").scrollTop <= 0 && !e.target.closest("input")) fp.style.transform = `translateY(${dy}px)`; }, { passive: true });
    fp.addEventListener("touchend", () => { fp.style.transition = ""; fp.style.transform = ""; if (dy > 120) fpFechar(); });
    return fp;
  }
  function fpAbrir() { if (!Player.atual) return; const fp = fpCriar(); fpPintar(); requestAnimationFrame(() => fp.classList.add("open")); document.body.classList.add("fp-open"); }
  function fpFechar() { const fp = $("#fp"); if (fp) fp.classList.remove("open"); document.body.classList.remove("fp-open"); }
  function fpPintar() {
    const m = Player.atual, body = $("#fp-body"); if (!body) return;
    if (!m) return fpFechar();
    const fav = Store.favoritos().includes(m.id);
    body.innerHTML = `<div class="fp-cover">${cover(Store.capaDe(m), m.titulo, "", m.id)}</div>
      <div class="fp-title"><div style="min-width:0"><h2>${esc(m.titulo)}</h2><p><a href="#/artista/${esc(m.artista)}">${esc(Store.artista(m.artista).nome)}</a></p></div>
        <button class="ibtn fav ${fav ? "on" : ""}" data-act="fav" data-id="${esc(m.id)}" aria-label="Favorito">${ico("heart", "lg")}</button></div>
      <div class="fp-seek"><input type="range" class="b-prog" min="0" max="1000" value="0" aria-label="Progresso"><div class="fp-times"><span class="b-cur">0:00</span><span class="b-dur">0:00</span></div></div>
      <div class="ctrls fp-ctrls"><button class="ibtn b-shuffle" data-act="aleatorio" aria-label="Aleatório">${ico("shuffle")}</button><button class="ibtn" data-act="anterior" aria-label="Anterior">${ico("prev", "lg")}</button>
        <button class="play b-play" data-act="alternar" aria-label="Tocar ou pausar">${ico("play", "lg")}</button><button class="ibtn" data-act="seguinte" aria-label="Seguinte">${ico("next", "lg")}</button>
        <button class="ibtn b-repeat" data-act="repetir" aria-label="Repetir">${ico("repeat")}</button></div>
      <div class="fp-actions"><button class="btn sec2 sm" data-act="fp-letra">${ico("lyrics", "sm")}Letra e história</button><button class="btn sec2 sm" data-act="baixar-atual">${ico("download", "sm")}Descarregar</button></div>`;
    ligarSeek($(".b-prog", body)); pintarEstado(); pintarModo(); pintarTempo();
  }

  function pintarInfo() {
    const m = Player.atual, p = $("#player"); if (!p) return;
    p.classList.toggle("vazio-p", !m);
    $("#p-info").innerHTML = m
      ? `<div data-act="ir-musica" style="width:58px;flex:none;cursor:pointer">${cover(Store.capaDe(m), m.titulo, "", m.id)}</div><div class="txt" data-act="ir-musica-m"><b>${esc(m.titulo)}</b><small><a href="#/artista/${esc(m.artista)}">${esc(Store.artista(m.artista).nome)}</a></small></div>
         <button class="ibtn fav ${Store.favoritos().includes(m.id) ? "on" : ""}" data-act="fav" data-id="${esc(m.id)}" aria-label="Favorito">${ico("heart", "sm")}</button>`
      : `<div class="p-empty"><div class="box">${ico("music", "lg")}</div><div><b>Nada a tocar</b><small style="display:block">Escolhe uma música para começar</small></div></div>`;
  }
  function pintarEstado() {
    const t = Player.tocando;
    $$(".b-play").forEach(b => b.innerHTML = ico(t ? "pause" : "play"));
    document.body.classList.toggle("tocando", t);
  }
  function ligarSeek(prog) {
    let arrasta = false;
    prog.addEventListener("pointerdown", () => arrasta = true);
    window.addEventListener("pointerup", () => arrasta = false);
    prog.addEventListener("input", () => { Player.procurar(prog.value / 1000); prog.style.setProperty("--p", prog.value / 10 + "%"); });
    prog._arrasta = () => arrasta;
  }
  function pintarTempo() {
    const d = Player.duracao, c = Player.tempo, f = d ? c / d : 0;
    $$(".b-cur").forEach(e => e.textContent = fmtTempo(c)); $$(".b-dur").forEach(e => e.textContent = fmtTempo(d));
    $$(".b-prog").forEach(p => { if (!p._arrasta || !p._arrasta()) { p.value = Math.round(f * 1000); p.style.setProperty("--p", f * 100 + "%"); } });
    const pl = $("#player"); if (pl) pl.style.setProperty("--pp", f * 100 + "%");
  }
  function pintarModo() {
    $$(".b-shuffle").forEach(b => b.classList.toggle("on", Player.aleatorio));
    $$(".b-repeat").forEach(b => { b.classList.toggle("on", Player.repetir !== "off"); b.innerHTML = ico(Player.repetir === "one" ? "repeat1" : "repeat", "sm"); });
  }
  function pintarVolume() {
    const v = Player.volumeAtual, vol = $(".b-vol"); if (!vol) return;
    vol.value = Math.round(v * 100); vol.style.setProperty("--p", v * 100 + "%");
    $(".b-mute").innerHTML = ico(v === 0 ? "mute" : "volume", "sm");
  }
  /* Linhas "a tocar", botões de coração e botão grande da página da música */
  function refrescarEstado() {
    const id = Player.atual && Player.atual.id, t = Player.tocando;
    $$(".track").forEach(r => r.classList.toggle("on", r.dataset.id === id));
    $$(".js-fab").forEach(b => { const eu = b.dataset.id === id; b.innerHTML = ico(eu && t ? "pause" : "play", "lg"); b.dataset.act = eu ? "alternar" : "tocar"; });
    $$(".np").forEach(n => n.classList.toggle("a-tocar", t && !!$(".js-fab", n) && $(".js-fab", n).dataset.id === id));
    const fav = Store.favoritos();
    $$('[data-act="fav"]').forEach(b => b.classList.toggle("on", fav.includes(b.dataset.id)));
  }

  /* ---------- Acções (clicks) ---------- */
  async function baixar(id) {
    const m = Store.musica(id); if (!m) return;
    const url = await Store.urlAudio(m.audio);
    if (!url) return toast("Ficheiro de áudio não encontrado", "err");
    const ext = m.ext || (m.audio.match(/\.([a-z0-9]+)$/i) || [0, "mp3"])[1];
    const a = document.createElement("a");
    a.href = url; a.download = `${m.titulo} - ${Store.artista(m.artista).nome}.${ext}`.replace(/[\\/:*?"<>|]/g, "");
    document.body.appendChild(a); a.click(); a.remove();
    toast("A descarregar “" + m.titulo + "”");
  }

  const ACOES = {
    tocar: el => { const id = el.dataset.id, q = (el.dataset.q || id).split(",").filter(Boolean); if (Player.atual && Player.atual.id === id) Player.alternar(); else Player.tocar(id, q); },
    alternar: () => Player.alternar(),
    anterior: () => Player.anterior(), seguinte: () => Player.seguinte(),
    aleatorio: () => Player.alternarAleatorio(), repetir: () => Player.alternarRepetir(), mudo: () => Player.silenciar(),
    fav: el => { const on = Store.alternarFav(el.dataset.id); refrescarEstado(); toast(on ? "Adicionada aos favoritos" : "Removida dos favoritos"); if (location.hash.startsWith("#/favoritos") && !on) recarregar(); },
    baixar: el => baixar(el.dataset.id),
    "baixar-atual": () => Player.atual ? baixar(Player.atual.id) : toast("Escolhe uma música primeiro", "err"),
    "ir-musica": () => { if (!Player.atual) return; if (movel()) fpAbrir(); else location.hash = "#/musica/" + Player.atual.id; },
    "ir-musica-m": () => { if (Player.atual && movel()) fpAbrir(); },
    "abrir-fp": () => fpAbrir(), "fechar-fp": () => fpFechar(),
    "fp-letra": () => { fpFechar(); if (Player.atual) location.hash = "#/musica/" + Player.atual.id; },
    aba: el => { modoLetra = el.dataset.modo; recarregar(); },
    voltar: () => history.back(), avancar: () => history.forward(),
    "menu-perfil": () => menuPerfil(), "fechar-menu": () => { $("#menu-slot").innerHTML = ""; },
    visitar: () => { Sessao.visita = true; sessionStorage.setItem("kaya.visita", "1"); desenharEstrutura(); location.hash = "#/"; rota(); toast("A ver como ouvinte"); },
    "sair-visita": () => { Sessao.visita = false; sessionStorage.removeItem("kaya.visita"); desenharEstrutura(); location.hash = "#/admin"; rota(); },
    "trocar-perfil": () => { if (Player.tocando) Player.alternar(); Store.pref.set("perfil", null); Sessao.perfil = null; Sessao.visita = false; sessionStorage.removeItem("kaya.visita"); location.hash = "#/"; mostrarLogin(); }
  };

  document.addEventListener("click", e => {
    const alvo = e.target.closest("[data-act]");
    if (alvo) {
      const n = alvo.dataset.act;
      if (n === "tocar" && alvo.classList.contains("track") && e.target.closest("a[href]")) return; // links dentro da linha
      if (alvo.tagName === "SELECT") return;
      if (n === "ir-musica-m" && e.target.closest("a[href]")) return;
      if (n.startsWith("adm:")) { Admin.acao(n.slice(4), alvo); return; }
      if (ACOES[n]) { ACOES[n](alvo); return; }
    }
    const go = e.target.closest("[data-go]");
    if (go) location.hash = go.dataset.go;
  });
  document.addEventListener("change", e => { const el = e.target.closest("[data-act^='adm:']"); if (el && el.tagName === "SELECT") Admin.acao(el.dataset.act.slice(4), el); });
  document.addEventListener("keydown", e => {
    const alvo = e.target;
    if (e.key === "Enter" && alvo.matches && alvo.matches("[data-go]")) { location.hash = alvo.dataset.go; return; }
    if (e.key === "Escape" && $("#fp.open")) fpFechar();
    if (e.code === "Space" && !alvo.closest("input,textarea,select,button,[contenteditable]") && Player.atual && Sessao.perfil && !$(".overlay")) { e.preventDefault(); Player.alternar(); }
  });
  document.addEventListener("change", e => { if (e.target.id === "pub-file" && e.target.files[0]) { Admin.publicar(e.target.files[0]); e.target.value = ""; } });
  document.addEventListener("dragover", e => { const p = e.target.closest && e.target.closest(".publish"); if (p) { e.preventDefault(); p.classList.add("sobre"); } });
  document.addEventListener("dragleave", e => { const p = e.target.closest && e.target.closest(".publish"); if (p) p.classList.remove("sobre"); });
  document.addEventListener("drop", e => { const p = e.target.closest && e.target.closest(".publish"); if (p) { e.preventDefault(); p.classList.remove("sobre"); if (e.dataTransfer.files[0]) Admin.publicar(e.dataTransfer.files[0]); } });
  window.addEventListener("hashchange", rota);
  window.addEventListener("kaya:refresh", () => { if ($("#side")) { desenharEstrutura(); } rota(); });

  Player.aoMudar(tipo => {
    if (!$("#player").innerHTML) return;
    if (tipo === "faixa") { pintarInfo(); refrescarEstado(); if ($("#fp.open")) fpPintar(); pintarTempo(); }
    else if (tipo === "estado") { pintarEstado(); refrescarEstado(); }
    else if (tipo === "tempo") pintarTempo();
    else if (tipo === "modo") pintarModo();
    else if (tipo === "volume") pintarVolume();
    else if (tipo === "erro") toast("Não foi possível tocar esta música. Confirma que o ficheiro existe e é MP3.", "err");
    else if (tipo === "bloqueado") toast("Clica em ▶ para começar a tocar", "err");
    else if (tipo === "fim") { pintarEstado(); refrescarEstado(); }
  });

  function abrirApp() {
    $("#login").hidden = true; $("#app").hidden = false;
    desenharEstrutura(); desenharLeitor();
    if (!location.hash || location.hash === "#") location.hash = "#/";
    rota();
  }

  async function iniciar() {
    await Store.init();
    Player.restaurar();
    if (Sessao.perfil) abrirApp(); else mostrarLogin();
  }
  return { iniciar };
})();

App.iniciar();
