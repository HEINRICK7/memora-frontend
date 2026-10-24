# Memora — Frontend Specification

**Versão:** 1.0 · 24/10/2026  
**Status:** especificação para implementação, sem afirmar código concluído.  
**Fontes obrigatórias:** [`BRAND_SYSTEM.md`](BRAND_SYSTEM.md), [`AGENTS.md`](AGENTS.md), [`BACKEND_SPEC.md`](../memora-backend/BACKEND_SPEC.md).

## 1. Objetivo e escopo

Criar um estúdio fotográfico responsivo onde o usuário importa fotografias, escolhe templates, edita composições, cria um mural persistente e compartilha com familiares/amigos. A experiência deve funcionar primeiro em celulares, com atenção especial ao Safari do iPhone e ao Chrome Android.

**MVP 1:** galeria local, seleção de template, editor não destrutivo, rascunho, publicação, link de visualização, mural convidado, exportação PNG/JPEG.

**Fase 2:** Google Fotos Picker, permissões de contribuição, fila de aprovação, gerenciamento de links.

**Fase 3:** filtros em imagens importadas, câmera com AR 3D, vídeo; recursos separados e não bloqueantes.

## 2. Stack proposta

| Item | Escolha | Justificativa |
|---|---|---|
| Web | Next.js + React + TypeScript | Rotas de editor e visualização compartilhada, rendering responsivo e SEO apenas em páginas institucionais |
| Estilos | CSS Modules ou Tailwind com tokens CSS | Consistência da marca sem acoplar componentes a biblioteca visual |
| Ícones | Lucide | Vocabulário visual único |
| Estado assíncrono | TanStack Query | Cache e invalidação de dados remotos |
| Estado local editor | Zustand ou reducer React isolado | Histórico e comandos de edição, sem Redux global desnecessário |
| Validação | Zod nos limites de I/O | Mensagens previsíveis para formulário/API |
| Canvas | Canvas 2D inicialmente; renderer em adapter | Exportação de templates com composição determinística |
| Testes | Vitest + Testing Library + Playwright | Domínio, viewmodels e fluxos ponta a ponta |
| Tipografia | Engagement para logo, DM Sans UI | Conforme identidade aprovada |

As versões das bibliotecas devem ser fixadas e testadas no repositório quando o projeto for inicializado; não presumir últimas versões sem validar compatibilidade.

## 3. Perfis e acesso

- **Visitante não autenticado:** acessar mural permitido pelo link; visualizar fotos aprovadas; enviar fotos somente se o link permitir contribuição (fase 2).
- **Proprietário autenticado:** criar, editar, publicar, exportar e gerenciar convites/fotos.
- **Editor convidado (futuro):** gerenciar apenas murais com permissão explícita. Não confundir contribuição com edição.

Um usuário não autenticado que inicia uma composição local pode editar/exportar; para persistência e link, solicitar login em momento contextual (definir provedor de identidade em ADR antes de integrar).

## 4. Mapa de rotas sugerido

| Rota | Acesso | Propósito |
|---|---|---|
| `/` | Público | Apresentação/CTA e acesso ao estúdio |
| `/criar` | Público/local | Selecionar fonte e template |
| `/templates` | Público | Catálogo de composições |
| `/editor/[draftId]` | Dono ou rascunho local | Editor não destrutivo |
| `/meus-murais` | Autenticado | Lista e filtros por status |
| `/murais/[muralId]/configurar` | Dono | Configurar título, capa e visibilidade |
| `/murais/[muralId]/compartilhar` | Dono | Links, revogação, contribuição |
| `/murais/[muralId]/contribuicoes` | Dono | Moderação de fotos (fase 2) |
| `/m/[shareToken]` | Link válido | Mural do convidado, noindex |
| `/entrar` | Público | Login contextual sem barreira desnecessária |

Evitar tokens em logs, analytics, previews externos e cabeçalhos Referrer; aplicar `Referrer-Policy: no-referrer` no mural compartilhado. Links reais são gerados no backend.

## 5. Design system aplicado

- Paleta exata: petróleo `#243D3A`, terracota `#C77760`, sálvia `#819988`, mel `#C39452`, linho `#F8F5EE`.
- Logo: palavra **Memora**, Engagement, letras multicoloridas; ícone circular M multicolorido.
- Fontes de componentes: DM Sans; títulos editoriais opcionais Cormorant Garamond.
- Base da UI em linho, superfícies brancas e fotos protagonistas. Nunca transformar um mural em dashboard de métricas.
- Componentes devem oferecer estados `default`, `hover`, `focus`, `pressed`, `disabled`, `loading`, `error`.
- Tamanho de alvo interativo recomendado >=44×44 CSS px; WCAG AA em contraste, teclado e leitor de tela.
- Toolbar inferior respeita `env(safe-area-inset-bottom)`; editor redimensiona sem ocultar CTA.

