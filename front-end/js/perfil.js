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

document.getElementById('btn-logout').addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
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

const formDados = document.getElementById('form-dados');
const mensagemDadosEl = document.getElementById('mensagem-dados');

const formSenha = document.getElementById('form-senha');
const mensagemSenhaEl = document.getElementById('mensagem-senha');

const formEmail = document.getElementById('form-email');
const mensagemEmailEl = document.getElementById('mensagem-email');

async function carregarMeusDados() {
  try {
    const resposta = await fetch(`${API_URL}/usuarios/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (resposta.status === 401) {
      localStorage.removeItem('token');
      window.location.href = 'index.html';
      return;
    }

    const usuario = await resposta.json();

    document.getElementById('email-exibicao').value = usuario.email;
    document.getElementById('titulo-perfil').textContent = usuario.cliente ? usuario.cliente.nome : 'Meu perfil';

    if (usuario.cliente) {
      document.getElementById('nome').value = usuario.cliente.nome;
      document.getElementById('telefone').value = usuario.cliente.telefone;
      document.getElementById('cpf-exibicao').value = usuario.cliente.cpf;
    }

  } catch (erro) {
    exibirMensagem(mensagemDadosEl, 'Não foi possível carregar seus dados.', 'error');
  }
}

formDados.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const corpo = {
    nome: document.getElementById('nome').value,
    telefone: document.getElementById('telefone').value
  };

  try {
    const resposta = await fetch(`${API_URL}/clientes/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(corpo)
    });

    if (!resposta.ok) {
      const erro = await resposta.json();
      exibirMensagem(mensagemDadosEl, erro.message || montarMensagemDeErros(erro.errors), 'error');
      return;
    }

    exibirMensagem(mensagemDadosEl, 'Dados atualizados com sucesso.', 'success');

  } catch (erro) {
    exibirMensagem(mensagemDadosEl, 'Não foi possível conectar ao servidor.', 'error');
  }
});

formSenha.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const corpo = {
    senhaAtual: document.getElementById('senha-atual').value,
    novaSenha: document.getElementById('nova-senha').value
  };

  try {
    const resposta = await fetch(`${API_URL}/usuarios/senha`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(corpo)
    });

    if (!resposta.ok) {
      const erro = await resposta.json();
      exibirMensagem(mensagemSenhaEl, erro.message || montarMensagemDeErros(erro.errors), 'error');
      return;
    }

    exibirMensagem(mensagemSenhaEl, 'Senha alterada com sucesso.', 'success');
    formSenha.reset();

  } catch (erro) {
    exibirMensagem(mensagemSenhaEl, 'Não foi possível conectar ao servidor.', 'error');
  }
});

function exibirMensagem(elemento, texto, tipo) {
  elemento.className = `form-message ${tipo}`;
  elemento.innerHTML = texto;
  setTimeout(() => {
    elemento.className = 'form-message';
  }, 3500);
}
function montarMensagemDeErros(errors) {
  if (!errors) return 'Não foi possível concluir a ação.';
  return Object.values(errors).join('<br>');
}
const formSenhaCompra = document.getElementById('form-senha-compra');
const mensagemSenhaCompraEl = document.getElementById('mensagem-senha-compra');

formSenhaCompra.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const corpo = {
    senhaCompraAtual: document.getElementById('senha-compra-atual').value,
    novaSenhaCompra: document.getElementById('nova-senha-compra').value
  };

  try {
    const resposta = await fetch(`${API_URL}/usuarios/senha-compra`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(corpo)
    });

    if (!resposta.ok) {
      const erro = await resposta.json();
      exibirMensagem(mensagemSenhaCompraEl, erro.message || montarMensagemDeErros(erro.errors), 'error');
      return;
    }

    exibirMensagem(mensagemSenhaCompraEl, 'Senha de compra salva com sucesso.', 'success');
    formSenhaCompra.reset();

  } catch (erro) {
    exibirMensagem(mensagemSenhaCompraEl, 'Não foi possível conectar ao servidor.', 'error');
  }
});

formEmail.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const corpo = {
    senhaAtual: document.getElementById('senha-atual-email').value,
    novoEmail: document.getElementById('novo-email').value
  };

  try {
    const resposta = await fetch(`${API_URL}/usuarios/email`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(corpo)
    });

    if (!resposta.ok) {
      const erro = await resposta.json();
      exibirMensagem(mensagemEmailEl, erro.message || montarMensagemDeErros(erro.errors), 'error');
      return;
    }

    alert('Email alterado com sucesso! Faça login novamente com o novo email.');
    localStorage.removeItem('token');
    window.location.href = 'index.html';

  } catch (erro) {
    exibirMensagem(mensagemEmailEl, 'Não foi possível conectar ao servidor.', 'error');
  }
});

carregarMeusDados();