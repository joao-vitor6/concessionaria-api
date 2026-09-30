const API_URL = 'http://localhost:9090';
const token = localStorage.getItem('token');

if (!token) {
  window.location.href = 'index.html';
}

const payload = decodificarToken(token);
if (payload.role !== 'VENDEDOR') {
  window.location.href = 'catalogo.html';
}

const tabelaEl = document.getElementById('tabela-vendas');
const mensagemEl = document.getElementById('mensagem');

document.getElementById('btn-logout').addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
});

async function carregarVendas() {
  try {
    const resposta = await fetch(`${API_URL}/compras`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const vendas = await resposta.json();
    renderizarTabela(vendas);

  } catch (erro) {
    tabelaEl.innerHTML = '<tr><td colspan="5">Não foi possível carregar as vendas.</td></tr>';
  }
}

function renderizarTabela(vendas) {
  if (vendas.length === 0) {
    tabelaEl.innerHTML = '<tr><td colspan="5">Você ainda não registrou nenhuma venda.</td></tr>';
    return;
  }

  const ordenadas = [...vendas].sort((a, b) => new Date(b.dataCompra) - new Date(a.dataCompra));

  tabelaEl.innerHTML = ordenadas.map((venda) => {
    const dataFormatada = new Date(venda.dataCompra + 'T00:00:00').toLocaleDateString('pt-BR');
    const cancelada = venda.status === 'CANCELADA';

    return `
      <tr>
        <td>${venda.cliente.nome}</td>
        <td>${venda.carro.marca} ${venda.carro.modelo}</td>
        <td>${dataFormatada}</td>
        <td>R$ ${venda.valorPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        <td>${cancelada ? '<span style="color: var(--danger);">Cancelada</span>' : '<span style="color: #6FCF97;">Ativa</span>'}</td>
      </tr>
    `;
  }).join('');
}

function decodificarToken(token) {
  const payloadBase64 = token.split('.')[1];
  const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(payloadJson);
}

carregarVendas();