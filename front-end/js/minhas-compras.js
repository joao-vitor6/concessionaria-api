const API_URL = 'http://localhost:9090';
const token = localStorage.getItem('token');

if (!token) {
  window.location.href = 'index.html';
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

const listaComprasEl = document.getElementById('lista-compras');

document.getElementById('btn-logout').addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
});

async function carregarCompras() {
  try {
    const resposta = await fetch(`${API_URL}/compras`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (resposta.status === 401) {
      localStorage.removeItem('token');
      window.location.href = 'index.html';
      return;
    }

    const compras = await resposta.json();
    renderizarCompras(compras);

  } catch (erro) {
    listaComprasEl.innerHTML = '<p class="empty-state">Não foi possível carregar suas compras.</p>';
  }
}

function renderizarCompras(compras) {
  if (compras.length === 0) {
    listaComprasEl.innerHTML = '<p class="empty-state">Você ainda não fez nenhuma compra.</p>';
    return;
  }

  const comprasOrdenadas = compras.sort((a, b) => new Date(b.dataCompra) - new Date(a.dataCompra));

  listaComprasEl.innerHTML = comprasOrdenadas.map((compra) => {
    const dataFormatada = new Date(compra.dataCompra + 'T00:00:00').toLocaleDateString('pt-BR');
    const cancelada = compra.status === 'CANCELADA';

    return `
      <div class="compra-card">
        <div class="compra-info">
          <h3>${compra.carro.marca} ${compra.carro.modelo}</h3>
          <div class="compra-data">Comprado em ${dataFormatada}</div>
          ${cancelada ? '<div style="color: var(--danger); font-size: 0.85rem; margin-top: 4px; font-weight: 600;">Cancelada</div>' : ''}
        </div>
        <div style="display: flex; align-items: center; gap: 16px;">
          <div class="compra-valor">R$ ${compra.valorPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          ${cancelada ? '' : `<button class="link-acao excluir" data-cancelar="${compra.id}">Cancelar</button>`}
        </div>
      </div>
    `;
  }).join('');

  document.querySelectorAll('[data-cancelar]').forEach((botao) => {
    botao.addEventListener('click', cancelarCompra);
  });
}

async function cancelarCompra(evento) {
  const compraId = evento.target.dataset.cancelar;

  const confirmou = await mostrarConfirmacao('Tem certeza que deseja cancelar esta compra?');
  if (!confirmou) {
    return;
  }

  const senhaCompra = await abrirPrompt('Cancelar compra', 'Digite sua senha de compra para confirmar o cancelamento:', 'password');

  if (!senhaCompra) {
    return;
  }

  try {
    const resposta = await fetch(`${API_URL}/compras/${compraId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ senhaCompra })
    });

    if (!resposta.ok) {
      const erro = await resposta.json();
      await mostrarAlerta(erro.message || 'Não foi possível cancelar a compra.');
      return;
    }

    await mostrarAlerta('Compra cancelada com sucesso.');
    carregarCompras();

  } catch (erro) {
    await mostrarAlerta('Não foi possível conectar ao servidor.');
  }
}

const perfilTrigger = document.getElementById('perfil-trigger');
const perfilOverlay = document.getElementById('perfil-overlay');
const perfilDrawerFechar = document.getElementById('perfil-drawer-fechar');

perfilTrigger.addEventListener('click', () => {
  perfilOverlay.classList.add('aberto');
});

perfilDrawerFechar.addEventListener('click', () => {
  perfilOverlay.classList.remove('aberto');
});

perfilOverlay.addEventListener('click', (evento) => {
  if (evento.target === perfilOverlay) {
    perfilOverlay.classList.remove('aberto');
  }
});

carregarCompras();