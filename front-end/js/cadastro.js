const API_URL = 'http://localhost:9090';

const form = document.getElementById('form-cadastro');
const mensagemEl = document.getElementById('mensagem');

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const nome = document.getElementById('nome').value;
  const cpf = document.getElementById('cpf').value;
  const telefone = document.getElementById('telefone').value;
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;
  const senhaCompra = document.getElementById('senha-compra').value;

  mensagemEl.className = 'form-message';
  mensagemEl.textContent = '';

  try {
    const resposta = await fetch(`${API_URL}/usuarios/registrar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, cpf, telefone, email, senha, senhaCompra })
    });

    if (!resposta.ok) {
      const erro = await resposta.json();
      mensagemEl.className = 'form-message error';
      mensagemEl.textContent = erro.message || montarMensagemDeErros(erro.errors);
      return;
    }

    mensagemEl.className = 'form-message success';
    mensagemEl.textContent = 'Conta criada com sucesso! Redirecionando para o login...';

    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1200);

  } catch (erro) {
    mensagemEl.className = 'form-message error';
    mensagemEl.textContent = 'Não foi possível conectar ao servidor.';
  }
});

function montarMensagemDeErros(errors) {
  if (!errors) return 'Não foi possível criar sua conta.';
  return Object.values(errors).join(' ');
}