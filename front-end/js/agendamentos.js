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

const listaAgendamentosEl = document.getElementById('lista-agendamentos');

document.getElementById('btn-logout').addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
});

async function carregarAgendamentos() {
  try {
    const resposta = await fetch(`${API_URL}/agendamentos`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (resposta.status === 401) {
      localStorage.removeItem('token');
      window.location.href = 'index.html';
      return;
    }

    const agendamentos = await resposta.json();
    renderizarAgendamentos(agendamentos);

  } catch (erro) {
    listaAgendamentosEl.innerHTML = '<p class="empty-state">Não foi possível carregar seus agendamentos.</p>';
  }
}

function renderizarAgendamentos(agendamentos) {
  if (agendamentos.length === 0) {
    listaAgendamentosEl.innerHTML = '<p class="empty-state">Você ainda não agendou nenhuma visita.</p>';
    return;
  }

  const ordenados = [...agendamentos].sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));

  const statusLabel = { PENDENTE: 'Pendente', CONFIRMADO: 'Confirmado', CANCELADO: 'Cancelado' };
  const statusCor = { PENDENTE: 'var(--accent)', CONFIRMADO: '#6FCF97', CANCELADO: 'var(--danger)' };

  listaAgendamentosEl.innerHTML = ordenados.map((agendamento) => {
    const data = new Date(agendamento.dataHora);
    const dataFormatada = data.toLocaleDateString('pt-BR');
    const horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const podeCancel = agendamento.status !== 'CANCELADO';

    return `
      <div class="compra-card">
        <div class="compra-info">
          <h3>${agendamento.carro.marca} ${agendamento.carro.modelo}</h3>
          <div class="compra-data">${dataFormatada} às ${horaFormatada}</div>
          <div style="color: ${statusCor[agendamento.status]}; font-size: 0.85rem; margin-top: 4px; font-weight: 600;">
            ${statusLabel[agendamento.status]}
          </div>
        </div>
        ${podeCancel ? `<button class="link-acao excluir" data-cancelar="${agendamento.id}">Cancelar</button>` : ''}
      </div>
    `;
  }).join('');

  document.querySelectorAll('[data-cancelar]').forEach((botao) => {
    botao.addEventListener('click', () => cancelarAgendamento(botao.dataset.cancelar));
  });
}

async function cancelarAgendamento(id) {
  const confirmou = await mostrarConfirmacao('Tem certeza que deseja cancelar este agendamento?');
  if (!confirmou) {
    return;
  }

  try {
    const resposta = await fetch(`${API_URL}/agendamentos/${id}/cancelar`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!resposta.ok) {
      const erro = await resposta.json();
      await mostrarAlerta(erro.message || 'Não foi possível cancelar o agendamento.');
      return;
    }

    carregarAgendamentos();

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

carregarAgendamentos();