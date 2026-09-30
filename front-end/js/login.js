const API_URL = 'http://localhost:9090';

const form = document.getElementById('form-login');
const mensagemEl = document.getElementById('mensagem');

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;

  mensagemEl.className = 'form-message';
  mensagemEl.textContent = '';

  try {
    const resposta = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });

    if (!resposta.ok) {
      const erro = await resposta.json();
      mensagemEl.className = 'form-message error';
      mensagemEl.textContent = erro.message || 'Não foi possível entrar.';
      return;
    }

    const dados = await resposta.json();
    localStorage.setItem('token', dados.token);

    const payload = decodificarToken(dados.token);

    mensagemEl.className = 'form-message success';
    mensagemEl.textContent = 'Login realizado! Redirecionando...';

    setTimeout(() => {
      let destino = 'catalogo.html';
      if (payload.role === 'ADMIN') {
        destino = 'admin-carros.html';
      } else if (payload.role === 'VENDEDOR') {
        destino = 'vendedor-agendamentos.html';
      } else if (payload.role === 'SECRETARIA') {
        destino = 'secretaria-clientes.html';
      }
      window.location.href = destino;
    }, 800);

  } catch (erro) {
    mensagemEl.className = 'form-message error';
    mensagemEl.textContent = 'Não foi possível conectar ao servidor.';
  }
});

function decodificarToken(token) {
  const payloadBase64 = token.split('.')[1];
  const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(payloadJson);
}