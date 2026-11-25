# FE-M04/W06 — Critérios de aceite

| ID | Given / When / Then |
|---|---|
| FE-SM-AC01 | Dado shared GET válido, quando a página renderiza, então título, descrição, contagem e fotos correspondem exatamente à coleção autorizada; autor e dados não retornados não aparecem. |
| FE-SM-AC02 | Dada uma resposta VIEW, quando visitante abre a página, então nenhum controle de contribuição, edição, publicação ou moderação é renderizado. |
| FE-SM-AC03 | Dado `canContribute: true`, quando a página renderiza, então o QR mostra boas-vindas e a foto enviada fica privada até o convidado selecioná-la para compartilhar. |
| FE-SM-AC04 | Dada capa nula, quando a página escolhe a imagem de abertura, então usa a primeira foto autorizada sem salvar alteração; nenhum preview é substituído por original/local. |
| FE-SM-AC05 | Dada galeria com imagens variadas, quando comparada nos sete breakpoints, então o mosaico mantém proporções sem distorção, preserva ordem e não cria overflow horizontal. |
| FE-SM-AC05a | Dada rolagem mobile maior que 40 CSS px, quando a galeria continua visível, então o cabeçalho compacto mostra Memora/título e uma saída acessível. |
| FE-SM-AC06 | Dada uma foto, quando o lightbox abre e é navegado/fechado por teclado ou toque, então a imagem permanece autorizada, o foco fica visível e retorna ao tile de origem. |
| FE-SM-AC07 | Dada URL temporária perto do vencimento ou erro de carregamento, quando a tela atualiza, então renova por shared GET ou mostra placeholder neutro sem fallback a outro objeto. |
| FE-SM-AC08 | Dado link inválido, expirado, revogado, mural indisponível ou falha de dependência, quando a página responde, então a mensagem é genérica e não revela metadata/fotos do mural. |
| FE-SM-AC09 | Dada a página em mobile ou desktop, quando teclado, viewport e leitor de tela são usados, então controles têm nome acessível, foco visível, alvos mínimos e safe area respeitada. |
| FE-SM-AC10 | Dado o documento `/m/[shareToken]`, quando inspecionados os headers HTTP, então HTML tem `private, no-store`, `noindex, nofollow, noarchive` e `no-referrer`, independentemente dos headers JSON da API. |

## Evidência exigida

Screenshots comparáveis de M04/M10 em 390 e 320 px, W06 em 1440 e 1024 px e layout de transição em 768 px; registro da comparação com as boards oficiais. E2E Compose com PostgreSQL/MinIO real permanece necessário para afirmar privacidade da variante, cache-control do objeto, expiração/revogação e renovação real; emulação visual não substitui esse gate.
