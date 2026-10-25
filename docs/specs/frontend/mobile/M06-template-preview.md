# M06 — Seleção de Fotos

**Status:** draft SDD. **ID visual:** M06.
**Referência:** public/telas/Memora mobile mural creation flow-3.png, segundo telefone, rótulo 06 SELECIONE AS FOTOS.
**Rota/estado:** etapa após M05, no fluxo local de criação.

## Objetivo

Selecionar várias imagens locais e confirmar a seleção antes de abrir o editor.

## Composição visual

- Header com voltar, wordmark e cancelar.
- Heading “escolhe os melhores cliques”.
- Grade compacta de miniaturas quadradas, seleção múltipla indicada por checks circulares.
- Faixa inferior persistente com quantidade real selecionada, ação “limpar tudo”, miniaturas da seleção e CTA “usar essas fotos”.
- Usar arquivos que a pessoa escolheu; fixtures sintéticas são somente previews/testes explicitamente rotulados.

## Comportamento e estados

- Toggle em uma foto adiciona/remove o item sem duplicatas; seleção e ordem local preservam a intenção do usuário.
- Limpar tudo esvazia a seleção. Continuar exige ao menos uma foto compatível com o template.
- Arquivos são validados conforme limites e tipos de FRONTEND_SPEC/MEM-001 antes de formar miniaturas; erro por item não descarta escolhas válidas.
- Voltar mantém seleção durante a sessão local; abandonar apresenta confirmação quando houver seleção não confirmada.

## Responsividade e acessibilidade

- Grade 3 colunas no retrato de referência, adaptável até que alvos tenham ao menos 44×44 px.
- Rodapé mantém CTA visível em viewport curto e safe area. Scroll não fica bloqueado pelo rodapé.
- Cada thumb anuncia nome/posição e estado selecionado; contagem é live region sem repetição excessiva.

## Aceite

- **FE-M06-AC01:** seleção múltipla soma uma vez cada asset e contador acompanha cada ação.
- **FE-M06-AC02:** formatos inválidos ou acima do limite recebem erro por arquivo, mantendo itens válidos.
- **FE-M06-AC03:** CTA abre M07 somente após haver seleção compatível e não faz upload implícito.

## Dúvidas / limites

O mockup mostra 8 selecionadas como exemplo; esse número nunca é fixo.
