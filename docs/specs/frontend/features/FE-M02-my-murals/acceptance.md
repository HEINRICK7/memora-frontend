# FE-M02 — Critérios de aceite

- **FE-M02-AC01 — Propriedade e status:** a lista usa apenas a resposta de `GET /api/v1/murals` para o proprietário atual. Cada card apresenta rótulo textual DRAFT, PUBLISHED ou ARCHIVED.
- **FE-M02-AC02 — Estados:** loading, falha recuperável, 401 sem sessão e lista vazia têm mensagens e ações distintas; vazio continua encaminhando para `/templates`.
- **FE-M02-AC03 — Filtros:** Todos/Rascunhos/Publicados/Arquivados usam os status do contrato. O selecionado tem `aria-pressed=true`, é anunciado e pode ser alcançado por teclado. Não há filtro de favoritos.
- **FE-M02-AC04 — Capa e contagem:** para cada mural exibido, a tela deriva contagem dos itens READY retornados por `listMuralPhotos`; a capa exibida tem `photoId === coverPhotoId`. Falha ou ausência de capa usa placeholder neutro e não cria contagem fictícia.
- **FE-M02-AC05 — Privacidade de preview:** URLs MinIO temporárias não são registradas, persistidas, enviadas a analytics ou incluídas em links de compartilhamento.
- **FE-M02-AC06 — Navegação:** links apontam a rotas existentes; Perfil fica desabilitado até existir rota implementada. A barra inferior respeita safe-area e identifica a rota ativa.
- **FE-M02-AC07 — Responsividade:** screenshots em 320, 375, 390, 414 e 768 px não mostram scroll horizontal; cards mantêm texto e controles utilizáveis.
- **FE-M02-AC08 — Visual e identidade:** composição segue a board M02, usa Space Grotesk + DM Sans, sem fonte serifada, e não mostra capturas de interface como conteúdo.
- **FE-M02-AC09 — Ação do card:** quando a rota de detalhe do proprietário estiver implementada, cada card passa a ser link/botão com nome acessível contendo título e status. Até essa rota existir, o artigo não usa um `href` morto. **Pendente para concluir a interação de M02.**
