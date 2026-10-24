# MEMORA — Brand & Product System

**Versão:** 1.0 — 24/10/2026  
**Status:** direção visual aprovada; assets vetoriais e performance requerem validação final.

## 1. DNA da marca

- **Nome:** Memora (não Lume).
- **Assinatura oficial:** “Suas histórias merecem ser guardadas.”
- **Proposta:** transformar fotografias em lembranças criativas, personalizadas, duradouras e compartilháveis.
- **Público:** pessoas, famílias, amigos e organizadores de ocasiões especiais; não limitar a crianças.
- **Personalidade:** afetiva, elegante, calma, intimista, contemporânea, confiável, artesanal sem parecer antiga.
- **Promessa:** cada momento pode virar uma história que vale revisitar e compartilhar.
- **Voz:** PT-BR, clara, carinhosa, sem infantilização, sem linguagem corporativa e sem exageros sentimentais.

### Exemplos de microcopy

| Contexto | Texto |
|---|---|
| Boas-vindas | Toda foto conta uma história. |
| CTA principal | Criar um mural |
| Importar | Escolher da galeria |
| Fonte Google | Escolher no Google Fotos |
| Fotos de câmera | Tirar uma foto |
| Compartilhamento | Compartilhar lembranças |
| Privacidade | Só as pessoas convidadas poderão ver. |
| Colaboração | Convide pessoas a acrescentar momentos. |
| Moderar | Revisar fotos recebidas |
| Salvar | Guardar meu mural |
| Vazio | Seu mural começa com uma fotografia. |
| Erro recuperável | Não conseguimos carregar esta foto. Tente novamente. |

## 2. Cores oficiais

| Token | Hex | Uso |
|---|---|---|
| `--color-petrol` | `#243D3A` | Marca, títulos, botões primários, texto de alto contraste |
| `--color-terracotta` | `#C77760` | Ênfase afetiva, seleção e detalhes pequenos |
| `--color-sage` | `#819988` | Cor das letras e ilustração; não usar como texto pequeno em fundo claro |
| `--color-honey` | `#C39452` | Destaques celebrativos, detalhes da marca |
| `--color-linen` | `#F8F5EE` | Base da marca, fundos |
| `--color-white` | `#FFFFFF` | Cartões e superfícies |
| `--color-ink` | `#243D3A` | Texto comum e títulos |
| `--color-muted` | `#536B65` | Texto secundário |
| `--color-line` | `#E4DED3` | Divisores e bordas |

**Teoria das cores:** verde-petróleo frio dá estabilidade; terracota e mel trazem calor e nostalgia; sálvia suaviza transições; linho mantém atenção nas fotos. **Regra 70/20/10:** ~70% linho/branco, 20% verde-petróleo, até 10% acentos. Não usar todas as cores em todos os componentes; multicolor é assinatura da marca.

### Acessibilidade

- Checar WCAG AA em texto normal (alvo mínimo 4.5:1) e texto grande (3:1).
- Textos importantes em petróleo; terracota, sálvia e mel preferencialmente em áreas decorativas ou superfícies que tenham contraste comprovado.
- Foco visível e estados que não dependam apenas da cor; alvos de toque confortáveis (mín. recomendado 44×44 CSS px).
- Respeitar `prefers-reduced-motion`; não usar piscadas e flashes intensos.

## 3. Tipografia

- **Logotipo:** Google Fonts **Engagement Regular**, de Astigmatic. Preservar traço caligráfico e espaços ópticos; não usar uma script genérica parecida.
- **UI e corpo:** **DM Sans** (fallback `system-ui, sans-serif`), com pesos 400/500/600/700.
- **Títulos editoriais opcionais:** **Cormorant Garamond** (fallback Georgia), com moderação; a marca com Engagement já é expressiva.
- Não usar Engagement para botões, formulários, parágrafos ou labels pequenos.
- Escala base sugerida (mobile): display 36/40, h1 30/36, h2 24/30, h3 20/26, body 16/24, supporting 14/20, caption 12/16; ajustar após testes.

## 4. Logotipo e ícone

### Wordmark principal

- Texto exato: **Memora** (M maiúsculo, restante minúsculo).
- Família Engagement, sem símbolo adicional.
- Cada letra colorida na ordem **M petróleo, e terracota, m sálvia, o mel, r petróleo, a terracota**.
- Fundo preferido: linho. Manter ampla área livre em torno da assinatura.
- Assinatura abaixo apenas quando houver espaço; não incorporá-la em favicon.

### Ícone (direção aprovada)

- Silhueta **circular** de linho, centro ocupado por um **M** caligráfico Engagement multicolorido.
- As diferentes pinceladas/trechos do M alternam petróleo, terracota, sálvia e mel; preservar reconhecimento em 32 px.
- Fora do círculo, transparente nos assets de marca. Para app-store/PWA, fornecer também PNG quadrado preenchido para cumprir os requisitos de plataforma.
- Evitar camera, coração, flash, lente, fotografia ou marca gráfica extra.

### Variantes requeridas

