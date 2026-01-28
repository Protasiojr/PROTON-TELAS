// ==========================================
// TWITCH - Módulo de plataforma
// ==========================================

const Twitch = {
    name: 'Twitch',
    icon: '<img src="../assets/twitch.svg" alt="Twitch" title="Twitch" class="platform-icon">',
    iconUrl: '../assets/twitch.svg',

    // Verifica se a URL é do Twitch
    isValidUrl: function(link) {
        return link.match(/(?:twitch\.tv\/|clips\.twitch\.tv\/)/i);
    },

    // Extrai dados do Twitch (canal, vídeo ou clip)
    extractData: function(link) {
        // Check for clip (clips.twitch.tv/Slug or twitch.tv/username/clip/Slug)
        const clipMatch = link.match(/(?:clips\.twitch\.tv\/|twitch\.tv\/[^/]+\/clip\/)([a-zA-Z0-9_-]+)/);
        if (clipMatch) return { type: 'clip', id: clipMatch[1] };

        // Check for video (VOD) - add 'v' prefix as required by Twitch API
        const videoMatch = link.match(/twitch\.tv\/videos\/(\d+)/);
        if (videoMatch) return { type: 'video', id: 'v' + videoMatch[1] };

        // Check for channel (live stream)
        const channelMatch = link.match(/twitch\.tv\/([a-zA-Z0-9_]+)(?:\/|$)/);
        if (channelMatch && !link.includes('/videos/') && !link.includes('/clip/')) {
            return { type: 'channel', id: channelMatch[1] };
        }

        return null;
    },

    // Gera o URL do iframe para player nativo
    getNativeIframeUrl: function(data) {
        // Twitch exige o parâmetro `parent` contendo o domínio que fará o embed.
        // Em protocolo file: usamos 'localhost' como fallback (útil para testes locais),
        // mas em produção deve ser o domínio real.
        const hostname = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : '';
        const protocol = (typeof window !== 'undefined' && window.location && window.location.protocol) ? window.location.protocol : '';
        let parentHost = '';
        if (hostname) parentHost = hostname;
        else if (protocol === 'file:') parentHost = 'localhost';

        const parentParam = parentHost ? `&parent=${encodeURIComponent(parentHost)}` : '';

        if (data.type === 'channel') {
            return `https://player.twitch.tv/?channel=${data.id}${parentParam}&autoplay=true`;
        } else if (data.type === 'video') {
            return `https://player.twitch.tv/?video=${data.id}${parentParam}&autoplay=true`;
        } else if (data.type === 'clip') {
            // Clips usam endpoint diferente
            return `https://clips.twitch.tv/embed?clip=${data.id}${parentParam}&autoplay=true`;
        }
        return null;
    },

    // Gera o HTML do iframe para player nativo
    getNativeIframeHtml: function(data, screenId) {
        const iframeUrl = this.getNativeIframeUrl(data);
        if (!iframeUrl) return '';
        // Twitch requer janelas com pelo menos 400x300 pixels. Aqui mantemos
        // o iframe responsivo (100%/100%) mas garantimos mínimo via estilo e
        // também colocamos atributos width/height para compatibilidade.
        return `
            <iframe
                src="${iframeUrl}"
                width="100%"
                height="100%"
                style="min-width:400px;min-height:300px;width:100%;height:100%;border:0;"
                frameborder="0"
                allowfullscreen
                scrolling="no"
                allow="autoplay; fullscreen">
            </iframe>
        `;
    },

    // Twitch não tem suporte estável no Plyr com parent param
    supportsPlyr: function() {
        return false;
    },

    // Retorna o objeto de configuração para Plyr (vazio pois não é suportado)
    getPlyrConfig: function() {
        return {};
    }
};

// Exportar para uso no app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Twitch;
}
