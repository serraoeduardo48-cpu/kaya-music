/* ==========================================================================
   Páginas do ouvinte
   ========================================================================== */
const Sessao = {
  perfil: Store.pref.get("perfil", null),                 // "admin" | "ouvinte" | null
  visita: sessionStorage.getItem("kaya.visita") === "1",  // admin a ver o site como ouvinte
  get admin() { return this.perfil === "admin" && !this.visita; }
};

const norm = s => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const DB = () => Store.get();
const ids = lista => lista.map(m => m.id).join(",");

/* ---------- Peças reutilizáveis ---------- */
function card({ go, img, nome, titulo, sub, seed, cls, tocar }) {
  const fab = tocar && tocar.length ? `<button class="play-fab" data-act="tocar" data-id="${esc(tocar[0])}" data-q="${esc(tocar.join(","))}" aria-label="Tocar">${ico("play")}</button>` : "";
  return `<div class="card ${cls || ""}" data-go="${esc(go)}" tabindex="0" role="link">${cover(img, nome, "", seed || nome)}<h3>${esc(titulo)}</h3><p>${esc(sub || "")}</p>${fab}</div>`;
}
const cardMusica = (m, q) => card({ go: "#/musica/" + m.id, img: Store.capaDe(m), nome: m.titulo, titulo: m.titulo, sub: Store.artista(m.artista).nome, seed: m.id, tocar: q || [m.id] });
const cardArtista = a => card({ go: "#/artista/" + a.id, img: a.foto, nome: a.nome, titulo: a.nome, sub: "Artista", seed: a.id, cls: "artist", tocar: DB().musicas.filter(m => m.artista === a.id).map(m => m.id) });
const cardAlbum = a => card({ go: "#/album/" + a.id, img: a.capa, nome: a.titulo, titulo: a.titulo, sub: `${Store.artista(a.artista).nome} · ${a.ano || ""}`, seed: a.id, tocar: DB().musicas.filter(m => m.album === a.id).map(m => m.id) });
function capaPlaylist(p) { const m = p.musicas.map(Store.musica).filter(Boolean)[0]; return m ? Store.capaDe(m) : ""; }
const cardPlaylist = p => card({ go: "#/playlist/" + p.id, img: capaPlaylist(p), nome: p.nome, titulo: p.nome, sub: `${p.musicas.length} música${p.musicas.length === 1 ? "" : "s"}`, seed: p.id, tocar: p.musicas.filter(Store.musica) });

function secao(titulo, conteudo, link) {
  return `<section class="sec"><div class="sec-head"><h2>${esc(titulo)}</h2>${link ? `<a href="${link[0]}">${esc(link[1])} ${ico("right", "sm")}</a>` : ""}</div>${conteudo}</section>`;
}
function vazio(icone, titulo, texto, botao) {
  return `<div class="vazio">${ico(icone)}<h3>${esc(titulo)}</h3><p>${esc(texto)}</p>${botao || ""}</div>`;
}
const btnAdmin = (txt, acao) => Sessao.admin ? `<button class="btn sm" data-act="adm:${acao}">${ico("plus", "sm")}${esc(txt)}</button>` : "";

function linhaMusica(m, i, q) {
  const a = Store.artista(m.artista), al = Store.album(m.album), fav = Store.favoritos().includes(m.id);
  const on = Player.atual && Player.atual.id === m.id;
  return `<div class="track ${on ? "on" : ""}" data-act="tocar" data-id="${esc(m.id)}" data-q="${esc(q)}">
    <div class="n"><span>${i + 1}</span>${ico("play", "sm")}<div class="eq"><i></i><i></i><i></i></div></div>
    <div class="t-main">${cover(Store.capaDe(m), m.titulo, "", m.id)}<div style="min-width:0"><b>${esc(m.titulo)}</b><small><a href="#/artista/${esc(a.id)}">${esc(a.nome)}</a></small></div></div>
    <span class="t-alb">${al ? `<a href="#/album/${esc(al.id)}">${esc(al.titulo)}</a>` : "Single"}</span>
    <div class="t-act"><button class="ibtn fav ${fav ? "on" : ""}" data-act="fav" data-id="${esc(m.id)}" title="Favorito" aria-label="Favorito">${ico("heart", "sm")}</button>
      <button class="ibtn dl" data-act="baixar" data-id="${esc(m.id)}" title="Descarregar" aria-label="Descarregar">${ico("download", "sm")}</button></div>
    <span class="t-dur">${esc(m.duracao || "")}</span></div>`;
}
function tabelaMusicas(lista) {
  const q = ids(lista);
  return `<div class="tracks"><div class="thead"><span style="text-align:center">#</span><span>Título</span><span class="h-alb">Álbum</span><span></span><span style="text-align:right">Duração</span></div>${lista.map((m, i) => linhaMusica(m, i, q)).join("")}</div>`;
}
function cabecalhoDetalhe({ img, nome, redondo, tipo, titulo, meta, texto, q }) {
  return `<div class="detail">${cover(img, nome, redondo ? "round" : "", nome)}<div class="info"><span class="eyebrow">${esc(tipo)}</span><h1>${esc(titulo)}</h1>
    ${texto ? `<p class="sub" style="max-width:640px">${esc(texto)}</p>` : ""}<p class="sub" style="margin-top:8px">${meta}</p></div></div>
    <div class="detail-actions">${q.length ? `<button class="play-fab" data-act="tocar" data-id="${esc(q[0])}" data-q="${esc(q.join(","))}" aria-label="Tocar tudo">${ico("play", "lg")}</button>` : ""}</div>`;
}

