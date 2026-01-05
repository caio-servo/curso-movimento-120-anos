let clientes = [];
let editId = null;

const tbody = document.querySelector('#clientesTable tbody');
const loading = document.getElementById('loading');
const modal = document.getElementById('modal');
const searchInput = document.getElementById('searchInput');

document.getElementById('btnNovo').onclick = abrirModal;
document.getElementById('btnCancelar').onclick = fecharModal;
document.getElementById('btnSalvar').onclick = salvarCliente;
searchInput.oninput = filtrarClientes;

checkAdmin();
carregarClientes();

function checkAdmin() {
    if (localStorage.getItem('userIsAdmin') !== 'true') {
        alert('Acesso negado');
        window.location.href = '/membros/';
    }
}

async function carregarClientes() {
    loading.style.display = 'block';
    tbody.innerHTML = '';

    try {
        const res = await fetch('https://movimento120anos.ibr.com.br/api/admin/clientes', {
            credentials: 'include'
        });

        if (!res.ok) {
            throw new Error(`Erro ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Erro ao carregar');
        }

        clientes = data.clientes || [];
        renderizar(clientes);
        atualizarDashboard();

    } catch (err) {
        console.error('Erro ao carregar:', err);
        alert('Erro ao carregar clientes: ' + err.message);
    } finally {
        loading.style.display = 'none';
    }
}

function atualizarDashboard() {
    const total = clientes.length;
    const ativos = clientes.filter(c => c.status === 'ativo').length;
    const inativos = clientes.filter(c => c.status === 'inativo').length;

    document.getElementById('totalClientes').textContent = total;
    document.getElementById('clientesAtivos').textContent = ativos;
    document.getElementById('clientesInativos').textContent = inativos;
}

function renderizar(lista) {
    tbody.innerHTML = '';

    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhum cliente encontrado</td></tr>';
        return;
    }

    lista.forEach(c => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>${c.name || 'N/A'}</td>
            <td>${c.email || 'N/A'}</td>
            <td><span class="status-badge status-${c.status}">${c.status || 'ativo'}</span></td>
            <td class="action-buttons">
                <button class="btn-action btn-edit" onclick="editar(${c.id})">Editar</button>
                <button class="btn-action btn-toggle" onclick="toggleStatus(${c.id}, '${c.status}')">
                    ${c.status === 'ativo' ? 'Inativar' : 'Ativar'}
                </button>
                <button class="btn-action btn-delete" onclick="deletarCliente(${c.id}, '${c.name}')">Deletar</button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function filtrarClientes() {
    const termo = searchInput.value.toLowerCase();
    renderizar(clientes.filter(c =>
        (c.name || '').toLowerCase().includes(termo) ||
        (c.email || '').toLowerCase().includes(termo)
    ));
}

function abrirModal() {
    editId = null;
    limparFormulario();
    document.getElementById('modalTitle').textContent = 'Novo Cliente';
    modal.classList.remove('hidden');
}

function fecharModal() {
    modal.classList.add('hidden');
    limparFormulario();
}

function limparFormulario() {
    ['name','email','password','confirmPassword'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('status').value = 'ativo';
}

function editar(id) {
    const c = clientes.find(x => x.id === id);
    if (!c) {
        alert('Cliente não encontrado');
        return;
    }

    editId = id;

    document.getElementById('modalTitle').textContent = 'Editar Cliente';
    document.getElementById('name').value = c.name || '';
    document.getElementById('email').value = c.email || '';
    document.getElementById('status').value = c.status || 'ativo';

    modal.classList.remove('hidden');
}

async function salvarCliente() {
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const statusInput = document.getElementById('status');

    const body = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        status: statusInput.value
    };

    // Validações
    if (!body.name || !body.email) {
        alert('Nome e email são obrigatórios');
        return;
    }

    if (passwordInput.value) {
        if (passwordInput.value !== confirmPasswordInput.value) {
            alert('Senhas não conferem');
            return;
        }
        if (passwordInput.value.length < 6) {
            alert('Senha deve ter no mínimo 6 caracteres');
            return;
        }
        body.password = passwordInput.value;
    } else if (!editId) {
        alert('Senha é obrigatória para novo cliente');
        return;
    }

    const url = editId
        ? `/api/admin/clientes/update/${editId}`
        : `/api/admin/clientes/create`;

    const method = editId ? 'PUT' : 'POST';

    try {
        console.log('🔄 Salvando:', method, url, body);

        const res = await fetch(`https://movimento120anos.ibr.com.br${url}`, {
            method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body)
        });

        console.log('📡 Status:', res.status, res.statusText);
        console.log('📡 Content-Type:', res.headers.get('content-type'));

        // Verifica se é JSON
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await res.text();
            console.error('❌ Resposta não é JSON:', text.substring(0, 200));
            
            if (res.status === 401 || res.status === 403) {
                alert('Sessão expirada. Faça login novamente.');
                window.location.href = '/login/';
                return;
            }
            
            throw new Error(`Servidor retornou HTML (Status ${res.status}). Rota pode não existir.`);
        }

        const data = await res.json();
        console.log('✅ Resposta:', data);

        if (!data.success) {
            throw new Error(data.message || 'Erro ao salvar');
        }

        alert(data.message || 'Cliente salvo com sucesso');
        fecharModal();
        carregarClientes();

    } catch (err) {
        console.error('💥 Erro completo:', err);
        alert('Erro ao salvar: ' + err.message);
    }
}

async function toggleStatus(id, statusAtual) {
    const novoStatus = statusAtual === 'ativo' ? 'inativo' : 'ativo';

    try {
        const res = await fetch(`https://movimento120anos.ibr.com.br/api/admin/clientes/toggle-status/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status: novoStatus })
        });

        const data = await res.json();

        if (!data.success) {
            throw new Error(data.message || 'Erro ao alterar status');
        }

        alert('Status alterado com sucesso');
        carregarClientes();

    } catch (err) {
        console.error('Erro ao toggle:', err);
        alert('Erro ao alterar status: ' + err.message);
    }
}

async function deletarCliente(id, nome) {
    if (!confirm(`Tem certeza que deseja deletar o cliente "${nome}"?`)) {
        return;
    }

    try {
        const res = await fetch(`https://movimento120anos.ibr.com.br/api/admin/clientes/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        console.log('Status:', res.status);

        // Se não for JSON, tenta parse mesmo assim
        const contentType = res.headers.get('content-type');
        let data;

        if (contentType && contentType.includes('application/json')) {
            data = await res.json();
        } else {
            const text = await res.text();
            console.log('Resposta:', text);
            
            if (res.ok) {
                // Se status for 200/201/204, considerar sucesso
                alert('Cliente deletado com sucesso');
                carregarClientes();
                return;
            }
            
            if (res.status === 401 || res.status === 403) {
                alert('Sessão expirada. Faça login novamente.');
                window.location.href = '/login/';
                return;
            }
            
            throw new Error(`Erro ${res.status}: ${text.substring(0, 100)}`);
        }

        if (!data.success) {
            throw new Error(data.message || 'Erro ao deletar');
        }

        alert('Cliente deletado com sucesso');
        carregarClientes();

    } catch (err) {
        console.error('Erro ao deletar:', err);
        alert('Erro ao deletar cliente: ' + err.message);
    }
}