// Toggle de visualização de senha
const togglePassword = document.getElementById('togglePassword');
const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');

togglePassword.addEventListener('click', function(e) {
    e.preventDefault();
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
});

toggleConfirmPassword.addEventListener('click', function(e) {
    e.preventDefault();
    const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    confirmPasswordInput.setAttribute('type', type);
});

// Validação do formulário
const registerForm = document.getElementById('registerForm');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const termsCheckbox = document.getElementById('terms');

registerForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();
    const termsAccepted = termsCheckbox.checked;
    
    // Validação básica
    if (!name || !email || !password || !confirmPassword) {
        showError('Por favor, preencha todos os campos!');
        return;
    }
    
    if (name.length < 3) {
        showError('O nome deve ter pelo menos 3 caracteres!');
        nameInput.focus();
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
    
    if (password !== confirmPassword) {
        showError('As senhas não coincidem!');
        confirmPasswordInput.focus();
        return;
    }
    
    if (!termsAccepted) {
        showError('Você precisa aceitar os termos de uso!');
        return;
    }
    
 function performRegister(name, email, password) {
    const btnRegister = document.querySelector('.btn-register');
    const originalText = btnRegister.textContent;

    btnRegister.disabled = true;
    btnRegister.textContent = 'CRIANDO CONTA...';
    btnRegister.style.opacity = '0.7';

    fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showSuccess('Conta criada com sucesso!');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            showError(data.message);
        }
    })
    .finally(() => {
        btnRegister.disabled = false;
        btnRegister.textContent = originalText;
        btnRegister.style.opacity = '1';
    });
}  

// Função de validação de e-mail
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
    
    registerForm.insertBefore(alert, registerForm.firstChild);
    
    registerForm.classList.add('shake');
    setTimeout(() => registerForm.classList.remove('shake'), 500);
    
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
    
    registerForm.insertBefore(alert, registerForm.firstChild);
}

// Simula o processo de cadastro
function performRegister(name, email, password) {
    const btnRegister = document.querySelector('.btn-register');
    const originalText = btnRegister.textContent;
    
    btnRegister.disabled = true;
    btnRegister.textContent = 'CRIANDO CONTA...';
    btnRegister.style.opacity = '0.7';
    
    setTimeout(() => {
        // Aqui você faria a requisição real para seu backend
        // Exemplo com fetch:
        /*
        fetch('https://seu-backend.com/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showSuccess('Conta criada com sucesso!');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                showError(data.message || 'Erro ao criar conta!');
            }
        })
        .catch(error => {
            showError('Erro ao criar conta. Tente novamente.');
            console.error('Erro:', error);
        })
        .finally(() => {
            btnRegister.disabled = false;
            btnRegister.textContent = originalText;
            btnRegister.style.opacity = '1';
        });
        */
        
        showSuccess('Conta criada com sucesso!');
        btnRegister.disabled = false;
        btnRegister.textContent = originalText;
        btnRegister.style.opacity = '1';
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        
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
`;
document.head.appendChild(style);

// Validação em tempo real das senhas
confirmPasswordInput.addEventListener('input', function() {
    if (passwordInput.value && confirmPasswordInput.value) {
        if (passwordInput.value === confirmPasswordInput.value) {
            confirmPasswordInput.style.borderColor = '#10b981';
        } else {
            confirmPasswordInput.style.borderColor = '#ef4444';
        }
    }
});

confirmPasswordInput.addEventListener('blur', function() {
    confirmPasswordInput.style.borderColor = 'transparent';
});
