# M09 — Share Success

**Status:** draft SDD. **ID visual:** M09.
**Referência:** public/telas/image2.png, primeiro telefone, rótulo 09 SHARE SUCCESS.
**Rota/estado:** sucesso da criação de grant em /murais/[muralId]/compartilhar.

## Objetivo

Confirmar criação de um link VIEW e deixar a pessoa compartilhá-lo intencionalmente.

## Composição visual

- Header escuro compacto com wordmark lime e fechar.
- Capa de mural em card vertical/collage, título “tá no ar!”, URL em campo selecionável e botão lime “copiar link”.
- Ações secundárias de compartilhamento ficam abaixo com ícones monocromáticos consistentes; não usar logos de plataformas se não houver integração nativa real.
- A capa usa asset ou mural autorizado, não uma imagem de referência com UI incorporada.

## Comportamento e estados

- Renderizar URL só da resposta inicial 201 do backend. Copiar exatamente a string recebida; Web Share usa essa mesma string quando suportado.
- Replay, listagem e recarregamento não recuperam token/URL; oferecer criar novo grant com nova chave quando a pessoa não guardou o link.
- Não gerar link/QR no cliente nem persistir shareUrl em IndexedDB/localStorage/analytics/logs.
- Fechar retorna à gestão dos grants; cancelar Web Share não é erro. Clipboard indisponível tem fallback selecionável e mensagem acessível.
- Ação de contribuição e toggle “permitir amigos” não faz parte de VIEW e não é mostrada como ativa.

## Responsividade e acessibilidade

- Conteúdo em coluna e rolagem normal; CTA principal confortável em toque. Link comprido quebra sem provocar overflow.
- Ícones têm rótulos acessíveis; copiar anuncia sucesso/falha. Sucesso não depende de cor ou animação.

## Aceite

- **FE-M09-AC01:** copiar/Web Share recebem byte a byte shareUrl da primeira resposta, sem reconstruir domínio ou path.
- **FE-M09-AC02:** token/URL não são persistidos nem registrados; replay/listagem não exibem segredo.
- **FE-M09-AC03:** sem Web Share, há fallback acessível de cópia; cancelar share mantém a tela estável.

## Dúvidas / limites

A grade de apps, QR Code e permissão CONTRIBUTE do mockup não são entregues por este estado até contrato real correspondente existir.
