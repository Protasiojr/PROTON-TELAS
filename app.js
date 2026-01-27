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

// Função chamada quando a API do YouTube está pronta
// Função chamada quando a API do YouTube está pronta
window.onYouTubeIframeAPIReady = function () {
    AppState.youtubeAPIReady = true;
    console.log('YouTube IFrame API está pronta');

    // Recarregar vídeos que foram carregados antes da API estar pronta
    reloadAllYouTubeVideos();
};

// ... (existing code for reloadAllYouTubeVideos) ... 

// ... inside renderVideo ...

if (AppState.youtubeAPIReady) {
    // Criar elemento div para o player
    const playerDiv = document.createElement('div');
    playerDiv.id = `youtube-player-${screenId}`;
    container.appendChild(playerDiv);

    // Criar player usando a API oficial
    try {
        AppState.youtubePlayers[screenId] = new YT.Player(`youtube-player-${screenId}`, {
            videoId: videoId,
            playerVars: {
                'autoplay': 1,
                'mute': 1,
                'rel': 0,
                'playsinline': 1
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
    } catch (e) {
        console.error("Erro ao instanciar YT.Player:", e);
        renderYouTubeIframe(container, videoId, screenId);
    }
} else {
    // API ainda não pronta. Tentar novamente em breve ou usar fallback.
    console.log('API YouTube ainda não pronta. Aguardando...');
    container.innerHTML = `
                        <div class="video-placeholder">
                            <i class="bi bi-hourglass-split"></i>
                            <span>Carregando player...</span>
                        </div>
                    `;

    let attempts = 0;
    const maxAttempts = 50; // 5 segundos
    const checkInterval = setInterval(() => {
        attempts++;
        if (AppState.youtubeAPIReady) {
            clearInterval(checkInterval);
            renderVideo(screenId, link);
        } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.warn('Timeout aguardando API do YouTube. Usando iframe simples.');
            renderYouTubeIframe(container, videoId, screenId);
        }, 100);
}
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

    // Se for erro 153 (erro de comunicação), tentar fallback para iframe
    if (errorCode === 153) {
        console.log(`Tentando fallback para iframe devido ao erro ${errorCode}`);
        const screen = AppState.screens.find(s => s.id === screenId);
        if (screen && screen.link) {
            const videoId = extractYouTubeId(screen.link);
            if (videoId) {
                // Destruir player existente
                if (AppState.youtubePlayers[screenId]) {
                    try {
                        AppState.youtubePlayers[screenId].destroy();
                        delete AppState.youtubePlayers[screenId];
                    } catch (e) {
                        console.error('Erro ao destruir player:', e);
                    }
                }
                // Usar iframe direto
                renderYouTubeIframe(container, videoId, screenId);
                return;
            }
        }
    }

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
        150: 'Erro ao reproduzir vídeo. Tente novamente.',
        153: 'Erro de comunicação com o YouTube. Tentando método alternativo...'
    };

    return errorMessages[errorCode] || 'Erro desconhecido ao carregar o vídeo.';
}

// Função para renderizar YouTube usando iframe direto
function renderYouTubeIframe(container, videoId, screenId) {
    container.innerHTML = `
        <iframe
            id="youtube-player-${screenId}"
            src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0&playsinline=1"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen>
        </iframe>
    `;
    console.log(`YouTube iframe renderizado para tela ${screenId}`);
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
    // Retornar true sempre para evitar problemas de CORS/Fetch em ambientes locais ou restritos.
    // O próprio player do YouTube tratará erros de disponibilidade.
    return true;
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
