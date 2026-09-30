const API_URL = 'http://localhost:9090';
const token = localStorage.getItem('token');

if (!token) {
  window.location.href = 'index.html';
}

const listaCarrosEl = document.getElementById('lista-carros');
let carrosCarregados = [];
let favoritosIds = new Set();
let compradosIds = new Set();

document.getElementById('btn-logout').addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
});

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

// >>> ALTERADO: agora é async, busca os vendedores e devolve { vendedorId, dataHora }
async function abrirModalAgendar() {
  let vendedores = [];

  try {
    const resposta = await fetch(`${API_URL}/usuarios/vendedores`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    vendedores = await resposta.json();
  } catch (erro) {
    await mostrarAlerta('Não foi possível carregar a lista de vendedores.');
    return null;
  }

  if (vendedores.length === 0) {
    await mostrarAlerta('Nenhum vendedor disponível no momento.');
    return null;
  }

  return new Promise((resolve) => {
    const overlay = document.getElementById('agendar-overlay');
    const selectVendedor = document.getElementById('agendar-vendedor');
    const inputData = document.getElementById('agendar-data');
    const inputHora = document.getElementById('agendar-hora');
    const btnConfirmar = document.getElementById('agendar-confirmar');
    const btnCancelar = document.getElementById('agendar-cancelar');

    selectVendedor.innerHTML = vendedores
      .map((v) => `<option value="${v.id}">${v.nome}</option>`).join('');
    inputData.value = '';
    inputHora.value = '';
    overlay.classList.add('aberto');

    function limpar() {
      overlay.classList.remove('aberto');
      btnConfirmar.removeEventListener('click', onConfirmar);
      btnCancelar.removeEventListener('click', onCancelar);
    }

    async function onConfirmar() {
      const data = inputData.value;
      const hora = inputHora.value;

      if (!data || !hora) {
        await mostrarAlerta('Preencha a data e o horário.');
        return;
      }

      limpar();
      resolve({
        vendedorId: Number(selectVendedor.value),
        dataHora: `${data}T${hora}:00`
      });
    }

    function onCancelar() {
      limpar();
      resolve(null);
    }

    btnConfirmar.addEventListener('click', onConfirmar);
    btnCancelar.addEventListener('click', onCancelar);
  });
}
// >>> FIM DA ALTERAÇÃO

async function carregarFavoritos() {
  try {
    const resposta = await fetch(`${API_URL}/favoritos`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (resposta.ok) {
      const favoritos = await resposta.json();
      favoritosIds = new Set(favoritos.map((f) => f.carro.id));
    }
  } catch (erro) {
    // silencioso
  }
}

async function carregarComprados() {
  try {
    const resposta = await fetch(`${API_URL}/compras`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (resposta.ok) {
      const compras = await resposta.json();
      compradosIds = new Set(
        compras.filter((c) => c.status !== 'CANCELADA').map((c) => c.carro.id)
      );
    }
  } catch (erro) {
    // silencioso
  }
}

async function carregarCarros() {
  try {
    await carregarFavoritos();
    await carregarComprados();

    const resposta = await fetch(`${API_URL}/carros`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (resposta.status === 401) {
      localStorage.removeItem('token');
      window.location.href = 'index.html';
      return;
    }

    const carros = await resposta.json();
    carrosCarregados = carros;
    renderizarCarros(carros);

  } catch (erro) {
    listaCarrosEl.innerHTML = '<p class="empty-state">Não foi possível carregar o catálogo.</p>';
  }
}

function renderizarCarros(carros) {
  if (carros.length === 0) {
    listaCarrosEl.innerHTML = '<p class="empty-state">Nenhum carro disponível no momento.</p>';
    return;
  }

  listaCarrosEl.innerHTML = carros.map((carro) => {
    const imagemHtml = carro.imagemUrl
      ? `<img src="${API_URL}${carro.imagemUrl}" alt="${carro.marca} ${carro.modelo}" class="car-image">`
      : `<div class="car-image car-image-placeholder">Sem imagem</div>`;

    const favoritado = favoritosIds.has(carro.id);
    const comprado = compradosIds.has(carro.id);

    return `
      <div class="car-card" data-carro-id="${carro.id}">
        ${imagemHtml}
        <div class="car-marca">${carro.marca}</div>
        <h3>${carro.modelo}</h3>
        <div class="car-specs">
          <span class="car-specs-info">
            <span>${carro.ano}</span>
            <span>${carro.cor}</span>
          </span>
          <button class="btn-favorito ${favoritado ? 'favoritado' : ''}" data-favorito-carro-id="${carro.id}">♥</button>
        </div>
        <div class="car-price">R$ ${carro.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        <button class="btn-primary btn-comprar" data-carro-id="${carro.id}" ${comprado ? 'disabled' : ''}>${comprado ? 'Comprado ✓' : 'Comprar'}</button>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.btn-comprar').forEach((botao) => {
    botao.addEventListener('click', (evento) => {
      evento.stopPropagation();
      comprarCarro(evento);
    });
  });

  document.querySelectorAll('.btn-favorito').forEach((botao) => {
    botao.addEventListener('click', (evento) => {
      evento.stopPropagation();
      alternarFavorito(botao);
    });
  });

  document.querySelectorAll('.car-card').forEach((card) => {
    card.addEventListener('click', () => {
      const carroId = Number(card.dataset.carroId);
      const carro = carrosCarregados.find((c) => c.id === carroId);
      abrirModal(carro);
    });
  });
}

async function alternarFavorito(botao) {
  const carroId = Number(botao.dataset.favoritoCarroId);
  const jaFavoritado = favoritosIds.has(carroId);
  const metodo = jaFavoritado ? 'DELETE' : 'POST';

  try {
    const resposta = await fetch(`${API_URL}/favoritos/${carroId}`, {
      method: metodo,
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!resposta.ok) {
      const erro = await resposta.json();
      await mostrarAlerta(erro.message || 'Não foi possível atualizar seus favoritos.');
      return;
    }

    if (jaFavoritado) {
      favoritosIds.delete(carroId);
    } else {
      favoritosIds.add(carroId);
    }

    botao.classList.toggle('favoritado');

  } catch (erro) {
    await mostrarAlerta('Não foi possível conectar ao servidor.');
  }
}

async function comprarCarro(evento) {
  const botao = evento.target;
  const carroId = botao.dataset.carroId;

  const senhaCompra = await abrirPrompt('Confirmar compra', 'Digite sua senha de compra para confirmar:', 'password');

  if (!senhaCompra) {
    return;
  }

  botao.disabled = true;
  botao.textContent = 'Processando...';

  try {
    const agora = new Date();
    const hoje = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;

    const resposta = await fetch(`${API_URL}/compras`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        cliente: { id: 1 },
        carro: { id: Number(carroId) },
        dataCompra: hoje,
        valorPago: 1,
        senhaCompra: senhaCompra
      })
    });

    if (!resposta.ok) {
      const erro = await resposta.json();
      await mostrarAlerta(erro.message || 'Não foi possível concluir a compra.');
      botao.disabled = false;
      botao.textContent = 'Comprar';
      return;
    }

    await mostrarAlerta('Compra realizada com sucesso!');
    document.querySelectorAll(`.btn-comprar[data-carro-id="${carroId}"]`).forEach((b) => {
      b.textContent = 'Comprado ✓';
      b.disabled = true;
    });
    fecharModal();

  } catch (erro) {
    await mostrarAlerta('Não foi possível conectar ao servidor.');
    botao.disabled = false;
    botao.textContent = 'Comprar';
  }
}

// >>> ALTERADO: usa o objeto { vendedorId, dataHora } e envia o vendedor no corpo
async function agendarVisita(evento) {
  const carroId = evento.target.dataset.carroId;

  const dados = await abrirModalAgendar();
  if (!dados) {
    return;
  }

  try {
    const resposta = await fetch(`${API_URL}/agendamentos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        carro: { id: Number(carroId) },
        vendedor: { id: dados.vendedorId },
        dataHora: dados.dataHora
      })
    });

    if (!resposta.ok) {
      const erro = await resposta.json();
      await mostrarAlerta(erro.message || 'Não foi possível agendar a visita.');
      return;
    }

    await mostrarAlerta('Visita agendada com sucesso! Aguarde a confirmação.');
    fecharModal();

  } catch (erro) {
    await mostrarAlerta('Não foi possível conectar ao servidor.');
  }
}
// >>> FIM DA ALTERAÇÃO

function abrirModal(carro) {
  document.getElementById('modal-imagem').src = carro.imagemUrl ? `${API_URL}${carro.imagemUrl}` : '';
  document.getElementById('modal-marca').textContent = carro.marca;
  document.getElementById('modal-modelo').textContent = carro.modelo;
  document.getElementById('modal-ano').textContent = carro.ano;
  document.getElementById('modal-cor').textContent = carro.cor;
  document.getElementById('modal-km').textContent = carro.quilometragem != null ? `${carro.quilometragem.toLocaleString('pt-BR')} km` : '—';
  document.getElementById('modal-combustivel').textContent = formatarEnum(carro.combustivel);
  document.getElementById('modal-cambio').textContent = formatarEnum(carro.cambio);
  document.getElementById('modal-portas').textContent = carro.portas != null ? carro.portas : '—';
  document.getElementById('modal-preco').textContent = `R$ ${carro.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const btnComprarModal = document.getElementById('btn-comprar-modal');
  btnComprarModal.dataset.carroId = carro.id;
  btnComprarModal.onclick = comprarCarro;

  const btnAgendarModal = document.getElementById('btn-agendar-modal');
  btnAgendarModal.dataset.carroId = carro.id;
  btnAgendarModal.onclick = agendarVisita;

  document.getElementById('modal-overlay').classList.add('aberto');
}

function formatarEnum(valor) {
  if (!valor) return '—';
  const mapa = {
    GASOLINA: 'Gasolina', ETANOL: 'Etanol', FLEX: 'Flex', DIESEL: 'Diesel',
    ELETRICO: 'Elétrico', HIBRIDO: 'Híbrido',
    MANUAL: 'Manual', AUTOMATICO: 'Automático', CVT: 'CVT'
  };
  return mapa[valor] || valor;
}

function fecharModal() {
  document.getElementById('modal-overlay').classList.remove('aberto');
}

document.getElementById('btn-fechar-modal').addEventListener('click', fecharModal);

document.getElementById('modal-overlay').addEventListener('click', (evento) => {
  if (evento.target.id === 'modal-overlay') {
    fecharModal();
  }
});

document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape') {
    fecharModal();
  }
});

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

carregarCarros();