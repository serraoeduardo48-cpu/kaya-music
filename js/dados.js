/* Dados iniciais do Kaya Music. Tudo o que o administrador adicionar fica guardado no navegador. */
const DADOS_PADRAO = {
  "generos": [
    {
      "id": "marrabenta",
      "nome": "Marrabenta",
      "descricao": "Género popular nascido em Maputo, de ritmo dançante e guitarras vivas."
    },
    {
      "id": "kizomba",
      "nome": "Kizomba",
      "descricao": "Ritmo lento e romântico, de origem angolana, muito dançado em Moçambique."
    },
    {
      "id": "afrobeat",
      "nome": "Afrobeat",
      "descricao": "Batidas africanas modernas, com percussão marcada e melodias para dançar."
    },
    {
      "id": "pandza",
      "nome": "Pandza",
      "descricao": "Música de dança urbana moçambicana, de batida electrónica e energia de festa."
    },
    {
      "id": "hiphop",
      "nome": "Hip-Hop",
      "descricao": "Rimas, batidas e crónica social contadas na voz das ruas moçambicanas."
    },
    {
      "id": "tufo",
      "nome": "Tufo",
      "descricao": "Música e dança tradicionais do norte de Moçambique, cantadas e dançadas por mulheres."
    },
    {
      "id": "nyau",
      "nome": "Nyau",
      "descricao": "Tradição de dança e máscaras de raiz ritual, ligada às comunidades do centro e norte do país."
    },
    {
      "id": "mbira",
      "nome": "Mbira",
      "descricao": "Música tradicional tocada com a mbira, instrumento de lamelas metálicas."
    },
    {
      "id": "jazz",
      "nome": "Jazz",
      "descricao": "Improviso e harmonia com sotaque moçambicano."
    },
    {
      "id": "tradicional",
      "nome": "Tradicional",
      "descricao": "Cantos e ritmos tradicionais de várias regiões de Moçambique."
    },
    {
      "id": "gospel",
      "nome": "Gospel",
      "descricao": "Música de louvor e fé, em coros e vozes solistas."
    }
  ],
  "artistas": [
    {
      "id": "kiba-the-seven",
      "nome": "Kiba The Seven",
      "genero": "hiphop",
      "foto": "assets/artistas/kiba-the-seven.jpg",
      "bio": ""
    },
    {
      "id": "dr-ed",
      "nome": "Dr Ed",
      "genero": "hiphop",
      "foto": "",
      "bio": ""
    },
    {
      "id": "akon-g",
      "nome": "AKON G",
      "genero": "afrobeat",
      "foto": "",
      "bio": ""
    },
    {
      "id": "mr-bow",
      "nome": "Mr Bow",
      "genero": "marrabenta",
      "foto": "assets/artistas/mr-bow.jpg",
      "bio": ""
    }
  ],
  "albuns": [
    {
      "id": "skinmask",
      "titulo": "SkinMask",
      "artista": "dr-ed",
      "ano": 2026,
      "capa": ""
    }
  ],
  "musicas": [
    {
      "id": "kiba-akon-g",
      "titulo": "Kiba × AKON G",
      "artista": "kiba-the-seven",
      "genero": "hiphop",
      "album": "",
      "audio": "musicas/kiba-akon-g.mp3",
      "capa": "assets/artistas/kiba-the-seven.jpg",
      "duracao": "2:11",
      "data": "2026-10-22",
      "contexto": "Colaboração entre Kiba The Seven e AKON G.",
      "letra": "",
      "traducao": ""
    },
    {
      "id": "mauro-flow",
      "titulo": "Mauro Flow",
      "artista": "dr-ed",
      "genero": "hiphop",
      "album": "skinmask",
      "audio": "musicas/mauro-flow.mp3",
      "capa": "",
      "duracao": "3:44",
      "data": "2026-10-01",
      "contexto": "Faixa do álbum SkinMask, que explora temas de identidade e expressão através de ritmos urbanos moçambicanos fundidos com sonoridades modernas.",
      "letra": "",
      "traducao": ""
    }
  ],
  "playlists": [
    {
      "id": "hip-hop-moz",
      "nome": "Hip-Hop Moz",
      "descricao": "Rimas de Moçambique.",
      "musicas": [
        "mauro-flow",
        "kiba-akon-g"
      ]
    }
  ]
};
