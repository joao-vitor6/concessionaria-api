package com.concessionaria.service;

import com.concessionaria.model.*;
import com.concessionaria.repository.CarroRepository;
import com.concessionaria.repository.ClienteRepository;
import com.concessionaria.repository.CompraRepository;
import com.concessionaria.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class CompraService {

    @Autowired
    private CompraRepository compraRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private LogAuditoriaService logAuditoriaService;

    @Autowired
    private CarroRepository carroRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Usuario getUsuarioLogado() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));
    }

    public List<Compra> listarTodos() {
        Usuario usuarioLogado = getUsuarioLogado();

        if (usuarioLogado.getRole() == Role.ADMIN || usuarioLogado.getRole() == Role.SECRETARIA) {
            return compraRepository.findAll();
        }

        if (usuarioLogado.getRole() == Role.VENDEDOR) {
            return compraRepository.findByVendedor(usuarioLogado);
        }

        return compraRepository.findByCliente(usuarioLogado.getCliente());
    }

    public Optional<Compra> buscarPorId(Long id) {
        Usuario usuarioLogado = getUsuarioLogado();
        Optional<Compra> compraOpt = compraRepository.findById(id);

        if (compraOpt.isEmpty()) {
            return Optional.empty();
        }

        Compra compra = compraOpt.get();

        if (usuarioLogado.getRole() != Role.ADMIN
                && !compra.getCliente().getId().equals(usuarioLogado.getCliente().getId())) {
            throw new AccessDeniedException("Você não tem permissão para acessar esta compra");
        }

        return compraOpt;
    }

    public Compra salvar(Compra compra) {
        Usuario usuarioLogado = getUsuarioLogado();

        Carro carro = carroRepository.findById(compra.getCarro().getId())
                .orElseThrow(() -> new IllegalArgumentException("Carro não encontrado"));

        Cliente cliente;
        if (usuarioLogado.getRole() == Role.ADMIN || usuarioLogado.getRole() == Role.SECRETARIA
                || usuarioLogado.getRole() == Role.VENDEDOR) {
            cliente = clienteRepository.findById(compra.getCliente().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado"));

            if (usuarioLogado.getRole() == Role.VENDEDOR) {
                compra.setVendedor(usuarioLogado);
            }
        } else {
            if (usuarioLogado.getCliente() == null) {
                throw new IllegalArgumentException("Sua conta não possui um cliente vinculado");
            }

            if (usuarioLogado.getSenhaCompra() == null) {
                throw new IllegalArgumentException("Você precisa definir uma senha de compra no seu perfil antes de comprar");
            }

            if (compra.getSenhaCompra() == null || compra.getSenhaCompra().isBlank()) {
                throw new IllegalArgumentException("Forneça a senha de compra para confirmar");
            }

            if (compra.getSenhaCompra() == null || !passwordEncoder.matches(compra.getSenhaCompra(), usuarioLogado.getSenhaCompra())) {
                throw new IllegalArgumentException("Senha de compra incorreta");
            }

            cliente = usuarioLogado.getCliente();
            compra.setValorPago(carro.getPreco());
            compra.setDataCompra(LocalDate.now());
        }

        if (usuarioLogado.getRole() != Role.USER) {
            if (compra.getDataCompra() != null && compra.getDataCompra().isAfter(LocalDate.now())) {
                throw new IllegalArgumentException("A data da compra não pode ser no futuro");
            }

            if (compra.getDataCompra() != null && compra.getDataCompra().getYear() < carro.getAno()) {
                throw new IllegalArgumentException("A data da compra não pode ser anterior ao ano de fabricação do carro (" + carro.getAno() + ")");
            }
        }

        compra.setCliente(cliente);
        compra.setCarro(carro);
        compra.setStatus(StatusCompra.ATIVA);

        Compra salva = compraRepository.save(compra);
        logAuditoriaService.registrar("Compra", salva.getId(), "CRIACAO",
                salva.getCliente().getNome() + " comprou " + salva.getCarro().getMarca() + " " + salva.getCarro().getModelo()
                        + " por R$ " + salva.getValorPago());
        return salva;
    }

    public Compra cancelar(Long id, String senhaCompra, String senhaAdmin) {
        Usuario usuarioLogado = getUsuarioLogado();

        Compra compra = compraRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Compra não encontrada"));

        if (compra.getStatus() == StatusCompra.CANCELADA) {
            throw new IllegalArgumentException("Esta compra já está cancelada");
        }

        if (usuarioLogado.getRole() == Role.ADMIN) {
            if (senhaAdmin == null || senhaAdmin.isBlank()) {
                throw new IllegalArgumentException("Forneça sua senha para confirmar o cancelamento");
            }

            if (!passwordEncoder.matches(senhaAdmin, usuarioLogado.getSenha())) {
                throw new IllegalArgumentException("Senha incorreta");
            }
        } else {
            if (!compra.getCliente().getId().equals(usuarioLogado.getCliente().getId())) {
                throw new AccessDeniedException("Você não tem permissão para cancelar esta compra");
            }

            if (usuarioLogado.getSenhaCompra() == null || usuarioLogado.getSenhaCompra().isBlank()) {
                throw new IllegalArgumentException("Você precisa definir uma senha de compra no seu perfil para cancelar compras");
            }

            if (senhaCompra == null || senhaCompra.isBlank()) {
                throw new IllegalArgumentException("Forneça a senha de compra para confirmar o cancelamento");
            }

            if (!passwordEncoder.matches(senhaCompra, usuarioLogado.getSenhaCompra())) {
                throw new IllegalArgumentException("Senha de compra incorreta");
            }
        }

        compra.setStatus(StatusCompra.CANCELADA);
        Compra salva = compraRepository.save(compra);
        logAuditoriaService.registrar("Compra", salva.getId(), "CANCELAMENTO",
                salva.getCliente().getNome() + " - " + salva.getCarro().getMarca() + " " + salva.getCarro().getModelo());
        return salva;
    }
}