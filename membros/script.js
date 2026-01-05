console.log('✅ Área de Membros carregada!');

// ========== ELEMENTOS DO DOM ==========
const btnProfile = document.getElementById('btnProfile');
const btnAdmin = document.getElementById('btnAdmin');
const btnExit = document.querySelector('.btn-exit');
const profileModal = document.getElementById('profileModal');
const changePasswordModal = document.getElementById('changePasswordModal');
const btnCloseModal = document.getElementById('btnCloseModal');
const modalOverlay = document.getElementById('modalOverlay');
const btnChangePassword = document.getElementById('btnChangePassword');
const btnCloseChangePassword = document.getElementById('btnCloseChangePassword');
const changePasswordOverlay = document.getElementById('changePasswordOverlay');
const changePasswordForm = document.getElementById('changePasswordForm');
const cards = document.querySelectorAll('.card');

// ========== DADOS DO USUÁRIO ==========
let userData = {
    name: 'Usuário',
    email: 'email@exemplo.com',
    isAdmin: false,
    status: 'ativo'
};

const isLogged = window.localStorage.getItem("isLogged");
if(!isLogged){
    window.location.replace('/login/');
}

// Função para carregar dados do usuário
async function loadUserData() {
    try {
        console.log('📡 Buscando dados do usuário...');
        
        // Tentar pegar do localStorage primeiro
        const storedName = localStorage.getItem('userName');
        const storedEmail = localStorage.getItem('userEmail');
        const storedIsAdmin = localStorage.getItem('userIsAdmin');
        
        if (storedName) {
            userData.name = storedName;
            console.log('✅ Nome do localStorage:', storedName);
        }
        
        if (storedEmail) {
            userData.email = storedEmail;
            console.log('✅ Email do localStorage:', storedEmail);
        }

        if (storedIsAdmin) {
            userData.isAdmin = storedIsAdmin === 'true';
            console.log('✅ IsAdmin do localStorage:', userData.isAdmin);
        }
        
        // Atualizar o título do hero
        document.querySelector('.hero-title').textContent = `Bem-vindo, ${userData.name}!`;
        
        // Tentar buscar do backend também
        const response = await fetch('https://movimento120anos.ibr.com.br/api/user-info', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Dados do backend recebidos:', data);
            
            if (data.name) {
                userData.name = data.name;
                localStorage.setItem('userName', data.name);
            }
            
            if (data.email) {
                userData.email = data.email;
                localStorage.setItem('userEmail', data.email);
            }

            if (data.isAdmin !== undefined) {
                userData.isAdmin = data.isAdmin;
                localStorage.setItem('userIsAdmin', data.isAdmin);
            }

            if (data.status) {
                userData.status = data.status;
            }
            
            // Atualizar novamente com dados do backend
            document.querySelector('.hero-title').textContent = `Bem-vindo, ${userData.name}!`;
            
        } else {
            console.warn('⚠️ Backend não retornou dados, usando localStorage');
        }

        // Verificar se o usuário está inativo
        if (userData.status === 'inativo') {
            showAlert('Sua conta está inativa. Entre em contato com o suporte.', 'error');
            setTimeout(() => {
                logout();
            }, 3000);
            return;
        }

        // Mostrar botão de admin se for administrador
        checkAdminAccess();
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados do backend:', error);
        console.log('ℹ️ Usando dados do localStorage');
        checkAdminAccess();
    }
}

// Verificar se o usuário é admin e mostrar o botão
// Verificar se o usuário é admin e mostrar os botões
function checkAdminAccess() {
    console.log('🔐 Verificando acesso admin:', userData.isAdmin);
    
    if (userData.isAdmin) {
        btnAdmin.style.display = 'flex';
        btnManageCourses.style.display = 'flex';
        console.log('✅ Botões Admin e Gerenciar habilitados!');
    } else {
        btnAdmin.style.display = 'none';
        btnManageCourses.style.display = 'none';
        console.log('ℹ️ Usuário não é administrador');
    }
}

// Event listener do botão Admin
if (btnAdmin) {
    btnAdmin.addEventListener('click', function() {
        console.log('🔧 Abrindo painel administrativo...');
        window.location.href = '/admin/admin.html';
    });
}

// Carregar dados ao iniciar
loadUserData();

