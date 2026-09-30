package com.concessionaria.controller;

import com.concessionaria.model.Agendamento;
import com.concessionaria.service.AgendamentoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/agendamentos")
public class AgendamentoController {

    @Autowired
    private AgendamentoService agendamentoService;

    @GetMapping
    public List<Agendamento> listarMeus() {
        return agendamentoService.listarMeus();
    }

    @GetMapping("/disponibilidade")
    public List<Map<String, Object>> disponibilidade(@RequestParam Long vendedorId, @RequestParam String data) {
        LocalDate dia;
        try {
            dia = LocalDate.parse(data);
        } catch (Exception e) {
            throw new IllegalArgumentException("Data inválida. Use o formato AAAA-MM-DD");
        }
        return agendamentoService.disponibilidade(vendedorId, dia);
    }

    @PostMapping
    public ResponseEntity<Agendamento> agendar(@Valid @RequestBody Agendamento agendamento) {
        Agendamento salvo = agendamentoService.agendar(agendamento);
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }

    @PutMapping("/{id}/confirmar")
    public ResponseEntity<Agendamento> confirmar(@PathVariable Long id) {
        return ResponseEntity.ok(agendamentoService.confirmar(id));
    }

    @PutMapping("/{id}/cancelar")
    public ResponseEntity<Agendamento> cancelar(@PathVariable Long id) {
        return ResponseEntity.ok(agendamentoService.cancelar(id));
    }
}