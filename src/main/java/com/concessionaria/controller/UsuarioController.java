package com.concessionaria.controller;

import com.concessionaria.model.Usuario;
import com.concessionaria.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import com.concessionaria.model.Role;

import java.util.Map;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;


    @PostMapping("/registrar")
    public ResponseEntity<Map<String, String>> registrar(@RequestBody Map<String, String> dados) {
        String email = dados.get("email");
        String senha = dados.get("senha");
        String nome = dados.get("nome");
        String cpf = dados.get("cpf");
        String telefone = dados.get("telefone");
        String senhaCompra = dados.get("senhaCompra");

        Usuario usuario = usuarioService.registrar(email, senha, nome, cpf, telefone, senhaCompra);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("email", usuario.getEmail(), "role", usuario.getRole().name()));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        usuarioService.deletar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public List<Usuario> listarTodos() {
        return usuarioService.listarTodos();
    }

    @GetMapping("/me")
    public ResponseEntity<Usuario> me() {
        return ResponseEntity.ok(usuarioService.buscarUsuarioLogado());
    }

    @PutMapping("/senha")
    public ResponseEntity<Void> alterarSenha(@RequestBody Map<String, String> dados) {
        usuarioService.alterarSenha(dados.get("senhaAtual"), dados.get("novaSenha"));
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/senha-compra")
    public ResponseEntity<Void> definirSenhaCompra(@RequestBody Map<String, String> dados) {
        usuarioService.definirOuAlterarSenhaCompra(dados.get("senhaCompraAtual"), dados.get("novaSenhaCompra"));
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/email")
    public ResponseEntity<Void> alterarEmail(@RequestBody Map<String, String> dados) {
        usuarioService.alterarEmail(dados.get("senhaAtual"), dados.get("novoEmail"));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/funcionario")
    public ResponseEntity<Map<String, String>> criarFuncionario(@RequestBody Map<String, String> dados) {
        Role role = Role.valueOf(dados.get("role"));
        Usuario usuario = usuarioService.criarFuncionario(
                dados.get("email"), dados.get("senha"), dados.get("nome"), role
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("email", usuario.getEmail(), "role", usuario.getRole().name()));
    }

    @GetMapping("/vendedores")
    public List<Map<String, Object>> listarVendedores() {
        return usuarioService.listarVendedores().stream()
                .map(v -> Map.<String, Object>of("id", v.getId(), "nome", v.getNome()))
                .toList();
    }



}