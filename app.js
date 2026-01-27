// ==========================================
// PRÓTON TELAS - Aplicação de Reprodutor de Vídeos
// Versão: 11.0
// Desenvolvido por: João Protásio da Luz Júnior
// ==========================================

// Estado da Aplicação
const AppState = {
    screenCount: 4,
    screens: [],
    isLocked: false,
    defaultScreens: 4,
    plyrInstances: {}, // Armazena instâncias do Plyr
    isPlaying: {},
    isLocalProtocol: window.location.protocol === 'file:'
};

// ==========================================
// INICIALIZAÇÃO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    generateScreens(AppState.defaultScreens);
    setupEventListeners();
    loadFromLocalStorage();
}

// Função para recarregar todos os vídeos
function reloadAllYouTubeVideos() {
    // Com Plyr, a gestão é automática, mas podemos forçar refresh se necessário
    AppState.screens.forEach(screen => {
        if (screen.link) {
            const container = document.getElementById(`videoContainer-${screen.id}`);
            const hasPlayer = container.querySelector('.plyr');
            if (!hasPlayer) {
                renderVideo(screen.id, screen.link);
            }
        }
    });
}

// ==========================================
// GERAÇÃO DE TELAS
// ==========================================
function generateScreens(count) {
    AppState.screenCount = count;
    AppState.screens = [];

    // Destruir todos os players existentes
    destroyAllPlayers();

    const container = document.getElementById('screensContainer');
    container.innerHTML = '';

    // Atualizar classe do grid
    container.className = 'screens-grid';
    container.classList.add(`screens-${count}`);

    // Atualizar dropdown ativo
    updateDropdownActive(count);

    // Gerar cards de tela
    for (let i = 0; i < count; i++) {
        const screenData = {
            id: i + 1,
            link: '',
            visible: true
        };
        AppState.screens.push(screenData);
        container.appendChild(createScreenCard(screenData));
    }
}

// Função para destruir todos os players
function destroyAllPlayers() {
    for (const screenId in AppState.plyrInstances) {
        try {
            if (AppState.plyrInstances[screenId]) {
                AppState.plyrInstances[screenId].destroy();
            }
        } catch (e) {
            console.error(`Erro ao destruir player ${screenId}:`, e);
        }
    }
    AppState.plyrInstances = {};
}

function createScreenCard(screenData) {
    const card = document.createElement('div');
    card.className = 'screen-card';
    card.dataset.screenId = screenData.id;

    card.innerHTML = `
        <div class="screen-header">
            <span class="screen-title">Tela ${screenData.id}</span>
            <div class="video-controls">
                <button class="btn-eye" data-screen-id="${screenData.id}" title="Mostrar/Ocultar Vídeo">
                    <i class="bi bi-eye${screenData.visible ? '' : '-slash'}"></i>
                </button>
            </div>
        </div>
        <div class="screen-body">
            <div class="video-container" id="videoContainer-${screenData.id}">
                <div class="video-placeholder">
                    <i class="bi bi-play-circle"></i>
                    <span>Aguardando link...</span>
                </div>
            </div>
            <div class="link-input-group">
                <input type="text" 
                       class="link-input" 
                       id="linkInput-${screenData.id}" 
                       placeholder="Cole o link do vídeo aqui..."
                       data-screen-id="${screenData.id}">
            </div>
            <div class="control-buttons">
                <button class="btn-control" data-action="refresh" data-screen-id="${screenData.id}" title="Atualizar Vídeo">
                    <i class="bi bi-arrow-clockwise"></i>
                </button>
                <button class="btn-control" data-action="apply" data-screen-id="${screenData.id}" title="Aplicar Vídeo">
                    <i class="bi bi-play-fill"></i>
                </button>
            </div>
        </div>
    `;

    return card;
}

function updateDropdownActive(count) {
    const dropdownItems = document.querySelectorAll('.dropdown-item[data-screens]');
    dropdownItems.forEach(item => {
        if (parseInt(item.dataset.screens) === count) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// ==========================================
// EVENT LISTENERS
// ==========================================
function setupEventListeners() {
    // Dropdown de quantidade de telas
    const dropdownItems = document.querySelectorAll('.dropdown-item[data-screens]');
    dropdownItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const screens = parseInt(item.dataset.screens);
            generateScreens(screens);
        });
    });

    // Botão Upload
    document.getElementById('btnUpload').addEventListener('click', () => {
        document.getElementById('uploadJson').click();
    });

    // Input de arquivo JSON
    document.getElementById('uploadJson').addEventListener('change', handleFileUpload);

    // Botão Lock/Unlock
    document.getElementById('btnLock').addEventListener('click', toggleLock);

    // Botão Save
    document.getElementById('btnSave').addEventListener('click', saveConfigurations);

    // Event delegation para botões de tela
    document.getElementById('screensContainer').addEventListener('click', handleScreenButtonClick);

    // Event delegation para inputs de link
    document.getElementById('screensContainer').addEventListener('input', handleLinkInput);
}

