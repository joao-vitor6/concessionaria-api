package com.concessionaria.model;

import jakarta.persistence.Transient;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;


import java.time.LocalDate;

@Entity
@Table(name = "compras")
public class Compra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "O cliente é obrigatório")
    @ManyToOne
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    @NotNull(message = "O carro é obrigatório")
    @ManyToOne
    @JoinColumn(name = "carro_id")
    private Carro carro;

    @JsonIgnoreProperties({"email", "role", "cliente", "senha", "senhaCompra"})
    @ManyToOne
    @JoinColumn(name = "vendedor_id")
    private Usuario vendedor;
    @NotNull(message = "A data da compra é obrigatória")
    private LocalDate dataCompra;

    @DecimalMin(value = "0.01", message = "O valor pago deve ser maior que zero")
    private double valorPago;

    public Compra() {
    }

    @Enumerated(EnumType.STRING)
    private StatusCompra status;

    public StatusCompra getStatus() {
        return status;
    }

    public void setStatus(StatusCompra status) {
        this.status = status;
    }

    public Usuario getVendedor() {
        return vendedor;
    }

    public void setVendedor(Usuario vendedor) {
        this.vendedor = vendedor;
    }

    @Transient
    private String senhaCompra;

    public String getSenhaCompra() {
        return senhaCompra;
    }

    public void setSenhaCompra(String senhaCompra) {
        this.senhaCompra = senhaCompra;
    }

    // Getters e Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }

    public Carro getCarro() {
        return carro;
    }

    public void setCarro(Carro carro) {
        this.carro = carro;
    }

    public LocalDate getDataCompra() {
        return dataCompra;
    }

    public void setDataCompra(LocalDate dataCompra) {
        this.dataCompra = dataCompra;
    }

    public double getValorPago() {
        return valorPago;
    }

    public void setValorPago(double valorPago) {
        this.valorPago = valorPago;
    }
}