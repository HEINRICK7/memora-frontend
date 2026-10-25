# M14 — Estado vazio de Meus Murais

**Status:** draft SDD. **ID visual:** M14.
**Referência:** public/telas/image3.png, segundo telefone, rótulo 14.
**Rota:** estado vazio de /meus-murais; não é página ou entidade nova.

## Objetivo

Mostrar ao proprietário que ainda não há murais e encaminhar à criação do primeiro.

## Composição visual

- Header branco com “seus murais”, botão criar e navegação inferior.
- Ilustração editorial central com molduras/traços livres e áreas azuis sólidas intencionais; mensagem grande “ainda tá tudo vazio por aqui” e CTA lime “criar primeiro mural”.
- A ilustração pode ser criada com formas SVG/CSS acessíveis; não usar screenshot da board ou placeholders fotográficos como conteúdo do mural.

## Comportamento e estados

- Só renderiza quando resposta real da listagem é vazia depois de carregar.
- CTA inicia M05 ou POST /murals somente após ação explícita e com idempotência conforme MEM-002.
- Loading, erro de API e ausência de autenticação não são tratados como lista vazia; usar estados próprios.
- Não mostrar números zero artificiais para contagens de perfil nem acessar dados de terceiros.

## Responsividade e acessibilidade

- Ilustração mantém proporção e não domina a tela; headline quebra em frases curtas.
- CTA com alvo mínimo 44×44 px, estado vazio possui heading anunciado e navegação por teclado.
- Animação de rabisco é opcional e desativada para prefers-reduced-motion.

## Aceite

- **FE-M14-AC01:** estado vazio só aparece após sucesso com items vazio; erro e loading preservam seus próprios estados.
- **FE-M14-AC02:** CTA abre criação, sem criar mural ocultamente.
- **FE-M14-AC03:** empty art é intencional, local e compatível com layout estreito.

## Dúvidas / limites

Os cartões azuis do mockup são ilustração, não murais reais nem placeholders permanentes de fotografia.
