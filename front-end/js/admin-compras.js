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

function abrirPrompt(titulo, mensagem, tipoInput) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('prompt-overlay');
    const input = document.getElementById('prompt-input');
    const btnConfirmar = document.getElementById('prompt-confirmar');
    const btnCancelar = document.getElementById('prompt-cancelar');

    document.getElementById('prompt-titulo').textContent = titulo;
    document.getElementById('prompt-mensagem').textContent = mensagem;
    input.type = tipoInput || 'password';
    input.value = '';
    input.style.borderBottomColor = '';
    overlay.classList.add('aberto');
    input.focus();

    function limpar() {
      overlay.classList.remove('aberto');
      btnConfirmar.removeEventListener('click', onConfirmar);
      btnCancelar.removeEventListener('click', onCancelar);
      input.removeEventListener('keydown', onKeydown);
    }

    function onConfirmar() {
      const valor = input.value;
      if (!valor) {
        input.style.borderBottomColor = 'var(--danger)';
        input.focus();
        return;
      }
      limpar();
      resolve(valor);
    }

    function onCancelar() {
      limpar();
      resolve(null);
    }

    function onKeydown(evento) {
      if (evento.key === 'Enter') onConfirmar();
    }

    btnConfirmar.addEventListener('click', onConfirmar);
    btnCancelar.addEventListener('click', onCancelar);
    input.addEventListener('keydown', onKeydown);
  });
}

const tabelaEl = document.getElementById('tabela-compras');
const mensagemEl = document.getElementById('mensagem');

document.getElementById('btn-logout').addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
});

async function cancelarCompra(id) {
  const senha = await abrirPrompt('Cancelar compra', 'Digite a senha de confirmação do cancelamento:', 'password');

  if (!senha) {
    return;
  }

  try {
    const resposta = await fetch(`${API_URL}/compras/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ senha })
    });

    if (!resposta.ok) {
      const erro = await resposta.json();
      exibirMensagem(erro.message || 'Não foi possível cancelar a compra.', 'error');
      return;
    }

    exibirMensagem('Compra cancelada com sucesso.', 'success');
    carregarCompras();

  } catch (erro) {
    exibirMensagem('Não foi possível conectar ao servidor.', 'error');
  }
}

async function carregarCompras() {
  try {
    const resposta = await fetch(`${API_URL}/compras`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const compras = await resposta.json();
    renderizarTabela(compras);

  } catch (erro) {
    tabelaEl.innerHTML = '<tr><td colspan="6">Não foi possível carregar as compras.</td></tr>';
  }
}

function renderizarTabela(compras) {
  if (compras.length === 0) {
    tabelaEl.innerHTML = '<tr><td colspan="6">Nenhuma compra registrada.</td></tr>';
    return;
  }

  const comprasOrdenadas = [...compras].sort((a, b) => new Date(b.dataCompra) - new Date(a.dataCompra));

  tabelaEl.innerHTML = comprasOrdenadas.map((compra) => {
    const dataFormatada = new Date(compra.dataCompra + 'T00:00:00').toLocaleDateString('pt-BR');
    const cancelada = compra.status === 'CANCELADA';

    return `
      <tr>
        <td>${compra.cliente.nome}</td>
        <td>${compra.carro.marca} ${compra.carro.modelo}</td>
        <td>${dataFormatada}</td>
        <td>R$ ${compra.valorPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        <td>${cancelada ? '<span style="color: var(--danger);">Cancelada</span>' : '<span style="color: #6FCF97;">Ativa</span>'}</td>
        <td class="acoes">
          ${cancelada ? '' : `<button class="link-acao excluir" data-cancelar="${compra.id}">Cancelar</button>`}
        </td>
      </tr>
    `;
  }).join('');

  document.querySelectorAll('[data-cancelar]').forEach((botao) => {
    botao.addEventListener('click', () => {
      cancelarCompra(Number(botao.dataset.cancelar));
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

carregarCompras();