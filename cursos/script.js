// Dados das aulas com links do YouTube
const lessons = [
    { 
        id: 1, 
        title: 'AULA 1 - Boas-vindas', 
        description: 'Bem-vindo ao curso Movimento 120 anos. Nesta aula inicial, apresentamos a visão geral do programa.',
        youtubeId: '8ogM37o3NnU',
        duration: '10:11', 
        completed: false 
    },
    { 
        id: 2, 
        title: 'AULA 2 - Introdução ao Movimento', 
        description: 'Nesta aula, aprenderemos os conceitos fundamentais sobre o Movimento 120 anos e sua importância histórica.',
        youtubeId: 'Kx8d39KZEHk',
        duration: '16:12', 
        completed: false 
    },
    { 
        id: 3, 
        title: 'AULA 3 - Fundamentos', 
        description: 'Aprofundamos os fundamentos básicos e os princípios que norteiam o movimento.',
        youtubeId: 'o9Q0KOxtEmU',
        duration: '11:55', 
        completed: false 
    },
    { 
        id: 4, 
        title: 'AULA 4 - Conclusão', 
        description: 'Nesta aula final, consolidamos os aprendizados e discutimos as próximas etapas.',
        youtubeId: '8Ttnz8xqMFE',
        duration: '11:55', 
        completed: false 
    }
];

let currentLesson = 1;

// Elementos do DOM
const btnBack = document.getElementById('btnBack');
const btnClose = document.getElementById('btnClose');
const btnComplete = document.getElementById('btnComplete');
const moduleHeader1 = document.getElementById('moduleHeader1');
const moduleContent1 = document.getElementById('moduleContent1');
const youtubePlayer = document.getElementById('youtubePlayer');
const lessonTitle = document.getElementById('lessonTitle');
const lessonDescription = document.getElementById('lessonDescription');
const progressText = document.getElementById('progress');
const headerTitle = document.getElementById('headerTitle');
const lessonElements = document.querySelectorAll('.lesson');
const tabs = document.querySelectorAll('.tab');
const tabPanels = document.querySelectorAll('.tab-panel');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');

// Inicializar
function init() {
    setupEventListeners();
    updateLessonInfo(currentLesson);
    updateAllLessonVisuals();
}

// Setup de Event Listeners
function setupEventListeners() {
    btnBack.addEventListener('click', goBack);
    btnClose.addEventListener('click', closePlayer);
    btnComplete.addEventListener('click', toggleComplete);
    moduleHeader1.addEventListener('click', toggleModule);

    lessonElements.forEach((element, index) => {
        element.addEventListener('click', () => selectLesson(index + 1));
    });

    tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('drop', handleDrop);

    fileInput.addEventListener('change', handleFileSelect);
}

// Ir para trás
function goBack() {
    window.history.back();
}

// Fechar player
function closePlayer() {
    if (confirm('Tem certeza que deseja sair do curso?')) {
        window.location.href = '/membros/index.html';
    }
}

// Toggle module collapse
function toggleModule() {
    const isCurrentlyCollapsed = moduleHeader1.classList.contains('collapsed');
    
    if (isCurrentlyCollapsed) {
        moduleHeader1.classList.remove('collapsed');
        moduleContent1.classList.remove('hidden');
    } else {
        moduleHeader1.classList.add('collapsed');
        moduleContent1.classList.add('hidden');
    }
}

// Verificar se a aula está desbloqueada
function isLessonUnlocked(lessonId) {
    if (lessonId === 1) return true;
    
    // Verifica se a aula anterior foi concluída
    const previousLesson = lessons[lessonId - 2];
    return previousLesson && previousLesson.completed;
}

// Selecionar lição
function selectLesson(lessonId) {
    if (!isLessonUnlocked(lessonId)) {
        showNotification('⚠ Complete a aula anterior para desbloquear esta!');
        return;
    }
    
    currentLesson = lessonId;
    updateLessonInfo(lessonId);
    updateActiveLesson(lessonId);
}

// Atualizar informações da lição
function updateLessonInfo(lessonId) {
    const lesson = lessons[lessonId - 1];
    
    lessonTitle.textContent = lesson.title;
    lessonDescription.textContent = lesson.description;
    headerTitle.textContent = `Curso Oficial – ${lesson.title}`;
    
    // Carregar vídeo do YouTube
    const embedUrl = `https://www.youtube.com/embed/${lesson.youtubeId}?rel=0&modestbranding=1`;
    youtubePlayer.src = embedUrl;
    
    updateProgress();
    updateCompleteButton();
}

