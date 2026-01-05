// Seleciona elementos uma única vez
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const toggleBtn = document.getElementById('togglePassword');

console.log('✅ Script de login carregado');

// Função para mostrar erros
function showError(msg) {
    console.error('❌ ERRO:', msg);
    alert(msg);
}

// Função de login
function performLogin(email, password) {
    const btn = document.querySelector('.btn-login');
    if (!btn) {
        console.error('❌ Botão de login não encontrado!');
        return;
    }

    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'CARREGANDO...';

    console.log('🚀 Iniciando login para:', email);
    console.log('📡 Enviando para: https://movimento120anos.ibr.com.br/api/login');

    fetch('https://movimento120anos.ibr.com.br/api/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })
    .then(res => {
        console.log('📡 Status HTTP:', res.status);
        return res.json();
    })
    .then(data => {
        console.log('📦 ========== DADOS RECEBIDOS ==========');
        console.log(JSON.stringify(data, null, 2));
        console.log('🔍 require2FA:', data.require2FA);
        console.log('🔍 success:', data.success);
        console.log('🔍 email:', data.email);
        console.log('🔍 name:', data.name);
        console.log('📦 =====================================\n');

        // ✅ VERIFICAÇÃO 1: Precisa de 2FA?
        if (data.require2FA === true) {
            console.log('✅✅✅ 2FA DETECTADO! Iniciando redirecionamento...\n');
            
            // Salvar dados
            localStorage.setItem('2fa_email', data.email || email);
            localStorage.setItem('2fa_pending', 'true');
            
            if (data.name) {
                localStorage.setItem('userName', data.name);
            }
            
            console.log('💾 Email 2FA salvo:', localStorage.getItem('2fa_email'));
            console.log('💾 Flag 2fa_pending salvo:', localStorage.getItem('2fa_pending'));
            
            btn.textContent = 'CÓDIGO ENVIADO! ✓';
            btn.style.background = '#10b981';
            
            // Log de redirecionamento
            console.log('⏳ Aguardando 1 segundo antes de redirecionar...');
            console.log('🎯 Destino: /2fa/index.html\n');
            
            setTimeout(() => {
                console.log('🔄 REDIRECIONANDO AGORA PARA 2FA...\n');
                window.location.href = '/2fa/index.html';
            }, 1000);
            
            return; // ⚠️ Sai daqui
        }

        // ✅ VERIFICAÇÃO 2: Login direto bem-sucedido?
        if (data.success === true) {
            console.log('✅✅✅ LOGIN DIRETO BEM-SUCEDIDO! Salvando dados...\n');
            
            localStorage.removeItem('2fa_pending');
            localStorage.setItem('isLogged', 'true');
            localStorage.setItem('userName', data.name || '');
            localStorage.setItem('userEmail', data.email || email);
            
            if (data.isAdmin !== undefined) {
                localStorage.setItem('isAdmin', data.isAdmin);
            }
            
            console.log('💾 Nome:', data.name);
            console.log('💾 Email:', data.email || email);
            console.log('💾 isAdmin:', data.isAdmin);
            
            btn.textContent = 'REDIRECIONANDO... ✓';
            btn.style.background = '#10b981';
            
            console.log('⏳ Aguardando 500ms antes de redirecionar...');
            console.log('🎯 Destino: /membros/index.html\n');
            
            setTimeout(() => {
                console.log('🔄 REDIRECIONANDO AGORA PARA MEMBROS...\n');
                window.location.href = '/membros/index.html';
            }, 500);
            
            return; // ⚠️ Sai daqui
        }

        // ❌ VERIFICAÇÃO 3: Erro
        console.log('❌ Login falhou:', data.message);
        showError(data.message || 'Email ou senha incorretos');
        btn.disabled = false;
        btn.textContent = original;
        btn.style.background = '';
    })
    .catch(err => {
        console.error('🔴 ERRO NA REQUISIÇÃO:', err);
        showError('Erro ao conectar com o servidor: ' + err.message);
        btn.disabled = false;
        btn.textContent = original;
        btn.style.background = '';
    });
}

// Event listener do formulário
if (loginForm) {
    console.log('📝 Formulário de login encontrado, adicionando listener');
    
    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        console.log('📝 Formulário enviado');

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        console.log('📧 Email:', email);
        console.log('🔒 Senha: [' + password.length + ' caracteres]');

        if (!email || !password) {
            showError('Preencha todos os campos');
            return;
        }

        performLogin(email, password);
    });
} else {
    console.error('❌ Formulário de login NÃO encontrado!');
}

// Toggle visibilidade da senha
if (toggleBtn) {
    toggleBtn.addEventListener('click', e => {
        e.preventDefault();
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        console.log('👁️ Senha visível:', type === 'text');
    });
}