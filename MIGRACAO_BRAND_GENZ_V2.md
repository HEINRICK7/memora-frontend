# Memora — Plano de migração de branding Gen Z v2

**Data:** 24/10/2026
**Status:** fundamentos visuais e fotos de demonstração aplicados na interface. Wordmark contornado, favicon.ico, ícones PWA 192/512 e verificação em aparelhos físicos continuam pendentes.
**Público inicial de comunicação:** geração Z, com foco em pessoas jovens que criam e compartilham murais de festas, viagens, amizades e aniversários. O produto **não** deve impor restrições de idade ou excluir outros públicos por causa da linguagem visual.

## 1. Decisão e objetivo

Migrar a apresentação do Memora de um visual editorial nostálgico (linho, caligrafia, pétalas e papel antigo) para uma identidade visual contemporânea, expressiva, fotográfica e orientada a compartilhamento.

**O que muda:** direção de arte, tipografia, cores, logotipo/ícone, linguagem de interface, templates, fotografia de demonstração, componentes visuais e comportamento responsivo.

**O que não muda:** nome `Memora`; conceito de mural fotográfico; origens de fotos (dispositivo, câmera e Google Fotos na fase prevista); edição não destrutiva; compartilhamento por link; permissões; fluxo de contribuições com moderação; arquitetura de domínio, contratos existentes e políticas de segurança.

O produto continua mobile-first com interface web desktop da mesma família visual. **Não transformar o redesign em uma nova feature ou reescrever o backend.**

### Precedência documental

Este documento substitui as **decisões visuais** das seções 1–6 de `BRAND_SYSTEM.md` v1 e os tokens em `assets/tokens.css` **após a migração ser implementada e validada**. `FRONTEND_SPEC.md`, `BACKEND_SPEC.md` e `SDD_TDD_PROTOCOL.md` seguem sendo as fontes de verdade de comportamento e arquitetura. Em conflito de comportamento/segurança, as specs funcionais prevalecem. Registrar esta decisão como ADR antes de declarar a v2 publicada.

## 2. Identidade visual v2

### Personalidade

- Criativa, jovem, humana, espontânea, direta, divertida e com personalidade.
- Referências de direção: cultura de photo dump, editor criativo, shows, viagens, encontros e compartilhamento entre amigos.
- Textos em PT-BR natural, sem forçar gírias. Humor e emojis são opcionais e contextuais.
- Fotos reais de usuários continuam sendo o conteúdo central; ilustrações e stickers são recursos secundários.
- Evitar aparência genérica de dashboard SaaS, gradientes de IA, glassmorphism indiscriminado, estética corporativa, filtros retrô aplicados a todas as fotos, ornamentos florais e fontes caligráficas.

### Paleta proposta

| Token semântico | Hex | Uso principal |
|---|---|---|
| `--brand-ink` | `#191D20` | texto, fundos escuros, navegação |
| `--brand-paper` | `#F7F7F2` | fundo claro e superfícies neutras |
| `--brand-lime` | `#D9FD61` | CTA principal e destaque |
| `--brand-cobalt` | `#475CFA` | seleção, foco, labels expressivos e acentos |
| `--brand-coral` | `#FF725E` | momentos celebrativos e CTA contextual |
| `--brand-white` | `#FFFFFF` | superfícies e texto sobre fundo escuro |

Não inventar tokens de estados (`hover`, `disabled`, `muted`, `border`, `danger`) a partir de capturas geradas. Derivar na implementação, checar contraste AA e documentar no design system. Texto pequeno sobre lime ou coral precisa de contraste validado; preferir `ink` sobre `lime`.

### Tipografia

| Aplicação | Direção |
|---|---|
| Títulos, destaques, numerais | `Space Grotesk`, pesos 600–700, com ajustes de tracking aprovados por UX |
| UI, navegação, inputs, mensagens | `DM Sans`, pesos 400–700 |
| Logo | **Novo wordmark vetorial customizado** `memora` minúsculo, grotesk arredondado e espesso. A imagem gerada não é arquivo-mestre da logo |
| Fallback | `system-ui, sans-serif` |

