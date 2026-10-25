# Design system Memora v2

**Estado:** tokens visuais definidos a partir da board oficial em `public/telas/Memora — Gen Z brand system-5.png`; implantação e contraste serão validados na UI.
**Precedência:** este documento e `specs/decisions/ADR-brand-v2.md` definem a apresentação v2; `FRONTEND_SPEC.md` e `BACKEND_SPEC.md` definem comportamento, privacidade e contratos.

## Tipografia

| Papel | Família | Pesos | Uso |
|---|---|---|---|
| Display | Space Grotesk | 600, 700 | Títulos, números e chamadas expressivas |
| Interface | DM Sans | 400, 500, 600, 700 | Navegação, formulários, controles, mensagens e texto corrido |
| Fallback | `system-ui, sans-serif` | — | Falha de carregamento da fonte |

Não usar fontes serifadas nem Engagement/Cormorant Garamond na interface v2. A board identifica Space Grotesk e DM Sans. O wordmark é minúsculo e pesado; usar o lockup tipográfico aprovado e o monograma vetorial `public/brand/v2/logo-monogram.svg`. Não transformar screenshot de marca em arquivo-mestre.

## Cores

| Token | Valor | Papel |
|---|---|---|
| `--color-ink` | `#191D20` | Texto principal, navegação e superfícies escuras |
| `--color-paper` | `#F7F7F2` | Fundo claro |
| `--color-lime` | `#D9FD61` | Ação primária e destaque |
| `--color-cobalt` | `#475CFA` | Seleção, foco e acento |
| `--color-coral` | `#FF725E` | Ação celebrativa contextual |
| `--color-white` | `#FFFFFF` | Superfície e texto em fundo escuro |

Tokens semânticos definidos para controles e estados:

| Token | Valor | Regra |
|---|---|---|
| `--color-background` | `var(--color-paper)` | Fundo de página |
| `--color-foreground` | `var(--color-ink)` | Texto sobre fundo claro |
| `--color-surface` | `var(--color-white)` | Superfície elevada |
| `--color-border` | `#E3E3DC` | Divisórias e contorno neutro |
| `--color-interactive` | `var(--color-lime)` | Ação primária; texto `ink` |
| `--color-hover` | `#C8F043` | Hover da ação primária; texto `ink` |
| `--color-focus` | `var(--color-cobalt)` | Anel de foco visível |
| `--color-selected` | `var(--color-cobalt)` | Seleção; texto branco ou indicador com nome/ícone |
| `--color-disabled-background` | `#E3E3DC` | Fundo desabilitado |
| `--color-disabled-foreground` | `#51585D` | Texto desabilitado, ainda legível |
| `--color-success` / `--color-success-soft` | `#176B45` / `#E6F4EB` | Estado textual e fundo de sucesso |
| `--color-warning` / `--color-warning-soft` | `#7A4A00` / `#FFF3D6` | Estado textual e fundo de atenção |
| `--color-error` / `--color-error-soft` | `#B42318` / `#FEE4E2` | Estado textual e fundo de erro |

As cores semânticas além da paleta são escolhas de interface, não cores observadas na board. Contraste calculado em sRGB para pares de texto propostos: ink/lime 14,68:1; ink/paper 15,79:1; cobalt/paper 4,68:1; branco/cobalt 5,02:1; muted `#4E565C`/paper 6,96:1; disabled `#51585D`/`#E3E3DC` 5,61:1; success 5,74:1; warning 6,78:1; error 5,45:1. Validar os pares realmente usados e foco/estados no navegador antes de concluir.

## Espaçamento, forma e fotografia

- Base de espaçamento: múltiplos de 4 px; tokens de 4, 8, 12, 16, 24, 32, 40, 48 e 64 px.
- Botão primário tem alto contraste, alvo mínimo de 44×44 CSS px e forma arredondada conforme a referência.
- Cards fotográficos preservam a imagem como conteúdo principal; `object-fit: cover`, corte declarado por contexto e texto legível sobre a foto.
- Superfícies usam paper/white e bordas finas; superfícies ink reservadas à navegação/experiências escuras mostradas nas referências.
- Stickers, rabiscos, corações e estrelas são decorativos e moderados; não competem com fotos nem informação de estado.
- Usar fotos de demonstração apenas de `public/brand/v2/`; não repetir a mesma foto na mesma grade. Identificar conteúdo sintético onde necessário.
- Referências em `public/telas/` nunca são assets de runtime da aplicação.

## Componentes-base

Reutilizar os componentes existentes antes de criar novos: wordmark/monograma, header, botão, icon button, campo, chip, photo card, mural card, template card, photo grid, modal/drawer, toast, empty/loading/error states, mobile bottom navigation e desktop sidebar. Não introduzir biblioteca visual genérica nem criar abstração sem uso real.

Estados nunca dependem apenas de cor. Botões têm hover, active, focus-visible, disabled e busy; formulários têm label, erro associado e foco; modal/drawer mantém foco e retorna ao acionador. Animação respeita `prefers-reduced-motion`.
