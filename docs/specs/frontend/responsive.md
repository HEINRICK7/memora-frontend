# Especificação responsiva

## Faixas e evidências

Implementação mobile-first; conferir screenshots e interação em 320, 375, 390, 414, 768, 1024 e 1440 px. Os alvos exigidos pelo brief são 375, 390, 768, 1024 e 1440 px; 320 e 414 px verificam o limite estreito e a transição de aparelhos comuns.

| Faixa | Comportamento esperado |
|---|---|
| 320–768 px | Navegação móvel, conteúdo em uma coluna quando a referência pede, controles de toque ≥44×44 px, safe area no rodapé; W01 recolhe para M01 |
| 769–1023 px | Grade e painéis reduzem colunas; editor mantém canvas prioritário e ferramentas acessíveis sem overflow |
| 1024 px ou mais | Composição desktop própria; sidebar e painéis aparecem nas telas que os mostram; o editor W03 usa biblioteca/canvas/propriedades |

## Regras

- Mobile e desktop derivam do mesmo sistema visual, mas cada um respeita sua composição de referência; não esticar a tela mobile para preencher desktop.
- Não permitir rolagem horizontal da página. Grades fotográficas usam tracks com `minmax(0, 1fr)` e itens com `min-width: 0`.
- Cabeçalhos longos quebram de forma segura; CTAs e links clicáveis não quebram em duas linhas sem especificação visual para isso.
- Imagens mantêm proporção e enquadramento definidos na spec da tela; usar `sizes`/carregamento adequado e evitar layouts que mudem após a imagem carregar.
- Navegação inferior e toolbar do editor consideram `env(safe-area-inset-bottom)`; conteúdo não fica atrás de controles fixos.
- Breakpoints podem ser ajustados se a composição real da referência exigir; documentar a mudança e manter os sete viewports de validação.
- Verificar teclado, foco, toque, zoom e `prefers-reduced-motion`. Viewport emulado não prova compatibilidade física com Safari iOS ou Chrome Android.