Remover o uso visível de `Engagement Regular` e `Cormorant Garamond` do produto v2. Os arquivos da marca v1 ficam preservados temporariamente como histórico, sem exclusão até aprovação dos novos vetores.

### Novo ícone

- Ícone quadrado de cantos arredondados com fundo `ink` e monograma geométrico **`m`** em `lime`.
- Exportar `favicon.svg`, `favicon.ico`, `apple-touch-icon.png` (180×180), PWA 192/512 e variantes para fundos claros/escuros.
- O desenho deve ser feito/refinado em vetor. Não exportar uma prévia raster gerada por IA como marca oficial.

### Componentes e layout

- Grid de espaçamento em múltiplos de 4 px; escalas finais de tipografia/espaçamento ficam em tokens revisados.
- Botão principal geralmente lime/ink; secundário ink/paper; terciário outline. Foco sempre visível.
- Cards fotográficos com `object-fit: cover`, título legível e status não dependente só de cor.
- Chips de filtros, etiquetas curtas, stickers ocasionais; evitar excesso de elementos decorativos.
- Mobile: toolbar inferior do editor e CTA com safe area. Desktop: biblioteca à esquerda, canvas central, propriedades à direita.
- Animação discreta, com redução via `prefers-reduced-motion`; sem flashes que prejudiquem acessibilidade.
- Definir `alt` significativo para fotos informativas; stickers puramente decorativos usam `aria-hidden`.

## 3. Conteúdo e microcopy

| Contexto | Proposta v2 | Observações |
|---|---|---|
| Hero | `seu rolê. suas memórias.` | Não remover a proposta clara do produto |
| CTA | `criar mural` | Palavra simples; aplicar mesma ação no mobile e web |
| Coleção | `seus momentos, todos aqui.` | Status rascunho/publicado acessível |
| Templates | `escolhe o mood` | Explicar tipo, proporção e quantidade de fotos |
| Importação | `de onde vêm as fotos?` | Fontes e permissões claras |
| Seleção | `escolhe os melhores cliques` | Contador de seleção |
| Publicação | `bora dar um nome?` | Privacidade explícita |
| Compartilhar | `tá no ar!` | Informar exatamente quem pode abrir o link |
| Contribuir | `também tava lá? manda!` | Informar revisão prévia |
| Moderação | `fotos novas!` | Botões `Aprovar` / `Recusar` inequívocos |
| Aniversário | `meu niver` | Template editável, não título fixo em domínio |

O slogan anterior **“Suas histórias merecem ser guardadas.”** pode permanecer como copy institucional secundária, mas não como heading obrigatório em todas as telas.

## 4. Matriz de telas a atualizar

| ID | Mobile | Desktop correspondente | Critério visual principal |
|---|---|---|---|
| `MOB-01` | Home | `WEB-01` Home | Hero com fotos espontâneas, CTA lime |
| `MOB-02` | Meus murais | `WEB-02` Meus murais | Capas em grade e status visível |
| `MOB-03` | Templates | `WEB-04` Templates | Photo Dump, Poster, 4 Frames, Vibes, Meu Niver |
| `MOB-04` | Mural público | `WEB-06` Mural público | Galeria de fotos protagonistas |
| `MOB-05` | Origem das fotos | fluxo de criação desktop | Galeria, Google Fotos, câmera conforme fase |
| `MOB-06` | Seleção | biblioteca desktop | Seleção múltipla e contador |
| `MOB-07` | Editor | `WEB-03` Editor | Ferramentas mobile versus painéis desktop |
| `MOB-08` | Configurar/publicar | `WEB-05` Publicar | Título, visibilidade, capa, CTA |
| `MOB-09` | Sucesso/compartilhar | `WEB-07` Compartilhar | URL e permissões inequívocas |
| `MOB-10` | Mural de convidado | `WEB-06` | Ler sem login se link permitir |
| `MOB-11` | Contribuição | fluxo convidado desktop | Upload, nome, moderação informada |
| `MOB-12` | Moderação | `WEB-07` | Aprovar/rejeitar por permissão |
| `MOB-13` | Entrar | Login contextual desktop | Sem bloquear edição local desnecessariamente |
| `MOB-14` | Estado vazio | `WEB-02` | CTA para primeiro mural |
| `MOB-15` | Configurações do mural | Configurar desktop | Mudanças de privacidade explícitas |
| `MOB-16` | Perfil | Perfil web se existir | Sem inventar métricas sociais como requisito |

