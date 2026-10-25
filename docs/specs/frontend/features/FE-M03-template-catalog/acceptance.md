# FE-M03 — Critérios de aceite

- **FE-M03-AC01 — Integridade do catálogo:** cada card corresponde a uma e somente uma definição versionada em `TEMPLATE_CATALOG_V1`; `templateId`, versão, nome, quantidade e proporção vêm do registry.
- **FE-M03-AC02 — Assets locais:** os previews carregam somente imagens de demonstração de `public/brand/v2/`, distribuídas pelos slots reais. Não exibem screenshots de UI nem apresentam essas fotos como conteúdo do usuário.
- **FE-M03-AC03 — Descoberta:** quantidade e proporção podem ser filtradas em conjunto; busca local considera nome, descrição e ID; limpar filtros retorna as oito definições. Um resultado vazio apresenta ação acessível para limpar.
- **FE-M03-AC04 — Rascunho e continuidade:** selecionar um card identifica o template em texto. A ação de uso chama o caso de uso real com o ID/version corretos e navega a `/editor/{draftId}` após persistência local bem-sucedida; erros mostram recuperação. Rascunhos existentes continuam carregáveis.
- **FE-M03-AC05 — Identidade e responsividade:** capturas a 320, 375, 390, 414, 768, 1024 e 1440 px não têm overflow, fontes serifadas ou cortes; mobile preserva título em duas linhas, filtros horizontais e cards fotográficos em duas colunas quando legíveis; desktop usa 2/3/4 colunas nos breakpoints definidos.
- **FE-M03-AC06 — Acessibilidade:** busca, filtros, cards e CTA funcionam por teclado, têm rótulos e foco visível, estado de seleção textual e alvos apropriados. Imagens decorativas não duplicam o nome acessível do card.
