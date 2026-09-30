package com.concessionaria.service;

import com.concessionaria.model.Carro;
import com.concessionaria.repository.CarroRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;


import java.util.List;
import java.util.Optional;

@Service
public class CarroService {

    @Autowired
    private CarroRepository carroRepository;

    @Autowired
    private LogAuditoriaService logAuditoriaService;

    public List<Carro> listarTodos() {
        return carroRepository.findAll();
    }

    public Optional<Carro> buscarPorId(Long id) {
        return carroRepository.findById(id);
    }

    public Carro salvar(Carro carro) {
        Carro salvo = carroRepository.save(carro);
        logAuditoriaService.registrar("Carro", salvo.getId(), "CRIACAO", salvo.getMarca() + " " + salvo.getModelo());
        return salvo;
    }

    public Carro atualizar(Long id, Carro carroAtualizado) {
        Carro carroExistente = carroRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Carro não encontrado"));

        carroExistente.setMarca(carroAtualizado.getMarca());
        carroExistente.setModelo(carroAtualizado.getModelo());
        carroExistente.setCor(carroAtualizado.getCor());
        carroExistente.setAno(carroAtualizado.getAno());
        carroExistente.setPreco(carroAtualizado.getPreco());
        carroExistente.setQuilometragem(carroAtualizado.getQuilometragem());
        carroExistente.setCombustivel(carroAtualizado.getCombustivel());
        carroExistente.setCambio(carroAtualizado.getCambio());
        carroExistente.setPortas(carroAtualizado.getPortas());
        Carro salvo = carroRepository.save(carroExistente);
        logAuditoriaService.registrar("Carro", salvo.getId(), "ATUALIZACAO", salvo.getMarca() + " " + salvo.getModelo());
        return salvo;
    }

    public void deletar(Long id) {
        Carro carro = carroRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Carro não encontrado"));

        logAuditoriaService.registrar("Carro", id, "EXCLUSAO", carro.getMarca() + " " + carro.getModelo());
        carroRepository.deleteById(id);
    }

    public Carro salvarImagem(Long id, MultipartFile arquivo) {
        Carro carro = carroRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Carro não encontrado"));

        if (arquivo.isEmpty()) {
            throw new IllegalArgumentException("Nenhum arquivo enviado");
        }

        String extensao = obterExtensao(arquivo.getOriginalFilename());
        String nomeArquivo = UUID.randomUUID() + extensao;

        Path caminhoDestino = Paths.get("uploads/carros/" + nomeArquivo);

        try {
            Files.createDirectories(caminhoDestino.getParent());
            Files.copy(arquivo.getInputStream(), caminhoDestino);
        } catch (IOException e) {
            throw new IllegalArgumentException("Não foi possível salvar a imagem");
        }

        carro.setImagemUrl("/uploads/carros/" + nomeArquivo);
        return carroRepository.save(carro);
    }

    private String obterExtensao(String nomeOriginal) {
        if (nomeOriginal == null || !nomeOriginal.contains(".")) {
            return "";
        }
        return nomeOriginal.substring(nomeOriginal.lastIndexOf("."));
    }
}