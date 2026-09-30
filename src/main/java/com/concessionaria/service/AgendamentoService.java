package com.concessionaria.service;

import com.concessionaria.model.*;
import com.concessionaria.repository.AgendamentoRepository;
import com.concessionaria.repository.CarroRepository;
import com.concessionaria.repository.ClienteRepository;
import com.concessionaria.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class AgendamentoService {

    @Autowired
    private AgendamentoRepository agendamentoRepository;

    @Autowired
    private LogAuditoriaService logAuditoriaService;

    @Autowired
    private CarroRepository carroRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    private Usuario getUsuarioLogado() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));
    }

    public List<Agendamento> listarMeus() {
        Usuario usuarioLogado = getUsuarioLogado();

        if (usuarioLogado.getRole() == Role.ADMIN || usuarioLogado.getRole() == Role.SECRETARIA) {
            return agendamentoRepository.findAll();
        }

        if (usuarioLogado.getRole() == Role.VENDEDOR) {
            return agendamentoRepository.findByVendedor(usuarioLogado);
        }

        return agendamentoRepository.findByCliente(usuarioLogado.getCliente());
    }

    public Agendamento agendar(Agendamento agendamento) {
        Usuario usuarioLogado = getUsuarioLogado();

        Carro carro = carroRepository.findById(agendamento.getCarro().getId())
                .orElseThrow(() -> new IllegalArgumentException("Carro não encontrado"));

        if (agendamento.getDataHora() == null || agendamento.getDataHora().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("A data e hora do agendamento devem ser no futuro");
        }

        DayOfWeek diaDaSemana = agendamento.getDataHora().getDayOfWeek();
        if (diaDaSemana == DayOfWeek.SATURDAY || diaDaSemana == DayOfWeek.SUNDAY) {
            throw new IllegalArgumentException("A concessionária funciona de segunda a sexta-feira");
        }

        int hora = agendamento.getDataHora().getHour();
        if (hora < 9 || hora >= 18) {
            throw new IllegalArgumentException("A concessionária funciona das 9h às 18h. Escolha um horário dentro desse período");
        }

        List<Agendamento> agendamentosDoCarro = agendamentoRepository.findByCarroAndStatusIn(
                carro, List.of(StatusAgendamento.PENDENTE, StatusAgendamento.CONFIRMADO)
        );

        boolean conflitoCarro = agendamentosDoCarro.stream().anyMatch(existente ->
                Math.abs(Duration.between(existente.getDataHora(), agendamento.getDataHora()).toMinutes()) < 60
        );

        if (conflitoCarro) {
            throw new IllegalArgumentException("Este carro já está reservado nesse horário ou muito próximo dele (é necessário pelo menos 1h de intervalo)");
        }

        Cliente cliente;
        if (usuarioLogado.getRole() == Role.ADMIN || usuarioLogado.getRole() == Role.SECRETARIA) {
            cliente = clienteRepository.findById(agendamento.getCliente().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado"));
        } else {
            if (usuarioLogado.getCliente() == null) {
                throw new IllegalArgumentException("Sua conta não possui um cliente vinculado");
            }
            cliente = usuarioLogado.getCliente();
        }

        if (agendamento.getVendedor() == null || agendamento.getVendedor().getId() == null) {
            throw new IllegalArgumentException("Selecione um vendedor para o agendamento");
        }

        Usuario vendedor = usuarioRepository.findById(agendamento.getVendedor().getId())
                .orElseThrow(() -> new IllegalArgumentException("Vendedor não encontrado"));

        if (vendedor.getRole() != Role.VENDEDOR) {
            throw new IllegalArgumentException("O usuário selecionado não é um vendedor");
        }

        List<Agendamento> agendamentosDoVendedor = agendamentoRepository.findByVendedorAndStatusIn(
                vendedor, List.of(StatusAgendamento.PENDENTE, StatusAgendamento.CONFIRMADO)
        );

        boolean vendedorOcupado = agendamentosDoVendedor.stream().anyMatch(existente ->
                Math.abs(Duration.between(existente.getDataHora(), agendamento.getDataHora()).toMinutes()) < 60
        );

        if (vendedorOcupado) {
            throw new IllegalArgumentException("Este vendedor já tem um atendimento nesse horário ou muito próximo dele (é necessário pelo menos 1h de intervalo)");
        }

        agendamento.setCliente(cliente);
        agendamento.setCarro(carro);
        agendamento.setVendedor(vendedor);
        agendamento.setStatus(StatusAgendamento.PENDENTE);

        Agendamento salvo = agendamentoRepository.save(agendamento);
        logAuditoriaService.registrar("Agendamento", salvo.getId(), "CRIACAO",
                salvo.getCliente().getNome() + " com " + salvo.getVendedor().getNome()
                        + " - " + salvo.getCarro().getMarca() + " " + salvo.getCarro().getModelo());
        return salvo;
    }

    public List<Map<String, Object>> disponibilidade(Long vendedorId, LocalDate data) {
        Usuario vendedor = usuarioRepository.findById(vendedorId)
                .orElseThrow(() -> new IllegalArgumentException("Vendedor não encontrado"));

        if (vendedor.getRole() != Role.VENDEDOR) {
            throw new IllegalArgumentException("O usuário selecionado não é um vendedor");
        }

        DayOfWeek diaDaSemana = data.getDayOfWeek();
        boolean diaUtil = diaDaSemana != DayOfWeek.SATURDAY && diaDaSemana != DayOfWeek.SUNDAY;

        List<Agendamento> ativos = agendamentoRepository.findByVendedorAndStatusIn(
                vendedor, List.of(StatusAgendamento.PENDENTE, StatusAgendamento.CONFIRMADO)
        );

        List<Map<String, Object>> horarios = new ArrayList<>();
        for (int hora = 9; hora < 18; hora++) {
            LocalDateTime horario = data.atTime(hora, 0);

            boolean livre = diaUtil
                    && horario.isAfter(LocalDateTime.now())
                    && ativos.stream().noneMatch(a ->
                    Math.abs(Duration.between(a.getDataHora(), horario).toMinutes()) < 60);

            horarios.add(Map.of("hora", String.format("%02d:00", hora), "disponivel", livre));
        }

        return horarios;
    }

    public Agendamento confirmar(Long id) {
        Usuario usuarioLogado = getUsuarioLogado();

        Agendamento agendamento = agendamentoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Agendamento não encontrado"));

        if (usuarioLogado.getRole() == Role.VENDEDOR
                && !agendamento.getVendedor().getId().equals(usuarioLogado.getId())) {
            throw new AccessDeniedException("Você só pode confirmar seus próprios agendamentos");
        }

        agendamento.setStatus(StatusAgendamento.CONFIRMADO);
        Agendamento salvo = agendamentoRepository.save(agendamento);
        logAuditoriaService.registrar("Agendamento", salvo.getId(), "CONFIRMACAO",
                salvo.getCliente().getNome() + " com " + salvo.getVendedor().getNome());
        return salvo;
    }

    public Agendamento cancelar(Long id) {
        Usuario usuarioLogado = getUsuarioLogado();

        Agendamento agendamento = agendamentoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Agendamento não encontrado"));

        if (usuarioLogado.getRole() == Role.VENDEDOR) {
            if (!agendamento.getVendedor().getId().equals(usuarioLogado.getId())) {
                throw new AccessDeniedException("Você só pode cancelar seus próprios agendamentos");
            }
        } else if (usuarioLogado.getRole() == Role.SECRETARIA) {
            throw new AccessDeniedException("Secretária não pode cancelar agendamentos");
        } else if (usuarioLogado.getRole() != Role.ADMIN) {
            if (!agendamento.getCliente().getId().equals(usuarioLogado.getCliente().getId())) {
                throw new AccessDeniedException("Você não tem permissão para cancelar este agendamento");
            }
        }

        agendamento.setStatus(StatusAgendamento.CANCELADO);
        Agendamento salvo = agendamentoRepository.save(agendamento);
        logAuditoriaService.registrar("Agendamento", salvo.getId(), "CANCELAMENTO",
                salvo.getCliente().getNome() + " com " + salvo.getVendedor().getNome());
        return salvo;
    }
}