## 6. Fluxo A — Seleção de origem

Tela inicial apresenta três ações: **Da galeria**, **Google Fotos** (fase 2), **Tirar uma foto**.

### Dispositivo

- Usar `<input type="file" accept="image/*" multiple>` com seletor nativo.
- Não exigir permissão de leitura irrestrita da galeria.
- Mostrar prévia, contador, ordenação e opção de remover antes de importar.
- Corrigir orientação EXIF e tratar HEIC quando suportado por browser/adapter; nunca afirmar suporte universal.
- Rejeitar arquivo inválido/tamanho excessivo com mensagem e alternativa.
- Processar miniaturas em thread apropriada quando necessário; liberar object URLs ao sair.
- Não transmitir fotos ao backend durante a simples seleção local.

### Google Fotos (fase 2)

- `ConnectGooglePhotos` inicia OAuth/Picker autorizado pelo backend.
- Enquanto o usuário escolhe imagens, exibir estado `WAITING_PROVIDER` com opção de cancelar.
- Após seleção, mostrar itens importados e erros por imagem sem perder as seleções válidas.
- Não reproduzir uma galeria Google por scraping nem guardar token OAuth no `localStorage`.

### Câmera

- `getUserMedia({video:{facingMode:'user'}})` somente após gesto do usuário e no contexto HTTPS.
- Controles: alternar câmera quando possível, capturar, repetir, aceitar.
- Se negada, apresentar caminho de importação existente.
- Encerrar tracks da câmera na navegação/abandono.

## 7. Fluxo B — Templates

### Catálogo inicial

- Single 1; Duo 2; Trio 3; Classic strip 4; Grid 4; Polaroid 1; Grid 6; Story trio 3.
- Cada template recebe `templateId`, `version`, `aspectRatio`, `slots[]` com geometria normalizada, ordem de camadas e configurações de exportação.
- UI exibe quantidade de fotos exigida; se faltar, permitir placeholders sem publicar composição incompleta.
- O template é dado declarativo validado, não condicional hardcoded em 20 componentes.

### Interface

- Cards com miniatura e badge “4 fotos”.
- Filtro por contagem e proporção.
- Estado selecionado por borda e marcação acessível, não só cor.

## 8. Fluxo C — Editor

### Estrutura

- Canvas principal mostra template e fotos.
- Ferramentas em barra inferior no celular: Fotos / Ajustar / Molduras / Texto / Filtros.
- Undo/redo, zoom da tela, prévia, salvar rascunho e Concluir.
- Barra secundária contextual aparece apenas quando um slot/camada está selecionado.

### Modelo de edição

```ts
type Transform = { x: number; y: number; scale: number; rotation: number };
type PhotoSlot = {
  slotId: string;
  assetId: string | null;
  transform: Transform;
  cropMode: 'cover' | 'contain';
};
type TextLayer = {
  id: string;
  text: string;
  x: number;
  y: number;
  fontId: string;
  color: string;
  size: number;
};
type CompositionDocument = {
  schemaVersion: 1;
  templateId: string;
  templateVersion: number;
  slots: PhotoSlot[];
  textLayers: TextLayer[];
  backgroundColor: string;
};
```

Todas as posições de camadas/slots devem ser normalizadas no espaço do template, independentes dos pixels renderizados na tela. O exportador usa o mesmo documento para evitar divergência prévia/arquivo final.

### Interações essenciais

- Tap num slot → escolher/substituir foto.
- Arrastar para reposicionar; pinça ou slider para zoom; ação Restabelecer.
- Escolher borda/moldura e editar texto sem afetar os arquivos originais.
- Undo/redo com comandos imutáveis, limite de memória e agrupamento coerente de gestos.
- Ao sair com alterações não salvas, confirmar descarte ou salvar rascunho.

### Exportação

- JPG (qualidade configurável) ou PNG, com dimensão padronizada por template.
- Mostrar progresso e permitir cancelar operação pesada.
- Exportar localmente sem publicação obrigatória.
- Tratar CORS e blobs remotos para evitar canvas contaminado (*tainted canvas*).
- Priorizar qualidade visual, evitando upscaling enganoso da imagem original.

## 9. Fluxo D — Mural e publicação

**Mural ≠ composição.** Um mural é coleção ordenada de fotos e permissões; uma composição é arte visual derivada que pode ser exportada.

- Form de título (obrigatório, 1–100 caracteres), descrição opcional, capa.
- Publicação explícita: resumo de quem terá acesso, confirmação e estado de sucesso.
- Link inicial apenas visualização; colaboração exige ativação consciente (fase 2).
- Rascunhos não possuem link público válido.
- Após publicar: prévia, Copiar link, Compartilhar, Gerenciar acesso.
- Revogação oferece confirmação e explicação de que links antigos deixam de funcionar.

