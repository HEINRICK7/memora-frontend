# M05 — Novo Mural: origem das fotos

**Status:** draft SDD. **ID visual:** M05.
**Referência:** public/telas/Memora mobile mural creation flow-3.png, primeiro telefone, rótulo 05 NOVO MURAL.
**Rota/estado:** primeiro passo do fluxo /criar; não requer endpoint próprio.

## Objetivo

Deixar a pessoa escolher uma fonte de imagens antes de selecionar fotos.

## Composição visual

- Header com voltar, wordmark central e cancelar.
- Heading grande “de onde vêm as fotos?” com risco manual cobalt/lime.
- Três faixas verticais de origem: minha galeria, Google Fotos e tirar agora; cada faixa usa ícone e miniatura local representativa.
- CTA principal “continuar” fica no rodapé, com nota de que a seleção ocorre depois.

## Comportamento e estados

- Galeria usa seletor nativo File API para imagens que a pessoa selecionar; não pede acesso irrestrito à fototeca.
- Câmera pede permissão após gesto explícito e interrompe tracks ao sair.
- Google Fotos permanece indisponível até integração oficial Picker/OAuth ser entregue; mostrar disabled/“indisponível nesta versão” sem simular conexão.
- Cancelar retorna à tela anterior sem persistir arquivos. Erros de permissão têm alternativa de galeria.

## Responsividade e acessibilidade

- Cartões empilham; miniaturas têm dimensões consistentes e não deformam.
- Cada opção é um botão acessível com estado disabled anunciado; ícone decorativo é oculto de leitor de tela.
- Navegação e CTA respeitam safe area e foco visível.

## Aceite

- **FE-M05-AC01:** escolher galeria abre seletor apenas após ação explícita e não envia bytes ao backend nesta etapa.
- **FE-M05-AC02:** Google Fotos não afirma conexão nem inicia OAuth sem API oficial e configuração aprovadas.
- **FE-M05-AC03:** câmera solicita permissão contextual, tem caminho alternativo e encerra stream ao abandonar o fluxo.

## Dúvidas / limites

A referência é visual; não fixa formatos além do suporte de FRONTEND_SPEC nem concede permissões silenciosas.
