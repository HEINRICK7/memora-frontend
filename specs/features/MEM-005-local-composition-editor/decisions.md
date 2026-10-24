# MEM-005 — Decisões

## MEM-005-ADR-01 — Draft local antes da sincronização remota

A etapa atual do backend ainda não oferece `SaveComposition`. Persistir o documento no IndexedDB permite demonstrar edição reabrível sem fingir sincronização com PostgreSQL. A UI deixa claro que o rascunho pertence a este navegador. Sincronização remota terá contrato e versão próprios.

O catálogo também é o ponto de entrada para reabrir os drafts locais, então a pessoa não precisa guardar nem digitar o UUID da rota.

## MEM-005-ADR-02 — Referenciar fotos sem copiá-las

Somente fotos explicitamente salvas no MinIO são elegíveis. O draft guarda asset IDs; URL assinada expira e é resolvida novamente ao abrir o editor. Os bytes permanecem no armazenamento privado atual.

## MEM-005-ADR-03 — Escopo inicial de editor

Esta fatia implementa seleção de template, atribuição/troca/remoção de fotos, prévia geométrica e rascunho local. Crop/transform, texto, histórico, exportação e publicação são fatias futuras; controles indisponíveis não serão apresentados como se funcionassem.

## MEM-005-ADR-04 — Recuperação em vez de descarte

Dados de draft fora da versão corrente não são apagados nem corrigidos automaticamente. O editor bloqueia sua renderização e oferece retorno ao catálogo; eventual migração de schema será especificada separadamente.
