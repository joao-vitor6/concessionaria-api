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

const tabelaEl = document.getElementById('tabela-agendamentos');
const mensagemEl = document.getElementById('mensagem');
const formPanel = document.getElementById('form-panel');
const form = document.getElementById('form-agendamento');
const selectVendedor = document.getElementById('vendedor-select');
const inputData = document.getElementById('agendamento-data');
const inputHora = document.getElementById('agendamento-hora');
const horariosGridEl = document.getElementById('horarios-grid');

document.getElementById('btn-logout').addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
});

// >>> NOVO: funções da grade de horários
function hojeLocal() {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;
}

function mostrarDicaHorarios(texto) {
  horariosGridEl.innerHTML = '';
  const dica = document.createElement('span');
  dica.className = 'horarios-dica';
  dica.textContent = texto;
  horariosGridEl.appendChild(dica);
}

function limparHorarios() {
  inputHora.value = '';
  mostrarDicaHorarios('Selecione o vendedor e a data para ver os horários.');
}

async function carregarHorarios() {
  inputHora.value = '';
  const vendedorId = selectVendedor.value;
  const data = inputData.value;

  if (!vendedorId || !data) {
    limparHorarios();
    return;
  }

  try {
    const resposta = await fetch(
      `${API_URL}/agendamentos/disponibilidade?vendedorId=${vendedorId}&data=${data}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (!resposta.ok) {
      const erro = await resposta.json();
      mostrarDicaHorarios(erro.message || 'Não foi possível carregar os horários.');
      return;
    }

    const horarios = await resposta.json();

    horariosGridEl.innerHTML = horarios.map((h) => `
      <button type="button" class="horario-slot" data-hora="${h.hora}" ${h.disponivel ? '' : 'disabled'}>${h.hora}</button>
    `).join('');

    if (!horarios.some((h) => h.disponivel)) {
      const aviso = document.createElement('span');
      aviso.className = 'horarios-dica';
      aviso.textContent = 'Nenhum horário disponível nesse dia para este vendedor.';
      horariosGridEl.appendChild(aviso);
    }

    document.querySelectorAll('.horario-slot').forEach((botao) => {
      botao.addEventListener('click', () => {
        document.querySelectorAll('.horario-slot').forEach((b) => b.classList.remove('selecionado'));
        botao.classList.add('selecionado');
        inputHora.value = botao.dataset.hora;
      });
    });

  } catch (erro) {
    mostrarDicaHorarios('Não foi possível conectar ao servidor.');
  }
}

selectVendedor.addEventListener('change', carregarHorarios);
inputData.addEventListener('change', carregarHorarios);
// >>> FIM DO NOVO

document.getElementById('btn-novo').addEventListener('click', async () => {
  await carregarSelects();
  inputData.min = hojeLocal();
  limparHorarios();
  formPanel.classList.add('aberto');
});

document.getElementById('btn-cancelar-form').addEventListener('click', () => {
  formPanel.classList.remove('aberto');
  form.reset();
  limparHorarios();
});

async function carregarSelects() {
  try {
    const [respClientes, respCarros, respVendedores] = await Promise.all([
      fetch(`${API_URL}/clientes`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_URL}/carros`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_URL}/usuarios/vendedores`, { headers: { 'Authorization': `Bearer ${token}` } })
    ]);

    const clientes = await respClientes.json();
    const carros = await respCarros.json();
    const vendedores = await respVendedores.json();

    document.getElementById('cliente-select').innerHTML = clientes
      .map((c) => `<option value="${c.id}">${c.nome} — ${c.cpf}</option>`).join('');

    document.getElementById('carro-select').innerHTML = carros
      .map((c) => `<option value="${c.id}">${c.marca} ${c.modelo} (${c.ano})</option>`).join('');

    selectVendedor.innerHTML = vendedores
      .map((v) => `<option value="${v.id}">${v.nome}</option>`).join('');

  } catch (erro) {
    exibirMensagem('Não foi possível carregar os dados do formulário.', 'error');
  }
}

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const data = inputData.value;
  const hora = inputHora.value;

  // >>> NOVO: campo escondido não é validado pelo navegador, então checamos aqui
  if (!hora) {
    await mostrarAlerta('Selecione um horário disponível.');
    return;
  }
  // >>> FIM DO NOVO

  const corpo = {
    cliente: { id: Number(document.getElementById('cliente-select').value) },
    carro: { id: Number(document.getElementById('carro-select').value) },
    vendedor: { id: Number(selectVendedor.value) },
    dataHora: `${data}T${hora}:00`
  };

  try {
    const resposta = await fetch(`${API_URL}/agendamentos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(corpo)
    });

    if (!resposta.ok) {
      const erro = await resposta.json();
      exibirMensagem(erro.message || 'Não foi possível criar o agendamento.', 'error');
      carregarHorarios();
      return;
    }

    exibirMensagem('Agendamento criado com sucesso.', 'success');
    formPanel.classList.remove('aberto');
    form.reset();
    limparHorarios();
    carregarAgendamentos();

  } catch (erro) {
    exibirMensagem('Não foi possível conectar ao servidor.', 'error');
  }
});

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
    tabelaEl.innerHTML = '<tr><td colspan="5">Nenhum agendamento registrado.</td></tr>';
    return;
  }

  const ordenados = [...agendamentos].sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));

  const statusLabel = { PENDENTE: 'Pendente', CONFIRMADO: 'Confirmado', CANCELADO: 'Cancelado' };
  const statusCor = { PENDENTE: 'var(--accent)', CONFIRMADO: '#6FCF97', CANCELADO: 'var(--danger)' };

  tabelaEl.innerHTML = ordenados.map((agendamento) => {
    const data = new Date(agendamento.dataHora);
    const dataFormatada = data.toLocaleDateString('pt-BR');
    const horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return `
      <tr>
        <td>${agendamento.cliente.nome}</td>
        <td>${agendamento.vendedor.nome}</td>
        <td>${agendamento.carro.marca} ${agendamento.carro.modelo}</td>
        <td>${dataFormatada} às ${horaFormatada}</td>
        <td style="color: ${statusCor[agendamento.status]}; font-weight: 600;">${statusLabel[agendamento.status]}</td>
      </tr>
    `;
  }).join('');
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