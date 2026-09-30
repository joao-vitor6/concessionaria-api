package com.concessionaria.controller;

import com.concessionaria.model.LogAuditoria;
import com.concessionaria.service.LogAuditoriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/auditoria")
public class LogAuditoriaController {

    @Autowired
    private LogAuditoriaService logAuditoriaService;

    @GetMapping
    public List<LogAuditoria> listarTodos() {
        return logAuditoriaService.listarTodos();
    }
}