// ========== MODAL DE PERFIL ==========
function openProfileModal() {
    // Atualizar informações no modal
    document.getElementById('userName').textContent = userData.name;
    document.getElementById('userEmail').textContent = userData.email;
    
    profileModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeProfileModal() {
    profileModal.classList.remove('active');
    document.body.style.overflow = '';
}

// Event listeners do modal de perfil
btnProfile.addEventListener('click', openProfileModal);
btnCloseModal.addEventListener('click', closeProfileModal);
modalOverlay.addEventListener('click', closeProfileModal);

// ========== MODAL DE TROCAR SENHA ==========
function openChangePasswordModal() {
    closeProfileModal();
    changePasswordModal.classList.add('active');
}

function closeChangePasswordModal() {
    changePasswordModal.classList.remove('active');
    document.body.style.overflow = '';
    changePasswordForm.reset();
}

btnChangePassword.addEventListener('click', openChangePasswordModal);
btnCloseChangePassword.addEventListener('click', closeChangePasswordModal);
changePasswordOverlay.addEventListener('click', closeChangePasswordModal);

// ========== TOGGLE DE SENHA ==========
const togglePasswordBtns = document.querySelectorAll('.toggle-password-btn');
togglePasswordBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        const targetId = this.getAttribute('data-target');
        const input = document.getElementById(targetId);
        
        if (input.type === 'password') {
            input.type = 'text';
        } else {
            input.type = 'password';
        }
    });
});

// ========== FORMULÁRIO DE TROCAR SENHA ==========
changePasswordForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validações
    if (newPassword !== confirmPassword) {
        showAlert('As senhas não coincidem!', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showAlert('A nova senha deve ter pelo menos 6 caracteres!', 'error');
        return;
    }
    
    const btnSubmit = document.querySelector('.btn-submit-password');
    const originalText = btnSubmit.textContent;
    
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'SALVANDO...';
    
    try {
        console.log('🔐 Enviando solicitação de troca de senha...');
        console.log('📧 Email do usuário:', userData.email);
        
        const response = await fetch('https://movimento120anos.ibr.com.br/api/change-password', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: userData.email,
                currentPassword,
                newPassword
            })
        });
        
        const data = await response.json();
        console.log('📦 Resposta do servidor:', data);
        
        if (response.ok && data.success) {
            console.log('✅ Senha alterada com sucesso!');
            showAlert('Senha alterada com sucesso!', 'success');
            closeChangePasswordModal();
            changePasswordForm.reset();
        } else {
            console.error('❌ Erro:', data.message);
            showAlert(data.message || 'Erro ao alterar senha. Verifique a senha atual.', 'error');
        }
        
    } catch (error) {
        console.error('💥 Erro na requisição:', error);
        showAlert('Erro ao conectar com o servidor. Verifique se o backend está rodando.', 'error');
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = originalText;
    }
});

// ========== CARDS - NAVEGAÇÃO ==========
cards.forEach((card) => {
    card.addEventListener('click', function() {
        // Verificar se o usuário está inativo
        if (userData.status === 'inativo') {
            showAlert('Sua conta está inativa. Você não pode acessar os cursos.', 'error');
            return;
        }

        if (card.classList.contains('card-active')) {
            window.location.href = '/cursos/index.html';
        } else if (card.classList.contains('card-coming')) {
            showAlert('Este conteúdo em breve estará disponível!', 'info');
        }
    });
});

// ========== BOTÃO SAIR ==========
btnExit.addEventListener('click', showExitMessage);

function logout() {
    // Limpar localStorage
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userIsAdmin');
    localStorage.removeItem('isLogged');
    
    // Fazer logout no backend
    fetch('https://movimento120anos.ibr.com.br/api/logout', {
        method: 'POST',
        credentials: 'include'
    }).catch(err => console.error('Erro ao fazer logout:', err));
    
    window.location.href = '/login/index.html';
}

