package com.concessionaria.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.ConstraintViolation;
import org.springframework.security.authentication.BadCredentialsException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {


    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> tratarErrosDeValidacao(MethodArgumentNotValidException ex) {
        Map<String, String> campos = new HashMap<>();
        for (FieldError erro : ex.getBindingResult().getFieldErrors()) {
            campos.put(erro.getField(), erro.getDefaultMessage());
        }

        Map<String, Object> corpo = new HashMap<>();
        corpo.put("timestamp", LocalDateTime.now());
        corpo.put("status", HttpStatus.BAD_REQUEST.value());
        corpo.put("error", "Bad Request");
        corpo.put("errors", campos);

        return ResponseEntity.badRequest().body(corpo);
    }


    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> tratarRegraDeNegocio(IllegalArgumentException ex) {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("timestamp", LocalDateTime.now());
        corpo.put("status", HttpStatus.BAD_REQUEST.value());
        corpo.put("error", "Bad Request");
        corpo.put("message", ex.getMessage());

        return ResponseEntity.badRequest().body(corpo);
    }
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> tratarViolacaoDeIntegridade(DataIntegrityViolationException ex) {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("timestamp", LocalDateTime.now());
        corpo.put("status", HttpStatus.CONFLICT.value());
        corpo.put("error", "Conflict");
        corpo.put("message", "Não é possível excluir este registro pois ele está vinculado a outros dados existentes no sistema");

        return ResponseEntity.status(HttpStatus.CONFLICT).body(corpo);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> tratarViolacaoDeConstraint(ConstraintViolationException ex) {
        Map<String, String> campos = new HashMap<>();
        for (ConstraintViolation<?> violacao : ex.getConstraintViolations()) {
            String nomeCampo = violacao.getPropertyPath().toString();
            campos.put(nomeCampo, violacao.getMessage());
        }

        Map<String, Object> corpo = new HashMap<>();
        corpo.put("timestamp", LocalDateTime.now());
        corpo.put("status", HttpStatus.BAD_REQUEST.value());
        corpo.put("error", "Bad Request");
        corpo.put("errors", campos);

        return ResponseEntity.badRequest().body(corpo);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> tratarCredenciaisInvalidas(BadCredentialsException ex) {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("timestamp", LocalDateTime.now());
        corpo.put("status", HttpStatus.UNAUTHORIZED.value());
        corpo.put("error", "Unauthorized");
        corpo.put("message", "Email ou senha inválidos");

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(corpo);
    }
}