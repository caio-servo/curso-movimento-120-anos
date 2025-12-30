// Seleciona elementos uma única vez
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const toggleBtn = document.getElementById('togglePassword');

// Função para mostrar erros
function showError(msg) {
    alert(msg);
}

// Função de login
function performLogin(email, password) {
    const btn = document.querySelector('.btn-login');
    const original = btn.textContent;

    btn.disabled = true;
    btn.textContent = 'CARREGANDO...';

    fetch('https://movimento120anos.ibr.com.br/api/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(data => {
        console.log('Resposta login:', data);

        if (data.require2FA) {
            // Vai para tela de 2FA e PARA por aqui
            console.log('Requer 2FA, redirecionando...');
            localStorage.setItem('2fa_email', data.email);
            window.location.href = '../2fa/index.html';
            return; // IMPORTANTE: retorna aqui para não continuar
        }

        if (data.success) {
            // Login bem-sucedido, vai para membros
            console.log('Login sucesso, redirecionando para membros...');
            btn.textContent = 'REDIRECIONANDO...';
            window.location.href = '../membros/index.html';
        } else {
            // Erro no login
            showError(data.message || 'Credenciais inválidas');
            btn.disabled = false;
            btn.textContent = original;
        }
    })
    .catch(err => {
        console.error('Erro:', err);
        showError('Erro ao realizar login');
        btn.disabled = false;
        btn.textContent = original;
    });
}

// Event listeners (adicionar apenas uma vez)
if (loginForm) {
    loginForm.addEventListener('submit', e => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            showError('Preencha todos os campos');
            return;
        }

        performLogin(email, password);
    });
}

// Toggle visibilidade da senha
if (toggleBtn) {
    toggleBtn.addEventListener('click', e => {
        e.preventDefault();
        passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
    });
}