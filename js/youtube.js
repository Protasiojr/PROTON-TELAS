// ==========================================
// YOUTUBE - Módulo de plataforma
// ==========================================

const YouTube = {
    name: 'YouTube',
    icon: '<img src="../assets/youtube.svg" alt="YouTube" title="YouTube" class="platform-icon">',
    iconUrl: '../assets/youtube.svg',

    // Verifica se a URL é do YouTube
    isValidUrl: function(link) {
        return link.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)/i);
    },

    // Extrai o ID do vídeo
    extractVideoId: function(link) {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = link.match(regex);
        return match ? match[1] : null;
    },

    // Gera o URL do iframe para Plyr
    getIframeUrl: function(videoId) {
        const origin = window.location.origin;
        return `https://www.youtube.com/embed/${videoId}?origin=${origin}&iv_load_policy=3&modestbranding=1&playsinline=1&showinfo=0&rel=0&enablejsapi=1`;
    },

    // Gera o URL do iframe para player nativo
    getNativeIframeUrl: function(videoId) {
        const origin = window.location.origin;
        return `https://www.youtube.com/embed/${videoId}?origin=${origin}&autoplay=1&mute=1&rel=0&playsinline=1&enablejsapi=1`;
    },

    // Gera o HTML do iframe para Plyr
    getPlyrIframeHtml: function(videoId, screenId) {
        const iframeUrl = this.getIframeUrl(videoId);
        return `
            <div class="plyr__video-embed" id="player-${screenId}">
                <iframe
                    src="${iframeUrl}"
                    allowfullscreen
                    allowtransparency
                    allow="autoplay">
                </iframe>
            </div>
        `;
    },

    // Gera o HTML do iframe para player nativo
    getNativeIframeHtml: function(videoId, screenId) {
        const iframeUrl = this.getNativeIframeUrl(videoId);
        return `
            <iframe
                id="youtube-player-${screenId}"
                src="${iframeUrl}"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                referrerpolicy="strict-origin-when-cross-origin"
                allowfullscreen>
            </iframe>
        `;
    },

    // Retorna o objeto de configuração para Plyr
    getPlyrConfig: function() {
        return {
            youtube: { noCookie: true, rel: 0, showinfo: 0, iv_load_policy: 3, modestbranding: 1 }
        };
    }
};

// Exportar para uso no app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = YouTube;
}
