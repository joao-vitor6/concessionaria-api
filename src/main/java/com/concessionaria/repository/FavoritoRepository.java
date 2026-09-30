package com.concessionaria.repository;

import com.concessionaria.model.Carro;
import com.concessionaria.model.Cliente;
import com.concessionaria.model.Favorito;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoritoRepository extends JpaRepository<Favorito, Long> {

    List<Favorito> findByCliente(Cliente cliente);

    Optional<Favorito> findByClienteAndCarro(Cliente cliente, Carro carro);

    boolean existsByClienteAndCarro(Cliente cliente, Carro carro);
}