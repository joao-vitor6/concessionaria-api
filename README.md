# Concessionária API

API REST completa para gestão de uma concessionária de veículos, com autenticação JWT, controle de acesso por múltiplos papéis (Admin, Vendedor, Secretária, Cliente), e front-end integrado em HTML/CSS/JS puro.

Este projeto foi construído do zero como estudo prático de Spring Boot, evoluindo de um CRUD simples até um sistema com regras de negócio reais, ownership de dados, auditoria e um front-end funcional completo.

## Tecnologias

- **Java 17**
- **Spring Boot 4.1.1**
- **Spring Web** (REST API)
- **Spring Data JPA** + **Hibernate**
- **Spring Security** + **JWT** (JJWT)
- **MySQL**
- **Bean Validation** (validações customizadas para CPF, telefone e nome)
- **HTML, CSS e JavaScript puro** no front-end (sem frameworks)

## Funcionalidades

### Autenticação e autorização
- Login com JWT, com claim de role para roteamento no front-end
- Cinco papéis com permissões distintas: **Admin**, **Vendedor**, **Secretária**, **Usuário (cliente)**
- Autorização baseada em *ownership* (ex: um vendedor só vê os próprios agendamentos e vendas)
- Segunda camada de senha ("senha de compra") exigida para concluir ou cancelar uma compra
- Reautenticação do admin (com a própria senha de login) para cancelar uma venda — proteção contra abuso de conta administrativa

### Catálogo e compras
- Catálogo de carros com filtros, imagens e modal de detalhes com zoom
- Favoritos
- Fluxo completo de compra com validações de negócio (preço, data, disponibilidade)
- Histórico de compras preservado mesmo após cancelamento (soft cancel, não exclusão)

### Agendamento de visitas
- Cliente agenda uma visita escolhendo carro, vendedor e horário
- Regra de horário comercial (segunda a sexta, 9h às 18h)
- Bloqueio de conflito de agenda por carro **e** por vendedor (janela de 1h)
- Painel do vendedor para confirmar/cancelar agendamentos e registrar vendas
- Painel da secretária com visualização de disponibilidade de qualquer vendedor, para marcar visitas presenciais

### Administração
- CRUD completo de carros, clientes e usuários
- Upload de imagem para os carros
- Log de auditoria persistente (sobrevive à exclusão do registro original), rastreando quem criou, editou, excluiu, confirmou ou cancelou cada ação

## Arquitetura

O projeto segue a arquitetura em camadas padrão do Spring:


Com tratamento centralizado de exceções (`GlobalExceptionHandler`) e configuração de segurança isolada (`SecurityConfig`, `JwtAuthFilter`, `JwtAuthenticationEntryPoint`).

## Como rodar o projeto

### Pré-requisitos
- Java 17
- Maven
- MySQL

### Passos

1. Clone o repositório
2. Crie o banco de dados no MySQL:
```sql
   CREATE DATABASE concessionaria_db;
```
3. Copie `src/main/resources/application.properties.example` para `src/main/resources/application.properties`
4. Preencha o `application.properties` com suas credenciais reais (senha do MySQL, senha do admin padrão, e uma chave JWT)
5. Rode a aplicação:
6. A API sobe em `http://localhost:9090`

Um usuário administrador é criado automaticamente na primeira inicialização, com o email/senha definidos no `application.properties`.

### Front-end

O front-end está na pasta `front-end/`, dentro deste mesmo repositório. Para rodar, abra a pasta `frontend` no VS Code e use a extensão **Live Server** (clique com o botão direito em `index.html` → "Open with Live Server"). Certifique-se de que a API (backend) já está rodando em `http://localhost:9090`.

## Aprendizados deste projeto

Este projeto foi construído gradualmente, entidade por entidade, com foco em entender:
- Como o Spring Data JPA e o Hibernate mapeiam relacionamentos e geram schema automaticamente
- Autenticação stateless com JWT e as armadilhas de propagação do `SecurityContext`
- Diferença entre autenticação e autorização, e como implementar regras de ownership reais
- Boas práticas de segurança: nunca commitar segredos, hashing de senhas, proteção contra CSRF/XSS
- Integridade referencial e por que "soft delete" é preferível a exclusão física em dados de negócio