/* ==========================================================================
   Rotas
   ========================================================================== */
const Views = {
  inicio() {
    const d = DB();
    const novas = d.musicas.slice().sort((a, b) => String(b.data).localeCompare(String(a.data)));
    const dest = Store.musica(Store.pref.get("destaque", "")) || novas[0];
    const q = ids(novas);
    let hero;
    if (dest) {
      const imgHero = new URL((dest.capa && dest.capa.startsWith("idb:") && Store.url(dest.capa)) || "assets/destaque.jpg", document.baseURI).href;
      hero = `<div class="hero" style="--hero:url('${esc(imgHero)}')"><div class="hero-in"><span class="eyebrow">Em destaque</span><h1>${esc(dest.titulo)}</h1>
        <p>${esc(Store.artista(dest.artista).nome)} · ${esc(Store.genero(dest.genero).nome)}</p>
        <div class="hero-actions"><button class="btn" data-act="tocar" data-id="${esc(dest.id)}" data-q="${esc(q)}">${ico("play")}Ouvir agora</button>
        <a class="btn sec2" href="#/musica/${esc(dest.id)}">${ico("lyrics")}Letra e história</a></div></div></div>`;
    } else {
      hero = `<div class="hero sem-img"><div class="hero-in"><span class="eyebrow">Bem-vindo</span><h1>Kaya Music</h1><p>A casa da música moçambicana.</p>
        <div class="hero-actions">${btnAdmin("Adicionar a primeira música", "nova-musica") || ""}</div></div></div>`;
    }
    let h = `<div class="page">${hero}`;
    if (novas.length) h += secao("Novidades", `<div class="shelf">${novas.slice(0, 6).map(m => cardMusica(m, novas.map(x => x.id))).join("")}</div>`, ["#/explorar", "Ver todas"]);
    if (d.generos.length) h += secao("Explorar por género", `<div class="genres">${d.generos.slice(0, 8).map(g => `<a class="genre" href="#/explorar?g=${esc(g.id)}" style="--g:${grad(g.id)}">${esc(g.nome)}</a>`).join("")}</div>`);
    if (d.artistas.length) h += secao("Artistas", `<div class="shelf">${d.artistas.map(cardArtista).join("")}</div>`, ["#/artistas", "Ver todos"]);
    if (d.albuns.length) h += secao("Álbuns", `<div class="shelf">${d.albuns.map(cardAlbum).join("")}</div>`, ["#/albuns", "Ver todos"]);
    if (d.playlists.length) h += secao("Playlists", `<div class="shelf">${d.playlists.map(cardPlaylist).join("")}</div>`, ["#/playlists", "Ver todas"]);
    return h + "</div>";
  },

  explorar(_, qs) {
    const d = DB(), g = qs.get("g") || "", q = norm(qs.get("q") || "");
    let lista = d.musicas.slice().sort((a, b) => String(b.data).localeCompare(String(a.data)));
    if (g) lista = lista.filter(m => m.genero === g);
    if (q) lista = lista.filter(m => norm([m.titulo, Store.artista(m.artista).nome, (Store.album(m.album) || {}).titulo, Store.genero(m.genero).nome].join(" ")).includes(q));
    const artistas = q ? d.artistas.filter(a => norm(a.nome).includes(q)) : [];
    const gn = g ? Store.genero(g) : null;
    const chips = `<div class="chips" style="margin:18px 0 6px"><a class="chip ${!g ? "on" : ""}" href="#/explorar${q ? "?q=" + encodeURIComponent(qs.get("q")) : ""}">Todos</a>${d.generos.map(x => `<a class="chip ${g === x.id ? "on" : ""}" href="#/explorar?g=${esc(x.id)}">${esc(x.nome)}</a>`).join("")}</div>`;
    let h = `<div class="page"><div class="pagehead"><div><h1 class="titulo">${q ? "Resultados para “" + esc(qs.get("q")) + "”" : gn ? esc(gn.nome) : "Explorar"}</h1>
      <p class="sub">${gn && gn.descricao ? esc(gn.descricao) : lista.length + " música" + (lista.length === 1 ? "" : "s")}</p></div></div>${chips}`;
    if (artistas.length) h += secao("Artistas", `<div class="shelf">${artistas.map(cardArtista).join("")}</div>`);
    h += `<div style="margin-top:20px">${lista.length ? tabelaMusicas(lista) : vazio("search", "Nada encontrado", q ? "Tenta outra palavra ou outro género." : "Ainda não há músicas neste género.", btnAdmin("Adicionar música", "nova-musica"))}</div>`;
    return h + "</div>";
  },

  albuns() {
    const l = DB().albuns;
    return `<div class="page"><div class="pagehead"><div><h1 class="titulo">Álbuns</h1><p class="sub">${l.length} álbum${l.length === 1 ? "" : "ns"}</p></div>${btnAdmin("Novo álbum", "novo-album")}</div>
      <div style="margin-top:20px">${l.length ? `<div class="shelf">${l.map(cardAlbum).join("")}</div>` : vazio("disc", "Ainda não há álbuns", "Os álbuns aparecem aqui quando forem criados.")}</div></div>`;
  },
  album(id) {
    const a = Store.album(id); if (!a) return Views.naoEncontrado();
    const l = DB().musicas.filter(m => m.album === id);
    return `<div class="page">${cabecalhoDetalhe({ img: a.capa, nome: a.titulo, tipo: "Álbum", titulo: a.titulo, q: l.map(m => m.id),
      meta: `<a href="#/artista/${esc(a.artista)}"><b>${esc(Store.artista(a.artista).nome)}</b></a> · ${esc(a.ano || "")} · ${l.length} faixa${l.length === 1 ? "" : "s"}` })}
      ${l.length ? tabelaMusicas(l) : vazio("music", "Álbum sem músicas", "Ainda não há faixas neste álbum.")}</div>`;
  },

  artistas() {
    const l = DB().artistas;
    return `<div class="page"><div class="pagehead"><div><h1 class="titulo">Artistas</h1><p class="sub">${l.length} artista${l.length === 1 ? "" : "s"}</p></div>${btnAdmin("Novo artista", "novo-artista")}</div>
      <div style="margin-top:20px">${l.length ? `<div class="shelf">${l.map(cardArtista).join("")}</div>` : vazio("mic", "Ainda não há artistas", "Os artistas aparecem aqui quando forem adicionados.")}</div></div>`;
  },
  artista(id) {
    const a = DB().artistas.find(x => x.id === id); if (!a) return Views.naoEncontrado();
    const l = DB().musicas.filter(m => m.artista === id), als = DB().albuns.filter(x => x.artista === id);
    return `<div class="page">${cabecalhoDetalhe({ img: a.foto, nome: a.nome, redondo: true, tipo: "Artista", titulo: a.nome, texto: a.bio, q: l.map(m => m.id),
      meta: `${esc(Store.genero(a.genero).nome)} · ${l.length} música${l.length === 1 ? "" : "s"}` })}
      ${l.length ? secao("Músicas", tabelaMusicas(l)) : vazio("music", "Sem músicas ainda", "Este artista ainda não tem músicas publicadas.")}
      ${als.length ? secao("Álbuns", `<div class="shelf">${als.map(cardAlbum).join("")}</div>`) : ""}</div>`;
  },

  playlists() {
    const l = DB().playlists;
    return `<div class="page"><div class="pagehead"><div><h1 class="titulo">Playlists</h1><p class="sub">${l.length} playlist${l.length === 1 ? "" : "s"}</p></div>${btnAdmin("Nova playlist", "nova-playlist")}</div>
      <div style="margin-top:20px">${l.length ? `<div class="shelf">${l.map(cardPlaylist).join("")}</div>` : vazio("list", "Ainda não há playlists", "As playlists aparecem aqui quando forem criadas.")}</div></div>`;
  },
  playlist(id) {
    const p = Store.playlist(id); if (!p) return Views.naoEncontrado();
    const l = p.musicas.map(Store.musica).filter(Boolean);
    return `<div class="page">${cabecalhoDetalhe({ img: capaPlaylist(p), nome: p.nome, tipo: "Playlist", titulo: p.nome, texto: p.descricao, q: l.map(m => m.id), meta: `${l.length} música${l.length === 1 ? "" : "s"}` })}
      ${l.length ? tabelaMusicas(l) : vazio("list", "Playlist vazia", "Ainda não há músicas nesta playlist.")}</div>`;
  },

  favoritos() {
    const l = Store.favoritos().map(Store.musica).filter(Boolean);
    return `<div class="page"><div class="pagehead"><div><h1 class="titulo">Favoritos</h1><p class="sub">${l.length} música${l.length === 1 ? "" : "s"} que gostas</p></div></div>
      <div style="margin-top:20px">${l.length ? tabelaMusicas(l) : vazio("heart", "Ainda não tens favoritos", "Toca no coração de qualquer música para a guardar aqui.", `<a class="btn sm" href="#/explorar" style="margin-top:8px">${ico("compass", "sm")}Explorar músicas</a>`)}</div></div>`;
  },

  /* Página da música: capa, história e letra */
  musica(id, qs, modo) {
    const m = Store.musica(id); if (!m) return Views.naoEncontrado();
    const a = Store.artista(m.artista), al = Store.album(m.album), fav = Store.favoritos().includes(m.id);
    const q = ids(DB().musicas);
    modo = modo || "letra";
    const tem = !!m.traducao;
    const tabs = tem ? `<div class="tabs"><button class="${modo === "letra" ? "on" : ""}" data-act="aba" data-modo="letra">Letra</button><button class="${modo === "traducao" ? "on" : ""}" data-act="aba" data-modo="traducao">Tradução</button><button class="${modo === "duplo" ? "on" : ""}" data-act="aba" data-modo="duplo">Lado a lado</button></div>` : "";
    const corpoLetra = m.letra ? htmlLetra(m.letra, m.traducao, modo)
      : `<p class="sub">A letra desta música ainda não está disponível.</p>${Sessao.admin ? `<button class="btn sm" style="margin-top:14px" data-act="adm:editar-musica" data-id="${esc(m.id)}">${ico("edit", "sm")}Adicionar letra</button>` : ""}`;
    return `<div class="page" data-musica="${esc(m.id)}"><div class="np" id="np"><div class="np-cover">${cover(Store.capaDe(m), m.titulo, "", m.id)}
      <div class="np-title"><span class="eyebrow">Música</span><h1>${esc(m.titulo)}</h1>
        <p class="sub" style="margin-top:6px"><a href="#/artista/${esc(a.id)}"><b>${esc(a.nome)}</b></a> · ${esc(Store.genero(m.genero).nome)}${al ? ` · <a href="#/album/${esc(al.id)}">${esc(al.titulo)}</a>` : ""}${m.duracao ? " · " + esc(m.duracao) : ""}</p></div>
      <div class="detail-actions"><button class="play-fab js-fab" data-id="${esc(m.id)}" data-q="${esc(q)}" data-act="tocar" aria-label="Tocar">${ico("play", "lg")}</button>
        <button class="ibtn fav ${fav ? "on" : ""}" data-act="fav" data-id="${esc(m.id)}" title="Favorito">${ico("heart")}</button>
        <button class="ibtn" data-act="baixar" data-id="${esc(m.id)}" title="Descarregar">${ico("download")}</button>
        ${Sessao.admin ? `<button class="ibtn" data-act="adm:editar-musica" data-id="${esc(m.id)}" title="Editar música">${ico("edit")}</button>` : ""}</div></div>
      <div><div class="panel">${m.contexto ? `<h2 style="font-size:18px;margin-bottom:8px">História da música</h2><p class="story">${esc(m.contexto)}</p>` : ""}
        <h2 style="font-size:18px;margin-bottom:14px">Letra</h2>${tabs}<div class="lyrics" id="letraBox">${corpoLetra}</div></div></div></div></div>`;
  },

  naoEncontrado() {
    return `<div class="page">${vazio("search", "Página não encontrada", "Este conteúdo já não existe ou foi removido.", `<a class="btn sm" href="#/" style="margin-top:8px">${ico("home", "sm")}Voltar ao início</a>`)}</div>`;
  }
};
