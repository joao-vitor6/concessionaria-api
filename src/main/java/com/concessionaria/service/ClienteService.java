package com.concessionaria.service;

import com.concessionaria.model.Cliente;
import com.concessionaria.model.Usuario;
import com.concessionaria.repository.ClienteRepository;
import com.concessionaria.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ClienteService {

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private LogAuditoriaService logAuditoriaService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    public List<Cliente> listarTodos() {
        return clienteRepository.findAll();
    }

    public Optional<Cliente> buscarPorId(Long id) {
        return clienteRepository.findById(id);
    }

    public Cliente salvar(Cliente cliente) {
        if (clienteRepository.existsByCpf(cliente.getCpf())) {
            throw new IllegalArgumentException("Já existe um cliente cadastrado com esse CPF");
        }

        if (clienteRepository.existsByEmail(cliente.getEmail())) {
            throw new IllegalArgumentException("Já existe um cliente cadastrado com esse email");
        }

        String emailLogado = SecurityContextHolder.getContext().getAuthentication().getName();
        cliente.setCriadoPor(emailLogado);
        cliente.setAtualizadoPor(emailLogado);

        Cliente salvo = clienteRepository.save(cliente);
        logAuditoriaService.registrar("Cliente", salvo.getId(), "CRIACAO", salvo.getNome() + " - " + salvo.getCpf());
        return salvo;
    }

    public Cliente atualizar(Long id, Cliente clienteAtualizado) {
        Cliente clienteExistente = clienteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado"));

        clienteExistente.setNome(clienteAtualizado.getNome());
        clienteExistente.setCpf(clienteAtualizado.getCpf());
        clienteExistente.setEmail(clienteAtualizado.getEmail());
        clienteExistente.setTelefone(clienteAtualizado.getTelefone());

        String emailLogado = SecurityContextHolder.getContext().getAuthentication().getName();
        clienteExistente.setAtualizadoPor(emailLogado);

        Cliente salvo = clienteRepository.save(clienteExistente);
        logAuditoriaService.registrar("Cliente", salvo.getId(), "ATUALIZACAO", salvo.getNome() + " - " + salvo.getCpf());
        return salvo;
    }
    public void deletar(Long id) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado"));

        logAuditoriaService.registrar("Cliente", id, "EXCLUSAO", cliente.getNome() + " - " + cliente.getCpf());
        clienteRepository.deleteById(id);
    }

    private Cliente getClienteDoUsuarioLogado() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));

        if (usuario.getCliente() == null) {
            throw new IllegalArgumentException("Sua conta não possui um cliente vinculado");
        }

        return usuario.getCliente();
    }

    public Cliente atualizarProprioCliente(String nome, String telefone) {
        Cliente cliente = getClienteDoUsuarioLogado();

        if (nome != null && !nome.isBlank()) {
            cliente.setNome(nome);
        }
        if (telefone != null && !telefone.isBlank()) {
            cliente.setTelefone(telefone);
        }

        return clienteRepository.save(cliente);
    }
}