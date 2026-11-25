# FE-M10 — Acesso ao modo Aniversário

**Estado:** implementado para o administrador local de teste.

- `/criar`, `/meus-murais`, `/biblioteca` e as rotas privadas `/murais/*` exigem sessão administrativa.
- Sem sessão, apresentar formulário de entrada por e-mail e senha usando os componentes/tokens de marca já existentes.
- Credenciais existem apenas no formulário até o POST de login; não usar localStorage/sessionStorage.
- O navegador carrega token CSRF antes de login e mutações autenticadas.
- Após login, formulário de criação de aniversário e ações privadas funcionam com cookie HttpOnly.
- Rotas públicas de convidados `/m/[shareToken]` permanecem abertas.
- A API, não o estado da interface, é a autoridade final de autorização.