function handleScreenButtonClick(e) {
    const button = e.target.closest('button');
    if (!button) return;

    const screenId = parseInt(button.dataset.screenId);
    const action = button.dataset.action;

    if (button.classList.contains('btn-eye')) {
        toggleVideoVisibility(screenId);
    } else if (action === 'refresh') {
        refreshVideo(screenId);
    } else if (action === 'apply') {
        applyVideo(screenId);
    }
}

function handleLinkInput(e) {
    if (e.target.classList.contains('link-input')) {
        const screenId = parseInt(e.target.dataset.screenId);
        const screen = AppState.screens.find(s => s.id === screenId);
        if (screen) {
            screen.link = e.target.value;
        }
    }
}

// ==========================================
// CONTROLES DE VÍDEO
// ==========================================
function applyVideo(screenId) {
    const screen = AppState.screens.find(s => s.id === screenId);
    if (!screen) return;

    const link = document.getElementById(`linkInput-${screenId}`).value.trim();
    if (!link) {
        showNotification('Por favor, insira um link válido.', 'warning');
        return;
    }

    screen.link = link;
    renderVideo(screenId, link);
    showNotification(`Vídeo aplicado na Tela ${screenId}`, 'success');
}

function refreshVideo(screenId) {
    const screen = AppState.screens.find(s => s.id === screenId);
    if (!screen || !screen.link) {
        showNotification('Não há vídeo para atualizar nesta tela.', 'warning');
        return;
    }

    renderVideo(screenId, screen.link);
    showNotification(`Vídeo atualizado na Tela ${screenId}`, 'success');
}

function renderVideo(screenId, link) {
    const container = document.getElementById(`videoContainer-${screenId}`);

    // Destruir instância anterior se existir
    if (AppState.plyrInstances[screenId]) {
        try {
            AppState.plyrInstances[screenId].destroy();
            delete AppState.plyrInstances[screenId];
        } catch (e) {
            console.error('Erro ao destruir player anterior:', e);
        }
    }

    container.innerHTML = '';

    // Fallback: Se Plyr não estiver definido, usar método nativo
    if (typeof Plyr === 'undefined') {
        console.warn('Plyr não carregado. Usando fallback nativo.');
        renderNativeVideo(container, link, screenId);
        return;
    }

    // Identificar tipo de vídeo e extrair ID
    const youtubeId = extractYouTubeId(link);
    const vimeoId = extractVimeoId(link);
    const twitchData = extractTwitchData(link);
    const kickId = extractKickId(link);

    if (youtubeId) {
        const origin = window.location.origin;
        container.innerHTML = `
            <div class="plyr__video-embed" id="player-${screenId}">
                <iframe
                    src="https://www.youtube.com/embed/${youtubeId}?origin=${origin}&iv_load_policy=3&modestbranding=1&playsinline=1&showinfo=0&rel=0&enablejsapi=1"
                    allowfullscreen
                    allowtransparency
                    allow="autoplay">
                </iframe>
            </div>
        `;
        initializePlyr(screenId, `#player-${screenId}`);
    } else if (vimeoId) {
        container.innerHTML = `<div id="player-${screenId}" data-plyr-provider="vimeo" data-plyr-embed-id="${vimeoId}"></div>`;
        initializePlyr(screenId, `#player-${screenId}`);
    } else if (twitchData) {
        // Fallback nativo para Twitch pois Plyr com Twitch + Parent param pode ser instável
        renderNativeVideo(container, link, screenId);
    } else if (kickId) {
        // Kick não tem suporte oficial no Plyr, usar native iframe
        renderNativeVideo(container, link, screenId);
    } else {
        // Vídeo local ou direto
        if (link.match(/\.(mp4|webm|ogg)$/i) || link.startsWith('blob:')) {
            container.innerHTML = `
                <video id="player-${screenId}" playsinline controls>
                    <source src="${link}" type="video/mp4" />
                </video>
            `;
            initializePlyr(screenId, `#player-${screenId}`);
        } else {
            console.warn('Tipo de vídeo não reconhecido, tentando iframe genérico');
            renderNativeVideo(container, link, screenId);
        }
    }
}

