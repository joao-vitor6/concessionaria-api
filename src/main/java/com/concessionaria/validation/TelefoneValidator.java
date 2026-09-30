package com.concessionaria.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class TelefoneValidator implements ConstraintValidator<TelefoneValido, String> {

    @Override
    public boolean isValid(String telefone, ConstraintValidatorContext context) {
        if (telefone == null) {
            return false;
        }

        String numeros = telefone.replaceAll("[^0-9]", "");

        // DDD (2 digitos) + numero (8 ou 9 digitos) = 10 ou 11 digitos no total
        return numeros.length() == 10 || numeros.length() == 11;
    }
}