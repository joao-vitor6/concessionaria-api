package com.concessionaria.service;

import com.concessionaria.model.LogAuditoria;
import com.concessionaria.repository.LogAuditoriaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class LogAuditoriaService {

    @Autowired
    private LogAuditoriaRepository logAuditoriaRepository;

    public void registrar(String entidade, Long entidadeId, String acao, String detalhes) {
        String emailLogado = SecurityContextHolder.getContext().getAuthentication().getName();

        LogAuditoria log = new LogAuditoria();
        log.setEntidade(entidade);
        log.setEntidadeId(entidadeId);
        log.setAcao(acao);
        log.setUsuarioResponsavel(emailLogado);
        log.setDataHora(LocalDateTime.now());
        log.setDetalhes(detalhes);

        logAuditoriaRepository.save(log);
    }

    public List<LogAuditoria> listarTodos() {
        return logAuditoriaRepository.findAll();
    }
}