**Nota de escopo:** os mockups contêm elementos visuais conceituais (estatísticas de participantes, exploração pública, botões de redes sociais e contadores fictícios). Não implementá-los automaticamente. Somente recursos previstos nas specs funcionais entram no MVP.

## 5. Templates e ativos fotográficos

### Templates de demonstração

1. `photo-dump`: layout assimétrico com 4–8 fotos.
2. `poster`: foto dominante, título e poucas camadas.
3. `4-frames`: grade de quatro fotos.
4. `vibes`: composições coloridas e textos curtos.
5. `festival`: galeria de show.
6. `trip`: viagem em grupo.
7. `meu-niver`: aniversário, fotos, bolo e stickers editáveis.

O template deve continuar sendo **dado declarativo**, versionado e validado, não um componente com regras hardcoded por template. A arte quadrada `Meu Niver` gerada é uma **prévia de capa**, não o modelo editável definitivo.

### Inventário de imagens

Consultar `GENZ_ASSET_MANIFEST.md`: foram gerados na conversa conceitos de fotografias de festival, praia, viagem, festa, skate, aniversário e outros, além da capa `Meu Niver`.

**Bloqueio real:** imagens exibidas no chat ainda **não estão exportadas** em arquivos de mídia separados no repositório. Os nomes do manifesto são destinos planejados. O agente deve primeiro obter/exportar os arquivos, registrar dimensões, formatar WebP/AVIF quando apropriado e verificar cada arquivo antes de referenciá-lo no código. Não usar URLs inventadas, imagens perdidas, scraping ou screenshots contendo UI como substitutos de assets fotográficos.

Quando a exportação estiver pronta, usar estrutura:

```text
public/brand/v2/
  logo-wordmark.svg
  logo-monogram.svg
  favicon.svg
  photos/
    hero/
    murals/
    birthday/
    gallery/
  templates/
  graphics/
```

Identificar exemplos sintéticos. Nunca misturar imagens demonstrativas com fotos reais enviadas pelos usuários. Fotos pessoais precisam manter suas regras de privacidade, autorização e exclusão.

## 6. Mudanças nos arquivos existentes

| Alvo | Ação requerida |
|---|---|
| `BRAND_SYSTEM.md` | Atualizar status/versão e apontar esta migração como decisão v2; não apagar o histórico v1 |
| `assets/tokens.css` | Substituir valores de marca e acrescentar tokens semânticos acessíveis |
| `assets/memora-wordmark.svg` | **Não sobrescrever antes de obter vetor v2 aprovado**; depois migrar consumidores |
| `assets/memora-icon.svg` | Mesma regra; gerar variante de monograma v2 |
| `FRONTEND_SPEC.md` | Atualizar seção de design e matriz de telas; não reescrever regras de domínio |
| `BACKEND_SPEC.md` | Nenhuma alteração por branding, salvo novos requisitos explicitamente aprovados |
| `SDD_TDD_PROTOCOL.md` | Manter processo de rastreabilidade e critérios de aceite |
| `agent/AGENTS.md` | Adicionar referência à migração v2 e regra de precedência visual |
| Frontend real | Aplicar temas, componentes, layout mobile/desktop e imagens exportadas |

Proibir refatoração ampla em módulos não relacionados durante a troca de marca.

## 7. Plano de execução — SDD + TDD + Clean Architecture

### Fase A — Especificar (SDD)

