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
    youtubePlayers: {},
    youtubeAPIReady: false,
    isPlaying: {}
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

// Função chamada quando a API do YouTube está pronta
function onYouTubeIframeAPIReady() {
    AppState.youtubeAPIReady = true;
    console.log('YouTube IFrame API está pronta');
    
    // Recarregar vídeos que foram carregados antes da API estar pronta
    reloadAllYouTubeVideos();
}

// Função para recarregar todos os vídeos do YouTube
function reloadAllYouTubeVideos() {
    AppState.screens.forEach(screen => {
        if (screen.link && isYouTubeLink(screen.link)) {
            const container = document.getElementById(`videoContainer-${screen.id}`);
            const hasPlayer = container.querySelector(`#youtube-player-${screen.id}`);
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
    
    // Destruir todos os players do YouTube existentes
    destroyAllYouTubePlayers();
    
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

// Função para destruir todos os players do YouTube
function destroyAllYouTubePlayers() {
    for (const screenId in AppState.youtubePlayers) {
        try {
            if (AppState.youtubePlayers[screenId] && typeof AppState.youtubePlayers[screenId].destroy === 'function') {
                AppState.youtubePlayers[screenId].destroy();
            }
        } catch (e) {
            console.error(`Erro ao destruir player ${screenId}:`, e);
        }
    }
    AppState.youtubePlayers = {};
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
    
    // Destruir player existente se houver
    if (AppState.youtubePlayers[screenId]) {
        try {
            AppState.youtubePlayers[screenId].destroy();
            delete AppState.youtubePlayers[screenId];
        } catch (e) {
            console.error('Erro ao destruir player:', e);
        }
    }
    
    // Limpar container
    container.innerHTML = '';
    
    // Verificar tipo de link
    if (isYouTubeLink(link)) {
        const videoId = extractYouTubeId(link);
        if (videoId) {
            // Exibir indicador de carregamento
            container.innerHTML = `
                <div class="video-placeholder">
                    <i class="bi bi-hourglass-split"></i>
                    <span>Verificando vídeo...</span>
                </div>
            `;
            
            // Verificar disponibilidade do vídeo (opcional, pois pode falhar)
            checkYouTubeVideoAvailability(videoId).then(canEmbed => {
                if (!canEmbed) {
                    showPlaceholder(container, 'Este vídeo não permite reprodução em aplicações de terceiros.');
                    showNotification('Vídeo não disponível para embed', 'error');
                    return;
                }
                
                if (AppState.youtubeAPIReady) {
                    // Criar elemento div para o player
                    const playerDiv = document.createElement('div');
                    playerDiv.id = `youtube-player-${screenId}`;
                    container.appendChild(playerDiv);
                    
                    // Criar player usando a API oficial
                    AppState.youtubePlayers[screenId] = new YT.Player(`youtube-player-${screenId}`, {
                        videoId: videoId,
                        playerVars: {
                            'autoplay': 1,
                            'rel': 0,
                            'playsinline': 1,
                            'origin': window.location.origin
                        },
                        events: {
                            'onReady': (event) => {
                                console.log(`Player YouTube ${screenId} está pronto`);
                            },
                            'onError': (event) => {
                                console.error(`Erro no player YouTube ${screenId}:`, event.data);
                                handleYouTubeError(screenId, event.data, container);
                            },
                            'onStateChange': (event) => {
                                handleYouTubeStateChange(screenId, event.data);
                            }
                        }
                    });
                } else {
                    // Fallback para iframe se a API não estiver pronta
                    container.innerHTML = `
                        <div id="youtube-player-${screenId}"></div>
                    `;
                    setTimeout(() => {
                        if (AppState.youtubeAPIReady) {
                            renderVideo(screenId, link);
                        }
                    }, 100);
                }
            });
        } else {
            showPlaceholder(container, 'Link inválido');
        }
    } else if (isVimeoLink(link)) {
        const videoId = extractVimeoId(link);
        if (videoId) {
            container.innerHTML = `
                <iframe
                    src="https://player.vimeo.com/video/${videoId}?autoplay=1"
                    allowfullscreen
                    allow="autoplay; fullscreen; picture-in-picture">
                </iframe>
            `;
        } else {
            showPlaceholder(container, 'Link inválido');
        }
    } else if (link.match(/\.(mp4|webm|ogg)$/i)) {
        container.innerHTML = `
            <video controls autoplay>
                <source src="${link}" type="video/mp4">
                Seu navegador não suporta o elemento de vídeo.
            </video>
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
    
    if (screen.visible) {
        container.classList.remove('video-hidden');
        icon.className = 'bi bi-eye';
        button.classList.remove('hidden');
        
        // Pausar/retomar player do YouTube se existir
        if (AppState.youtubePlayers[screenId]) {
            try {
                const player = AppState.youtubePlayers[screenId];
                if (typeof player.playVideo === 'function') {
                    player.playVideo();
                }
            } catch (e) {
                console.error('Erro ao retomar vídeo:', e);
            }
        }
    } else {
        container.classList.add('video-hidden');
        icon.className = 'bi bi-eye-slash';
        button.classList.add('hidden');
        
        // Pausar player do YouTube se existir
        if (AppState.youtubePlayers[screenId]) {
            try {
                const player = AppState.youtubePlayers[screenId];
                if (typeof player.pauseVideo === 'function') {
                    player.pauseVideo();
                }
            } catch (e) {
                console.error('Erro ao pausar vídeo:', e);
            }
        }
    }
}

// ==========================================
// TRATAMENTO DE ERROS DO YOUTUBE
// ==========================================
function handleYouTubeError(screenId, errorCode, container) {
    const errorMessage = getYouTubeErrorMessage(errorCode);
    console.error(`Erro no player YouTube ${screenId} (código ${errorCode}):`, errorMessage);
    
    // Exibir mensagem de erro específica
    showPlaceholder(container, errorMessage);
    
    // Exibir notificação ao usuário
    showNotification(errorMessage, 'error');
}

function getYouTubeErrorMessage(errorCode) {
    const errorMessages = {
        2: 'Parâmetro inválido. Verifique o link do vídeo.',
        5: 'O conteúdo HTML5 do player não pode ser reproduzido.',
        100: 'Vídeo não encontrado. Verifique o link.',
        101: 'O proprietário do vídeo não permite a reprodução em aplicações de terceiros.',
        150: 'Erro ao reproduzir vídeo. Tente novamente.'
    };
    
    return errorMessages[errorCode] || 'Erro desconhecido ao carregar o vídeo.';
}

function handleYouTubeStateChange(screenId, playerState) {
    const stateNames = {
        [YT.PlayerState.UNSTARTED]: 'UNSTARTED',
        [YT.PlayerState.ENDED]: 'ENDED',
        [YT.PlayerState.PLAYING]: 'PLAYING',
        [YT.PlayerState.PAUSED]: 'PAUSED',
        [YT.PlayerState.BUFFERING]: 'BUFFERING',
        [YT.PlayerState.CUED]: 'CUED'
    };
    
    const stateName = stateNames[playerState] || 'UNKNOWN';
    console.log(`Player YouTube ${screenId} mudou para estado: ${stateName} (${playerState})`);
    
    // Verificar se o vídeo foi bloqueado pelo proprietário
    if (playerState === YT.PlayerState.PLAYING) {
        // Vídeo está sendo reproduzido com sucesso
        const screen = AppState.screens.find(s => s.id === screenId);
        if (screen) {
            screen.isPlaying = true;
            AppState.isPlaying[screenId] = true;
        }
    } else if (playerState === YT.PlayerState.PAUSED) {
        const screen = AppState.screens.find(s => s.id === screenId);
        if (screen) {
            screen.isPlaying = false;
            AppState.isPlaying[screenId] = false;
        }
    } else if (playerState === YT.PlayerState.ENDED) {
        const screen = AppState.screens.find(s => s.id === screenId);
        if (screen) {
            screen.isPlaying = false;
            AppState.isPlaying[screenId] = false;
        }
    } else if (playerState === YT.PlayerState.CUED) {
        // Vídeo está pronto para ser reproduzido
        const screen = AppState.screens.find(s => s.id === screenId);
        if (screen) {
            screen.isPlaying = false;
            AppState.isPlaying[screenId] = false;
        }
    }
}

// Função para verificar se o vídeo pode ser reproduzido
async function checkYouTubeVideoAvailability(videoId) {
    try {
        // Tentar obter informações do vídeo usando o endpoint oEmbed
        const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        if (!response.ok) {
            console.warn('Não foi possível verificar disponibilidade do vídeo');
            return true; // Retornar true para tentar carregar mesmo assim
        }
        
        const data = await response.json();
        
        // Verificar se o vídeo permite embed
        if (data && data.html) {
            console.log('Vídeo permite embed');
            return true;
        } else {
            console.warn('Vídeo não permite embed');
            return false;
        }
    } catch (error) {
        console.error('Erro ao verificar disponibilidade do vídeo:', error);
        return true; // Retornar true para tentar carregar mesmo assim
    }
}

// ==========================================
// FUNÇÕES DE LINK
// ==========================================
function isYouTubeLink(link) {
    return link.match(/(?:youtube\.com|youtu\.be)/i);
}

function extractYouTubeId(link) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
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
