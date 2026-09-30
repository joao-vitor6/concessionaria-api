const API_URL = 'http://localhost:9090';
const token = localStorage.getItem('token');

if (!token) {
  window.location.href = 'index.html';
}

const payload = decodificarToken(token);
if (payload.role !== 'ADMIN') {
  window.location.href = 'catalogo.html';
}

function mostrarAlerta(mensagem, titulo = 'Aviso') {
  return new Promise((resolve) => {
    const overlay = document.getElementById('alerta-overlay');
    const btnOk = document.getElementById('alerta-ok');
    document.getElementById('alerta-titulo').textContent = titulo;
    document.getElementById('alerta-mensagem').textContent = mensagem;
    overlay.classList.add('aberto');

    function onOk() {
      overlay.classList.remove('aberto');
      btnOk.removeEventListener('click', onOk);
      resolve();
    }
    btnOk.addEventListener('click', onOk);
  });
}

function mostrarConfirmacao(mensagem, titulo = 'Confirmar') {
  return new Promise((resolve) => {
    const overlay = document.getElementById('confirmar-overlay');
    const btnSim = document.getElementById('confirmar-sim');
    const btnNao = document.getElementById('confirmar-nao');
    document.getElementById('confirmar-titulo').textContent = titulo;
    document.getElementById('confirmar-mensagem').textContent = mensagem;
    overlay.classList.add('aberto');

    function limpar() {
      overlay.classList.remove('aberto');
      btnSim.removeEventListener('click', onSim);
      btnNao.removeEventListener('click', onNao);
    }
    function onSim() { limpar(); resolve(true); }
    function onNao() { limpar(); resolve(false); }
    btnSim.addEventListener('click', onSim);
    btnNao.addEventListener('click', onNao);
  });
}

const tabelaEl = document.getElementById('tabela-usuarios');
const mensagemEl = document.getElementById('mensagem');

document.getElementById('btn-logout').addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
});

async function excluirUsuario(id) {
  const confirmou = await mostrarConfirmacao('Isso também vai excluir o cliente vinculado a essa conta, se houver. Deseja continuar?');
  if (!confirmou) {
    return;
  }

  try {
    const resposta = await fetch(`${API_URL}/usuarios/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!resposta.ok) {
      const erro = await resposta.json();
      exibirMensagem(erro.message || 'Não foi possível excluir o usuário.', 'error');
      return;
    }

    exibirMensagem('Usuário excluído com sucesso.', 'success');
    carregarUsuarios();

  } catch (erro) {
    exibirMensagem('Não foi possível conectar ao servidor.', 'error');
  }
}

async function carregarUsuarios() {
  try {
    const resposta = await fetch(`${API_URL}/usuarios`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const usuarios = await resposta.json();
    renderizarTabela(usuarios);

  } catch (erro) {
    tabelaEl.innerHTML = '<tr><td colspan="4">Não foi possível carregar os usuários.</td></tr>';
  }
}

function renderizarTabela(usuarios) {
  if (usuarios.length === 0) {
    tabelaEl.innerHTML = '<tr><td colspan="4">Nenhum usuário cadastrado.</td></tr>';
    return;
  }

  tabelaEl.innerHTML = usuarios.map((usuario) => `
    <tr>
      <td>${usuario.email}</td>
      <td>${usuario.role}</td>
      <td>${usuario.cliente ? usuario.cliente.nome : '—'}</td>
      <td class="acoes">
        <button class="link-acao excluir" data-excluir="${usuario.id}">Excluir</button>
      </td>
    </tr>
  `).join('');

  document.querySelectorAll('[data-excluir]').forEach((botao) => {
    botao.addEventListener('click', () => {
      excluirUsuario(Number(botao.dataset.excluir));
    });
  });
}

function exibirMensagem(texto, tipo) {
  mensagemEl.className = `form-message ${tipo}`;
  mensagemEl.textContent = texto;
  setTimeout(() => {
    mensagemEl.className = 'form-message';
  }, 3500);
}

function decodificarToken(token) {
  const payloadBase64 = token.split('.')[1];
  const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(payloadJson);
}

carregarUsuarios();