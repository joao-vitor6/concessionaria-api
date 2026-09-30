const API_URL = 'http://localhost:9090';
const token = localStorage.getItem('token');

if (!token) {
  window.location.href = 'index.html';
}

const payload = decodificarToken(token);
if (payload.role !== 'ADMIN') {
  window.location.href = 'catalogo.html';
}

const tabelaEl = document.getElementById('tabela-auditoria');
const mensagemEl = document.getElementById('mensagem');
let registros = [];

document.getElementById('btn-logout').addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
});

function escapar(texto) {
  const div = document.createElement('div');
  div.textContent = texto == null ? '' : String(texto);
  return div.innerHTML;
}

function converterData(valor) {
  // o Java devolve até 7 casas decimais nos segundos; o JS só precisa de 3
  return new Date(String(valor).replace(/(\.\d{3})\d+/, '$1'));
}

async function carregarAuditoria() {
  try {
    const resposta = await fetch(`${API_URL}/auditoria`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (resposta.status === 401) {
      localStorage.removeItem('token');
      window.location.href = 'index.html';
      return;
    }

    if (!resposta.ok) {
      exibirMensagem('Não foi possível carregar o registro de auditoria.', 'error');
      return;
    }

    registros = await resposta.json();
    renderizar();

  } catch (erro) {
    tabelaEl.innerHTML = '<tr><td colspan="5">Não foi possível conectar ao servidor.</td></tr>';
  }
}

function renderizar() {
  if (registros.length === 0) {
    tabelaEl.innerHTML = '<tr><td colspan="5">Nenhum registro de auditoria ainda.</td></tr>';
    return;
  }

  const acao = document.getElementById('filtro-acao').value;
  const busca = document.getElementById('filtro-busca').value.trim().toLowerCase();

  const filtrados = registros
    .filter((r) => !acao || r.acao === acao)
    .filter((r) => !busca
      || (r.usuarioResponsavel || '').toLowerCase().includes(busca)
      || (r.detalhes || '').toLowerCase().includes(busca))
    .sort((a, b) => converterData(b.dataHora) - converterData(a.dataHora));

  if (filtrados.length === 0) {
    tabelaEl.innerHTML = '<tr><td colspan="5">Nenhum registro corresponde aos filtros.</td></tr>';
    return;
  }

  const acaoLabel = { CRIACAO: 'Criação', ATUALIZACAO: 'Atualização', EXCLUSAO: 'Exclusão' };
  const acaoCor = { CRIACAO: '#6FCF97', ATUALIZACAO: 'var(--accent)', EXCLUSAO: 'var(--danger)' };

  tabelaEl.innerHTML = filtrados.map((r) => {
    const data = converterData(r.dataHora);
    const dataFormatada = data.toLocaleDateString('pt-BR');
    const horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    return `
      <tr>
        <td>${dataFormatada} ${horaFormatada}</td>
        <td style="color: ${acaoCor[r.acao] || 'inherit'}; font-weight: 600;">${escapar(acaoLabel[r.acao] || r.acao)}</td>
        <td>${escapar(r.entidade)} #${escapar(r.entidadeId)}</td>
        <td>${escapar(r.usuarioResponsavel)}</td>
        <td>${escapar(r.detalhes)}</td>
      </tr>
    `;
  }).join('');
}

document.getElementById('filtro-acao').addEventListener('change', renderizar);
document.getElementById('filtro-busca').addEventListener('input', renderizar);

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

carregarAuditoria();