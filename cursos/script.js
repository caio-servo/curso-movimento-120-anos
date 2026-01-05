// ========== VARIÁVEIS GLOBAIS ==========
let userData = { isAdmin: false };
let modulos = [];
let aulas = [];
let currentAula = null;
let currentModulo = null;
let editandoModuloId = null;
let editandoAulaId = null;
let modoVisualizacao = false;

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    checkUserType();
    carregarDados();
    setupEventListeners();
});

// ========== VERIFICAR TIPO DE USUÁRIO ==========
function checkUserType() {
    const isAdmin = localStorage.getItem('userIsAdmin') === 'true';
    userData.isAdmin = isAdmin;

    const userView = document.getElementById('userView');
    const adminView = document.getElementById('adminView');

    if (isAdmin) {
        adminView.style.display = 'flex';
        userView.style.display = 'none';
    } else {
        userView.style.display = 'flex';
        adminView.style.display = 'none';
    }
}

// ========== CARREGAR DADOS ==========
async function carregarDados() {
    try {
        const response = await fetch('https://movimento120anos.ibr.com.br/api/modulos', {
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            modulos = (data.modulos || []).reverse();
            aulas = data.aulas || [];
        }
    } catch (error) {
        console.error('Erro ao carregar:', error);
        modulos = [];
        aulas = [];
    }

    if (userData.isAdmin) {
        renderizarAdminView();
    } else {
        renderizarUserView();
    }
}

// ========== VISTA DO USUÁRIO ==========
function renderizarUserView() {
    renderizarModulosUsuario();
    if (modulos.length > 0) {
        selecionarAula(modulos[0].id, aulas.filter(a => a.modulo_id === modulos[0].id)[0]);
    }
}

function renderizarModulosUsuario() {
    const modulesList = document.getElementById('modulesList');
    modulesList.innerHTML = '';

    // Ordenar módulos por ID (crescente = primeiro criado fica em primeiro)
    const modulosOrdenados = [...modulos].sort((a, b) => a.id - b.id);

    modulosOrdenados.forEach(modulo => {
        const aulasDoModulo = aulas.filter(a => a.modulo_id === modulo.id);
        
        const moduloDiv = document.createElement('div');
        moduloDiv.className = 'module';

        const headerDiv = document.createElement('div');
        headerDiv.className = 'module-header';
        headerDiv.innerHTML = `
            <div class="module-title">${modulo.nome}</div>
            <div class="module-count">${aulasDoModulo.length}</div>
        `;
        headerDiv.addEventListener('click', () => toggleModule(moduloDiv, modulo.id));

        const contentDiv = document.createElement('div');
        contentDiv.className = 'module-content';

        aulasDoModulo.forEach(aula => {
            const aulaDiv = document.createElement('div');
            aulaDiv.className = 'lesson';
            aulaDiv.style.padding = '12px 20px';
            aulaDiv.style.borderLeft = '4px solid transparent';
            aulaDiv.style.cursor = 'pointer';
            aulaDiv.style.transition = 'all 0.3s ease';
            aulaDiv.style.background = '#243447';
            aulaDiv.style.marginBottom = '8px';
            aulaDiv.style.borderRadius = '6px';

            aulaDiv.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color: #5e5eff;">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    <span style="flex: 1; font-size: 13px; font-weight: 600;">${aula.titulo}</span>
                    <span style="font-size: 11px; color: #9ca3af;">${aula.duracao}</span>
                </div>
            `;

            aulaDiv.addEventListener('click', () => selecionarAula(modulo.id, aula));
            aulaDiv.addEventListener('mouseenter', () => {
                aulaDiv.style.background = '#2d3e52';
                aulaDiv.style.borderLeftColor = '#5e5eff';
                aulaDiv.style.paddingLeft = '24px';
            });
            aulaDiv.addEventListener('mouseleave', () => {
                aulaDiv.style.background = '#243447';
                aulaDiv.style.borderLeftColor = 'transparent';
                aulaDiv.style.paddingLeft = '20px';
            });

            contentDiv.appendChild(aulaDiv);
        });

        moduloDiv.appendChild(headerDiv);
        moduloDiv.appendChild(contentDiv);
        modulesList.appendChild(moduloDiv);
    });
}

function toggleModule(moduloDiv, moduloId) {
    const content = moduloDiv.querySelector('.module-content');
    content.style.display = content.style.display === 'none' ? 'block' : 'none';
}

function selecionarAula(moduloId, aula) {
    currentModulo = modulos.find(m => m.id === moduloId);
    currentAula = aula;

    document.getElementById('headerTitle').textContent = `Curso Oficial – ${aula.titulo}`;
    document.getElementById('lessonTitle').textContent = aula.titulo;
    document.getElementById('lessonDescription').textContent = aula.descricao || 'Sem descrição';

    const embedUrl = `https://www.youtube.com/embed/${aula.youtube_id}?rel=0&modestbranding=1`;
    document.getElementById('youtubePlayer').src = embedUrl;

    updateProgress();
}

function updateProgress() {
    const total = aulas.length;
    const completed = 0;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    document.getElementById('progress').textContent = `Seu Progresso: ${completed} de ${total} (${percentage}%)`;
}

// ========== VISTA DO ADMIN ==========
function renderizarAdminView() {
    renderizarModulosAdmin();
    setupAdminEventListeners();
}

function renderizarModulosAdmin() {
    const adminModulesList = document.getElementById('adminModulesList');
    adminModulesList.innerHTML = '';

    if (modulos.length === 0) {
        adminModulesList.innerHTML = '<p style="padding: 20px; text-align: center; color: #9ca3af;">Nenhum módulo criado</p>';
        return;
    }

    // Ordenar módulos por ID (crescente = primeiro criado fica em primeiro)
    const modulosOrdenados = [...modulos].sort((a, b) => a.id - b.id);

    modulosOrdenados.forEach(modulo => {
        const aulasDoModulo = aulas.filter(a => a.modulo_id === modulo.id);
        const itemDiv = document.createElement('div');
        itemDiv.className = 'module-item';
        itemDiv.style.padding = '12px 16px';
        itemDiv.style.marginBottom = '8px';
        itemDiv.style.background = '#243447';
        itemDiv.style.borderLeft = '4px solid transparent';
        itemDiv.style.borderRadius = '8px';
        itemDiv.style.display = 'flex';
        itemDiv.style.justifyContent = 'space-between';
        itemDiv.style.alignItems = 'center';
        itemDiv.style.gap = '12px';
        itemDiv.style.transition = 'all 0.3s ease';
        itemDiv.style.cursor = 'pointer';

        const contentDiv = document.createElement('div');
        contentDiv.style.flex = '1';
        contentDiv.innerHTML = `<div style="font-size: 13px; font-weight: 600; color: #e5e7eb;">${modulo.nome}</div>`;

        const badgeDiv = document.createElement('div');
        badgeDiv.style.fontSize = '11px';
        badgeDiv.style.background = 'rgba(94, 94, 255, 0.2)';
        badgeDiv.style.color = '#5e5eff';
        badgeDiv.style.padding = '4px 8px';
        badgeDiv.style.borderRadius = '6px';
        badgeDiv.textContent = `${aulasDoModulo.length} aulas`;

        const deleteBtn = document.createElement('button');
        deleteBtn.style.cssText = `
            background: rgba(239, 68, 68, 0.2);
            color: #ef4444;
            border: none;
            padding: 6px 10px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 600;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 4px;
        `;
        deleteBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Deletar
        `;
        deleteBtn.addEventListener('mouseenter', () => {
            deleteBtn.style.background = 'rgba(239, 68, 68, 0.3)';
        });
        deleteBtn.addEventListener('mouseleave', () => {
            deleteBtn.style.background = 'rgba(239, 68, 68, 0.2)';
        });
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deletarModulo(modulo.id);
        });

        itemDiv.appendChild(contentDiv);
        itemDiv.appendChild(badgeDiv);
        itemDiv.appendChild(deleteBtn);

        itemDiv.addEventListener('click', () => selecionarModuloAdmin(modulo.id));
        itemDiv.addEventListener('mouseenter', () => {
            itemDiv.style.background = '#2d3e52';
            itemDiv.style.borderLeftColor = '#5e5eff';
        });
        itemDiv.addEventListener('mouseleave', () => {
            itemDiv.style.background = '#243447';
            itemDiv.style.borderLeftColor = 'transparent';
        });

        adminModulesList.appendChild(itemDiv);
    });
}

function selecionarModuloAdmin(moduloId) {
    modoVisualizacao = false;
    currentModulo = modulos.find(m => m.id === moduloId);
    const aulasDoModulo = aulas.filter(a => a.modulo_id === moduloId);

    document.getElementById('mainTitle').textContent = currentModulo.nome;
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = '';

    if (aulasDoModulo.length === 0) {
        const btnAdd = document.createElement('button');
        btnAdd.className = 'btn-add-lesson';
        btnAdd.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Adicionar Primeira Aula
        `;
        btnAdd.onclick = abrirModalAula;
        contentArea.appendChild(btnAdd);
        return;
    }

    const btnAdd = document.createElement('button');
    btnAdd.className = 'btn-add-lesson';
    btnAdd.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Adicionar Aula
    `;
    btnAdd.onclick = abrirModalAula;
    contentArea.appendChild(btnAdd);

    const grid = document.createElement('div');
    grid.className = 'lessons-container';

    aulasDoModulo.forEach(aula => {
        const card = document.createElement('div');
        card.className = 'lesson-card';
        
        const cardHeader = document.createElement('div');
        cardHeader.className = 'lesson-card-header';
        cardHeader.innerHTML = `
            <div class="lesson-card-title">${aula.titulo}</div>
            <div class="lesson-card-duration">${aula.duracao}</div>
        `;
        
        const cardDescription = document.createElement('div');
        cardDescription.className = 'lesson-card-description';
        cardDescription.textContent = aula.descricao || 'Sem descrição';
        
        const cardActions = document.createElement('div');
        cardActions.className = 'lesson-card-actions';
        
        const btnView = document.createElement('button');
        btnView.className = 'btn-small btn-view';
        btnView.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            Ver
        `;
        btnView.onclick = () => visualizarAulaAdmin(aula.id);
        
        const btnEdit = document.createElement('button');
        btnEdit.className = 'btn-small btn-edit';
        btnEdit.textContent = 'Editar';
        btnEdit.onclick = () => editarAula(aula.id);
        
        const btnDelete = document.createElement('button');
        btnDelete.className = 'btn-small btn-delete';
        btnDelete.textContent = 'Deletar';
        btnDelete.onclick = () => deletarAula(aula.id);
        
        cardActions.appendChild(btnView);
        cardActions.appendChild(btnEdit);
        cardActions.appendChild(btnDelete);
        
        card.appendChild(cardHeader);
        card.appendChild(cardDescription);
        card.appendChild(cardActions);
        
        grid.appendChild(card);
    });

    contentArea.appendChild(grid);
}

function visualizarAulaAdmin(aulaId) {
    const aula = aulas.find(a => a.id === aulaId);
    if (!aula) return;

    modoVisualizacao = true;
    currentAula = aula;

    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = '';

    const btnVoltar = document.createElement('button');
    btnVoltar.className = 'btn-back-admin';
    btnVoltar.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Voltar para Edição
    `;
    btnVoltar.onclick = () => selecionarModuloAdmin(currentModulo.id);
    contentArea.appendChild(btnVoltar);

    const videoContainer = document.createElement('div');
    videoContainer.style.cssText = `
        margin-top: 20px;
        background: #1a2332;
        border-radius: 12px;
        overflow: hidden;
    `;

    const videoHeader = document.createElement('div');
    videoHeader.style.cssText = `
        padding: 20px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
    `;
    videoHeader.innerHTML = `
        <h3 style="margin: 0 0 8px 0; color: #e5e7eb; font-size: 18px;">${aula.titulo}</h3>
        <p style="margin: 0; color: #9ca3af; font-size: 14px;">${aula.descricao || 'Sem descrição'}</p>
        <div style="margin-top: 12px; display: flex; align-items: center; gap: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span style="color: #9ca3af; font-size: 13px;">Duração: ${aula.duracao}</span>
        </div>
    `;

    const playerWrapper = document.createElement('div');
    playerWrapper.style.cssText = `
        position: relative;
        padding-bottom: 56.25%;
        height: 0;
        overflow: hidden;
        background: #000;
    `;

    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${aula.youtube_id}?rel=0&modestbranding=1`;
    iframe.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border: none;
    `;
    iframe.allowFullscreen = true;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';

    playerWrapper.appendChild(iframe);
    videoContainer.appendChild(videoHeader);
    videoContainer.appendChild(playerWrapper);
    contentArea.appendChild(videoContainer);
}

// ========== MODAIS ADMIN ==========
function abrirModalModulo() {
    editandoModuloId = null;
    document.getElementById('moduleForm').reset();
    document.getElementById('moduleModalTitle').textContent = 'Novo Módulo';
    document.getElementById('moduleModal').classList.add('active');
}

function fecharModalModulo() {
    document.getElementById('moduleModal').classList.remove('active');
}

function abrirModalAula() {
    if (!currentModulo) {
        showAlert('Selecione um módulo primeiro', 'error');
        return;
    }
    
    editandoAulaId = null;
    document.getElementById('lessonForm').reset();
    
    setTimeout(() => {
        document.getElementById('lessonModuleId').value = currentModulo.id;
    }, 0);
    
    document.getElementById('lessonModalTitle').textContent = 'Nova Aula';
    document.getElementById('lessonModal').classList.add('active');
}

function fecharModalAula() {
    document.getElementById('lessonModal').classList.remove('active');
}

function editarAula(id) {
    const aula = aulas.find(a => a.id === id);
    if (!aula) {
        showAlert('Erro: Aula não encontrada!', 'error');
        return;
    }

    editandoAulaId = id;
    
    document.getElementById('lessonModuleId').value = aula.modulo_id;
    document.getElementById('lessonTitleInput').value = aula.titulo;
    document.getElementById('lessonDescription').value = aula.descricao || '';
    document.getElementById('youtubeLink').value = aula.youtube_id;
    document.getElementById('lessonDuration').value = aula.duracao;
    document.getElementById('lessonModalTitle').textContent = 'Editar Aula';
    document.getElementById('lessonModal').classList.add('active');
}

async function deletarAula(id) {
    if (!confirm('Tem certeza que deseja deletar esta aula?')) return;

    try {
        const response = await fetch(`https://movimento120anos.ibr.com.br/api/aulas/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            aulas = aulas.filter(a => a.id !== id);
            selecionarModuloAdmin(currentModulo.id);
            showAlert('Aula deletada com sucesso!', 'success');
        } else {
            showAlert('Erro ao deletar aula', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showAlert('Erro ao deletar', 'error');
    }
}

async function deletarModulo(id) {
    const modulo = modulos.find(m => m.id === id);
    if (!modulo) return;

    if (!confirm(`Tem certeza que deseja deletar o módulo "${modulo.nome}"? Todas as aulas serão deletadas também.`)) {
        return;
    }

    try {
        const response = await fetch(`https://movimento120anos.ibr.com.br/api/modulos/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (response.status === 401) {
            showAlert('Sessão expirada. Faça login novamente.', 'error');
            setTimeout(() => {
                window.location.href = '/login/';
            }, 2000);
            return;
        }

        if (response.ok) {
            modulos = modulos.filter(m => m.id !== id);
            aulas = aulas.filter(a => a.modulo_id !== id);
            currentModulo = null;
            
            document.getElementById('mainTitle').textContent = 'Selecione um módulo';
            document.getElementById('contentArea').innerHTML = '';
            
            renderizarModulosAdmin();
            showAlert('Módulo deletado com sucesso!', 'success');
        } else {
            showAlert('Erro ao deletar módulo', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showAlert('Erro ao deletar', 'error');
    }
}

// ========== FORMULÁRIOS ==========
function setupEventListeners() {
    if (userData.isAdmin) {
        setupAdminEventListeners();
    } else {
        document.getElementById('btnBack').addEventListener('click', () => window.history.back());
        document.getElementById('btnClose').addEventListener('click', () => {
            if (confirm('Sair do curso?')) {
                window.location.href = '/membros/';
            }
        });
        document.getElementById('btnComplete').addEventListener('click', () => {
            document.getElementById('btnComplete').classList.add('completed');
            showAlert('Aula marcada como concluída!', 'success');
        });
        setupTabs();
    }
}

function setupAdminEventListeners() {
    document.getElementById('btnAddModule').addEventListener('click', abrirModalModulo);
    document.getElementById('btnCloseModuleModal').addEventListener('click', fecharModalModulo);
    document.getElementById('moduleModalOverlay').addEventListener('click', fecharModalModulo);
    document.getElementById('btnCancelModule').addEventListener('click', fecharModalModulo);
    document.getElementById('moduleForm').addEventListener('submit', salvarModulo);

    document.getElementById('btnCloseLessonModal').addEventListener('click', fecharModalAula);
    document.getElementById('lessonModalOverlay').addEventListener('click', fecharModalAula);
    document.getElementById('btnCancelLesson').addEventListener('click', fecharModalAula);
    document.getElementById('lessonForm').addEventListener('submit', salvarAula);

    document.getElementById('btnBackToMembers').addEventListener('click', () => {
        window.location.href = '/membros/';
    });
}

async function salvarModulo(e) {
    e.preventDefault();

    const dados = {
        nome: document.getElementById('moduleName').value.trim(),
        descricao: document.getElementById('moduleDescription').value.trim(),
        curso_id: 1
    };

    try {
        const url = editandoModuloId
            ? `https://movimento120anos.ibr.com.br/api/modulos/${editandoModuloId}`
            : 'https://movimento120anos.ibr.com.br/api/modulos';

        const method = editandoModuloId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(dados)
        });

        if (response.ok) {
            fecharModalModulo();
            carregarDados();
            showAlert('Módulo salvo!', 'success');
        }
    } catch (error) {
        console.error('Erro:', error);
        showAlert('Erro ao salvar', 'error');
    }
}

async function salvarAula(e) {
    e.preventDefault();

    const moduloIdEl = document.getElementById('lessonModuleId');
    const tituloEl = document.getElementById('lessonTitleInput');
    const descricaoEl = document.getElementById('lessonDescription');
    const youtubeLinkEl = document.getElementById('youtubeLink');
    const duracaoEl = document.getElementById('lessonDuration');

    if (!moduloIdEl || !tituloEl || !youtubeLinkEl) {
        showAlert('Erro: Campos obrigatórios não encontrados', 'error');
        return;
    }

    const moduloIdInput = moduloIdEl.value;
    const tituloInput = tituloEl.value;
    
    let descricaoInput = '';
    if (descricaoEl) {
        descricaoInput = descricaoEl.value || '';
    }
    
    const youtubeLinkInput = youtubeLinkEl.value;
    const duracaoInput = duracaoEl ? duracaoEl.value : '';

    if (!moduloIdInput && !currentModulo) {
        showAlert('Erro: Módulo não identificado', 'error');
        return;
    }

    if (!tituloInput || !tituloInput.trim()) {
        showAlert('Erro: Título da aula é obrigatório', 'error');
        return;
    }

    if (!youtubeLinkInput || !youtubeLinkInput.trim()) {
        showAlert('Erro: Link do YouTube é obrigatório', 'error');
        return;
    }

    let youtubeId = youtubeLinkInput.trim();
    const match = youtubeId.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (match) youtubeId = match[1];

    const dados = {
        modulo_id: parseInt(moduloIdInput || currentModulo.id),
        titulo: tituloInput.trim(),
        descricao: descricaoInput ? descricaoInput.trim() : '',
        youtube_id: youtubeId,
        duracao: duracaoInput ? duracaoInput.trim() : ''
    };

    try {
        let url, method;
        
        if (editandoAulaId) {
            url = `https://movimento120anos.ibr.com.br/api/aulas/${editandoAulaId}`;
            method = 'PUT';
        } else {
            url = 'https://movimento120anos.ibr.com.br/api/aulas';
            method = 'POST';
        }

        const response = await fetch(url, {
            method,
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(dados)
        });

        if (response.status === 401) {
            showAlert('Sessão expirada. Faça login novamente.', 'error');
            setTimeout(() => {
                window.location.href = '/login/';
            }, 2000);
            return;
        }

        if (response.ok) {
            fecharModalAula();
            await carregarDados();
            if (currentModulo) {
                selecionarModuloAdmin(currentModulo.id);
            }
            showAlert('Aula salva com sucesso!', 'success');
        } else {
            showAlert('Erro ao salvar: ' + response.status, 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar aula:', error);
        showAlert('Erro ao salvar: ' + error.message, 'error');
    }
}

function setupTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });
}

function logout() {
    localStorage.removeItem('isLogged');
    localStorage.removeItem('userIsAdmin');
    window.location.href = '/login/';
}

function showAlert(msg, type = 'info') {
    const alert = document.createElement('div');
    alert.textContent = msg;
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-weight: 500;
    `;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 3000);
}