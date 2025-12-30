const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

const isLogged = window.localStorage.getItem("isLogged");
console.log('✅ Script carregado', isLogged);
if(isLogged){
    afterLogin();
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

async function afterLogin(){
    window.location.replace('/membros/');
}

async function performLogin(email, password) {
    const btn = document.querySelector('.btn-login');
    const original = btn.textContent;

    btn.disabled = true;
    btn.textContent = 'CARREGANDO...';

    console.log('🚀 Fazendo login para:', email);
    console.log('📡 URL:', 'https://movimento120anos.ibr.com.br/api/login');

    const response = await fetch('https://movimento120anos.ibr.com.br/api/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    });
        console.log('📥 Status da resposta:', response.status);
        console.log('📥 Response OK?', response.ok);
      const data =  await response.json();
        console.log('📦 DADOS RECEBIDOS:');
        console.log(JSON.stringify(data, null, 2));
        console.log('🔍 require2FA =', data.require2FA);
        console.log('🔍 success =', data.success);
        
        // VERIFICAÇÃO 1: Precisa de 2FA?
        if (data.require2FA === true) {
            console.log('✅ 2FA DETECTADO! Redirecionando...');
            
            // Salvar email e nome no localStorage
            localStorage.setItem('2fa_email', data.email || email);
            if (data.name) {
                localStorage.setItem('userName', data.name);
            }
            console.log('💾 Email salvo:', localStorage.getItem('2fa_email'));
            
            btn.textContent = 'CÓDIGO ENVIADO!';
            btn.style.background = '#10b981';
            
            // Redirecionar
            console.log('🔄 Redirecionando em 1 segundo...');
            setTimeout(() => {
                console.log('🎯 Redirecionando para: /2fa/index.html');
                window.location.href = '/2fa/index.html';
            }, 1000);
            
            // return;
        }
        
        // VERIFICAÇÃO 2: Login direto?
        if (data.success === true) {
            console.log('✅ Login direto bem-sucedido!');

            localStorage.setItem('isLogged', 'true');
localStorage.setItem('userName', data.name);
localStorage.setItem('userEmail', data.email || email);

            
            // 💾 SALVAR DADOS NO LOCALSTORAGE
            if (data.name) {
                localStorage.setItem('userName', data.name);
                console.log('💾 Nome salvo:', data.name);
            }
            
            if (data.email) {
                localStorage.setItem('userEmail', data.email);
                console.log('💾 Email salvo:', data.email);
            } else {
                localStorage.setItem('userEmail', email);
                console.log('💾 Email salvo (do input):', email);
            }
            
            btn.textContent = 'SUCESSO!';
            btn.style.background = '#10b981';
            
            // setTimeout(() => {
                window.location.replace = '/membros/';
            // }, 500);
            
            // return;
        }
        
        // VERIFICAÇÃO 3: Erro
        console.log('❌ Erro de login:', data.message);
        // alert(data.message || 'Email ou senha incorretos');
        btn.disabled = false;
        btn.textContent = original;
        btn.style.background = '';
    // })
    // .catch(error => {
    //     console.error('💥 ERRO NA REQUISIÇÃO:', error);
    //     console.error('Tipo do erro:', error.name);
    //     console.error('Mensagem:', error.message);
        
    //     alert('Erro ao conectar com o servidor. Verifique:\n1. Backend está rodando? (node backend/back.js)\n2. Backend está na porta 3000?\n3. CORS está configurado?');
        
    //     btn.disabled = false;
    //     btn.textContent = original;
    //     btn.style.background = '';
    // });
}