function showExitMessage() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        animation: fadeInOverlay 0.3s ease;
        backdrop-filter: blur(5px);
    `;
    
    const message = document.createElement('div');
    message.style.cssText = `
        text-align: center;
        animation: scaleIn 0.5s ease;
    `;
    
    const title = document.createElement('h2');
    title.textContent = 'Até Logo!';
    title.style.cssText = `
        color: #d97336;
        font-size: 48px;
        font-weight: 700;
        margin-bottom: 20px;
    `;
    
    const subtitle = document.createElement('p');
    subtitle.textContent = 'Você será redirecionado em breve...';
    subtitle.style.cssText = `
        color: #b8c5d6;
        font-size: 18px;
        margin-bottom: 30px;
    `;
    
    const spinner = document.createElement('div');
    spinner.style.cssText = `
        width: 50px;
        height: 50px;
        border: 4px solid rgba(217, 115, 54, 0.2);
        border-top-color: #d97336;
        border-radius: 50%;
        margin: 0 auto;
        animation: spin 1s linear infinite;
    `;
    
    message.appendChild(title);
    message.appendChild(subtitle);
    message.appendChild(spinner);
    overlay.appendChild(message);
    document.body.appendChild(overlay);
    
    setTimeout(() => {
        logout();
    }, 2000);
}

// ========== SISTEMA DE ALERTAS ==========
function showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.textContent = message;
    
    const colors = {
        success: 'linear-gradient(135deg, #10b981, #059669)',
        error: 'linear-gradient(135deg, #ef4444, #dc2626)',
        info: 'linear-gradient(135deg, #5e5eff, #7c7dfe)'
    };
    
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        animation: slideInRight 0.4s ease;
        max-width: 300px;
    `;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.style.animation = 'slideOutRight 0.4s ease';
        setTimeout(() => alert.remove(), 400);
    }, 3000);
}

// ========== ESTILOS DAS ANIMAÇÕES ==========
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { opacity: 0; transform: translateX(100px); }
        to { opacity: 1; transform: translateX(0); }
    }
    @keyframes slideOutRight {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100px); }
    }
    @keyframes fadeInOverlay {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.8); }
        to { opacity: 1; transform: scale(1); }
    }
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Fechar modais com ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        if (changePasswordModal.classList.contains('active')) {
            closeChangePasswordModal();
        } else if (profileModal.classList.contains('active')) {
            closeProfileModal();
        }
    }
});

console.log('🎬 Script pronto! Menu de perfil configurado.');
console.log('📊 Dados carregados:', userData);






// ========== GERENCIAMENTO DE CURSOS (ADMIN) ==========

let cursos = [];
let editandoCursoId = null;

// Elementos do DOM
const btnManageCourses = document.getElementById('btnManageCourses');
const manageCursosModal = document.getElementById('manageCursosModal');
const manageCursosOverlay = document.getElementById('manageCursosOverlay');
const btnCloseManageCursos = document.getElementById('btnCloseManageCursos');
const btnAddCurso = document.getElementById('btnAddCurso');
const cursosList = document.getElementById('cursosList');
const cursosGrid = document.getElementById('cursosGrid');

const cursoFormModal = document.getElementById('cursoFormModal');
const cursoFormOverlay = document.getElementById('cursoFormOverlay');
const btnCloseCursoForm = document.getElementById('btnCloseCursoForm');
const cursoForm = document.getElementById('cursoForm');
const cursoFormTitle = document.getElementById('cursoFormTitle');

