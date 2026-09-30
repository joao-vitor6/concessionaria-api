
package com.concessionaria.repository;

import com.concessionaria.model.Cliente;
import com.concessionaria.model.Compra;
import com.concessionaria.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompraRepository extends JpaRepository<Compra, Long> {

    List<Compra> findByCliente(Cliente cliente);

    List<Compra> findByVendedor(Usuario vendedor);
}