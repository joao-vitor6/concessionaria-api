package com.concessionaria.controller;

import com.concessionaria.model.Compra;
import com.concessionaria.service.CompraService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;


import java.util.List;

@RestController
@RequestMapping("/compras")
public class CompraController {

    @Autowired
    private CompraService compraService;

    @GetMapping
    public List<Compra> listarTodos() {
        return compraService.listarTodos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Compra> buscarPorId(@PathVariable Long id) {
        return compraService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Compra> criar(@Valid @RequestBody Compra compra) {
        Compra compraSalva = compraService.salvar(compra);
        return ResponseEntity.status(HttpStatus.CREATED).body(compraSalva);
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Compra> cancelar(@PathVariable Long id, @RequestBody(required = false) Map<String, String> dados) {
        String senhaCompra = dados != null ? dados.get("senhaCompra") : null;
        String senhaAdmin = dados != null ? dados.get("senha") : null;
        Compra compra = compraService.cancelar(id, senhaCompra, senhaAdmin);
        return ResponseEntity.ok(compra);
    }
}