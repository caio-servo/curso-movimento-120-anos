const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

const isLogged = window.localStorage.getItem("isLogged");
console.log('✅ Script carregado. isLogged =', isLogged);

// Se já está logado, redireciona
if(isLogged === 'true'){
    console.log('✅ Usuário já logado, redirecionando...');
    window.location.href = '/membros/index.html';
}

// Toggle senha
const toggleBtn = document.getElementById('togglePassword');
if (toggleBtn) {
    toggleBtn.addEventListener('click', e => {
        e.preventDefault();
        passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
    });
}

loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    console.log('📝 Formulário enviado');

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        alert('Preencha todos os campos');
        return;
    }

    await performLogin(email, password);
});

async function performLogin(email, password) {
    const btn = document.querySelector('.btn-login');
    const original = btn.textContent;

    btn.disabled = true;
    btn.textContent = 'CARREGANDO...';

    console.log('🚀 Fazendo login para:', email);
    console.log('📡 URL:', 'https://movimento120anos.ibr.com.br/api/login');

    try {
        const response = await fetch('https://movimento120anos.ibr.com.br/api/login', {
            method: 'POST',
            credentials: 'include',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        console.log('📥 Status da resposta:', response.status);
        const data = await response.json();
        
        console.log('📦 ========== DADOS RECEBIDOS ==========');
        console.log(JSON.stringify(data, null, 2));
        console.log('🔍 require2FA:', data.require2FA);
        console.log('🔍 success:', data.success);
        console.log('📦 =====================================\n');
        
        // ✅ VERIFICAÇÃO 1: Precisa de 2FA?
        if (data.require2FA === true) {
            console.log('✅✅✅ 2FA DETECTADO!\n');
            
            // 🧹 LIMPAR tudo antes
            console.log('🧹 Limpando localStorage...');
            localStorage.clear();
            
            // 💾 Salvar APENAS os dados necessários para 2FA
            console.log('💾 Salvando dados para 2FA...');
            localStorage.setItem('2fa_email', data.email || email);
            localStorage.setItem('2fa_pending', 'true');
            
            if (data.name) {
                localStorage.setItem('2fa_name', data.name);
            }
            
            console.log('💾 Dados salvos:');
            console.log('   - 2fa_email:', localStorage.getItem('2fa_email'));
            console.log('   - 2fa_pending:', localStorage.getItem('2fa_pending'));
            console.log('   - 2fa_name:', localStorage.getItem('2fa_name'));
            
            btn.textContent = 'CÓDIGO ENVIADO! ✓';
            btn.style.background = '#10b981';
            
            console.log('⏳ Aguardando 1 segundo...');
            console.log('🎯 Destino: /2fa/index.html\n');
            
            setTimeout(() => {
                console.log('🔄 REDIRECIONANDO PARA 2FA...\n');
                window.location.href = '/2fa/index.html';
            }, 1000);
            
            return;
        }
        
        // ✅ VERIFICAÇÃO 2: Login direto bem-sucedido?
        if (data.success === true) {
            console.log('✅✅✅ LOGIN DIRETO BEM-SUCEDIDO!\n');
            
            // 🧹 LIMPAR tudo antes
            console.log('🧹 Limpando localStorage...');
            localStorage.clear();
            
            // 💾 SALVAR sessão definitiva
            console.log('💾 Salvando sessão...');
            localStorage.setItem('isLogged', 'true');
            localStorage.setItem('userName', data.name || '');
            localStorage.setItem('userEmail', data.email || email);
            
            if (data.isAdmin !== undefined) {
                localStorage.setItem('isAdmin', data.isAdmin);
            }
            
            console.log('💾 Dados salvos:');
            console.log('   - isLogged: true');
            console.log('   - userName:', data.name);
            console.log('   - userEmail:', data.email || email);
            console.log('   - isAdmin:', data.isAdmin);
            
            btn.textContent = 'SUCESSO! ✓';
            btn.style.background = '#10b981';
            
            console.log('⏳ Aguardando 500ms...');
            console.log('🎯 Destino: /membros/index.html\n');
            
            setTimeout(() => {
                console.log('🔄 REDIRECIONANDO PARA MEMBROS...\n');
                window.location.href = '/membros/index.html';
            }, 500);
            
            return;
        }
        
        // ❌ VERIFICAÇÃO 3: Erro no login
        console.log('❌ Erro de login:', data.message);
        alert(data.message || 'Email ou senha incorretos');
        btn.disabled = false;
        btn.textContent = original;
        btn.style.background = '';
        
    } catch (error) {
        console.error('💥 ERRO NA REQUISIÇÃO:', error);
        alert('Erro ao conectar com o servidor.');
        btn.disabled = false;
        btn.textContent = original;
        btn.style.background = '';
    }
}