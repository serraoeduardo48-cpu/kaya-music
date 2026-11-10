/* ==========================================================================
   Store — guarda tudo no próprio navegador (sem servidor, sem instalar nada)
   - dados (texto): localStorage
   - ficheiros enviados (áudio, capas, fotos): IndexedDB
   ========================================================================== */
const Store = (() => {
  const KEY = "kaya.db.v3";
  let db = null;
  const cacheImg = {};   // ref "idb:..." -> objectURL (imagens carregadas no arranque)
  const cacheAud = {};   // ref "idb:..." -> objectURL (áudio, sob pedido)
  let idb = null;

  /* ---- IndexedDB ---- */
  function abrirIDB() {
    return new Promise(res => {
      if (!window.indexedDB) return res(null);
      let r;
      try { r = indexedDB.open("kaya-ficheiros", 1); } catch (e) { return res(null); }
      r.onupgradeneeded = () => r.result.createObjectStore("f");
      r.onsuccess = () => res(r.result);
      r.onerror = () => res(null);
    });
  }
  const tx = (modo, fn) => new Promise(res => {
    if (!idb) return res(null);
    const t = idb.transaction("f", modo), s = t.objectStore("f"), q = fn(s);
    t.oncomplete = () => res(q && "result" in q ? q.result : true);
    t.onerror = () => res(null);
  });

  const clone = o => JSON.parse(JSON.stringify(o));
  const slug = s => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "item";

  async function init() {
    idb = await abrirIDB();
    try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) { db = null; }
    if (!db || !Array.isArray(db.musicas)) db = clone(DADOS_PADRAO);
    for (const k of ["generos", "artistas", "albuns", "musicas", "playlists"]) db[k] = db[k] || [];
    db.favoritos = db.favoritos || [];
    // carrega as imagens guardadas (pequenas) para URLs imediatos
    if (idb) {
      const refs = [...db.musicas.map(m => m.capa), ...db.artistas.map(a => a.foto), ...db.albuns.map(a => a.capa)].filter(r => r && r.startsWith("idb:"));
      await Promise.all(refs.map(async r => {
        const blob = await tx("readonly", s => s.get(r.slice(4)));
        if (blob) cacheImg[r] = URL.createObjectURL(blob);
      }));
    }
    return db;
  }

  function guardar() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); return true; }
    catch (e) { console.warn(e); return false; }
  }

  /* ---- Ficheiros ---- */
  async function guardarFicheiro(prefixo, id, blob) {
    const chave = `${prefixo}:${slug(id)}-${Date.now().toString(36)}`;
    const ok = await tx("readwrite", s => s.put(blob, chave));
    if (!ok) throw new Error("Não foi possível guardar o ficheiro neste navegador.");
    const ref = "idb:" + chave;
    if (prefixo === "img") cacheImg[ref] = URL.createObjectURL(blob);
    return ref;
  }
  async function removerFicheiro(ref) {
    if (!ref || !ref.startsWith("idb:")) return;
    await tx("readwrite", s => s.delete(ref.slice(4)));
    [cacheImg, cacheAud].forEach(c => { if (c[ref]) { URL.revokeObjectURL(c[ref]); delete c[ref]; } });
  }
  async function urlAudio(ref) {
    if (!ref) return "";
    if (!ref.startsWith("idb:")) return encodeURI(ref);
    if (cacheAud[ref]) return cacheAud[ref];
    const blob = await tx("readonly", s => s.get(ref.slice(4)));
    if (!blob) return "";
    return (cacheAud[ref] = URL.createObjectURL(blob));
  }
  const url = ref => !ref ? "" : ref.startsWith("idb:") ? (cacheImg[ref] || "") : encodeURI(ref);

  async function repor() {
    localStorage.removeItem(KEY);
    await tx("readwrite", s => s.clear());
    Object.keys(cacheImg).concat(Object.keys(cacheAud)).forEach(k => { try { URL.revokeObjectURL(cacheImg[k] || cacheAud[k]); } catch (e) { /* ok */ } delete cacheImg[k]; delete cacheAud[k]; });
    db = clone(DADOS_PADRAO); db.favoritos = [];
  }

  /* ---- Consultas ---- */
  const get = () => db;
  const musica = id => db.musicas.find(m => m.id === id);
  const artista = id => db.artistas.find(a => a.id === id) || { id: "", nome: "Artista desconhecido", foto: "" };
  const album = id => db.albuns.find(a => a.id === id);
  const genero = id => db.generos.find(g => g.id === id) || { id: "", nome: "Sem género" };
  const playlist = id => db.playlists.find(p => p.id === id);
  const capaDe = m => (m && (m.capa || (album(m.album) || {}).capa || artista(m.artista).foto)) || "";
  function idUnico(base, lista) { let id = slug(base), n = 2; while (lista.some(x => x.id === id)) id = slug(base) + "-" + n++; return id; }

  /* ---- Preferências (perfil, favoritos, volume, palavra-passe) ---- */
  const pref = {
    get: (k, d) => { try { const v = localStorage.getItem("kaya." + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: (k, v) => { try { localStorage.setItem("kaya." + k, JSON.stringify(v)); } catch (e) { /* ok */ } }
  };
  const favoritos = () => pref.get("favoritos", []);
  function alternarFav(id) {
    const f = favoritos(), i = f.indexOf(id);
    if (i >= 0) f.splice(i, 1); else f.push(id);
    pref.set("favoritos", f);
    return i < 0;
  }

  return { init, guardar, guardarFicheiro, removerFicheiro, urlAudio, url, repor, get, musica, artista, album, genero, playlist, capaDe, idUnico, slug, pref, favoritos, alternarFav };
})();