1. Inventariar todas as rotas/componentes atuais e capturas aprovadas.
2. Registrar decisão ADR: branding Gen Z v2 substitui o v1.
3. Congelar tokens, wordmark/ícone vetoriais e exemplos de componentes.
4. Detalhar contratos de cada tela e comportamento responsivo sem inventar funcionalidades.
5. Confirmar disponibilidade/licença das fontes e exportação dos assets.

### Fase B — Testar (RED)

1. Testes de tokens e consistência de temas onde aplicável.
2. Testes comportamentais dos controles (seleção, upload, edição, publicação e moderação).
3. Testes acessíveis de labels, teclado, contraste, foco e estados.
4. Testes de regressão de fluxo e autorização.

### Fase C — Implementar (GREEN → REFACTOR)

1. Implementar design tokens globais e fontes no boundary de apresentação.
2. Criar/refinar primitivas existentes (`Button`, `Input`, `Chip`, `Card`, `PhotoTile`); reutilizar, não duplicar.
3. Aplicar header, navegação e layouts responsivos.
4. Integrar fotos e thumbnails exportados.
5. Migrar telas por fluxo vertical e refatorar sem alterar comportamento.
6. Executar testes e revisão visual a cada fluxo.

### Dependências arquiteturais

```text
presentation/       UI, CSS, fontes, imagens, componentes, hooks/viewmodels
application/        casos de uso já existentes e ports; apenas adaptações necessárias
domain/             regras de mural, template, contribuição e permissão: inalteradas
infrastructure/     arquivos estáticos/CDN e adapters se realmente necessários
```

- Não mover regras de negócio para componentes ou CSS.
- Não alterar as permissões dos links por causa de novos controles visuais.
- Não criar novos services/interfaces apenas para trocar o design.
- Testar regras importantes sem dependência de React, Next.js, browser ou banco.

## 8. Critérios de aceite

- [ ] Wordmark e favicon v2 aprovados em SVG real e tamanhos de ícone necessários.
- [ ] Tokens v2 aplicados sem cores antigas vazando para as telas novas.
- [ ] Fotos independentes exportadas, catalogadas e ligadas aos componentes corretos.
- [ ] Template de aniversário editável com fotos, texto e cores; capa estática usada apenas como demonstração.
- [ ] Mobile e desktop exibem a **mesma identidade** com layouts adequados a cada largura.
- [ ] Editor desktop com biblioteca, canvas e propriedades; mobile com toolbar inferior funcional.
- [ ] Testes dos fluxos existentes passam: importar → selecionar → editar → publicar → compartilhar → contribuir → moderar.
- [ ] Mural privado não aparece para quem não tem permissão.
- [ ] Estados vazio, loading, erro e sucesso definidos, sem CTAs falsos.
- [ ] Fonte carregada com fallback; sem layout shift inaceitável.
- [ ] WCAG AA, navegação por teclado, touch targets e `prefers-reduced-motion` verificados.
- [ ] Testes em larguras ~360, 390, 768, 1024 e 1440 px, com screenshots de comparação visual.
- [ ] Migração concluída sem quebrar os contratos do backend.

## 9. Fora de escopo desta mudança

- Reescrever backend, persistência, autenticação ou políticas de contribuição.
- Implementar exploração social pública, seguidores, contadores de likes ou integrações com plataformas apenas porque aparecem em um mockup.
- Publicar um novo logo baseado em uma imagem raster sem validação vetorial.
- Considerar imagens geradas no chat automaticamente disponíveis no filesystem.

## 10. Ordem recomendada de PRs

1. `brand-v2-foundations`: ADR, tokens, tipografia e SVGs aprovados.
2. `brand-v2-media`: exportação e catálogo das mídias e previews de templates.
3. `brand-v2-mobile`: Home, criação, editor, murais, compartilhamento e moderação.
4. `brand-v2-desktop`: equivalentes web, editor de três painéis e responsividade.
5. `brand-v2-qa`: testes E2E, acessibilidade, comparação visual, performance e limpeza dos estilos legados sem deleção prematura.

**Definição de pronto:** a migração só termina quando as telas reais e os assets exportados estiverem verificados, não quando os mockups estiverem bonitos.