1. Wordmark multicolor em linho.
2. Wordmark monocromático petróleo em fundo claro.
3. Wordmark monocromático linho/branco em fundo escuro.
4. Ícone circular M multicolor sobre linho, transparência externa.
5. Ícone alternativo alto contraste, monocromático.
6. `favicon.ico`, `favicon.svg`, `apple-touch-icon.png` 180 px e ícones PWA 192/512 px.

**Estado dos assets:** imagens geradas nas conversas são direção artística, não master vetorial validado. A implementação deve renderizar a fonte oficial, conferir glifos e exportar vetores/PNGs com bordas limpas, sem artefatos. Não tratar prévias de IA como SVG exato.

## 5. Linguagem visual

- Fotografia é protagonista: imagens reais em proporções coerentes, retratos não distorcidos, `object-fit: cover` onde houver corte controlado.
- Referências visuais: papel fotográfico, álbuns artesanais, bordas de Polaroid, fita de papel *apenas* nos templates, texturas sutis (nunca pesado).
- Cantos UI 12–20 px, cartões em branco/linho, bordas neutras, sombras muito discretas.
- Layout mobile-first, grande respiro, grid de 4 ou 8 px, conteúdo máximo ~1120 px no desktop.
- Evitar gradientes de IA, glassmorphism generalizado, dashboard corporativo, roxo neon, excesso de ícones e artes artificiais como conteúdo final.
- Ícones de interface Lucide consistentes; não misturar coleções.

## 6. Páginas e componentes

### Telas v1

1. **Início/Criar:** mensagem da marca, entradas Galeria / Google Fotos / Câmera, modelos recomendados e projetos recentes.
2. **Templates:** tipos (single, duo, trio, classic strip, grid, Polaroid); prévia com quantidade de fotos e seleção.
3. **Editor:** canvas central; substituir/recortar/posicionar foto por slot; ações Fotos, Molduras, Texto, Filtros; histórico desfazer/refazer; CTA Concluir.
4. **Prévia/publicação:** título, descrição, capa, política de visualização, opção permitir contribuições e revisão obrigatória para novos uploads quando habilitado.
5. **Compartilhar:** copiar link, compartilhar usando mecanismo nativo quando disponível, revogar/regenerar acesso e escolher papel.
6. **Mural público por convite:** galeria legível, capa, visualização em tela cheia, colaboração condicionada à permissão, sem conta obrigatória para visualização.
7. **Moderação:** fotos pendentes, aprovar/rejeitar, reportar conteúdo e gerenciar convidados.
8. **Meus murais:** lista de rascunhos, publicados e arquivados, sempre com status distinguível.

### Componentes

`BrandWordmark`, `BrandMonogram`, `AppHeader`, `SourceCard`, `TemplateCard`, `PhotoTile`, `PhotoSlot`, `CompositionCanvas`, `EditorToolbar`, `ColorChip`, `PhotoCropper`, `PrivacySelector`, `ShareSheet`, `InviteLink`, `ContributionsQueue`, `EmptyState`, `ConfirmDialog`, `Toast`, `Skeleton`.

### Responsividade

- Mobile: área de canvas completa com toolbar fixa inferior, ações essenciais acessíveis com polegar.
- Tablet: canvas + drawer de ferramentas lateral.
- Desktop: editor com canvas central, painel direito para edição e navegação superior.
- Sempre prever safe areas do iPhone e controles suficientemente grandes.

## 7. Fluxos

### Mural novo

Escolher fonte → selecionar fotos → normalizar orientação e gerar miniaturas → escolher template → atribuir fotos aos slots → editar → nomear → salvar rascunho → publicar → compartilhar.

### Convidado

Abrir link → validar acesso/expiração → ver mural → (se permitido) selecionar fotos → confirmar envio → aguardam moderação → proprietário aprova → mural reflete imagens aprovadas.

### Regras de permissão

- `PRIVATE`: apenas proprietário/autorizados.
- `LINK_VIEW`: qualquer pessoa com link válido pode ver; não indexar, expiração/revogação e senha opcional.
- `LINK_CONTRIBUTE`: link distinto ou permissão explícita; convidados enviam, **nunca** publicam diretamente.
- Apenas dono/editor autorizado altera mural, retira imagens ou aprova contribuições.
- Toda contribuição deve identificar o evento de upload e seu estado `PENDING | APPROVED | REJECTED`.

## 8. Importação de fotografias

- **Dispositivo/iPhone:** File API (`input accept="image/*" multiple`) usando o seletor do sistema; o site não lê a fototeca inteira.
- **Câmera:** `getUserMedia` sob HTTPS, com permissão explícita; também oferecer seletor `capture` como fallback.
- **Google Fotos:** Picker API oficial e OAuth 2.0; o usuário seleciona os itens; autenticação segura; tokens não ficam embutidos no frontend.
- Aceitar JPEG/PNG/WebP/HEIC quando a plataforma e conversão suportarem; informar incompatibilidades, limites, dimensões e tipo de arquivo.
- Sanitizar metadados sensíveis (ex.: localização EXIF) antes de compartilhar; manter original privado se realmente necessário.
- Não enviar para backend imagens usadas somente em prévias locais sem uma ação explícita de salvar/publicar.

## 9. Modelo de domínio inicial

