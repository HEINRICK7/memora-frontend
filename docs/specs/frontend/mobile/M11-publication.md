# M11 — Guest Contribution

**Status:** draft SDD, depende da fase de contribuição. **ID visual:** M11.
**Referência:** public/telas/image2.png, terceiro telefone, rótulo 11 GUEST CONTRIBUTION.
**Rota/estado:** fluxo contextual iniciado de mural cujo contrato permite CONTRIBUTION; endpoint de Backend Specification é fase 2.

## Objetivo

Registrar a intenção de enviar fotos a um mural colaborativo sem publicar automaticamente a contribuição.

## Composição visual

- Header ink com voltar, wordmark e cancelar.
- Heading “também tava lá? manda!”, arquivos escolhidos em tiras de preview, campo de nome opcional conforme contrato e aviso visual de revisão.
- CTA lime “enviar fotos”; thumbnails locais com ação explícita de remover antes de envio.
- Layout não confunde envio pendente com fotos já publicadas.

## Comportamento e estados

- Não habilitar para grant VIEW; requer scope CONTRIBUTE e API real aprovada. Token não vai para logs nem analytics.
- Selecionar arquivo não faz upload; envio exige confirmação explícita. Falhas mantêm a seleção local recuperável.
- Após confirmação, mostrar somente estado retornado pelo backend (ex.: PENDING); a contribuição não aparece na galeria antes de aprovação.
- Se backend de contribuição não estiver disponível, a tela não deve simular sucesso; exibir indisponibilidade contextual e retorno ao mural.

## Responsividade e acessibilidade

- Área de seleção e previews empilham no celular; cada remoção tem nome acessível. CTA e cancelar permanecem visíveis sem cobrir campos.
- Aviso de moderação é texto, não apenas ícone/cor; teclado alcança remover/confirmar e foco retorna ao mural.

## Aceite

- **FE-M11-AC01:** somente capacidade CONTRIBUTE real permite abrir/enviar contribuição; VIEW não aceita upload.
- **FE-M11-AC02:** nenhuma foto aparece publicada antes de decisão APPROVED do backend.
- **FE-M11-AC03:** falha do envio conserva os arquivos selecionados para recuperação e não mostra sucesso falso.

## Dúvidas / limites

Front-end e backend descrevem contribuição como fase 2; esta tela não libera MVP VIEW antes dos contratos, testes RED e integração real.
