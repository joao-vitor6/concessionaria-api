package com.concessionaria.controller;

import com.concessionaria.model.Favorito;
import com.concessionaria.service.FavoritoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/favoritos")
public class FavoritoController {

    @Autowired
    private FavoritoService favoritoService;

    @GetMapping
    public List<Favorito> listarMeusFavoritos() {
        return favoritoService.listarMeusFavoritos();
    }

    @PostMapping("/{carroId}")
    public ResponseEntity<Void> adicionar(@PathVariable Long carroId) {
        favoritoService.adicionar(carroId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{carroId}")
    public ResponseEntity<Void> remover(@PathVariable Long carroId) {
        favoritoService.remover(carroId);
        return ResponseEntity.noContent().build();
    }
}