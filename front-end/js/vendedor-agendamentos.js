const API_URL = 'http://localhost:9090';
const token = localStorage.getItem('token');

if (!token) {
  window.location.href = 'index.html';
}

const payload = decodificarToken(token);
if (payload.role !== 'VENDEDOR') {
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

function abrirModalVenda(valorSugerido) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('venda-overlay');
    const inputValor = document.getElementById('venda-valor');
    const inputData = document.getElementById('venda-data');
    const btnConfirmar = document.getElementById('venda-confirmar');
    const btnCancelar = document.getElementById('venda-cancelar');

    inputValor.value = valorSugerido;
    inputData.value = new Date().toISOString().split('T')[0];
    overlay.classList.add('aberto');

    function limpar() {
      overlay.classList.remove('aberto');
      btnConfirmar.removeEventListener('click', onConfirmar);
      btnCancelar.removeEventListener('click', onCancelar);
    }

    async function onConfirmar() {
      const valor = inputValor.value;
      const data = inputData.value;

      if (!valor || !data) {
        await mostrarAlerta('Preencha o valor e a data.');
        return;
      }

      limpar();
      resolve({ valorPago: Number(valor), dataCompra: data });
    }

    function onCancelar() {
      limpar();
      resolve(null);
    }

    btnConfirmar.addEventListener('click', onConfirmar);
    btnCancelar.addEventListener('click', onCancelar);
  });
}

const tabelaEl = document.getElementById('tabela-agendamentos');
const mensagemEl = document.getElementById('mensagem');

document.getElementById('btn-logout').addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
});

async function confirmarAgendamento(id) {
  const confirmou = await mostrarConfirmacao('Confirmar este agendamento?');
  if (!confirmou) return;

  try {
    const resposta = await fetch(`${API_URL}/agendamentos/${id}/confirmar`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!resposta.ok) {
      const erro = await resposta.json();
      exibirMensagem(erro.message || 'Não foi possível confirmar.', 'error');
      return;
    }

    exibirMensagem('Agendamento confirmado.', 'success');
    carregarAgendamentos();

  } catch (erro) {
    exibirMensagem('Não foi possível conectar ao servidor.', 'error');
  }
}

async function cancelarAgendamento(id) {
  const confirmou = await mostrarConfirmacao('Cancelar este agendamento?');
  if (!confirmou) return;

  try {
    const resposta = await fetch(`${API_URL}/agendamentos/${id}/cancelar`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!resposta.ok) {
      const erro = await resposta.json();
      exibirMensagem(erro.message || 'Não foi possível cancelar.', 'error');
      return;
    }

    exibirMensagem('Agendamento cancelado.', 'success');
    carregarAgendamentos();

  } catch (erro) {
    exibirMensagem('Não foi possível conectar ao servidor.', 'error');
  }
}

async function registrarVenda(agendamento) {
  const dados = await abrirModalVenda(agendamento.carro.preco);
  if (!dados) return;

  try {
    const resposta = await fetch(`${API_URL}/compras`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        cliente: { id: agendamento.cliente.id },
        carro: { id: agendamento.carro.id },
        dataCompra: dados.dataCompra,
        valorPago: dados.valorPago
      })
    });

    if (!resposta.ok) {
      const erro = await resposta.json();
      exibirMensagem(erro.message || 'Não foi possível registrar a venda.', 'error');
      return;
    }

    exibirMensagem('Venda registrada com sucesso!', 'success');

  } catch (erro) {
    exibirMensagem('Não foi possível conectar ao servidor.', 'error');
  }
}

async function carregarAgendamentos() {
  try {
    const resposta = await fetch(`${API_URL}/agendamentos`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const agendamentos = await resposta.json();
    renderizarTabela(agendamentos);

  } catch (erro) {
    tabelaEl.innerHTML = '<tr><td colspan="5">Não foi possível carregar os agendamentos.</td></tr>';
  }
}

function renderizarTabela(agendamentos) {
  if (agendamentos.length === 0) {
    tabelaEl.innerHTML = '<tr><td colspan="5">Nenhum agendamento com você ainda.</td></tr>';
    return;
  }

  const ordenados = [...agendamentos].sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));

  const statusLabel = { PENDENTE: 'Pendente', CONFIRMADO: 'Confirmado', CANCELADO: 'Cancelado' };
  const statusCor = { PENDENTE: 'var(--accent)', CONFIRMADO: '#6FCF97', CANCELADO: 'var(--danger)' };

  tabelaEl.innerHTML = ordenados.map((agendamento) => {
    const data = new Date(agendamento.dataHora);
    const dataFormatada = data.toLocaleDateString('pt-BR');
    const horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    let acoes = '';
    if (agendamento.status === 'PENDENTE') {
      acoes = `
        <button class="link-acao" data-confirmar="${agendamento.id}">Confirmar</button>
        <button class="link-acao excluir" data-cancelar="${agendamento.id}">Cancelar</button>
      `;
    } else if (agendamento.status === 'CONFIRMADO') {
      acoes = `
        <button class="link-acao" data-venda="${agendamento.id}">Registrar venda</button>
        <button class="link-acao excluir" data-cancelar="${agendamento.id}">Cancelar</button>
      `;
    }

    return `
      <tr>
        <td>${agendamento.cliente.nome}</td>
        <td>${agendamento.carro.marca} ${agendamento.carro.modelo}</td>
        <td>${dataFormatada} às ${horaFormatada}</td>
        <td style="color: ${statusCor[agendamento.status]}; font-weight: 600;">${statusLabel[agendamento.status]}</td>
        <td class="acoes">${acoes}</td>
      </tr>
    `;
  }).join('');

  document.querySelectorAll('[data-confirmar]').forEach((botao) => {
    botao.addEventListener('click', () => confirmarAgendamento(Number(botao.dataset.confirmar)));
  });

  document.querySelectorAll('[data-cancelar]').forEach((botao) => {
    botao.addEventListener('click', () => cancelarAgendamento(Number(botao.dataset.cancelar)));
  });

  document.querySelectorAll('[data-venda]').forEach((botao) => {
    botao.addEventListener('click', () => {
      const agendamento = agendamentos.find((a) => a.id === Number(botao.dataset.venda));
      registrarVenda(agendamento);
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

carregarAgendamentos();