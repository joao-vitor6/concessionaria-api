package com.concessionaria.config;

import com.concessionaria.model.Role;
import com.concessionaria.model.Usuario;
import com.concessionaria.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class UsuarioInitializer implements CommandLineRunner {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${admin.default.email}")
    private String emailPadrao;

    @Value("${admin.default.senha}")
    private String senhaPadrao;

    @Override
    public void run(String... args) {
        if (usuarioRepository.findByEmail(emailPadrao).isEmpty()) {
            Usuario admin = new Usuario();
            admin.setEmail(emailPadrao);
            admin.setSenha(passwordEncoder.encode(senhaPadrao));
            admin.setRole(Role.ADMIN);
            admin.setNome("Administrador");
            usuarioRepository.save(admin);
            System.out.println("Admin padrao criado: " + emailPadrao);
        }
    }
}