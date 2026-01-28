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
        // Atualizar ícone da plataforma (inicialmente vazio)
        updatePlatformIcon(screenData.id, screenData.link);
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

// Função auxiliar para detectar plataforma e retornar ícone
function getPlatformIcon(link) {
    if (!link) return '';
    if (YouTube.isValidUrl(link)) {
        return YouTube.icon;
    }
    if (Vimeo.isValidUrl(link)) {
        return Vimeo.icon;
    }
    if (Twitch.isValidUrl(link)) {
        return Twitch.icon;
    }
    if (Kick.isValidUrl(link)) {
        return Kick.icon;
    }
    return '';
}

// Função para atualizar o ícone da plataforma no DOM
function updatePlatformIcon(screenId, link) {
    const placeholderId = `platformIcon-${screenId}`;

    // Tentar localizar o placeholder existente
    let placeholder = document.getElementById(placeholderId);

    // Se não existir, criar e inserir logo após o input de link
    if (!placeholder) {
        const input = document.getElementById(`linkInput-${screenId}`);
        placeholder = document.createElement('span');
        placeholder.className = 'platform-icon';
        placeholder.id = placeholderId;

        if (input && input.parentNode) {
            input.parentNode.insertBefore(placeholder, input.nextSibling);
        } else {
            // fallback: inserir no header (compatibilidade)
            const headerControls = document.querySelector(`.screen-card[data-screen-id="${screenId}"] .video-controls`);
            if (headerControls) headerControls.insertBefore(placeholder, headerControls.firstChild || null);
        }
    }

    // Limpar conteúdo atual
    placeholder.innerHTML = '';

    if (!link) return;

    // Definir ícone conforme a plataforma detectada
    if (YouTube.isValidUrl(link)) {
        placeholder.innerHTML = `<img src="../assets/youtube.svg" alt="YouTube" title="YouTube" class="platform-icon">`;
        placeholder.setAttribute('title', 'YouTube');
    } else if (Vimeo.isValidUrl(link)) {
        placeholder.innerHTML = `<img src="../assets/vimeo.svg" alt="Vimeo" title="Vimeo" class="platform-icon">`;
        placeholder.setAttribute('title', 'Vimeo');
    } else if (Twitch.isValidUrl(link)) {
        placeholder.innerHTML = `<img src="../assets/twitch.svg" alt="Twitch" title="Twitch" class="platform-icon">`;
        placeholder.setAttribute('title', 'Twitch');
    } else if (Kick.isValidUrl(link)) {
        placeholder.innerHTML = `<img src="../assets/kick.svg" alt="Kick" title="Kick" class="platform-icon">`;
        placeholder.setAttribute('title', 'Kick');
    }
}

function createScreenCard(screenData) {
    const card = document.createElement('div');
    card.className = 'screen-card';
    card.dataset.screenId = screenData.id;

    card.innerHTML = `
        <div class="screen-body no-header">
            <div class="video-container" id="videoContainer-${screenData.id}">
                <div class="video-placeholder">
                    <i class="bi bi-play-circle"></i>
                    <span>Aguardando link...</span>
                </div>
            </div>
            <div class="link-input-group">
                <div class="control-buttons">
                    <button class="btn-control" data-action="refresh" data-screen-id="${screenData.id}" title="Atualizar Vídeo">
                        <i class="bi bi-arrow-clockwise"></i>
                    </button>
                    <button class="btn-control" data-action="apply" data-screen-id="${screenData.id}" title="Aplicar Vídeo">
                        <i class="bi bi-play-fill"></i>
                    </button>
                </div>
                <input type="text" 
                       class="link-input" 
                       id="linkInput-${screenData.id}" 
                       placeholder="Cole o link do vídeo aqui..."
                       data-screen-id="${screenData.id}">
                <span class="platform-icon" id="platformIcon-${screenData.id}"></span>
                <button class="btn-eye" data-screen-id="${screenData.id}" title="Mostrar/Ocultar Vídeo">
                    <i class="bi bi-eye${screenData.visible ? '' : '-slash'}"></i>
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
            updatePlatformIcon(screenId, screen.link);
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
    updatePlatformIcon(screenId, link);
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

    // Identificar tipo de vídeo e extrair ID usando os módulos
    const youtubeId = YouTube.extractVideoId(link);
    const vimeoId = Vimeo.extractVideoId(link);
    const twitchData = Twitch.extractData(link);
    const kickId = Kick.extractChannelId(link);

    if (youtubeId) {
        container.innerHTML = YouTube.getPlyrIframeHtml(youtubeId, screenId);
        initializePlyr(screenId, `#player-${screenId}`);
    } else if (vimeoId) {
        container.innerHTML = Vimeo.getPlyrContainerHtml(vimeoId, screenId);
        initializePlyr(screenId, `#player-${screenId}`);
    } else if (twitchData) {
        // Se a aplicação estiver sendo aberta via file: ou sem hostname, o
        // Twitch bloqueará o embed por causa de CSP/frame-ancestors. Detectamos
        // este caso e mostramos uma mensagem orientando o usuário a rodar
        // o app via servidor local (ex: http://localhost:5500).
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        if (protocol === 'file:' || !hostname) {
            container.innerHTML = `
                <div class="video-placeholder">
                    <i class="bi bi-exclamation-triangle"></i>
                    <span>Embed Twitch bloqueado: rode a aplicação via servidor local (ex: http://localhost:5500) para permitir o parâmetro "parent" requerido pelo Twitch.</span>
                </div>
            `;
        } else {
            container.innerHTML = Twitch.getNativeIframeHtml(twitchData, screenId);
        }
    } else if (kickId) {
        container.innerHTML = Kick.getNativeIframeHtml(kickId, screenId);
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
    const youtubeId = YouTube.extractVideoId(link);
    const vimeoId = Vimeo.extractVideoId(link);
    const twitchData = Twitch.extractData(link);
    const kickId = Kick.extractChannelId(link);

    if (youtubeId) {
        container.innerHTML = YouTube.getNativeIframeHtml(youtubeId, screenId);
    } else if (vimeoId) {
        container.innerHTML = Vimeo.getNativeIframeHtml(vimeoId, screenId);
    } else if (twitchData) {
        container.innerHTML = Twitch.getNativeIframeHtml(twitchData, screenId);
    } else if (kickId) {
        container.innerHTML = Kick.getNativeIframeHtml(kickId, screenId);
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
            const playResult = player.play();
            if (playResult && typeof playResult.catch === 'function') {
                playResult.catch(e => console.warn('Autoplay bloqueado pelo navegador:', e));
            }
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
                updatePlatformIcon(screen.id, screen.link);
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