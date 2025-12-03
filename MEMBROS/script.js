// Botão sair
const btnExit = document.querySelector('.btn-exit');
btnExit.addEventListener('click', showExitMessage);

// Cards - clique para abrir curso
const cards = document.querySelectorAll('.card');
cards.forEach((card, index) => {
    card.addEventListener('click', function() {
        if (card.classList.contains('card-active')) {
            window.location.href = '/CURSOS/index.html';
        } else if (card.classList.contains('card-coming')) {
            showAlert('Este conteúdo em breve estará disponível!');
        }
    });
});

// Mensagem de saída
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
    
    localStorage.removeItem('userName');
    
    setTimeout(() => {
        window.location.href = '/LOGIN/index.html';
    }, 2000);
}

// Alerta
function showAlert(message) {
    const alert = document.createElement('div');
    alert.textContent = message;
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #5e5eff, #7c7dfe);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(94, 94, 255, 0.3);
        font-size: 14px;
        font-weight: 500;
        z-index: 1000;
        animation: slideInRight 0.4s ease;
    `;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.style.animation = 'slideOutRight 0.4s ease';
        setTimeout(() => alert.remove(), 400);
    }, 3000);
}

// Estilos das animações
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
console.log('Área de Membros carregada!');