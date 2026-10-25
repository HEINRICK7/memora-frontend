# Memora frontend — catálogo de telas e SDD

**Estado:** 23 specs; M01/W01 e M03/W04 implementadas e validadas visualmente em Docker. M02 mobile visual foi validada por fixture, mas a navegação dos cards e as demais telas continuam em andamento.
**Referências oficiais:** boards em `public/telas/`; assets de demonstração em `public/brand/v2/`.
**Comportamento e segurança:** `FRONTEND_SPEC.md`, `BACKEND_SPEC.md`, `AGENTS.md` e os contratos de cada feature continuam prevalecendo.

## Decisão para numeração mobile

O texto do brief anexado e as legendas numeradas das boards discordam sobre a correspondência de algumas telas depois de M04. Para decisões visuais, esta documentação usa os números e títulos legíveis nas imagens. O texto do brief continua sendo referência de escopo funcional, mapeado abaixo. Onde o mockup sugere integração ou permissão ainda não coberta por contrato, a tela não simula essa integração.

| ID visual | Título lido na referência | Referência |
|---|---|---|
| M01 | Welcome | `Memora_ Next-gen Brazilian photo mural UI-1.png`, quadro 01 |
| M02 | Seus murais | `Memora_ Next-gen Brazilian photo mural UI-1.png`, quadro 02 |
| M03 | Templates | `Memora_ Next-gen Brazilian photo mural UI-1.png`, quadro 03 |
| M04 | Mural público | `Memora_ Next-gen Brazilian photo mural UI-1.png`, quadro 04 |
| M05 | Novo mural / origem das fotos | `Memora mobile mural creation flow-3.png`, quadro 05 |
| M06 | Seleção de fotos | `Memora mobile mural creation flow-3.png`, quadro 06 |
| M07 | Editor | `Memora mobile mural creation flow-3.png`, quadro 07 |
| M08 | Nome e privacidade / publicação | `Memora mobile mural creation flow-3.png`, quadro 08 |
| M09 | Share success | `image2.png`, quadro 09 |
| M10 | Guest public mural | `image2.png`, quadro 10 |
| M11 | Guest contribution | `image2.png`, quadro 11 |
| M12 | Contribution moderation | `image2.png`, quadro 12 |
| M13 | Login | `image3.png`, quadro 13 |
| M14 | Estado vazio de meus murais | `image3.png`, quadro 14 |
| M15 | Configurar mural | `image3.png`, quadro 15 |
| M16 | Perfil | `image3.png`, quadro 16 |

O editor de texto/stickers, preview de template, publicação, convite e upload descritos no texto são documentados como estados/fluxos dentro das telas visuais correspondentes quando a referência não mostra uma tela separada. Não se atribuem permissões nem endpoints a partir de um mockup.

M02 usa o contrato real de lista e de fotos para murais próprios. Como o ambiente local está sem murais, a comparação dos cards usa uma fixture visual temporária e rotulada, sem persistir imagens demo no MinIO; o estado vazio também foi capturado com a resposta real do backend.

Os nomes dos arquivos M01–M16 mantêm os slugs do brief escrito; o título e o campo **ID visual** dentro de cada arquivo seguem a board. Este crosswalk evita que o slug seja confundido com o conteúdo visual:

| ID do texto | Conteúdo escrito | ID visual / tratamento |
|---|---|---|
| M01 | Welcome / onboarding | M01 |
| M02 | Home com feed | M02; mostrar apenas dados de mural cobertos por API, sem inventar feed público |
| M03 | Meus Murais | M02 quando há coleção e M14 no estado vazio |
| M04 | Detalhes do Mural | M04 e M10, apresentações do mesmo contrato de leitura shared |
| M05 | Templates | M03 mobile e W04 desktop |
| M06 | Preview do Template | Interação/preview ligada ao catálogo M03/W04; não há board mobile exclusiva |
| M07 | Importação | M05 |
| M08 | Seleção de fotografias | M06 |
| M09 | Editor visual | M07 |
| M10 | Texto e stickers no editor | Estado/ferramentas do M07; não corresponde ao convidado visual M10 |
| M11 | Publicação | M08 e M15 mobile; W05 desktop |
| M12 | Compartilhamento | M09 mobile; controles desktop relacionados em W07 |
| M13 | Convite para contribuição | M11 e CTA condicionado em M04/M10; só com contrato real de contribuição |
| M14 | Upload de colaborador | Passo de envio em M11; só após contrato MEM-009 real |
| M15 | Login | M13 visual; não simular provedor ou sessão |
| M16 | Perfil e configurações | M16 |

M12 visual (moderação mobile) e W07 (contribuições desktop) têm equivalência comportamental com o mesmo fluxo de moderação; contribuição pendente nunca aparece como publicada.

## Inventário desktop

| ID | Tela | Referência |
|---|---|---|
| W01 | Landing page | `Memora Gen Z Desktop Mural Showcase-2.png`, quadro superior |
| W02 | Dashboard de murais | `Memora Gen Z Desktop Mural Showcase-2.png`, quadro inferior |
| W03 | Editor de colagens | `image.png` |
| W04 | Catálogo de templates | `Memora templates and publish flow-4.png`, quadro superior |
| W05 | Publicação | `Memora templates and publish flow-4.png`, quadro inferior |
| W06 | Mural compartilhado | `image4.png`, quadro superior |
| W07 | Gerenciamento de contribuições | `image4.png`, quadro inferior |

## Critério de conclusão

Uma tela só pode ser marcada como concluída quando existe spec e aceite; o comportamento real ou explicitamente indisponível está claro; os breakpoints relevantes funcionam; os testes aplicáveis passam; há screenshot da implementação no viewport comparável; e diferenças visuais relevantes foram corrigidas ou registradas com motivo. “Rota responde 200” e “componente renderiza” não bastam para validação visual.

Relatórios e screenshots finais ficam em `docs/IMPLEMENTATION_STATUS.md` e `docs/visual-validation/`. Screenshots de referência são material de comparação, não imagens a exibir dentro do produto.
