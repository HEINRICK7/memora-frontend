# FE-W07 — Fotos compartilhadas pelos convidados

**Status:** especificação do histórico do anfitrião, somente leitura.
**Requirement IDs:** FE-W07-R01–R04 · **Acceptance IDs:** FE-W07-AC01–04.
**Route/access:** `/murais/[muralId]/contribuicoes` · proprietário autorizado.

## Objetivo

Mostrar ao anfitrião as fotos que os convidados escolheram compartilhar no álbum universal. Cada convidado mantém seu próprio álbum privado; o anfitrião não recebe as prévias nem aprova contribuições `READY`.

## Requisitos

- **FE-W07-R01:** a página lista somente contribuições já publicadas no álbum universal, vindas da API real do mural.
- **FE-W07-R02:** contribuições privadas `READY`, em envio ou falhas não aparecem nessa página nem retornam URLs de prévia ao anfitrião.
- **FE-W07-R03:** não há fila de aprovação, ações aprovar/recusar ou contagem de pendências.
- **FE-W07-R04:** estados de carregamento, vazio e indisponibilidade são claros; nenhum item ou contador fictício aparece.

## Layout e navegação

- Header Memora e identificação do mural autorizado.
- Lista responsiva de fotos compartilhadas com nome opcional e data apenas quando retornados pela API.
- “Gerenciar links” abre `/murais/[muralId]/compartilhar`; esta tela não armazena nem recupera `shareUrl` e não apresenta QR Code.
- A tela não disponibiliza acesso aos álbuns pessoais privados dos convidados.

## Acessibilidade

Imagens têm texto alternativo contextual, lista utilizável por teclado, foco visível, contraste adequado e cartões legíveis em 1440, 1024, 768, 414, 390, 375 e 320 px.

## Aceite

- **FE-W07-AC01:** só fotos publicadas no álbum universal aparecem no histórico do anfitrião.
- **FE-W07-AC02:** fotos `READY` privadas não aparecem nem expõem URL assinada.
- **FE-W07-AC03:** não existem botões de aprovar ou recusar fotos.
- **FE-W07-AC04:** listas vazias, erro e carregamento não usam dados ilustrativos.
