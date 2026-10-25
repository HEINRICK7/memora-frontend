# M13 — Login

**Status:** draft SDD. **ID visual:** M13.
**Referência:** public/telas/image3.png, primeiro telefone, rótulo 13 (selo numerado no canto).
**Rota sugerida em FRONTEND_SPEC:** /entrar.

## Objetivo

Solicitar autenticação somente quando uma ação exigir persistência/gestão de proprietário; o editor local continua acessível sem login desnecessário.

## Composição visual

- Wordmark grande, foto de grupo da marca em bloco superior, headline “não deixa o rolê sumir.”, apoio e ações de login empilhadas.
- Botão com provedor e campos seguem DM Sans; headline em Space Grotesk.
- Conteúdo fica centralizado em tela estreita, com termos/privacidade em texto de apoio legível.

## Comportamento e estados

- FRONTEND_SPEC deixa provedor de identidade pendente de ADR. Não simular OAuth Google nem autenticação por e-mail sem contrato/provedor configurado.
- Se nenhuma integração estiver habilitada, mostrar aviso de indisponibilidade para acesso de proprietário e caminho de volta à edição local.
- Erro de autenticação só usa mensagem retornada pelo adapter; estado de loading impede envio repetido, sem expor tokens.
- Retorno após login preserva destino seguro e não grava token em URL/analytics.

## Responsividade e acessibilidade

- Foto recorta para formato vertical sem empurrar controles para fora; em altura baixa o conteúdo rola.
- Inputs têm labels persistentes, autocomplete apropriado somente quando auth real existir, erro associado, foco visível e suporte de teclado.

## Aceite

- **FE-M13-AC01:** sem provedor aprovado, nenhum botão simula sucesso de login; acesso local ao editor permanece disponível.
- **FE-M13-AC02:** integração real informa loading/erro/sucesso com mensagens seguras e não expõe segredo.
- **FE-M13-AC03:** após navegação de retorno não há token ou código OAuth em log/telemetria.

## Dúvidas / limites

O botão “continuar com Google” do mockup não autoriza escolher um provedor. Identidade de produção depende de ADR.
