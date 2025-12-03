// Toggle de visualização de senha
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

togglePassword.addEventListener('click', function(e) {
    e.preventDefault();
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
});

// Validação do formulário
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');

loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    // Validação básica
    if (!email || !password) {
        showError('Por favor, preencha todos os campos!');
        return;
    }
    
    if (!isValidEmail(email)) {
        showError('Por favor, insira um e-mail válido!');
        emailInput.focus();
        return;
    }
    
    if (password.length < 6) {
        showError('A senha deve ter pelo menos 6 caracteres!');
        passwordInput.focus();
        return;
    }
 
function performLogin(email, password) {
    const btnLogin = document.querySelector('.btn-login');
    const originalText = btnLogin.textContent;

    btnLogin.disabled = true;
    btnLogin.textContent = 'CARREGANDO...';
    btnLogin.style.opacity = '0.7';

    fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showSuccess('Login realizado com sucesso!');

            setTimeout(() => {
                showWelcomeMessage(email);
            }, 1200);
        } else {
            showError(data.message);
        }
    })
    .finally(() => {
        btnLogin.disabled = false;
        btnLogin.textContent = originalText;
        btnLogin.style.opacity = '1';
    });
}

// Função de validação de e-mail
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Função para exibir mensagem de boas-vindas
function showWelcomeMessage(email) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        animation: fadeInOverlay 0.3s ease;
    `;
    
    const message = document.createElement('div');
    message.style.cssText = `
        text-align: center;
        animation: scaleIn 0.5s ease;
    `;
    
    const title = document.createElement('h2');
    title.textContent = 'Seja bem-vindo!';
    title.style.cssText = `
        color: #d97336;
        font-size: 48px;
        font-weight: 700;
        margin-bottom: 15px;
        letter-spacing: 1px;
    `;
    
    const userName = document.createElement('p');
    const name = email.split('@')[0];
    userName.textContent = name.charAt(0).toUpperCase() + name.slice(1);
    userName.style.cssText = `
        color: #b8c5d6;
        font-size: 24px;
        margin-bottom: 20px;
    `;
    
    const subtitle = document.createElement('p');
    subtitle.textContent = 'Você será redirecionado em breve...';
    subtitle.style.cssText = `
        color: #94a3b8;
        font-size: 16px;
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
    message.appendChild(userName);
    message.appendChild(subtitle);
    message.appendChild(spinner);
    
    overlay.appendChild(message);
    document.body.appendChild(overlay);
    
    // Redirecionar após 2.5 segundos
    setTimeout(() => {
          window.location.href = '/membros/index.html';
    }, 1500);
}

// Função para exibir erros
function showError(message) {
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alert = document.createElement('div');
    alert.className = 'alert';
    alert.textContent = message;
    alert.style.cssText = `
        background: #ef4444;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 20px;
        font-size: 14px;
        animation: slideDown 0.3s ease;
    `;
    
    loginForm.insertBefore(alert, loginForm.firstChild);
    
    // Adiciona animação shake
    loginForm.classList.add('shake');
    setTimeout(() => loginForm.classList.remove('shake'), 500);
    
    // Remove o alerta após 4 segundos
    setTimeout(() => {
        alert.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, 4000);
}

// Função de sucesso
function showSuccess(message) {
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alert = document.createElement('div');
    alert.className = 'alert';
    alert.textContent = message;
    alert.style.cssText = `
        background: #10b981;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 20px;
        font-size: 14px;
        animation: slideDown 0.3s ease;
    `;
    
    loginForm.insertBefore(alert, loginForm.firstChild);
}

// Simula o processo de login
function performLogin(email, password) {
    const btnLogin = document.querySelector('.btn-login');
    const originalText = btnLogin.textContent;
    
    // Desabilita o botão e mostra loading
    btnLogin.disabled = true;
    btnLogin.textContent = 'CARREGANDO...';
    btnLogin.style.opacity = '0.7';
    
    // Simula requisição ao servidor
    setTimeout(() => {
        // Verifica credenciais
        if (email === 'admin@gmail.com' && password === '123456') {
            showSuccess('Login realizado com sucesso!');
            btnLogin.disabled = false;
            btnLogin.textContent = originalText;
            btnLogin.style.opacity = '1';
            
            // Exibe mensagem de boas-vindas e redireciona
            setTimeout(() => {
                showWelcomeMessage(email);
            }, 1500);
        } else {
            showError('E-mail ou senha incorretos!');
            btnLogin.disabled = false;
            btnLogin.textContent = originalText;
            btnLogin.style.opacity = '1';
        }
    }, 2000);
}

// Adiciona animações CSS via JavaScript
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(-20px);
        }
    }

    @keyframes fadeInOverlay {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @keyframes scaleIn {
        from {
            opacity: 0;
            transform: scale(0.8);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
`;
document.head.appendChild(style);

// Melhora a experiência do usuário com feedback visual nos inputs
[emailInput, passwordInput].forEach(input => {
    input.addEventListener('input', function() {
        this.style.transform = 'scale(1.01)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 150);
    });
});
});
