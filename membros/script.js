console.log('✅ Área de Membros carregada!');

// ========== ELEMENTOS DO DOM ==========
const btnProfile = document.getElementById('btnProfile');
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
    email: 'email@exemplo.com'
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
        
        if (storedName) {
            userData.name = storedName;
            console.log('✅ Nome do localStorage:', storedName);
        }
        
        if (storedEmail) {
            userData.email = storedEmail;
            console.log('✅ Email do localStorage:', storedEmail);
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
            
            // Atualizar novamente com dados do backend
            document.querySelector('.hero-title').textContent = `Bem-vindo, ${userData.name}!`;
            
        } else {
            console.warn('⚠️ Backend não retornou dados, usando localStorage');
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados do backend:', error);
        console.log('ℹ️ Usando dados do localStorage');
    }
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
        if (card.classList.contains('card-active')) {
            window.location.href = '/cursos/index.html';
        } else if (card.classList.contains('card-coming')) {
            showAlert('Este conteúdo em breve estará disponível!', 'info');
        }
    });
});

// ========== BOTÃO SAIR ==========
btnExit.addEventListener('click', showExitMessage);

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
    
    // Limpar localStorage
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    
    // Fazer logout no backend
    fetch('https://movimento120anos.ibr.com.br/api/logout', {
        method: 'POST',
        credentials: 'include'
    }).catch(err => console.error('Erro ao fazer logout:', err));
    
    setTimeout(() => {
        window.location.href = '/login/index.html';
        window.localStorage.removeItem('isLogged');
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