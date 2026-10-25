# M04 — Mural Público

**Status:** draft SDD. **ID visual:** M04.
**Referência:** public/telas/Memora_ Next-gen Brazilian photo mural UI-1.png, quarto telefone, rótulo 04 MURAL PÚBLICO.
**Rota:** /m/[shareToken], mesma leitura de mural convidado detalhada em M10.

## Objetivo

Mostrar um mural autorizado como coleção de fotos. A referência representa o primeiro viewport editorial com collage e CTA condicionado às capacidades reais.

## Composição visual

- Header compacto escuro com voltar, título, busca/mais ações conforme capacidades existentes.
- Collage irregular de fotos ocupa a maior área; recortes se separam por filetes claros e conservam foco visual. Uma legenda/sticker ocupa uma faixa lateral estreita.
- CTA lime fixo ao rodapé respeita safe area. A composição reutiliza fotos reais da resposta shared; exemplos do catálogo vêm de public/brand/v2.
- Texto é Space Grotesk em títulos e DM Sans nos metadados/controles.

## Comportamento e estados

- Consulta somente GET /api/v1/shared/{shareToken}; token não é enviado a endpoints privados.
- Mural e previews renderizam apenas depois de autorização válida. Erros inválido, expirado, revogado e indisponível seguem estados seguros definidos em FRONTEND_SPEC/MEM-008.
- Para grant VIEW, não existe CTA de contribuição: canContribute false remove ação de envio. Um CTA “mandar fotos” só é renderizado quando backend real retorna capacidade e a feature de contribuição está aprovada.
- Foto/capa usa SHARE_VIEW sanitizada e nunca original; falha de preview mostra erro de foto sem fallback ao original.

## Responsividade e acessibilidade

- Collage reordena para uma coluna em largura pequena sem esconder informações ou controles.
- Botões flutuantes não cobrem o fim da última foto. Imagens têm alt significativo ou alt vazio quando repetem conteúdo decorativo.
- Paginação/renovação, foco e lightbox seguem M10; não revelar título ou fotos em estado de erro.

## Aceite

- **FE-M04-AC01:** resposta inválida não expõe título, capa, foto ou UUID do mural.
- **FE-M04-AC02:** para canView true e canContribute false a pessoa navega fotos e nenhuma ação de escrita aparece.
- **FE-M04-AC03:** GET de mídia usa apenas previewUrl da resposta autorizada e estados responsivos não vazam overflow.

## Dúvidas / limites

O board mostra “manda suas fotos”, mas o contrato VIEW-only não autoriza upload; a aparência desse CTA depende de futura capacidade CONTRIBUTE real.
