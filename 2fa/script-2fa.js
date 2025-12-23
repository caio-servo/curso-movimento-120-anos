const inputs = document.querySelectorAll('.code-input');
const verifyBtn = document.getElementById('verifyBtn');
const resendLink = document.getElementById('resendLink');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const form = document.getElementById('verificationForm');

let resendTimer = null;
let resendCountdown = 60;

// Auto-focus e navegação entre inputs
inputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
        const value = e.target.value;
        
        // Aceita apenas números
        if (!/^\d*$/.test(value)) {
            e.target.value = '';
            return;
        }

        // Move para o próximo input
        if (value && index < inputs.length - 1) {
            inputs[index + 1].focus();
        }

        // Verifica se todos os campos estão preenchidos
        checkAllFilled();
    });

    input.addEventListener('keydown', (e) => {
        // Backspace: volta para o input anterior
        if (e.key === 'Backspace' && !input.value && index > 0) {
            inputs[index - 1].focus();
        }

        // Setas de navegação
        if (e.key === 'ArrowLeft' && index > 0) {
            inputs[index - 1].focus();
        }
        if (e.key === 'ArrowRight' && index < inputs.length - 1) {
            inputs[index + 1].focus();
        }
    });

    input.addEventListener('paste', (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();
        
        // Aceita apenas 6 dígitos
        if (/^\d{6}$/.test(pastedData)) {
            pastedData.split('').forEach((char, i) => {
                if (inputs[i]) {
                    inputs[i].value = char;
                }
            });
            inputs[5].focus();
            checkAllFilled();
        }
    });
});

// Foca no primeiro input ao carregar
inputs[0].focus();

function checkAllFilled() {
    const allFilled = Array.from(inputs).every(input => input.value !== '');
    verifyBtn.disabled = !allFilled;
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    successMessage.classList.remove('show');
    
    setTimeout(() => {
        errorMessage.classList.remove('show');
    }, 5000);
}

function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.classList.add('show');
    errorMessage.classList.remove('show');
}

function clearInputs() {
    inputs.forEach(input => input.value = '');
    inputs[0].focus();
}

function startResendTimer() {
    resendCountdown = 60;
    resendLink.classList.add('disabled');
    
    resendTimer = setInterval(() => {
        resendCountdown--;
        resendLink.innerHTML = `Reenviar em <span class="timer">${resendCountdown}s</span>`;
        
        if (resendCountdown <= 0) {
            clearInterval(resendTimer);
            resendLink.classList.remove('disabled');
            resendLink.textContent = 'Reenviar código';
        }
    }, 1000);
}

// Submissão do formulário
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const code = Array.from(inputs).map(input => input.value).join('');
    
    verifyBtn.disabled = true;
    verifyBtn.textContent = 'VERIFICANDO...';
    
    try {
        // Aqui você faria a chamada para o backend
        const response = await fetch('http://localhost:3000/verify-2fa', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                code,
                email: localStorage.getItem('2fa_email') // Email salvo do login
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Código verificado com sucesso!');
            setTimeout(() => {
                // Redireciona para a página principal
                window.location.href = '../membros/index.html';
            }, 1500);
        } else {
            showError(data.message || 'Código inválido. Tente novamente.');
            clearInputs();
        }
    } catch (error) {
        console.error('Erro na verificação:', error);
        showError('Erro ao verificar código. Tente novamente.');
        clearInputs();
    } finally {
        verifyBtn.disabled = false;
        verifyBtn.textContent = 'VERIFICAR CÓDIGO';
        checkAllFilled();
    }
});

// Reenvio de código
resendLink.addEventListener('click', async (e) => {
    e.preventDefault();
    
    if (resendLink.classList.contains('disabled')) {
        return;
    }
    
    try {
         const response = await fetch('http://localhost:3000/resend-2fa', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                email: localStorage.getItem('2fa_email')
            })
        });
       
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Código reenviado com sucesso!');
            startResendTimer();
        } else {
            showError(data.message || 'Erro ao reenviar código.');
        }
    } catch (error) {
        console.error('Erro ao reenviar:', error);
        showError('Erro ao reenviar código. Tente novamente.');
    }
});

// Inicia o timer ao carregar a página
startResendTimer();