- `User` — proprietário, identidade e preferências.
- `Mural` — id, dono, título, descrição, capa, status, visibilidade, timestamps.
- `PhotoAsset` — storage key, owner, dimensões, mime, tamanhos derivados, hash/deduplicação opcional.
- `MuralPhoto` — relação ordenada e legenda entre mural e foto.
- `Template` — id, version, proporção, slots, máscaras e restrições.
- `Composition` — template + transformações não destrutivas por slot, camadas de texto/decor.
- `ShareGrant` — token opaco armazenado em hash, papel, expiração, revogação.
- `Contribution` — foto proposta, remetente opcional, status, decisão de moderação.
- `EffectPreset` — parâmetros independentes do adaptador MediaPipe/Three.js (fase posterior).

Invariantes: mural publicado tem dono, projeto não acessa imagem de outro dono, token não confere edição por padrão, publicação de contribuição exige aprovação, exclusão respeita políticas de retenção.

## 10. Arquitetura técnica

```text
src/
  domain/         # entidades, invariantes, políticas, eventos
  application/    # casos de uso, portas, DTOs, orquestração
  infrastructure/ # persistência, storage, OAuth, image processing, camera, AR
  presentation/   # Next.js, React, hooks, componentes, rotas
```

- **Frontend:** Next.js + React + TypeScript; CSS variables/tokens; editor em Canvas/WebGL.
- **Persistência proposta:** PostgreSQL e storage compatível com S3 para imagens compartilhadas.
- **Autenticação:** opção a decidir antes da implementação; visitante não precisa criar conta para visualizar link permitido.
- **Imagens:** versões pequenas para listas e tela cheia, URLs temporárias para privados, exportação em resolução original suportada.
- **AR posterior:** MediaPipe Face Landmarker → `FaceState` normalizado → shaders + Three.js, com adapters; filtros não dependem de React.
- **Backend:** API fina, use cases explicitando regras; armazenamento e serviços externos atrás de ports.
- **Observação:** esta stack é direção proposta, não infraestrutura implantada.

## 11. Qualidade e segurança

- Testes de domínio para papéis, visibilidade, expiração e estados de contribuição antes de implementação (RED → GREEN → REFACTOR).
- Testes de aplicação: importar, publicar, compartilhar, revogar, contribuir, moderar, exportar.
- Integração: OAuth Google Photos, armazenamento assinado, persistência, conversão de imagens.
- E2E: dispositivo → template → salvar → link → convidado → envio → aprovação.
- Privacidade por padrão; não indexar murais compartilhados; prevenir enumeração de IDs e vazamento de tokens.
- Limites de upload, MIME sniffing, tratamento de conteúdo inseguro, rate limiting e cotas; mecanismo de denúncia e remoção.
- Crianças: não criar perfis biométricos, não fazer identificação facial, não vender dados, orientar adulto responsável e minimizar retenção.
- Não inventar métricas de desempenho; medir LCP, tempo de exportação, memória em iOS/Android e FPS dos filtros em celulares reais.

## 12. Escopo de entrega

### MVP 1 (prioridade)

Galeria local, escolha de template, editor de slots, prévia, exportar JPG/PNG, salvar rascunho e mural compartilhável com link somente de visualização, com privacidade explícita.

### MVP 2

Google Fotos Picker, permissão para contribuir, fila de moderação, gerenciamento de links.

### MVP 3

Filtros em fotos existentes, efeitos faciais AR 3D e vídeo (com desempenho e compatibilidade testados).

## 13. Critérios de aceite

- [ ] Logo Engagement fiel, monograma circular e paleta consistente.
- [ ] Tela de início no estilo editorial/afetivo aprovado, sem estética SaaS.
- [ ] Importação local de múltiplas fotos em Android e iPhone.
- [ ] Fotos entram em templates e podem ser reposicionadas sem perda destrutiva.
- [ ] Exportação preserva proporções e fidelidade visual.
- [ ] Proprietário escolhe visibilidade antes de compartilhar.
- [ ] Link revogável e não adivinhável; fotos privadas protegidas.
- [ ] Convidado vê apenas o que está publicado; upload pendente não aparece.
- [ ] Navegação com teclado, rótulos, foco visível e sem flashes.
- [ ] Testes de domínio/aplicação/fluxos essenciais aprovados.

## 14. Decisões ainda abertas

- Modelo de autenticação do proprietário.
- Prazo padrão para expiração de links e política de retenção de rascunhos.
- Limites gratuitos por mural e tamanhos de imagens.
- Nomes finais dos templates e política de conteúdo.
- Desenho vetorial definitivo e revisão de legibilidade a 16/32 px.
- Verificação de domínio, marca e disponibilidade comercial do nome Memora.

## 15. Referências oficiais

- Google Fonts Engagement: https://fonts.google.com/specimen/Engagement
- Google Fonts repositório: https://github.com/google/fonts/tree/main/ofl/engagement
- MediaPipe Face Landmarker Web: https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js
- Three.js: https://github.com/mrdoob/three.js
- Google Photos Picker API: https://developers.google.com/photos/picker/guides/get-started-picker
- File API: https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications

