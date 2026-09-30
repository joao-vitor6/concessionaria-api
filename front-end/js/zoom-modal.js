(function () {
  const overlay = document.getElementById('modal-overlay');
  const container = document.querySelector('.modal-imagem-container');
  const imagem = document.getElementById('modal-imagem');

  if (!overlay || !container || !imagem) return;

  function atualizarOrigem(evento) {
    const area = container.getBoundingClientRect();
    const x = ((evento.clientX - area.left) / area.width) * 100;
    const y = ((evento.clientY - area.top) / area.height) * 100;
    imagem.style.transformOrigin = `${x}% ${y}%`;
  }

  function resetarZoom() {
    container.classList.remove('zoom');
    imagem.style.transformOrigin = 'center';
  }

  container.addEventListener('click', (evento) => {
    if (!imagem.getAttribute('src')) return;

    if (container.classList.contains('zoom')) {
      container.classList.remove('zoom');
    } else {
      atualizarOrigem(evento);
      container.classList.add('zoom');
    }
  });

  container.addEventListener('mousemove', (evento) => {
    if (container.classList.contains('zoom')) atualizarOrigem(evento);
  });

  container.addEventListener('mouseleave', () => {
    container.classList.remove('zoom');
  });

  new MutationObserver(resetarZoom).observe(overlay, {
    attributes: true,
    attributeFilter: ['class']
  });
})();