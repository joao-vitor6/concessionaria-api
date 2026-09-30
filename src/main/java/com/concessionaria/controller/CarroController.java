package com.concessionaria.controller;

import com.concessionaria.model.Carro;
import com.concessionaria.service.CarroService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/carros")
public class CarroController {




    @Autowired
    private CarroService carroService;

    @GetMapping
    public List<Carro> listarTodos() {
        return carroService.listarTodos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Carro> buscarPorId(@PathVariable Long id) {
        return carroService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Carro> criar(@Valid @RequestBody Carro carro) {
        Carro carroSalvo = carroService.salvar(carro);
        return ResponseEntity.status(HttpStatus.CREATED).body(carroSalvo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Carro> atualizar(@PathVariable Long id, @Valid @RequestBody Carro carro) {
        if (carroService.buscarPorId(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Carro carroAtualizado = carroService.atualizar(id, carro);
        return ResponseEntity.ok(carroAtualizado);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        if (carroService.buscarPorId(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        carroService.deletar(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/imagem")
    public ResponseEntity<Carro> uploadImagem(@PathVariable Long id, @RequestParam("arquivo") MultipartFile arquivo) {
        Carro carro = carroService.salvarImagem(id, arquivo);
        return ResponseEntity.ok(carro);
    }
}