# M12 — Contribution Moderation

**Status:** draft SDD, depende de API de moderação. **ID visual:** M12.
**Referência:** public/telas/image2.png, quarto telefone, rótulo 12 CONTRIBUTION MODERATION (OWNER).
**Rota definida para fase 2:** /murais/[muralId]/contribuicoes.

## Objetivo

Permitir ao proprietário revisar submissões pendentes e aprovar ou recusar cada uma, sem confundir decisão com link VIEW.

## Composição visual

- Header paper com wordmark, título “fotos novas!” e indicação textual da quantidade pendente obtida do backend.
- Lista vertical de grupos por contribuição, autor apenas se permitido pelo contrato, miniaturas e botões explícitos “aprovar” / “recusar”.
- Navegação inferior pode marcar a área de notificações se existir fonte real; badge só usa contagem retornada.
- Usar fotos pending autorizadas do backend, não o arquivo original público nem dados artificiais em produção.

## Comportamento e estados

- Exigir owner do mural e endpoint aprovado de lista/approve/reject. A interface não concede a si mesma permissão.
- Aprovar/rejeitar cada item pede estado de carregamento, resultado confirmado pelo servidor e recuperação de erro sem duplicar decisão.
- Pending não é incluído na galeria shared; aprovação vincula a foto ao mural em operação idempotente conforme backend.
- Sem endpoint operacional, apresentar fase indisponível ou deixar a rota desabilitada; fixtures servem apenas a teste explicitamente marcado.

## Responsividade e acessibilidade

- Um pedido por região com nome/estado anunciados; botões têm alvos confortáveis e confirmação acessível.
- Mover o foco para feedback após ação e preservar o contexto da fila. Nunca usar cor como único marcador de pending/approved/rejected.
- Imagens têm alt seguro; não registrar URL assinada ou token em atributo externo/telemetria.

## Aceite

- **FE-M12-AC01:** lista inclui somente contribuições pendentes autorizadas do mural.
- **FE-M12-AC02:** aprovação/rejeição atualiza a tela somente após confirmação do backend; erro preserva item/contexto.
- **FE-M12-AC03:** conteúdo PENDING nunca aparece na leitura pública do mural.

## Dúvidas / limites

Mockup não prova que a API MEM-009 esteja implementada; não afirmar moderação concluída sem integração real.
