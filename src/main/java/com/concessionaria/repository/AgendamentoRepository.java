package com.concessionaria.repository;

import com.concessionaria.model.Agendamento;
import com.concessionaria.model.Carro;
import com.concessionaria.model.Cliente;
import com.concessionaria.model.StatusAgendamento;
import com.concessionaria.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AgendamentoRepository extends JpaRepository<Agendamento, Long> {

    List<Agendamento> findByCliente(Cliente cliente);

    List<Agendamento> findByCarroAndStatusIn(Carro carro, List<StatusAgendamento> status);

    List<Agendamento> findByVendedor(Usuario vendedor);

    List<Agendamento> findByVendedorAndStatusIn(Usuario vendedor, List<StatusAgendamento> status);
}