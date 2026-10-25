# FE-W01 — Landing page desktop

**Status:** draft SDD; requires review before implementation is considered complete.
**Requirement IDs:** FE-W01-R01–R05 · **Acceptance IDs:** FE-W01-AC01–AC06.
**Route/access:** / · public.

## Objective

Apresentar Memora e levar a pessoa a criar um mural ou explorar templates sem fazer alegações de produto, audiência ou integração que não tenham sido comprovadas.

## Visual reference

Arquivo public/telas/Memora Gen Z Desktop Mural Showcase-2.png, painel superior: header, hero e faixa editorial escura. A moldura do navegador, barra de endereço e controles do sistema na captura não fazem parte da página.

## Layout and components

- Header horizontal ink: wordmark Memora em lima à esquerda; links para destinos existentes (`/meus-murais` e `/templates`) no centro; botão “criar mural” à direita. Não mostrar acesso de perfil enquanto `/perfil` não existir.
- Hero em duas regiões assimétricas: à esquerda, título grande em três linhas (“seu rolê. suas memórias.”), apoio “junta a galera, cria um mural e salva tudo que importa.” e CTAs coral/lima; à direita, colagem fotográfica espontânea com cortes, bordas e rabiscos/stickers da identidade.
- Faixa ink abaixo do hero com “criou. compartilhou. virou memória.” e fragmentos de fotografia nas bordas.
- Componentes reutilizáveis: BrandHeader, BrandWordmark, Button, PhotoCollage, DecorativeSticker. Fotos decorativas têm alt vazio e aria-hidden; imagens informativas recebem descrição.
- Paleta: ink #191D20, paper #F7F7F2, lime #D9FD61, cobalt #475CFA, coral #FF725E e white. Space Grotesk 600–700 em títulos; DM Sans 400–700 em navegação, corpo e controles. Nenhuma fonte serifada.

## Interactions, states and navigation

- “criar mural” e “templates” abrem `/templates`, que inicia o fluxo local implementado; “escolher fotos” abre a biblioteca existente em `/biblioteca`; “meus murais” abre `/meus-murais` sob o controle de acesso previsto.
- Links navegam para rotas ou âncoras existentes. Não criar uma exploração pública de murais sem contrato.
- Loading de fonte/imagem reserva dimensões para evitar layout shift; falha de imagem mantém composição legível com fallback de marca, sem bloco genérico permanente.
- O painel de prova social da referência não exibe número nem quantidade de usuários enquanto não houver fonte real aprovada. Fotos de demonstração da marca podem aparecer apenas como conteúdo sintético visual, nunca como mural real.

## Responsive and accessibility

- A partir de 1024 px mantém hero em duas regiões e colagem assimétrica. Em tablet, reduz a colagem e o tamanho do título sem sobreposição.
- Em 768 px ou menos, usa a composição mobile M01, não uma página desktop apenas estreitada. Verificar 375, 390, 768, 1024 e 1440 px; também 320 e 414 px para overflow.
- Foco visível, ordem de tabulação igual à ordem visual, landmarks semânticos, um h1, contraste WCAG AA e alvos interativos de pelo menos 44×44 CSS px. Movimento decorativo respeita prefers-reduced-motion.

## Acceptance

- **FE-W01-AC01:** em 1440 px a estrutura, proporção hero/colagem, header escuro e CTAs correspondem ao painel superior de referência, sem reproduzir a moldura do browser.
- **FE-W01-AC02:** a renderização usa Space Grotesk nos títulos e DM Sans na UI, sem família serifada carregada ou aplicada.
- **FE-W01-AC03:** as ações principais levam a destinos existentes; nenhum link fica sem destino ou anuncia uma integração inexistente.
- **FE-W01-AC04:** imagens usam arquivos locais de public/brand/v2; arquivos com texto/UI dos mockups não são usados como fotografia do hero.
- **FE-W01-AC05:** nenhuma métrica, depoimento ou quantidade de usuários é apresentada sem dado verificável.
- **FE-W01-AC06:** a página não tem overflow horizontal nos breakpoints definidos, mantém foco/contraste e recolhe para a composição M01.
