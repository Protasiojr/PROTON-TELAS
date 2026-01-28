# Próton Telas

Aplicação simples para reproduzir vídeos em múltiplas telas.

Uso básico

- Abra `index.html` via servidor local (recomendado):

```bash
# Node
npx http-server . -p 5500

# Python 3
python -m http.server 5500
```

- Acesse `http://localhost:5500` no navegador.

Como usar

- Cole o link do vídeo no campo "Cole o link do vídeo aqui..." em um card.
- Clique em `Aplicar` para carregar o vídeo.
- Use `Atualizar` para recarregar o player.
- O botão de olho mostra/oculta o vídeo.

Plataformas suportadas

- YouTube, Vimeo, Twitch (requer servidor local), Kick e vídeos diretos (.mp4, .webm, .ogg).

Notas

- Twitch exige o parâmetro `parent` com o domínio; rode via `localhost` para permitir o embed.
- Os ícones e favicon estão em `assets/`.

Arquivos principais

- `index.html`, `css/styles.css`, `js/app.js`, `js/youtube.js`, `js/vimeo.js`, `js/twitch.js`, `js/kick.js`.

---
Desenvolvido por João Protásio da Luz Júnior
