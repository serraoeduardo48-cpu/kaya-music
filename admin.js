/* ==========================================================================
   Painel de administração (só aparece no perfil Administrador)
   ========================================================================== */
const SENHA_PADRAO = "admin";
const senhaAtual = () => Store.pref.get("senha", SENHA_PADRAO);

const Admin = (() => {
  const SUBS = [["musicas", "Músicas", "music"], ["artistas", "Artistas", "mic"], ["albuns", "Álbuns", "disc"], ["playlists", "Playlists", "list"], ["definicoes", "Definições", "settings"]];
  const refrescar = () => window.dispatchEvent(new Event("kaya:refresh"));
  const val = (root, s) => ($(s, root) || {}).value || "";

  /* ---------- Página principal ---------- */
  function render(sub) {
    sub = SUBS.some(s => s[0] === sub) ? sub : "musicas";
    const d = DB();
    const n = { musicas: d.musicas.length, artistas: d.artistas.length, albuns: d.albuns.length, playlists: d.playlists.length, definicoes: "" };
    const topo = { musicas: ["Músicas publicadas", null], artistas: ["Artistas", ["novo-artista", "Novo artista"]], albuns: ["Álbuns", ["novo-album", "Novo álbum"]], playlists: ["Playlists", ["nova-playlist", "Nova playlist"]], definicoes: ["Definições", null] }[sub];
    const conteudo = { musicas, artistas, albuns, playlists, definicoes }[sub]();
    return `<div class="page admin"><div class="pagehead"><div><span class="eyebrow">Administração</span><h1 class="titulo" style="margin-top:8px">Painel</h1></div>
      <button class="btn sec2 sm" data-act="visitar">${ico("eye", "sm")}Ver como ouvinte</button></div>
      <label class="publish" for="pub-file"><div class="pub-ic">${ico("upload", "xl")}</div>
        <div class="pub-txt"><h2>Publicar nova música</h2><p>Arrasta um ficheiro de áudio para aqui ou clica para escolher. Depois preenches o artista, a capa e a letra.</p></div>
        <span class="btn pub-btn">${ico("plus", "sm")}Escolher música</span><input type="file" id="pub-file" accept="audio/*,.mp3,.m4a,.aac,.ogg,.opus,.wav,.flac" hidden></label>
      <div class="atabs">${SUBS.map(([k, nome, ic]) => `<a href="#/admin/${k}" class="${k === sub ? "on" : ""}">${ico(ic, "sm")}<span>${nome}</span>${n[k] !== "" ? `<em>${n[k]}</em>` : ""}</a>`).join("")}</div>
      <div class="lista-topo"><h2>${topo[0]}</h2>${topo[1] ? `<button class="btn sm" data-act="adm:${topo[1][0]}">${ico("plus", "sm")}${topo[1][1]}</button>` : ""}</div>${conteudo}</div>`;
  }

  const vazioLista = (ic, t, p) => `<div class="vazio" style="margin-top:20px">${ico(ic)}<h3>${t}</h3><p>${p}</p></div>`;
  const btnsLinha = (tipo, id) => `<button class="ibtn" data-act="adm:editar-${tipo}" data-id="${esc(id)}" title="Editar" aria-label="Editar">${ico("edit", "sm")}</button><button class="ibtn danger" data-act="adm:apagar-${tipo}" data-id="${esc(id)}" title="Apagar" aria-label="Apagar">${ico("trash", "sm")}</button>`;

  function musicas() {
    const l = DB().musicas.slice().reverse();
    if (!l.length) return vazioLista("music", "Ainda não há músicas", "Clica em “Adicionar música” para enviar a primeira.");
    return `<div class="arows">${l.map(m => `<div class="arow">${cover(Store.capaDe(m), m.titulo, "", m.id)}
      <div class="inf"><b>${esc(m.titulo)}${m.letra ? '<span class="pill ok">com letra</span>' : '<span class="pill no">sem letra</span>'}</b><small>${esc(Store.artista(m.artista).nome)} · ${esc(Store.genero(m.genero).nome)} · ${esc(m.duracao || "—")}</small></div>
      <button class="ibtn" data-act="tocar" data-id="${esc(m.id)}" data-q="${esc(m.id)}" title="Ouvir" aria-label="Ouvir">${ico("play", "sm")}</button>${btnsLinha("musica", m.id)}</div>`).join("")}</div>`;
  }
  function artistas() {
    const l = DB().artistas;
    if (!l.length) return vazioLista("mic", "Ainda não há artistas", "Adiciona o primeiro artista.");
    return `<div class="arows">${l.map(a => `<div class="arow">${cover(a.foto, a.nome, "round", a.id)}<div class="inf"><b>${esc(a.nome)}</b><small>${esc(Store.genero(a.genero).nome)} · ${DB().musicas.filter(m => m.artista === a.id).length} música(s)</small></div>${btnsLinha("artista", a.id)}</div>`).join("")}</div>`;
  }
  function albuns() {
    const l = DB().albuns;
    if (!l.length) return vazioLista("disc", "Ainda não há álbuns", "Cria um álbum para agrupar músicas.");
    return `<div class="arows">${l.map(a => `<div class="arow">${cover(a.capa, a.titulo, "", a.id)}<div class="inf"><b>${esc(a.titulo)}</b><small>${esc(Store.artista(a.artista).nome)} · ${esc(a.ano)} · ${DB().musicas.filter(m => m.album === a.id).length} faixa(s)</small></div>${btnsLinha("album", a.id)}</div>`).join("")}</div>`;
  }
  function playlists() {
    const l = DB().playlists;
    if (!l.length) return vazioLista("list", "Ainda não há playlists", "Cria uma playlist com as tuas músicas favoritas.");
    return `<div class="arows">${l.map(p => `<div class="arow">${cover(capaPlaylist(p), p.nome, "", p.id)}<div class="inf"><b>${esc(p.nome)}</b><small>${p.musicas.length} música(s) ${p.descricao ? "· " + esc(p.descricao) : ""}</small></div>${btnsLinha("playlist", p.id)}</div>`).join("")}</div>`;
  }
  function definicoes() {
    const d = DB(), dest = Store.pref.get("destaque", "");
    return `<div class="arows">
      <div class="setting"><div><h3>Música em destaque</h3><p>Aparece no topo da página inicial.</p></div>
        <select class="inp" style="width:260px" data-act="adm:destaque"><option value="">Automático (a mais recente)</option>${d.musicas.map(m => `<option value="${esc(m.id)}" ${m.id === dest ? "selected" : ""}>${esc(m.titulo)}</option>`).join("")}</select></div>
      <div class="setting"><div><h3>Palavra-passe do administrador</h3><p>Actualmente: <b>${esc(senhaAtual())}</b>. Muda para o que quiseres — pode ser simples.</p></div><button class="btn sec2 sm" data-act="adm:senha">${ico("lock", "sm")}Mudar</button></div>
      <div class="setting"><div><h3>Repor dados de demonstração</h3><p>Apaga o que foi adicionado e volta ao conteúdo inicial do Kaya Music.</p></div><button class="btn sec2 sm" data-act="adm:repor">${ico("reset", "sm")}Repor</button></div></div>`;
  }

  /* ---------- Campos reutilizáveis ---------- */
  function zona(id, titulo, dica, aceita, compacto) {
    return `<label class="dz ${compacto ? "compact" : ""}" data-dz="${id}">${ico(compacto ? "image" : "upload")}<span><b>${titulo}</b>${compacto ? " " : "<br>"}<small>${dica}</small></span><input type="file" id="${id}" accept="${aceita}"></label>`;
  }
  function ligarZonas(root, aoEscolher) {
    $$("[data-dz]", root).forEach(z => {
      const inp = $("input", z), span = $("span", z), original = span.innerHTML;
      const marcar = () => {
        const f = inp.files[0];
        if (f) { z.classList.add("tem"); span.innerHTML = `<b>${esc(f.name)}</b><br><small>${(f.size / 1048576).toFixed(1)} MB</small>`; }
        else { z.classList.remove("tem"); span.innerHTML = original; }
        if (aoEscolher) aoEscolher(z.dataset.dz, f);
      };
      inp.addEventListener("change", marcar);
      z.addEventListener("dragover", e => { e.preventDefault(); z.classList.add("sobre"); });
      z.addEventListener("dragleave", () => z.classList.remove("sobre"));
      z.addEventListener("drop", e => { e.preventDefault(); z.classList.remove("sobre"); if (e.dataTransfer.files[0]) { inp.files = e.dataTransfer.files; marcar(); } });
    });
  }
  const opcoes = (lista, sel, rot, primeira) => (primeira != null ? `<option value="">${primeira}</option>` : "") + lista.map(x => `<option value="${esc(x.id)}" ${x.id === sel ? "selected" : ""}>${esc(x[rot])}</option>`).join("");
  const erro = (root, msg) => { const e = $("#f-erro", root); e.hidden = false; e.textContent = msg; e.scrollIntoView({ block: "nearest", behavior: "smooth" }); };

  /* ---------- Música ---------- */
  function formMusica(m, inicial) {
    const novo = !m, d = DB();
    let audio = null, segundos = 0;
    const mod = modal({ titulo: novo ? "Adicionar música" : "Editar música",
      corpo: `<div class="err-box" id="f-erro" hidden></div>
        <div class="field"><label>1. Ficheiro de áudio ${novo ? "<i>*</i>" : "(opcional — deixa vazio para manter)"}</label>${zona("f-audio", "Arrasta a música para aqui ou clica para escolher", "MP3 recomendado · também M4A, WAV, OGG", "audio/*,.mp3,.m4a,.aac,.ogg,.opus,.wav,.flac")}</div>
        <div class="sep">2. Informação</div>
        <div class="field"><label>Título <i>*</i></label><input class="inp" id="f-titulo" maxlength="120" value="${esc(m && m.titulo)}" placeholder="Nome da música"></div>
        <div class="grid2"><div class="field"><label>Artista <i>*</i></label><select class="inp" id="f-artista">${opcoes(d.artistas, m && m.artista, "nome", "Escolher artista…")}<option value="__novo__">+ Novo artista…</option></select>
            <input class="inp" id="f-artista-novo" placeholder="Nome do novo artista" style="margin-top:8px" hidden></div>
          <div class="field"><label>Género <i>*</i></label><select class="inp" id="f-genero">${opcoes(d.generos, m && m.genero, "nome", "Escolher género…")}</select></div></div>
        <div class="grid2"><div class="field"><label>Álbum</label><select class="inp" id="f-album">${opcoes(d.albuns, m && m.album, "titulo", "Single (sem álbum)")}<option value="__novo__">+ Novo álbum…</option></select>
            <input class="inp" id="f-album-novo" placeholder="Título do novo álbum" style="margin-top:8px" hidden></div>
          <div class="field"><label>Data de lançamento</label><input class="inp" type="date" id="f-data" value="${esc((m && m.data) || new Date().toISOString().slice(0, 10))}"></div></div>
        <div class="field"><label>Capa (opcional)</label>${zona("f-capa", "Escolher imagem da capa", "JPG, PNG ou WEBP", "image/*", true)}</div>
        <div class="sep">3. História e letra</div>
        <div class="field"><label>História da música (opcional)</label><textarea class="inp" id="f-contexto" maxlength="3000" placeholder="Conta a história por trás desta música…">${esc(m && m.contexto)}</textarea></div>
        <div class="field"><label>Letra</label><textarea class="inp mono" id="f-letra" placeholder="Cola a letra aqui. Títulos como “Verso 1”, “Refrão” e “Ponte” são arrumados automaticamente.">${esc(m && m.letra)}</textarea>
          <div class="tools"><button type="button" class="btn sec2 sm" id="b-org">${ico("sparkles", "sm")}Organizar letra</button><button type="button" class="btn sec2 sm" id="b-txt">${ico("lyrics", "sm")}Carregar .txt</button><button type="button" class="btn sec2 sm" id="b-web">${ico("globe", "sm")}Procurar na internet</button><input type="file" id="f-txt" accept=".txt,text/plain" hidden></div></div>
        <div class="field"><label>Tradução (opcional)</label><textarea class="inp mono" id="f-trad" style="min-height:120px">${esc(m && m.traducao)}</textarea><div class="note" id="f-aviso"></div></div>`,
      rodape: `<button class="btn sec2 sm" data-cancel>Cancelar</button><button class="btn sm" id="f-gravar">${ico("check", "sm")}${novo ? "Adicionar música" : "Guardar alterações"}</button>` });
    const root = mod.el;
    $("[data-cancel]", root).onclick = mod.fechar;
    ligarZonas(root, async (id, f) => {
      if (id !== "f-audio" || !f) { if (id === "f-audio") { audio = null; } return; }
      try {
        segundos = await lerDuracao(f); audio = f;
        const z = $('[data-dz="f-audio"] span', root); z.innerHTML = `<b>${esc(f.name)}</b><br><small>${(f.size / 1048576).toFixed(1)} MB · duração ${fmtTempo(segundos)}</small>`;
        if (!val(root, "#f-titulo")) $("#f-titulo", root).value = f.name.replace(/\.[^.]+$/, "").replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
        $("#f-erro", root).hidden = true;
      } catch (e) {
        audio = null; $("#f-audio", root).value = ""; $('[data-dz="f-audio"]', root).classList.remove("tem");
        erro(root, "Este navegador não consegue tocar esse ficheiro. Usa um MP3 (ou M4A/WAV/OGG normal).");
      }
    });
    const alterna = (sel, campo) => $(sel, root).addEventListener("change", e => { $(campo, root).hidden = e.target.value !== "__novo__"; if (!$(campo, root).hidden) $(campo, root).focus(); });
    alterna("#f-artista", "#f-artista-novo"); alterna("#f-album", "#f-album-novo");
    const aviso = () => { const l = val(root, "#f-letra").trim().split("\n").length, t = val(root, "#f-trad").trim(); $("#f-aviso", root).textContent = t && t.split("\n").length !== l ? `A letra tem ${l} linhas e a tradução ${t.split("\n").length}. Para a vista “Lado a lado” alinhar, devem ter o mesmo número.` : ""; };
    $("#f-letra", root).addEventListener("input", aviso); $("#f-trad", root).addEventListener("input", aviso); aviso();
    $("#b-org", root).onclick = () => { $("#f-letra", root).value = organizarLetra(val(root, "#f-letra")); if (val(root, "#f-trad").trim()) $("#f-trad", root).value = organizarLetra(val(root, "#f-trad")); aviso(); toast("Letra organizada"); };
    $("#b-txt", root).onclick = () => $("#f-txt", root).click();
    $("#f-txt", root).onchange = async e => { if (e.target.files[0]) { $("#f-letra", root).value = organizarLetra(await e.target.files[0].text()); aviso(); toast("Letra carregada e organizada"); } };
    $("#b-web", root).onclick = () => { const a = $("#f-artista", root); const n = a.value === "__novo__" ? val(root, "#f-artista-novo") : (a.value ? a.options[a.selectedIndex].text : ""); window.open("https://www.google.com/search?q=" + encodeURIComponent(`${val(root, "#f-titulo")} ${n} letra`), "_blank", "noopener"); };

    if (inicial) { const dt = new DataTransfer(); dt.items.add(inicial); const inp = $("#f-audio", root); inp.files = dt.files; inp.dispatchEvent(new Event("change")); }

    $("#f-gravar", root).onclick = async () => {
      const btn = $("#f-gravar", root);
      const titulo = val(root, "#f-titulo").trim();
      if (novo && !audio) return erro(root, "Escolhe o ficheiro de áudio da música.");
      if (!titulo) return erro(root, "Escreve o título da música.");
      let art = val(root, "#f-artista"), gen = val(root, "#f-genero"), alb = val(root, "#f-album");
      if (!art) return erro(root, "Escolhe o artista.");
      if (!gen) return erro(root, "Escolhe o género.");
      if (art === "__novo__" && !val(root, "#f-artista-novo").trim()) return erro(root, "Escreve o nome do novo artista.");
      if (alb === "__novo__" && !val(root, "#f-album-novo").trim()) return erro(root, "Escreve o título do novo álbum.");
      btn.disabled = true; btn.innerHTML = "A guardar…";
      try {
        const db = DB();
        if (art === "__novo__") { const nome = val(root, "#f-artista-novo").trim(); art = Store.idUnico(nome, db.artistas); db.artistas.push({ id: art, nome, genero: gen, foto: "", bio: "" }); }
        if (alb === "__novo__") { const t = val(root, "#f-album-novo").trim(); alb = Store.idUnico(t, db.albuns); db.albuns.push({ id: alb, titulo: t, artista: art, ano: Number(val(root, "#f-data").slice(0, 4)) || new Date().getFullYear(), capa: "" }); }
        const id = m ? m.id : Store.idUnico(titulo, db.musicas);
        const alvo = m || { id, audio: "", capa: "", duracao: "", ext: "mp3" };
        if (audio) { const antigo = alvo.audio; alvo.audio = await Store.guardarFicheiro("aud", id, audio); alvo.duracao = fmtTempo(segundos); alvo.ext = (audio.name.match(/\.([a-z0-9]+)$/i) || [0, "mp3"])[1].toLowerCase(); if (m) await Store.removerFicheiro(antigo); }
        const capaF = $("#f-capa", root).files[0];
        if (capaF) { const antiga = alvo.capa; alvo.capa = await Store.guardarFicheiro("img", id, await reduzirImagem(capaF)); await Store.removerFicheiro(antiga); }
        Object.assign(alvo, { titulo, artista: art, genero: gen, album: alb, data: val(root, "#f-data"), contexto: val(root, "#f-contexto").trim(), letra: organizarLetra(val(root, "#f-letra")), traducao: organizarLetra(val(root, "#f-trad")) });
        if (!m) db.musicas.push(alvo);
        if (!Store.guardar()) throw new Error("Sem espaço para guardar os dados no navegador.");
        mod.fechar(); toast(novo ? "Música adicionada ao site" : "Alterações guardadas"); refrescar();
      } catch (e) { btn.disabled = false; btn.innerHTML = ico("check", "sm") + (novo ? "Adicionar música" : "Guardar alterações"); erro(root, e.message || "Não foi possível guardar."); }
    };
  }

  /* ---------- Artista / Álbum / Playlist ---------- */
  function formSimples({ titulo, campos, gravar, extra }) {
    const mod = modal({ titulo, corpo: `<div class="err-box" id="f-erro" hidden></div>${campos}`, rodape: `<button class="btn sec2 sm" data-cancel>Cancelar</button><button class="btn sm" id="f-gravar">${ico("check", "sm")}Guardar</button>` });
    const root = mod.el;
    $("[data-cancel]", root).onclick = mod.fechar; ligarZonas(root);
    if (extra) extra(root);
    $("#f-gravar", root).onclick = async () => {
      const btn = $("#f-gravar", root); btn.disabled = true;
      try { const msg = await gravar(root); if (msg) { btn.disabled = false; return erro(root, msg); } mod.fechar(); refrescar(); }
      catch (e) { btn.disabled = false; erro(root, e.message || "Não foi possível guardar."); }
    };
  }
  function formArtista(a) {
    formSimples({ titulo: a ? "Editar artista" : "Novo artista",
      campos: `<div class="field"><label>Nome <i>*</i></label><input class="inp" id="f-nome" maxlength="80" value="${esc(a && a.nome)}" placeholder="Nome artístico"></div>
        <div class="field"><label>Género principal</label><select class="inp" id="f-genero">${opcoes(DB().generos, a && a.genero, "nome", "—")}</select></div>
        <div class="field"><label>Foto</label>${zona("f-foto", "Escolher foto do artista", "JPG, PNG ou WEBP", "image/*", true)}</div>
        <div class="field"><label>Biografia (opcional)</label><textarea class="inp" id="f-bio" maxlength="2000">${esc(a && a.bio)}</textarea></div>`,
      gravar: async root => {
        const nome = val(root, "#f-nome").trim(); if (!nome) return "Escreve o nome do artista.";
        const db = DB(); const alvo = a || { id: Store.idUnico(nome, db.artistas), foto: "" };
        const f = $("#f-foto", root).files[0]; if (f) { const antiga = alvo.foto; alvo.foto = await Store.guardarFicheiro("img", alvo.id, await reduzirImagem(f)); await Store.removerFicheiro(antiga); }
        Object.assign(alvo, { nome, genero: val(root, "#f-genero"), bio: val(root, "#f-bio").trim() });
        if (!a) db.artistas.push(alvo); Store.guardar(); toast("Artista guardado");
      } });
  }
  function formAlbum(al) {
    formSimples({ titulo: al ? "Editar álbum" : "Novo álbum",
      campos: `<div class="field"><label>Título <i>*</i></label><input class="inp" id="f-titulo" maxlength="100" value="${esc(al && al.titulo)}"></div>
        <div class="grid2"><div class="field"><label>Artista <i>*</i></label><select class="inp" id="f-artista">${opcoes(DB().artistas, al && al.artista, "nome", "Escolher…")}</select></div>
        <div class="field"><label>Ano</label><input class="inp" type="number" id="f-ano" min="1900" max="2100" value="${esc((al && al.ano) || new Date().getFullYear())}"></div></div>
        <div class="field"><label>Capa</label>${zona("f-capa", "Escolher capa do álbum", "JPG, PNG ou WEBP", "image/*", true)}</div>`,
      gravar: async root => {
        const t = val(root, "#f-titulo").trim(); if (!t) return "Escreve o título do álbum."; if (!val(root, "#f-artista")) return "Escolhe o artista do álbum.";
        const db = DB(); const alvo = al || { id: Store.idUnico(t, db.albuns), capa: "" };
        const f = $("#f-capa", root).files[0]; if (f) { const antiga = alvo.capa; alvo.capa = await Store.guardarFicheiro("img", alvo.id, await reduzirImagem(f)); await Store.removerFicheiro(antiga); }
        Object.assign(alvo, { titulo: t, artista: val(root, "#f-artista"), ano: Number(val(root, "#f-ano")) || alvo.ano });
        if (!al) db.albuns.push(alvo); Store.guardar(); toast("Álbum guardado");
      } });
  }
  function formPlaylist(p) {
    const ordem = p ? p.musicas.slice() : [];
    formSimples({ titulo: p ? "Editar playlist" : "Nova playlist",
      campos: `<div class="field"><label>Nome <i>*</i></label><input class="inp" id="f-nome" maxlength="60" value="${esc(p && p.nome)}"></div>
        <div class="field"><label>Descrição</label><input class="inp" id="f-desc" maxlength="200" value="${esc(p && p.descricao)}"></div>
        <div class="field"><label>Músicas (a ordem em que escolhes é a ordem de reprodução)</label><div class="picklist">${DB().musicas.map(m => `<label><input type="checkbox" value="${esc(m.id)}" ${ordem.includes(m.id) ? "checked" : ""}> ${esc(m.titulo)} <span class="sub">— ${esc(Store.artista(m.artista).nome)}</span></label>`).join("") || '<span class="sub" style="padding:10px">Ainda não há músicas.</span>'}</div></div>`,
      extra: root => $$(".picklist input", root).forEach(c => c.addEventListener("change", () => { const i = ordem.indexOf(c.value); if (c.checked && i < 0) ordem.push(c.value); if (!c.checked && i >= 0) ordem.splice(i, 1); })),
      gravar: async root => {
        const nome = val(root, "#f-nome").trim(); if (!nome) return "Escreve o nome da playlist.";
        const db = DB(); const alvo = p || { id: Store.idUnico(nome, db.playlists) };
        Object.assign(alvo, { nome, descricao: val(root, "#f-desc").trim(), musicas: ordem.filter(Store.musica) });
        if (!p) db.playlists.push(alvo); Store.guardar(); toast("Playlist guardada");
      } });
  }
  function formSenha() {
    formSimples({ titulo: "Mudar palavra-passe", campos: `<div class="field"><label>Nova palavra-passe</label><input class="inp" id="f-senha" value="${esc(senhaAtual())}" maxlength="40"><p class="hint" style="margin-top:6px">Podes usar qualquer palavra simples (ex.: <code>admin</code>, <code>kaya</code>).</p></div>`,
      gravar: async root => { const s = val(root, "#f-senha").trim(); if (!s) return "Escreve uma palavra-passe."; Store.pref.set("senha", s); toast("Palavra-passe actualizada"); } });
  }

  /* ---------- Acções ---------- */
  async function apagar(titulo, texto, fn) { if (await confirmar(titulo, texto, "Apagar", true)) { await fn(); Store.guardar(); toast("Apagado"); refrescar(); } }
  async function acao(nome, el) {
    const id = el && el.dataset ? el.dataset.id : null, d = DB();
    switch (nome) {
      case "nova-musica": return formMusica(null);
      case "editar-musica": return formMusica(Store.musica(id));
      case "novo-artista": return formArtista(null);
      case "editar-artista": return formArtista(d.artistas.find(a => a.id === id));
      case "novo-album": return formAlbum(null);
      case "editar-album": return formAlbum(Store.album(id));
      case "nova-playlist": return formPlaylist(null);
      case "editar-playlist": return formPlaylist(Store.playlist(id));
      case "senha": return formSenha();
      case "destaque": Store.pref.set("destaque", el.value); return toast("Destaque actualizado");
      case "apagar-musica": { const m = Store.musica(id); return apagar("Apagar música", `Apagar “${m.titulo}” e o seu ficheiro de áudio? Não dá para desfazer.`, async () => {
        if (Player.atual && Player.atual.id === id && Player.tocando) Player.alternar();
        await Store.removerFicheiro(m.audio); await Store.removerFicheiro(m.capa);
        d.musicas = d.musicas.filter(x => x.id !== id); d.playlists.forEach(p => { p.musicas = p.musicas.filter(i => i !== id); });
        Store.pref.set("favoritos", Store.favoritos().filter(i => i !== id)); }); }
      case "apagar-artista": {
        if (d.musicas.some(m => m.artista === id) || d.albuns.some(a => a.artista === id)) return toast("Este artista ainda tem músicas ou álbuns. Apaga-os primeiro.", "err");
        const a = d.artistas.find(x => x.id === id); return apagar("Apagar artista", `Apagar “${a.nome}”?`, async () => { await Store.removerFicheiro(a.foto); d.artistas = d.artistas.filter(x => x.id !== id); }); }
      case "apagar-album": { const a = Store.album(id); return apagar("Apagar álbum", `Apagar “${a.titulo}”? As músicas ficam como singles.`, async () => { await Store.removerFicheiro(a.capa); d.albuns = d.albuns.filter(x => x.id !== id); d.musicas.forEach(m => { if (m.album === id) m.album = ""; }); }); }
      case "apagar-playlist": { const p = Store.playlist(id); return apagar("Apagar playlist", `Apagar “${p.nome}”?`, async () => { d.playlists = d.playlists.filter(x => x.id !== id); }); }
      case "repor":
        if (await confirmar("Repor dados", "Isto apaga tudo o que adicionaste e volta ao conteúdo inicial. Continuar?", "Repor", true)) { await Store.repor(); Store.pref.set("favoritos", []); Store.pref.set("ultima", null); toast("Dados repostos"); location.hash = "#/admin/musicas"; setTimeout(() => location.reload(), 500); }
    }
  }
  return { render, acao, publicar: f => formMusica(null, f) };
})();
