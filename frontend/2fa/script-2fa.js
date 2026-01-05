// Script para a página 2FA (/2fa/script-2fa.js)

console.log('✅ Script 2FA carregado\n');

// 🔍 VERIFICAR o que tem no localStorage
console.log('🔍 ========== VERIFICANDO LOCALSTORAGE ==========');
console.log('2fa_email:', localStorage.getItem('2fa_email'));
console.log('2fa_pending:', localStorage.getItem('2fa_pending'));
console.log('2fa_name:', localStorage.getItem('2fa_name'));
console.log('isLogged:', localStorage.getItem('isLogged'));
console.log('================================================\n');

// 🛡️ VERIFICAÇÃO: Usuário tem permissão para estar aqui?
const email2FA = localStorage.getItem('2fa_email');
const pending2FA = localStorage.getItem('2fa_pending');

if (!email2FA || pending2FA !== 'true') {
    console.log('❌ ACESSO NEGADO!');
    console.log('   - email2FA existe?', !!email2FA);
    console.log('   - pending2FA = "true"?', pending2FA === 'true');
    console.log('   - Valor de pending2FA:', pending2FA);
    console.log('\n⚠️ Redirecionando para login...\n');
    
    alert('Acesso negado. Faça login primeiro.');
    window.location.href = '/login/index.html';
    throw new Error('Acesso negado'); // Para o script aqui
}

console.log('✅ Acesso permitido!');
console.log('   - Email:', email2FA);
console.log('   - Pending:', pending2FA);
console.log('\n');

// Selecionar elementos
const form = document.getElementById('verificationForm');
const inputs = document.querySelectorAll('.code-input');
const verifyBtn = document.getElementById('verifyBtn');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const resendLink = document.getElementById('resendLink');

// Função para mostrar erro
function showError(msg) {
    if (errorMessage) {
        errorMessage.textContent = msg;
        errorMessage.style.display = 'block';
    }
    if (successMessage) {
        successMessage.style.display = 'none';
    }
}

// Função para mostrar sucesso
function showSuccess(msg) {
    if (successMessage) {
        successMessage.textContent = msg;
        successMessage.style.display = 'block';
    }
    if (errorMessage) {
        errorMessage.style.display = 'none';
    }
}

// Auto-focus no próximo input
inputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
        if (e.target.value.length === 1 && index < inputs.length - 1) {
            inputs[index + 1].focus();
        }
    });
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
            inputs[index - 1].focus();
        }
    });
});

// Auto-focus no primeiro input
if (inputs[0]) {
    inputs[0].focus();
}

// Função para pegar o código completo
function getCode() {
    return Array.from(inputs).map(input => input.value).join('');
}

// Função para limpar inputs
function clearInputs() {
    inputs.forEach(input => input.value = '');
    if (inputs[0]) {
        inputs[0].focus();
    }
}

// SUBMIT do formulário
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const code = getCode();
        
        if (code.length !== 6) {
            showError('Digite o código completo de 6 dígitos');
            return;
        }
        
        console.log('🔐 ========== VERIFICANDO CÓDIGO 2FA ==========');
        console.log('📧 Email:', email2FA);
        console.log('🔢 Código:', code);
        console.log('📡 Enviando para: /api/verify-2fa');
        
        const originalText = verifyBtn.textContent;
        verifyBtn.disabled = true;
        verifyBtn.textContent = 'VERIFICANDO...';
        
        try {
            const response = await fetch('https://movimento120anos.ibr.com.br/api/verify-2fa', {
                method: 'POST',
                credentials: 'include',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    email: email2FA,
                    code: code 
                })
            });
            
            console.log('📡 Status HTTP:', response.status);
            const data = await response.json();
            
            console.log('📦 ========== RESPOSTA DA API ==========');
            console.log(JSON.stringify(data, null, 2));
            console.log('🔍 success:', data.success);
            console.log('========================================\n');
            
            // ✅ SUCESSO: Código válido!
            if (data.success === true) {
                console.log('✅✅✅ CÓDIGO VÁLIDO!\n');
                
                showSuccess('✓ Código validado! Redirecionando...');
                verifyBtn.textContent = 'SUCESSO! ✓';
                verifyBtn.style.background = '#10b981';
                
                // 🧹 LIMPAR flags de 2FA
                console.log('🧹 Limpando flags de 2FA...');
                localStorage.removeItem('2fa_pending');
                localStorage.removeItem('2fa_email');
                
                // 💾 SALVAR sessão definitiva
                console.log('💾 Salvando sessão definitiva...');
                localStorage.setItem('isLogged', 'true');
                localStorage.setItem('userEmail', email2FA);
                
                // Salvar nome
                const userName = data.name || localStorage.getItem('2fa_name') || '';
                if (userName) {
                    localStorage.setItem('userName', userName);
                    localStorage.removeItem('2fa_name');
                }
                
                // Salvar isAdmin
                if (data.isAdmin !== undefined) {
                    localStorage.setItem('isAdmin', data.isAdmin);
                }
                
                console.log('💾 Sessão salva:');
                console.log('   - isLogged: true');
                console.log('   - userEmail:', email2FA);
                console.log('   - userName:', userName);
                console.log('   - isAdmin:', data.isAdmin);
                
                // 🚀 REDIRECIONAR
                console.log('\n⏳ Aguardando 1.5 segundos...');
                console.log('🎯 Destino: /membros/index.html\n');
                
                setTimeout(() => {
                    console.log('🔄 REDIRECIONANDO AGORA...\n');
                    window.location.href = '/membros/index.html';
                }, 1500);
                
            } else {
                // ❌ Código inválido
                console.log('❌ Código inválido:', data.message);
                showError(data.message || '❌ Código inválido. Tente novamente.');
                clearInputs();
                verifyBtn.disabled = false;
                verifyBtn.textContent = originalText;
            }
            
        } catch (error) {
            console.error('🔴 ERRO ao verificar 2FA:', error);
            showError('Erro ao verificar código. Tente novamente.');
            verifyBtn.disabled = false;
            verifyBtn.textContent = originalText;
        }
    });
}

// REENVIAR CÓDIGO
if (resendLink) {
    resendLink.addEventListener('click', async (e) => {
        e.preventDefault();
        
        console.log('📧 Reenviando código para:', email2FA);
        
        const originalText = resendLink.textContent;
        resendLink.textContent = 'Enviando...';
        resendLink.style.pointerEvents = 'none';
        
        try {
            const response = await fetch('https://movimento120anos.ibr.com.br/api/resend-2fa', {
                method: 'POST',
                credentials: 'include',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email2FA })
            });
            
            const data = await response.json();
            
            if (data.success) {
                console.log('✅ Código reenviado');
                showSuccess('✓ Novo código enviado para seu e-mail!');
                clearInputs();
            } else {
                console.log('❌ Erro ao reenviar:', data.message);
                showError(data.message || 'Erro ao reenviar código');
            }
            
        } catch (error) {
            console.error('🔴 ERRO ao reenviar:', error);
            showError('Erro ao reenviar código. Tente novamente.');
        } finally {
            setTimeout(() => {
                resendLink.textContent = originalText;
                resendLink.style.pointerEvents = 'auto';
            }, 3000);
        }
    });
}