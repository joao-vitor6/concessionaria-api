package com.concessionaria.service;

import com.concessionaria.model.Cliente;
import com.concessionaria.model.Role;
import com.concessionaria.model.Usuario;
import com.concessionaria.repository.ClienteRepository;
import com.concessionaria.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.context.SecurityContextHolder;



@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private LogAuditoriaService logAuditoriaService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Usuario registrar(String email, String senha, String nome, String cpf, String telefone, String senhaCompra) {
        if (usuarioRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Já existe uma conta cadastrada com esse email");
        }

        if (clienteRepository.existsByCpf(cpf)) {
            throw new IllegalArgumentException("Já existe um cliente cadastrado com esse CPF");
        }

        if (senhaCompra == null || senhaCompra.isBlank()) {
            throw new IllegalArgumentException("A senha de compra é obrigatória");
        }

        Cliente cliente = new Cliente();
        cliente.setNome(nome);
        cliente.setCpf(cpf);
        cliente.setEmail(email);
        cliente.setTelefone(telefone);
        clienteRepository.save(cliente);

        Usuario usuario = new Usuario();
        usuario.setEmail(email);
        usuario.setSenha(passwordEncoder.encode(senha));
        usuario.setSenhaCompra(passwordEncoder.encode(senhaCompra));
        usuario.setRole(Role.USER);
        usuario.setCliente(cliente);

        return usuarioRepository.save(usuario);
    }

    @Transactional
    public void deletar(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));

        Cliente cliente = usuario.getCliente();

        logAuditoriaService.registrar("Usuario", id, "EXCLUSAO", usuario.getNome() + " (" + usuario.getRole() + ") - " + usuario.getEmail());

        usuarioRepository.deleteById(id);

        if (cliente != null) {
            clienteRepository.deleteById(cliente.getId());
        }
    }
    public List<Usuario> listarTodos() {
        return usuarioRepository.findAll();
    }

    private Usuario getUsuarioLogado() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));
    }

    public Usuario buscarUsuarioLogado() {
        return getUsuarioLogado();
    }

    public void alterarSenha(String senhaAtual, String novaSenha) {
        Usuario usuario = getUsuarioLogado();

        if (!passwordEncoder.matches(senhaAtual, usuario.getSenha())) {
            throw new IllegalArgumentException("Senha atual incorreta");
        }

        if (novaSenha == null || novaSenha.isBlank()) {
            throw new IllegalArgumentException("A nova senha é obrigatória");
        }

        usuario.setSenha(passwordEncoder.encode(novaSenha));
        usuarioRepository.save(usuario);
    }

    public void definirOuAlterarSenhaCompra(String senhaCompraAtual, String novaSenhaCompra) {
        Usuario usuario = getUsuarioLogado();

        boolean jaTemSenhaCompra = usuario.getSenhaCompra() != null && !usuario.getSenhaCompra().isBlank();

        if (jaTemSenhaCompra) {
            if (senhaCompraAtual == null || senhaCompraAtual.isBlank()) {
                throw new IllegalArgumentException("Informe sua senha de compra atual");
            }

            if (!passwordEncoder.matches(senhaCompraAtual, usuario.getSenhaCompra())) {
                throw new IllegalArgumentException("Senha de compra atual incorreta");
            }
        }

        if (novaSenhaCompra == null || novaSenhaCompra.isBlank()) {
            throw new IllegalArgumentException("A nova senha de compra é obrigatória");
        }

        usuario.setSenhaCompra(passwordEncoder.encode(novaSenhaCompra));
        usuarioRepository.save(usuario);
    }

    public void alterarEmail(String senhaAtual, String novoEmail) {
        Usuario usuario = getUsuarioLogado();

        if (senhaAtual == null || !passwordEncoder.matches(senhaAtual, usuario.getSenha())) {
            throw new IllegalArgumentException("Senha atual incorreta");
        }

        if (novoEmail == null || novoEmail.isBlank()) {
            throw new IllegalArgumentException("O novo email é obrigatório");
        }

        if (!novoEmail.equals(usuario.getEmail()) && usuarioRepository.existsByEmail(novoEmail)) {
            throw new IllegalArgumentException("Já existe uma conta cadastrada com esse email");
        }

        usuario.setEmail(novoEmail);
        usuarioRepository.save(usuario);

        if (usuario.getCliente() != null) {
            Cliente cliente = usuario.getCliente();
            cliente.setEmail(novoEmail);
            clienteRepository.save(cliente);
        }
    }

    public Usuario criarFuncionario(String email, String senha, String nome, Role role) {
        if (role != Role.VENDEDOR && role != Role.SECRETARIA) {
            throw new IllegalArgumentException("Role inválida para criação de funcionário");
        }

        if (usuarioRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Já existe uma conta cadastrada com esse email");
        }

        if (nome == null || nome.isBlank()) {
            throw new IllegalArgumentException("O nome é obrigatório");
        }

        Usuario usuario = new Usuario();
        usuario.setEmail(email);
        usuario.setSenha(passwordEncoder.encode(senha));
        usuario.setNome(nome);
        usuario.setRole(role);

        Usuario salvo = usuarioRepository.save(usuario);
        logAuditoriaService.registrar("Usuario", salvo.getId(), "CRIACAO", salvo.getNome() + " (" + salvo.getRole() + ") - " + salvo.getEmail());
        return salvo;
    }

    public List<Usuario> listarVendedores() {
        return usuarioRepository.findByRole(Role.VENDEDOR);
    }



}