// Fallback para player nativo (sem Plyr ou em caso de erro)
function renderNativeVideo(container, link, screenId) {
    const youtubeId = extractYouTubeId(link);
    const vimeoId = extractVimeoId(link);
    const twitchData = extractTwitchData(link);
    const kickId = extractKickId(link);

    if (youtubeId) {
        const origin = window.location.origin;
        container.innerHTML = `
            <iframe
                id="youtube-player-${screenId}"
                src="https://www.youtube.com/embed/${youtubeId}?origin=${origin}&autoplay=1&mute=1&rel=0&playsinline=1&enablejsapi=1"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                referrerpolicy="strict-origin-when-cross-origin"
                allowfullscreen>
            </iframe>
        `;
    } else if (vimeoId) {
        container.innerHTML = `
            <iframe
                src="https://player.vimeo.com/video/${vimeoId}?autoplay=1"
                allowfullscreen
                allow="autoplay; fullscreen; picture-in-picture">
            </iframe>
        `;
    } else if (twitchData) {
        const hostname = window.location.hostname;
        const parentParam = hostname ? `&parent=${hostname}` : '';
        const src = twitchData.type === 'channel'
            ? `https://player.twitch.tv/?channel=${twitchData.id}${parentParam}&autoplay=true`
            : `https://player.twitch.tv/?video=${twitchData.id}${parentParam}&autoplay=true`;

        container.innerHTML = `
            <iframe
                src="${src}"
                allowfullscreen
                scrolling="no"
                allow="autoplay; fullscreen">
            </iframe>
        `;
    } else if (kickId) {
        container.innerHTML = `
            <iframe
                src="https://player.kick.com/${kickId}?autoplay=true"
                allowfullscreen
                scrolling="no"
                allow="autoplay; fullscreen">
            </iframe>
        `;
    } else {
        container.innerHTML = `
            <iframe
                src="${link}"
                allowfullscreen
                sandbox="allow-scripts allow-same-origin allow-presentation">
            </iframe>
        `;
    }
}

function initializePlyr(screenId, selector) {
    try {
        const player = new Plyr(selector, {
            controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'],
            autoplay: true,
            youtube: { noCookie: true, rel: 0, showinfo: 0, iv_load_policy: 3, modestbranding: 1 }
        });

        AppState.plyrInstances[screenId] = player;

        player.on('ready', () => {
            console.log(`Plyr pronto na tela ${screenId}`);
            // Tentar autoplay se permitido pelo navegador
            player.play().catch(e => console.warn('Autoplay bloqueado pelo navegador:', e));
        });

    } catch (e) {
        console.error('Erro ao inicializar Plyr:', e);
    }
}

function showPlaceholder(container, message) {
    container.innerHTML = `
        <div class="video-placeholder">
            <i class="bi bi-exclamation-triangle"></i>
            <span>${message}</span>
        </div>
    `;
}

function toggleVideoVisibility(screenId) {
    const screen = AppState.screens.find(s => s.id === screenId);
    if (!screen) return;

    screen.visible = !screen.visible;
    const container = document.getElementById(`videoContainer-${screenId}`);
    const button = document.querySelector(`.btn-eye[data-screen-id="${screenId}"]`);
    const icon = button.querySelector('i');
    const player = AppState.plyrInstances[screenId];

    if (screen.visible) {
        container.classList.remove('video-hidden');
        icon.className = 'bi bi-eye';
        button.classList.remove('hidden');
        if (player) player.play();
    } else {
        container.classList.add('video-hidden');
        icon.className = 'bi bi-eye-slash';
        button.classList.add('hidden');
        if (player) player.pause();
    }
}

// ==========================================
// FUNÇÕES DE LINK
// ==========================================
function isYouTubeLink(link) {
    return link.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)/i);
}

function extractYouTubeId(link) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = link.match(regex);
    return match ? match[1] : null;
}

function isVimeoLink(link) {
    return link.match(/vimeo\.com/i);
}

function extractVimeoId(link) {
    const regex = /vimeo\.com\/(\d+)/;
    const match = link.match(regex);
    return match ? match[1] : null;
}

function isTwitchLink(link) {
    return link.match(/(?:twitch\.tv\/|clips\.twitch\.tv\/)/i);
}

function extractTwitchData(link) {
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
}

function isKickLink(link) {
    return link.match(/(?:kick\.com\/)/i);
}

