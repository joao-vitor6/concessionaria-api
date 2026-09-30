package com.concessionaria.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class NomeValidator implements ConstraintValidator<NomeValido, String> {

    private static final String REGEX_NOME = "^[A-Za-zÀ-ÖØ-öø-ÿ' ]{2,100}$";

    @Override
    public boolean isValid(String nome, ConstraintValidatorContext context) {
        if (nome == null) {
            return false;
        }

        String nomeLimpo = nome.trim();

        if (!nomeLimpo.matches(REGEX_NOME)) {
            return false;
        }

        return nomeLimpo.chars().anyMatch(Character::isLetter);
    }
}