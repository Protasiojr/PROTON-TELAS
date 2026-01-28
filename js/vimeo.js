// ==========================================
// VIMEO - Módulo de plataforma
// ==========================================

const Vimeo = {
    name: 'Vimeo',
    icon: '<img src="../assets/vimeo.svg" alt="Vimeo" title="Vimeo" class="platform-icon">',
    iconUrl: '../assets/vimeo.svg',

    // Verifica se a URL é do Vimeo
    isValidUrl: function(link) {
        return link.match(/vimeo\.com/i);
    },

    // Extrai o ID do vídeo
    extractVideoId: function(link) {
        const regex = /vimeo\.com\/(\d+)/;
        const match = link.match(regex);
        return match ? match[1] : null;
    },

    // Gera o URL do iframe para player nativo
    getNativeIframeUrl: function(videoId) {
        return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
    },

    // Gera o HTML do container para Plyr
    getPlyrContainerHtml: function(videoId, screenId) {
        return `<div id="player-${screenId}" data-plyr-provider="vimeo" data-plyr-embed-id="${videoId}"></div>`;
    },

    // Gera o HTML do iframe para player nativo
    getNativeIframeHtml: function(videoId, screenId) {
        const iframeUrl = this.getNativeIframeUrl(videoId);
        return `
            <iframe
                src="${iframeUrl}"
                allowfullscreen
                allow="autoplay; fullscreen; picture-in-picture">
            </iframe>
        `;
    },

    // Retorna o objeto de configuração para Plyr
    getPlyrConfig: function() {
        return {};
    }
};

// Exportar para uso no app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Vimeo;
}