## 10. Fluxo E — Convidado

- Página legível sem login quando o link permitir.
- Cabeçalho com capa, título, descrição, contador de fotos aprovadas (se útil) e grid responsivo.
- Abrir foto com lightbox acessível, fechar, navegar para anterior/próxima.
- Estados `LINK_INVALID`, `LINK_EXPIRED`, `LINK_REVOKED`, `MURAL_REMOVED` com mensagens distintas e sem expor dados privados.
- Botão “Adicionar fotos” somente se papel for contribuição e função liberada.
- Upload visitante mostra `Aguardando aprovação`; nunca aparece na galeria até decisão do dono.

## 11. Estados e tratamento de erros

| Contexto | Estados |
|---|---|
| Importação | `IDLE`, `SELECTING`, `PROCESSING`, `READY`, `PARTIAL_ERROR`, `ERROR` |
| Editor | `CLEAN`, `DIRTY`, `SAVING`, `SAVED`, `SAVE_FAILED`, `EXPORTING` |
| Publicação | `DRAFT`, `PUBLISHING`, `PUBLISHED`, `FAILED` |
| Contribuição | `SELECTED`, `UPLOADING`, `PENDING`, `REJECTED`, `APPROVED` |

- Toast apenas para confirmações não críticas; erros estruturais inline.
- Nunca perder a edição por falha de rede.
- Exibir skeletons proporcionais; evitar layout shift e spinner eterno.
- Compatibilidade offline: rascunho local e edição local, sem prometer publicação offline.

## 12. Arquitetura de frontend

```text
src/
  domain/
    composition/      # transformações, slots, invariantes, comandos
    template/         # definição e validação declarativa
  application/
    import-photos/
    edit-composition/
    publish-mural/
    share-mural/
    ports/             # PhotoSource, MuralGateway, ExportRenderer
  infrastructure/
    camera/
    file-picker/
    api-client/
    canvas-renderer/
    local-drafts/
    google-photos/     # fase 2
    face-tracking/     # fase 3
  presentation/
    app/               # Next.js routes
    components/
    viewmodels/
    styles/
```

`presentation` nunca chama banco diretamente nem implementa política de autorização. Adaptadores externos recebem contratos pequenos; não criar `IThingService` artificial sem variação real.

## 13. Contratos para backend

Todos os contratos HTTP detalhados estão em `../memora-backend/BACKEND_SPEC.md`. O frontend deve consumir uma API tipada gerada a partir de OpenAPI ou uma camada client explícita, sem duplicar regras de negócio. Headers `Idempotency-Key` para operações de publicação e criação quando suportado. `401` significa autenticação exigida, `403` sem permissão, `404` recurso não acessível, `409` conflito de versão/estado, `422` campo inválido, `429` limite de requisições.

## 14. TDD e aceitação

### Testes unitários de domínio

- Transformação preserva limites configurados de escala, rotação e enquadramento.
- Template rejeita slot duplicado, geometria inválida e ausência de referência.
- Histórico undo/redo reproduz operações sem mutação dos originais.
- Composição continua consistente após troca de foto.

### Testes de aplicação

- Seleção parcial mantém arquivos válidos e relata os inválidos.
- Salvar rascunho preserva edições após recarregar.
- Publicação não ocorre se validação falhar.
- Revogação limpa estados de link antigos do cliente.

### E2E prioritário

1. Importar 4 fotos locais → template 4 → editar → exportar imagem.
2. Salvar mural → publicar view-only → copiar link → abrir em janela anônima.
3. Abrir link inválido/revogado → sem revelar fotos.
4. Mobile Safari: seletor de fotos, safe area, recorte e exportação.
5. Chrome Android: captura, edição por toque e download.

### DoD frontend

- Todos os estados vazios, falhas e carregamento desenhados e testados.
- A11y (teclado, rótulos, foco, contraste), responsividade e comportamento de toque validados.
- Sem gravação/telemetria das fotos por padrão.
- Sem dependência do backend para uso local do editor.
- Design é fiel ao brand kit, com nenhuma cópia direta de assets do Mentomory.

## 15. Fases de execução

1. Tokens, fontes, navegação, componentes e galeria de templates.
2. Casos de uso de composição, editor Canvas, exportação e rascunhos.
3. Integração API de murais, publicação e link view-only.
4. Convites, upload de contribuições e moderação.
5. Google Fotos e AR, ambos separados por feature flags.

## 16. Pontos abertos

- Identidade do proprietário (Cognito, Auth.js ou outro) ainda não foi aprovada.
- Persistência de rascunhos local: IndexedDB e política de limpeza devem ser testadas em iOS.
- Tamanho máximo por foto, limites de template e resolução de exportação exigem medição de memória real.
- Google OAuth e uso de fotos infantis exigem revisão de consentimento e privacidade antes do lançamento.

