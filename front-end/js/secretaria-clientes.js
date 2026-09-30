const API_URL = 'http://localhost:9090';
const token = localStorage.getItem('token');

if (!token) {
  window.location.href = 'index.html';
}

const payload = decodificarToken(token);
if (payload.role !== 'SECRETARIA') {
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

const tabelaEl = document.getElementById('tabela-clientes');
const formPanel = document.getElementById('form-panel');
const form = document.getElementById('form-cliente');
const formTitulo = document.getElementById('form-titulo');
const mensagemEl = document.getElementById('mensagem');

document.getElementById('btn-logout').addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
});

document.getElementById('btn-novo').addEventListener('click', () => {
  abrirFormulario();
});

document.getElementById('btn-cancelar').addEventListener('click', () => {
  fecharFormulario();
});

function abrirFormulario(cliente = null) {
  form.reset();
  document.getElementById('cliente-id').value = '';

  if (cliente) {
    formTitulo.textContent = 'Editar cliente';
    document.getElementById('cliente-id').value = cliente.id;
    document.getElementById('nome').value = cliente.nome;
    document.getElementById('cpf').value = cliente.cpf;
    document.getElementById('email').value = cliente.email;
    document.getElementById('telefone').value = cliente.telefone;
  } else {
    formTitulo.textContent = 'Novo cliente';
  }

  formPanel.classList.add('aberto');
}

function fecharFormulario() {
  formPanel.classList.remove('aberto');
  form.reset();
}

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const id = document.getElementById('cliente-id').value;
  const corpo = {
    nome: document.getElementById('nome').value,
    cpf: document.getElementById('cpf').value,
    email: document.getElementById('email').value,
    telefone: document.getElementById('telefone').value
  };

  const url = id ? `${API_URL}/clientes/${id}` : `${API_URL}/clientes`;
  const metodo = id ? 'PUT' : 'POST';

  try {
    const resposta = await fetch(url, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(corpo)
    });

    if (!resposta.ok) {
      const erro = await resposta.json();
      exibirMensagem(erro.message || montarMensagemDeErros(erro.errors), 'error');
      return;
    }

    exibirMensagem(id ? 'Cliente atualizado com sucesso.' : 'Cliente criado com sucesso.', 'success');
    fecharFormulario();
    carregarClientes();

  } catch (erro) {
    exibirMensagem('Não foi possível conectar ao servidor.', 'error');
  }
});


async function carregarClientes() {
  try {
    const resposta = await fetch(`${API_URL}/clientes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const clientes = await resposta.json();
    renderizarTabela(clientes);

  } catch (erro) {
    tabelaEl.innerHTML = '<tr><td colspan="5">Não foi possível carregar os clientes.</td></tr>';
  }
}

function renderizarTabela(clientes) {
  if (clientes.length === 0) {
    tabelaEl.innerHTML = '<tr><td colspan="5">Nenhum cliente cadastrado.</td></tr>';
    return;
  }

  tabelaEl.innerHTML = clientes.map((cliente) => `
    <tr>
      <td>${cliente.nome}</td>
      <td>${cliente.cpf}</td>
      <td>${cliente.email}</td>
      <td>${cliente.telefone}</td>
      <td class="acoes">
        <button class="link-acao" data-editar="${cliente.id}">Editar</button>
      </td>
    </tr>
  `).join('');

  document.querySelectorAll('[data-editar]').forEach((botao) => {
    botao.addEventListener('click', () => {
      const cliente = clientes.find((c) => c.id === Number(botao.dataset.editar));
      abrirFormulario(cliente);
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

function montarMensagemDeErros(errors) {
  if (!errors) return 'Não foi possível salvar o cliente.';
  return Object.values(errors).join(' — ');
}

function decodificarToken(token) {
  const payloadBase64 = token.split('.')[1];
  const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(payloadJson);
}

carregarClientes();