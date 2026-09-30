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

const tabelaEl = document.getElementById('tabela-carros');
const formPanel = document.getElementById('form-panel');
const form = document.getElementById('form-carro');
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

function abrirFormulario(carro = null) {
  form.reset();
  document.getElementById('carro-id').value = '';

  if (carro) {
    formTitulo.textContent = 'Editar carro';
    document.getElementById('carro-id').value = carro.id;
    document.getElementById('marca').value = carro.marca;
    document.getElementById('modelo').value = carro.modelo;
    document.getElementById('cor').value = carro.cor;
    document.getElementById('ano').value = carro.ano;
    document.getElementById('preco').value = carro.preco;
    document.getElementById('quilometragem').value = carro.quilometragem;
    document.getElementById('combustivel').value = carro.combustivel;
    document.getElementById('cambio').value = carro.cambio;
    document.getElementById('portas').value = carro.portas;
  } else {
    formTitulo.textContent = 'Novo carro';
  }

  formPanel.classList.add('aberto');
}

function fecharFormulario() {
  formPanel.classList.remove('aberto');
  form.reset();
}

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const id = document.getElementById('carro-id').value;
  const corpo = {
    marca: document.getElementById('marca').value,
    modelo: document.getElementById('modelo').value,
    cor: document.getElementById('cor').value,
    ano: Number(document.getElementById('ano').value),
    preco: Number(document.getElementById('preco').value),
    quilometragem: Number(document.getElementById('quilometragem').value),
    combustivel: document.getElementById('combustivel').value,
    cambio: document.getElementById('cambio').value,
    portas: Number(document.getElementById('portas').value)
  };

  const url = id ? `${API_URL}/carros/${id}` : `${API_URL}/carros`;
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
    exibirMensagem(id ? 'Carro atualizado com sucesso.' : 'Carro criado com sucesso.', 'success');
    fecharFormulario();
    carregarCarros();

  } catch (erro) {
    exibirMensagem('Não foi possível conectar ao servidor.', 'error');
  }
});

async function excluirCarro(id) {
  const confirmou = await mostrarConfirmacao('Tem certeza que deseja excluir este carro?');
  if (!confirmou) {
    return;
  }

  try {
    const resposta = await fetch(`${API_URL}/carros/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!resposta.ok) {
      const erro = await resposta.json();
      exibirMensagem(erro.message || 'Não foi possível excluir o carro.', 'error');
      return;
    }

    exibirMensagem('Carro excluído com sucesso.', 'success');
    carregarCarros();

  } catch (erro) {
    exibirMensagem('Não foi possível conectar ao servidor.', 'error');
  }
}

async function carregarCarros() {
  try {
    const resposta = await fetch(`${API_URL}/carros`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const carros = await resposta.json();
    renderizarTabela(carros);

  } catch (erro) {
    tabelaEl.innerHTML = '<tr><td colspan="6">Não foi possível carregar os carros.</td></tr>';
  }
}

function renderizarTabela(carros) {
  if (carros.length === 0) {
    tabelaEl.innerHTML = '<tr><td colspan="6">Nenhum carro cadastrado.</td></tr>';
    return;
  }

  tabelaEl.innerHTML = carros.map((carro) => `
    <tr>
      <td>${carro.marca}</td>
      <td>${carro.modelo}</td>
      <td>${carro.cor}</td>
      <td>${carro.ano}</td>
      <td>R$ ${carro.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      <td class="acoes">
        <button class="link-acao" data-editar="${carro.id}">Editar</button>
        <button class="link-acao" data-imagem="${carro.id}">Imagem</button>
        <button class="link-acao excluir" data-excluir="${carro.id}">Excluir</button>
      </td>
    </tr>
  `).join('');

  document.querySelectorAll('[data-editar]').forEach((botao) => {
    botao.addEventListener('click', () => {
      const carro = carros.find((c) => c.id === Number(botao.dataset.editar));
      abrirFormulario(carro);
    });
  });

  document.querySelectorAll('[data-excluir]').forEach((botao) => {
    botao.addEventListener('click', () => {
      excluirCarro(Number(botao.dataset.excluir));
    });
  });

  document.querySelectorAll('[data-imagem]').forEach((botao) => {
    botao.addEventListener('click', () => {
      abrirSeletorDeImagem(Number(botao.dataset.imagem));
    });
  });
}

let carroIdParaImagem = null;
const inputImagem = document.getElementById('input-imagem');

function abrirSeletorDeImagem(carroId) {
  carroIdParaImagem = carroId;
  inputImagem.click();
}

inputImagem.addEventListener('change', async (evento) => {
  const arquivo = evento.target.files[0];
  if (!arquivo || !carroIdParaImagem) return;

  const formData = new FormData();
  formData.append('arquivo', arquivo);

  try {
    const resposta = await fetch(`${API_URL}/carros/${carroIdParaImagem}/imagem`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    if (!resposta.ok) {
      const erro = await resposta.json();
      exibirMensagem(erro.message || 'Não foi possível enviar a imagem.', 'error');
      return;
    }

    exibirMensagem('Imagem atualizada com sucesso.', 'success');
    carregarCarros();

  } catch (erro) {
    exibirMensagem('Não foi possível conectar ao servidor.', 'error');
  }

  inputImagem.value = '';
});

function exibirMensagem(texto, tipo) {
  mensagemEl.className = `form-message ${tipo}`;
  mensagemEl.textContent = texto;
  setTimeout(() => {
    mensagemEl.className = 'form-message';
  }, 3500);
}

function montarMensagemDeErros(errors) {
  if (!errors) return 'Não foi possível salvar o carro.';
  return Object.values(errors).join(' — ');
}

function decodificarToken(token) {
  const payloadBase64 = token.split('.')[1];
  const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(payloadJson);
}

carregarCarros();