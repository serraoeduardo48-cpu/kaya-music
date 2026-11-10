/* ==========================================================================
   Player — motor de reprodução (uma só instância para o site todo,
   por isso a música NÃO pára quando mudas de página)
   ========================================================================== */
const Player = (() => {
  const a = new Audio();
  a.preload = "metadata";
  let fila = [], pos = -1, atual = null;
  let aleatorio = Store.pref.get("aleatorio", false), repetir = Store.pref.get("repetir", "off");
  let ouvintes = [];
  let pedido = 0;
  a.volume = Store.pref.get("volume", 0.8);

  const emitir = (tipo) => ouvintes.forEach(f => f(tipo));
  const aoMudar = f => ouvintes.push(f);

  async function carregar(id, tocar) {
    const m = Store.musica(id);
    if (!m) return;
    const meu = ++pedido;
    atual = m;
    emitir("faixa");
    const url = await Store.urlAudio(m.audio);
    if (meu !== pedido) return;
    if (!url) { emitir("erro"); return; }
    a.src = url;
    if (tocar) { try { await a.play(); } catch (e) { if (meu === pedido) emitir("bloqueado"); } }
    configurarMediaSession();
  }

  function tocar(id, lista) {
    if (lista && lista.length) fila = lista.slice();
    else if (!fila.includes(id)) fila = [id];
    pos = fila.indexOf(id);
    Store.pref.set("ultima", { id, t: 0 });
    return carregar(id, true);
  }
  function alternar() {
    if (!atual) return;
    if (a.paused) a.play().catch(() => emitir("bloqueado")); else a.pause();
  }
  function seguinte(auto) {
    if (!fila.length) return;
    if (auto && repetir === "one") { a.currentTime = 0; a.play(); return; }
    let n;
    if (aleatorio && fila.length > 1) { do { n = Math.floor(Math.random() * fila.length); } while (n === pos); }
    else { n = pos + 1; if (n >= fila.length) { if (repetir === "all" || !auto) n = 0; else { a.pause(); a.currentTime = 0; emitir("fim"); return; } } }
    pos = n; carregar(fila[pos], true);
  }
  function anterior() {
    if (!fila.length) return;
    if (a.currentTime > 3) { a.currentTime = 0; return; }
    pos = pos > 0 ? pos - 1 : fila.length - 1;
    carregar(fila[pos], true);
  }
  function procurar(frac) { if (isFinite(a.duration)) a.currentTime = Math.max(0, Math.min(1, frac)) * a.duration; }
  function volume(v) { a.volume = Math.max(0, Math.min(1, v)); a.muted = false; Store.pref.set("volume", a.volume); emitir("volume"); }
  function silenciar() { a.muted = !a.muted; emitir("volume"); }
  function alternarAleatorio() { aleatorio = !aleatorio; Store.pref.set("aleatorio", aleatorio); emitir("modo"); }
  function alternarRepetir() { repetir = repetir === "off" ? "all" : repetir === "all" ? "one" : "off"; Store.pref.set("repetir", repetir); emitir("modo"); }

  function configurarMediaSession() {
    if (!("mediaSession" in navigator) || !atual) return;
    const img = Store.url(Store.capaDe(atual));
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ title: atual.titulo, artist: Store.artista(atual.artista).nome, album: (Store.album(atual.album) || {}).titulo || "Kaya Music",
        artwork: img && !img.startsWith("blob:") ? [{ src: img, sizes: "512x512" }] : [] });
      navigator.mediaSession.setActionHandler("play", () => a.play());
      navigator.mediaSession.setActionHandler("pause", () => a.pause());
      navigator.mediaSession.setActionHandler("previoustrack", anterior);
      navigator.mediaSession.setActionHandler("nexttrack", () => seguinte(false));
    } catch (e) { /* alguns navegadores não suportam */ }
  }

  a.addEventListener("timeupdate", () => { emitir("tempo"); if (atual && Math.floor(a.currentTime) % 3 === 0) Store.pref.set("ultima", { id: atual.id, t: a.currentTime }); });
  a.addEventListener("loadedmetadata", () => emitir("tempo"));
  a.addEventListener("play", () => emitir("estado"));
  a.addEventListener("pause", () => emitir("estado"));
  a.addEventListener("waiting", () => emitir("estado"));
  a.addEventListener("playing", () => emitir("estado"));
  a.addEventListener("ended", () => seguinte(true));
  a.addEventListener("error", () => { if (a.src) emitir("erro"); });

  /* Restaura a última música (em pausa) ao abrir */
  function restaurar() {
    const u = Store.pref.get("ultima", null);
    const m = u && Store.musica(u.id);
    if (!m) return;
    fila = Store.get().musicas.map(x => x.id); pos = fila.indexOf(m.id); atual = m;
    Store.urlAudio(m.audio).then(url => {
      if (!url) return;
      a.src = url;
      a.addEventListener("loadedmetadata", () => { if (u.t > 1 && u.t < a.duration - 2) a.currentTime = u.t; }, { once: true });
      emitir("faixa");
    });
  }

  return {
    aoMudar, tocar, alternar, seguinte: () => seguinte(false), anterior, procurar, volume, silenciar, alternarAleatorio, alternarRepetir, restaurar,
    get atual() { return atual; }, get tocando() { return !a.paused && !a.ended; },
    get tempo() { return a.currentTime || 0; }, get duracao() { return isFinite(a.duration) ? a.duration : 0; },
    get volumeAtual() { return a.muted ? 0 : a.volume; }, get aleatorio() { return aleatorio; }, get repetir() { return repetir; },
    get fila() { return fila; }
  };
})();
