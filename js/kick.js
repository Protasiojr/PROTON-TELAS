// ==========================================
// KICK - Módulo de plataforma
// ==========================================

const Kick = {
    name: 'Kick',
    icon: '<img src="../assets/kick.svg" alt="Kick" title="Kick" class="platform-icon">',
    iconUrl: '../assets/kick.svg',

    // Verifica se a URL é do Kick
    isValidUrl: function(link) {
        return link.match(/(?:kick\.com\/)/i);
    },

    // Extrai o ID do canal
    extractChannelId: function(link) {
        const match = link.match(/kick\.com\/([a-zA-Z0-9_]+)/);
        return match ? match[1] : null;
    },

    // Gera o URL do iframe para player nativo
    getNativeIframeUrl: function(channelId) {
        return `https://player.kick.com/${channelId}?autoplay=true`;
    },

    // Gera o HTML do iframe para player nativo
    getNativeIframeHtml: function(channelId, screenId) {
        const iframeUrl = this.getNativeIframeUrl(channelId);
        return `
            <iframe
                src="${iframeUrl}"
                allowfullscreen
                scrolling="no"
                allow="autoplay; fullscreen">
            </iframe>
        `;
    },

    // Kick não tem suporte oficial no Plyr
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
    module.exports = Kick;
}
