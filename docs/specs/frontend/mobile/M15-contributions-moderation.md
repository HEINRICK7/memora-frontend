# M15 — Configurar Mural

**Status:** draft SDD. **ID visual:** M15.
**Referência:** public/telas/image3.png, terceiro telefone, rótulo 15 CONFIGURAR MURAL.
**Rota:** /murais/[muralId]/configurar.

## Objetivo

Editar metadados e capa de um mural DRAFT próprio e explicitar o estado de acesso sem conceder permissão implicitamente.

## Composição visual

- App bar com voltar e título central “configurar mural”.
- Foto de capa ampla com título sobre overlay e ação de escolher/substituir imagem.
- Campo de nome; grupo “quem pode ver?” com cartões “só eu”/“quem tem link”; opção de contribuição só se contrato aprovado.
- CTA lime “salvar mudanças”. Input, seleção e ajuda em DM Sans; títulos em Space Grotesk.

## Comportamento e estados

- Ler mural próprio e fotos associadas/READY; gravar título/descrição/capa em PATCH com If-Match atual.
- Campo omitido preserva capa; null limpa explicitamente; capa deve ser foto READY associada.
- Para MEM-008, publicar é ação explícita e não cria grant. Escolher intenção de link não publica nem cria token; criação de grant é o passo separado de M09.
- Mural PUBLISHED é somente leitura neste slice; não mostrar controles que aparentam editar conteúdo imutável.
- Contribuições ficam desabilitadas/indisponíveis até contrato MEM-009 aprovado e real.

## Responsividade e acessibilidade

- Capa adapta-se à largura com overlay que mantém título legível; controles não ficam sobre o rosto principal.
- Radio cards têm labels claros e estado programático; mensagens de erro ficam junto ao campo, foco move para erro após submit.
- Safe area, contraste AA e mínimo 44×44 px.

## Aceite

- **FE-M15-AC01:** salvar envia campos alterados e If-Match; erro 409 relê estado sem descartar texto digitado.
- **FE-M15-AC02:** selecionada capa é foto associada/READY e limpeza é explícita.
- **FE-M15-AC03:** nenhuma opção de acesso cria grant; só resposta explícita de publish/grant altera o estado correspondente.

## Dúvidas / limites

No mockup, “quem tem link” e permissão de foto de amigos parecem um toggle direto. A semântica real segue MEM-008 e futuras decisões MEM-009.
