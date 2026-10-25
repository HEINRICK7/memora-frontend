# M01 — Welcome

**Status:** draft SDD. **ID visual:** M01.
**Referência:** public/telas/Memora_ Next-gen Brazilian photo mural UI-1.png, primeiro telefone à esquerda, rótulo 01 WELCOME.
**Rota proposta existente:** /; não exige nova rota.

## Objetivo

Apresentar Memora como lugar para reunir e compartilhar fotos e encaminhar a pessoa à criação de mural. A tela é a entrada pública; não exige login para começar uma composição local.

## Composição visual

- Fundo fotográfico em tela cheia com a selfie de amigos em festival de public/brand/v2/photos/hero/festival-selfie.webp. Usar recorte vertical, camada escura de contraste e imagem sem deformação.
- Wordmark branco no topo; headline agrupada no terço inferior: “seu rolê. suas memórias.”, com “memórias” em lime.
- Texto de apoio “memórias feitas pra compartilhar.” e botão lime de largura quase total “criar mural”. Sticker de estrela e risco ficam decorativos, sem competir com o texto.
- Títulos em Space Grotesk 600–700; texto, botão e navegação em DM Sans. Nenhuma face serifada.

## Componentes e comportamento

- BrandWordmark, HeroPhoto, DecorativeSticker e ButtonPrimary.
- O CTA “criar mural” abre `/templates`, o início funcional disponível do fluxo local de composição. Não abre OAuth nem cria mural antes de a pessoa iniciar a ação correspondente.
- Carregamento da imagem mantém um fundo ink estável; erro de imagem mantém texto e CTA utilizáveis.
- Não apresentar login como pré-condição. Login contextual pertence a M13 e depende de identidade real.

## Responsividade e acessibilidade

- Retrato: fotografia ocupa a tela sem cobrir título/CTA; respeitar safe areas superior e inferior.
- Larguras intermediárias: adaptar o corte e manter a hierarquia em uma coluna.
- Contraste mínimo WCAG AA no texto sobre foto, CTA com alvo de pelo menos 44×44 px, foco visível e sticker ignorado por leitor de tela.
- Respeitar prefers-reduced-motion; animação decorativa não pode atrasar o CTA.

## Aceite

- **FE-M01-AC01:** na rota /, o primeiro viewport mostra o wordmark, headline, apoio e CTA sobre uma foto local de brand; nenhum bloco vazio substitui a imagem.
- **FE-M01-AC02:** o CTA navega para `/templates`, sem criar mural nem enviar fotos por conta própria; a tela não afirma login ou provedor de identidade disponível sem integração aprovada.
- **FE-M01-AC03:** em 375, 390 e 414 px não há rolagem horizontal, o conteúdo respeita safe areas e o foco do CTA é perceptível.

## Dúvidas / limites

O mockup é uma referência de aparência, não define autenticação, telemetria ou persistência.
