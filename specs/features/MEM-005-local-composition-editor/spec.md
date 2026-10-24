# MEM-005 — Composição local com rascunho restaurável

**Estado:** aprovado para implementação incremental após revisão do juiz.  
**Fontes:** `../../../FRONTEND_SPEC.md`, `../../../BRAND_SYSTEM.md`, `../../../../memora-backend/BACKEND_SPEC.md`, `../../../../SDD_TDD_PROTOCOL.md`.

## Problema e usuário

Depois de guardar fotografias e escolher um template, a pessoa precisa atribuir imagens aos espaços e continuar a edição no mesmo navegador. Hoje o catálogo termina na seleção temporária.

## Pré-condições

- O template selecionado existe no catálogo imutável e versionado.
- A pessoa usa o mesmo navegador/dispositivo onde o rascunho local foi criado.
- Uma foto `READY` guardada no MinIO é necessária para preencher um slot; não é necessária para criar um draft vazio.

## Requisitos rastreáveis

- **MEM-005-R01:** “Usar template” no catálogo cria um `CompositionDocument` local v1 com `templateId`, `templateVersion`, uma entrada para cada slot declarativo, `assetId: null`, transform padrão `{x:0,y:0,scale:1,rotation:0}`, `cropMode: cover`, `textLayers: []` e fundo linho.
- **MEM-005-R02:** o editor mostra a proporção e geometrias do template; slot vazio é identificado como espaço disponível e não exige foto para continuar salvando.
- **MEM-005-R03:** o usuário pode atribuir, substituir ou remover uma fotografia guardada em cada slot. Somente fotos retornadas por `PhotoGateway.listPhotos()` (`READY`) aparecem; a mesma foto pode ser usada em mais de um slot.
- **MEM-005-R04:** documento e IDs são persistidos no IndexedDB do navegador após cada alteração confirmada. Não armazenar imagem, URL assinada, token ou credencial no IndexedDB.
- **MEM-005-R05:** restauração carrega o documento local e busca URLs temporárias atuais via `PhotoGateway`; nunca reutiliza URL de prévia persistida.
- **MEM-005-R06:** se um asset salvo tiver sido excluído ou não estiver disponível, manter o `assetId` original no documento restaurado, sinalizar o slot como indisponível e oferecer remover/substituir, sem limpar outros slots.
- **MEM-005-R07:** se IndexedDB falhar ao criar draft, permanecer no catálogo, preservar a seleção do template e oferecer retry. Se falhar ao salvar uma alteração de draft existente, manter a edição corrente em memória, informar que ela não foi salva neste dispositivo e permitir retry; bloquear navegação interna com confirmação e solicitar confirmação nativa antes de descarregar a página.
- **MEM-005-R08:** erro ao listar fotografias mostra ação de tentar novamente e mantém o documento; não simular fotos.
- **MEM-005-R09:** template e documento carregados do IndexedDB passam validação de domínio estrita. Nesta versão sem edição de transforms, cada transform deve ser exatamente `{x:0,y:0,scale:1,rotation:0}` e finito. Documento incompatível é preservado no armazenamento e abre em estado de recuperação, sem renderizar conteúdo não confiável.
- **MEM-005-R10:** a rota `/editor/{draftId}` funciona sem criar ou atualizar Mural no servidor; não chama API de composição nem publica/compartilha.
- **MEM-005-R11:** editor responsivo e acessível: controles nomeados, alvos >=44×44 CSS px, foco visível, estados anunciados, placeholders compreensíveis sem depender de cor.
- **MEM-005-R12:** `/templates` lista os drafts locais por `updatedAt` decrescente, mostra nome/versionamento do template e ação “Continuar”; falha ao ler IndexedDB tem retry e não apresenta lista vazia como sucesso.
- **MEM-005-R13:** se uma prévia assinada expirar durante a sessão, o usuário pode atualizar a lista de fotos e resolver nova URL; falha da imagem não apaga nem troca o `assetId`.
- **MEM-005-R14:** seletor com zero fotos READY mostra estado vazio e caminho para voltar à galeria e guardar fotografias; não confunde coleção vazia com falha da API.

## Modelo de composição v1

```ts
type CompositionDocument = {
  schemaVersion: 1;
  templateId: string;
  templateVersion: number;
  slots: Array<{
    slotId: string;
    assetId: string | null;
    transform: { x: number; y: number; scale: number; rotation: number };
    cropMode: "cover" | "contain";
  }>;
  textLayers: [];
  backgroundColor: "#F8F5EE";
};
```

O registro local associa `draftId` UUID, documento e timestamps locais. `assetId` referencia exclusivamente PhotoAsset READY do dono; as URLs de visualização não fazem parte do documento.

## Erros e privacidade

- Template ou draft inexistente/incompatível: tela recuperável com link para catálogo; nenhum dado local é apagado automaticamente.
- Falha no IndexedDB ou na API de fotos: mensagem inline e ação de retry.
- Dados são locais à origem/perfil do browser; limpeza do browser ou uso em outro aparelho pode remover/ocultar o rascunho.
- O IndexedDB está sujeito a quota e despejo pelo navegador; a interface não promete backup durável.
- A composição não é backup em nuvem e não fica disponível para compartilhamento nesta feature.

## Fora de escopo

Transformar/recortar/rotacionar, texto editável, undo/redo, exportar imagem, upload direto da composição, persistência no backend, metadados de mural, publicar, links, Google Fotos e câmera.

## Critérios observáveis

1. Selecionar template cria e abre documento versionado com slots vazios.
2. Atribuir/substituir/remover foto atualiza visualização e IndexedDB.
3. Reabrir a URL restaura o mesmo arranjo usando URLs de fotos recém-carregadas.
4. Foto removida da biblioteca pode ser substituída sem apagar o restante do rascunho.
5. `/templates` permite localizar e retomar drafts salvos neste navegador.
6. Falhas de storage/API ficam visíveis e não se passam por persistência ou seleção bem-sucedidas.