function extractKickId(link) {
    const match = link.match(/kick\.com\/([a-zA-Z0-9_]+)/);
    return match ? match[1] : null;
}

// ==========================================
// BLOQUEIO/DESBLOQUEIO
// ==========================================
function toggleLock() {
    AppState.isLocked = !AppState.isLocked;
    const body = document.body;
    const btnLock = document.getElementById('btnLock');
    const icon = btnLock.querySelector('i');

    if (AppState.isLocked) {
        body.classList.add('locked');
        icon.className = 'bi bi-unlock-fill';
        showNotification('Aplicação bloqueada', 'info');
    } else {
        body.classList.remove('locked');
        icon.className = 'bi bi-lock-fill';
        showNotification('Aplicação desbloqueada', 'info');
    }
}

// ==========================================
// SALVAR E CARREGAR CONFIGURAÇÕES
// ==========================================
function saveConfigurations() {
    const config = {
        screenCount: AppState.screenCount,
        screens: AppState.screens.map(screen => ({
            id: screen.id,
            link: document.getElementById(`linkInput-${screen.id}`).value.trim(),
            visible: screen.visible
        })),
        version: '11.0',
        savedAt: new Date().toISOString()
    };

    // Salvar em arquivo JSON
    downloadJson(config);

    // Salvar no localStorage
    saveToLocalStorage(config);

    showNotification('Configurações salvas com sucesso!', 'success');
}

function downloadJson(config) {
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `proton_telas_config_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const config = JSON.parse(event.target.result);
            loadConfigurations(config);
            showNotification('Configurações carregadas com sucesso!', 'success');
        } catch (error) {
            showNotification('Erro ao ler arquivo JSON. Verifique o formato.', 'error');
        }
    };
    reader.readAsText(file);

    // Limpar input
    e.target.value = '';
}

function loadConfigurations(config) {
    if (!config.screens || !Array.isArray(config.screens)) {
        showNotification('Formato de configuração inválido.', 'error');
        return;
    }

    // Gerar telas com a quantidade salva
    generateScreens(config.screenCount || AppState.defaultScreens);

    // Aplicar configurações de cada tela
    config.screens.forEach(screenConfig => {
        const screen = AppState.screens.find(s => s.id === screenConfig.id);
        if (screen) {
            screen.link = screenConfig.link || '';
            screen.visible = screenConfig.visible !== undefined ? screenConfig.visible : true;

            // Atualizar input
            const input = document.getElementById(`linkInput-${screen.id}`);
            if (input) {
                input.value = screen.link;
            }

            // Atualizar visibilidade
            const button = document.querySelector(`.btn-eye[data-screen-id="${screen.id}"]`);
            const icon = button.querySelector('i');
            const container = document.getElementById(`videoContainer-${screen.id}`);

            if (screen.visible) {
                container.classList.remove('video-hidden');
                icon.className = 'bi bi-eye';
                button.classList.remove('hidden');
            } else {
                container.classList.add('video-hidden');
                icon.className = 'bi bi-eye-slash';
                button.classList.add('hidden');
            }

            // Renderizar vídeo se houver link
            if (screen.link) {
                renderVideo(screen.id, screen.link);
            }
        }
    });
}

// ==========================================
// LOCAL STORAGE
// ==========================================
function saveToLocalStorage(config) {
    try {
        localStorage.setItem('protonTelasConfig', JSON.stringify(config));
    } catch (error) {
        console.error('Erro ao salvar no localStorage:', error);
    }
}

function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('protonTelasConfig');
        if (saved) {
            const config = JSON.parse(saved);
            loadConfigurations(config);
        }
    } catch (error) {
        console.error('Erro ao carregar do localStorage:', error);
    }
}

// ==========================================
// NOTIFICAÇÕES
// ==========================================
function showNotification(message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="bi bi-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
    `;

    // Adicionar estilos
    Object.assign(notification.style, {
        position: 'fixed',
        top: '80px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '8px',
        backgroundColor: getNotificationColor(type),
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        zIndex: '9999',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        animation: 'slideIn 0.3s ease-out'
    });

    document.body.appendChild(notification);

    // Remover após 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle-fill',
        error: 'exclamation-circle-fill',
        warning: 'exclamation-triangle-fill',
        info: 'info-circle-fill'
    };
    return icons[type] || icons.info;
}

function getNotificationColor(type) {
    const colors = {
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#0EA5E9'
    };
    return colors[type] || colors.info;
}

// Adicionar animações CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
