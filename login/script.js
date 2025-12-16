const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

// Toggle senha
document.getElementById('togglePassword').addEventListener('click', e => {
    e.preventDefault();
    passwordInput.type =
        passwordInput.type === 'password' ? 'text' : 'password';
});

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

function performLogin(email, password) {
    const btn = document.querySelector('.btn-login');
    const original = btn.textContent;

    btn.disabled = true;
    btn.textContent = 'CARREGANDO...';

    fetch('http://localhost:3000/login', {
        method: 'POST',
         credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(res => {
        if (!res.ok) throw new Error('Erro HTTP');
        return res.json();
    })
    .then(data => {
        if (data.require2FA) {
            localStorage.setItem('2fa_email', data.email);
            window.location.href = '../2fa/index.html';
            return;
        }

        if (data.success) {
            showSuccess('Login realizado com sucesso!');
            setTimeout(() => showWelcomeMessage(email), 1200);
        } else {
            showError(data.message || 'Credenciais inválidas');
        }
    })
    .catch(() => {
        showError('Erro ao realizar login');
    })
    .finally(() => {
        btn.disabled = false;
        btn.textContent = original;
    });
}

// Helpers UI
function showError(msg) {
    alert(msg);
}

function showSuccess(msg) {
    alert(msg);
}

function showWelcomeMessage(email) {
    window.location.href = '/membros/index.html';
}

