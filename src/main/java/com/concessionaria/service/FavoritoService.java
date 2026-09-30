package com.concessionaria.service;

import com.concessionaria.model.Carro;
import com.concessionaria.model.Cliente;
import com.concessionaria.model.Favorito;
import com.concessionaria.model.Usuario;
import com.concessionaria.repository.CarroRepository;
import com.concessionaria.repository.FavoritoRepository;
import com.concessionaria.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FavoritoService {

    @Autowired
    private FavoritoRepository favoritoRepository;

    @Autowired
    private CarroRepository carroRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    private Cliente getClienteDoUsuarioLogado() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));

        if (usuario.getCliente() == null) {
            throw new IllegalArgumentException("Sua conta não possui um cliente vinculado");
        }

        return usuario.getCliente();
    }

    public List<Favorito> listarMeusFavoritos() {
        Cliente cliente = getClienteDoUsuarioLogado();
        return favoritoRepository.findByCliente(cliente);
    }

    public void adicionar(Long carroId) {
        Cliente cliente = getClienteDoUsuarioLogado();

        Carro carro = carroRepository.findById(carroId)
                .orElseThrow(() -> new IllegalArgumentException("Carro não encontrado"));

        if (favoritoRepository.existsByClienteAndCarro(cliente, carro)) {
            throw new IllegalArgumentException("Este carro já está nos seus favoritos");
        }

        Favorito favorito = new Favorito();
        favorito.setCliente(cliente);
        favorito.setCarro(carro);
        favoritoRepository.save(favorito);
    }

    public void remover(Long carroId) {
        Cliente cliente = getClienteDoUsuarioLogado();

        Carro carro = carroRepository.findById(carroId)
                .orElseThrow(() -> new IllegalArgumentException("Carro não encontrado"));

        Favorito favorito = favoritoRepository.findByClienteAndCarro(cliente, carro)
                .orElseThrow(() -> new IllegalArgumentException("Este carro não está nos seus favoritos"));

        favoritoRepository.deleteById(favorito.getId());
    }
}