// Atualizar lição ativa
function updateActiveLesson(lessonId) {
    lessonElements.forEach((element, index) => {
        element.classList.remove('active');
        if (index + 1 === lessonId) {
            element.classList.add('active');
        }
    });
}

// Atualizar visual de todas as aulas
function updateAllLessonVisuals() {
    lessonElements.forEach((element, index) => {
        const lesson = lessons[index];
        const lessonId = index + 1;
        const isUnlocked = isLessonUnlocked(lessonId);
        
        element.classList.remove('locked');
        
        if (!isUnlocked) {
            element.classList.add('locked');
        }
        
        // Restaurar ícones corretos
        const iconContainer = element.querySelector('.lesson-icon');
        
        if (lesson.completed) {
            iconContainer.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            `;
        } else if (isUnlocked && lessonId === currentLesson) {
            iconContainer.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
            `;
        } else {
            iconContainer.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="5" y="13" width="14" height="8" rx="2" ry="2"></rect>
                    <path d="M7 13V8a5 5 0 0 1 10 0v5"></path>
                </svg>
            `;
        }
    });
}

// Marcar como concluído
function toggleComplete() {
    const lesson = lessons[currentLesson - 1];
    
    if (!lesson.completed) {
        lesson.completed = true;
        
        updateCompleteButton();
        updateProgress();
        updateAllLessonVisuals();
        
        showNotification('✓ Aula marcada como concluída!');
        
        // Auto-avanço para próxima aula
        if (currentLesson < lessons.length) {
            setTimeout(() => {
                selectLesson(currentLesson + 1);
                showNotification('▶ Próxima aula carregada!');
            }, 1500);
        }
    }
}

// Atualizar botão de conclusão
function updateCompleteButton() {
    const lesson = lessons[currentLesson - 1];
    if (lesson.completed) {
        btnComplete.classList.add('completed');
        btnComplete.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            CONCLUÍDO
        `;
    } else {
        btnComplete.classList.remove('completed');
        btnComplete.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            MARCAR COMO CONCLUÍDO
        `;
    }
}

// Atualizar progresso
function updateProgress() {
    const completedCount = lessons.filter(l => l.completed).length;
    const percentage = Math.round((completedCount / lessons.length) * 100);
    progressText.textContent = `Seu Progresso: ${completedCount} de ${lessons.length} (${percentage}%)`;
    
    // Atualizar contador do módulo
    const moduleCount = document.querySelector('.module-count');
    moduleCount.textContent = `${completedCount}/${lessons.length}`;
}

// Switch tabs
function switchTab(tabName) {
    tabs.forEach(tab => tab.classList.remove('active'));
    tabPanels.forEach(panel => panel.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

// Drag and Drop
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.style.background = 'rgba(217, 115, 54, 0.15)';
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.style.background = '';
    const files = e.dataTransfer.files;
    handleFiles(files);
}

function handleFileSelect(e) {
    handleFiles(e.target.files);
}

function handleFiles(files) {
    Array.from(files).forEach(file => {
        const fileSize = (file.size / 1024 / 1024).toFixed(1);
        addFileToList(file.name, fileSize);
        showNotification(`✓ Arquivo "${file.name}" adicionado!`);
    });
}

function addFileToList(fileName, fileSize) {
    const filesList = document.getElementById('filesList');
    
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="color: #d97336;">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
        </svg>
        <div class="file-info">
            <p class="file-name">${fileName}</p>
            <p class="file-size">${fileSize} MB</p>
        </div>
        <button class="btn-download">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
        </button>
    `;
    
    const downloadBtn = fileItem.querySelector('.btn-download');
    downloadBtn.addEventListener('click', () => {
        showNotification(`⬇ Baixando ${fileName}...`);
    });
    
    filesList.insertBefore(fileItem, filesList.firstChild);
}

// Notificação
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 24px;
        right: 24px;
        background: linear-gradient(135deg, #d97336, #e68a4f);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(217, 115, 54, 0.4);
        font-size: 14px;
        font-weight: 600;
        z-index: 10000;
        animation: slideInRight 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        max-width: 350px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.4s ease';
        setTimeout(() => {
            notification.remove();
        }, 400);
    }, 3000);
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', init);