// Carregar cursos do backend
async function carregarCursos() {
    try {
        console.log('[CURSOS] Carregando cursos do backend...');
        
        const response = await fetch('https://movimento120anos.ibr.com.br/api/cursos', {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('[CURSOS] Status:', response.status);

        // Verificar se é JSON válido
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.warn('[CURSOS] Resposta não é JSON. Status:', response.status);
            const text = await response.text();
            console.error('[CURSOS] Texto da resposta:', text.substring(0, 200));
            cursos = [];
        } else if (response.ok) {
            const data = await response.json();
            console.log('[CURSOS] Cursos recebidos:', data);
            cursos = data.cursos || [];
        } else {
            console.warn('[CURSOS] Erro ao carregar (status:', response.status + ')');
            cursos = [];
        }
    } catch (error) {
        console.error('[CURSOS] Erro ao carregar:', error);
        cursos = [];
    }

    renderizarCards();
}

// Renderizar cards na área de membros
function renderizarCards() {
    if (!cursosGrid) return;
    
    cursosGrid.innerHTML = '';

    if (cursos.length === 0) {
        cursosGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                    <path d="M2 17l10 5 10-5"></path>
                    <path d="M2 12l10 5 10-5"></path>
                </svg>
                <h3>Nenhum curso disponível</h3>
                <p>Os cursos aparecerão aqui quando forem adicionados</p>
            </div>
        `;
        return;
    }

    cursos.forEach(curso => {
        // Se o curso não está disponível e o usuário não é admin, não mostrar
        if (!curso.disponivel && !userData.isAdmin) {
            return;
        }

        const card = document.createElement('div');
        card.className = curso.tipo === 'oficial' ? 'card card-active' : 'card card-coming';
        
        card.innerHTML = `
            <div class="card-image ${curso.tipo === 'oficial' ? 'course-demo' : 'novidade'}">
                <div class="card-overlay">
                    <h3 class="card-title">${curso.nome}</h3>
                    <p class="${curso.tipo === 'oficial' ? 'card-subtitle' : 'card-subtitle-novidade'}">
                        ${curso.descricao}
                    </p>
                </div>
            </div>
        `;

        card.addEventListener('click', () => {
            if (userData.status === 'inativo') {
                showAlert('Sua conta está inativa. Você não pode acessar os cursos.', 'error');
                return;
            }

            if (curso.disponivel || userData.isAdmin) {
                if (curso.tipo === 'oficial') {
                    window.location.href = '/cursos/index.html';
                } else {
                    showAlert('Este conteúdo em breve estará disponível!', 'info');
                }
            } else {
                showAlert('Este curso ainda não está disponível.', 'info');
            }
        });

        cursosGrid.appendChild(card);
    });
}

// Abrir modal de gerenciar cursos
function abrirModalGerenciar() {
    if (!manageCursosModal) return;
    manageCursosModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    renderizarListaCursos();
}

// Fechar modal de gerenciar cursos
function fecharModalGerenciar() {
    if (!manageCursosModal) return;
    manageCursosModal.classList.remove('active');
    document.body.style.overflow = '';
}

// Renderizar lista de cursos no modal de gerenciamento
function renderizarListaCursos() {
    if (!cursosList) return;
    
    if (cursos.length === 0) {
        cursosList.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                    <path d="M2 17l10 5 10-5"></path>
                    <path d="M2 12l10 5 10-5"></path>
                </svg>
                <h3>Nenhum curso cadastrado</h3>
                <p>Clique em "Adicionar Novo Curso" para começar</p>
            </div>
        `;
        return;
    }

    cursosList.innerHTML = '';

    cursos.forEach(curso => {
        const item = document.createElement('div');
        item.className = 'curso-item';
        
        item.innerHTML = `
            <div class="curso-item-info">
                <div class="curso-item-nome">${curso.nome}</div>
                <div class="curso-item-descricao">${curso.descricao}</div>
                <div class="curso-item-badges">
                    <span class="badge ${curso.tipo === 'oficial' ? 'badge-oficial' : 'badge-breve'}">
                        ${curso.tipo === 'oficial' ? 'Oficial' : 'Em Breve'}
                    </span>
                    <span class="badge ${curso.disponivel ? 'badge-disponivel' : 'badge-indisponivel'}">
                        ${curso.disponivel ? 'Disponível' : 'Indisponível'}
                    </span>
                </div>
            </div>
            <div class="curso-item-actions">
                <button class="btn-edit-curso" onclick="editarCurso(${curso.id})">Editar</button>
                <button class="btn-delete-curso" onclick="excluirCurso(${curso.id})">Excluir</button>
            </div>
        `;

        cursosList.appendChild(item);
    });
}

// Abrir modal de adicionar/editar curso
function abrirModalCursoForm(editando = false) {
    if (!cursoFormModal) return;
    
    if (!editando) {
        editandoCursoId = null;
        cursoForm.reset();
        cursoFormTitle.textContent = 'Novo Curso';
    } else {
        cursoFormTitle.textContent = 'Editar Curso';
    }
    
    fecharModalGerenciar();
    cursoFormModal.classList.add('active');
}

// Fechar modal de adicionar/editar curso
function fecharModalCursoForm() {
    if (!cursoFormModal) return;
    cursoFormModal.classList.remove('active');
    document.body.style.overflow = '';
    editandoCursoId = null;
    cursoForm.reset();
}

// Editar curso
function editarCurso(id) {
    const curso = cursos.find(c => c.id === id);
    if (!curso) return;

    editandoCursoId = id;
    
    document.getElementById('cursoNome').value = curso.nome;
    document.getElementById('cursoDescricao').value = curso.descricao;
    document.getElementById('cursoTipo').value = curso.tipo;
    document.getElementById('cursoDisponivel').value = curso.disponivel.toString();

    abrirModalCursoForm(true);
}

// Excluir curso
async function excluirCurso(id) {
    if (!confirm('Tem certeza que deseja excluir este curso?')) {
        return;
    }

    try {
        console.log('[CURSOS] Excluindo curso:', id);
        
        const response = await fetch(`https://movimento120anos.ibr.com.br/api/cursos/${id}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Resposta não é JSON. Backend pode não ter o endpoint.');
        }

        const data = await response.json();
        console.log('[CURSOS] Resposta ao excluir:', data);

        if (response.ok && data.success) {
            showAlert('Curso excluído com sucesso!', 'success');
            await carregarCursos();
            renderizarListaCursos();
        } else {
            showAlert('Erro ao excluir curso: ' + (data.message || 'Erro desconhecido'), 'error');
        }
    } catch (error) {
        console.error('[CURSOS] Erro ao excluir:', error);
        showAlert('Erro ao conectar com o servidor: ' + error.message, 'error');
    }
}

// Salvar curso (criar ou editar)
if (cursoForm) {
    cursoForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const nome = document.getElementById('cursoNome').value.trim();
        const descricao = document.getElementById('cursoDescricao').value.trim();
        const tipo = document.getElementById('cursoTipo').value;
        const disponivel = document.getElementById('cursoDisponivel').value === 'true';

        console.log('[CURSOS] Salvando curso:', { nome, descricao, tipo, disponivel, editandoCursoId });

        const btnSubmit = document.querySelector('.btn-submit-curso');
        const originalText = btnSubmit.textContent;
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'SALVANDO...';

        try {
            // Preparar URL e método
            const url = editandoCursoId 
                ? `https://movimento120anos.ibr.com.br/api/cursos/${editandoCursoId}`
                : 'https://movimento120anos.ibr.com.br/api/cursos';
            
            const method = editandoCursoId ? 'PUT' : 'POST';

            console.log(`[CURSOS] ${method} para ${url}`);

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    nome,
                    descricao,
                    tipo,
                    disponivel
                })
            });

            console.log('[CURSOS] Status da resposta:', response.status);
            console.log('[CURSOS] Headers:', response.headers.get('content-type'));

            // Verificar se é JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('[CURSOS] Resposta não é JSON:', text.substring(0, 300));
                
                if (response.status === 401 || response.status === 403) {
                    showAlert('Sessão expirada. Faça login novamente.', 'error');
                    setTimeout(() => window.location.href = '/login/', 2000);
                    return;
                }
                
                throw new Error(`Backend retornou HTML (Status ${response.status}). Verifique se o endpoint /api/cursos existe.`);
            }

            const data = await response.json();
            console.log('[CURSOS] Resposta do servidor:', data);

            if (response.ok && data.success) {
                console.log('[CURSOS] Salvo com sucesso! Recarregando...');
                showAlert('Curso salvo com sucesso!', 'success');
                fecharModalCursoForm();
                await carregarCursos();
                abrirModalGerenciar();
            } else {
                console.error('[CURSOS] Erro:', data.message);
                showAlert('Erro ao salvar: ' + (data.message || 'Erro desconhecido'), 'error');
            }
        } catch (error) {
            console.error('[CURSOS] Erro completo:', error);
            showAlert('Erro: ' + error.message, 'error');
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = originalText;
        }
    });
}

// Event Listeners
if (btnManageCourses) {
    btnManageCourses.addEventListener('click', abrirModalGerenciar);
}

if (btnCloseManageCursos) {
    btnCloseManageCursos.addEventListener('click', fecharModalGerenciar);
}

if (manageCursosOverlay) {
    manageCursosOverlay.addEventListener('click', fecharModalGerenciar);
}

if (btnAddCurso) {
    btnAddCurso.addEventListener('click', () => abrirModalCursoForm(false));
}

if (btnCloseCursoForm) {
    btnCloseCursoForm.addEventListener('click', fecharModalCursoForm);
}

if (cursoFormOverlay) {
    cursoFormOverlay.addEventListener('click', fecharModalCursoForm);
}

// Carregar cursos ao iniciar
carregarCursos();

console.log('🎓 Sistema de gerenciamento de cursos carregado!');