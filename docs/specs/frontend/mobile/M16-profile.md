# M16 — Perfil e configurações

**Status:** draft SDD. **ID visual:** M16.
**Referência:** public/telas/image3.png, quarto telefone, rótulo 16.
**Rota:** rota de perfil ainda não definida em FRONTEND_SPEC.

## Objetivo

Oferecer um lugar para dados de perfil/preferências quando houver identidade e contrato correspondentes; não inventar métricas sociais.

## Composição visual

- Navegação superior com avatar/engrenagem, retrato circular, saudação curta e blocos de favoritos e preferências.
- Lista de opções com ícones lineares e divisores; navegação inferior mantém consistência com M02.
- Retrato demonstrativo, se usado em catálogo local, vem de public/brand/v2/photos/gallery/profile-blue-wall.webp e é marcado como demonstração; não representa usuário autenticado.
- Títulos em Space Grotesk, UI em DM Sans, fundo paper e ink.

## Comportamento e estados

- Itens de perfil e contagens só vêm de API de perfil aprovada; sem isso, não exibir “12 murais”, “342 fotos” ou identidade fictícia.
- Preferências/sair só ficam acionáveis quando houver sessão e caso de uso real. Não simular logout.
- “Favoritos” só aparece se houver regra de domínio e persistência aprovada; caso contrário a seção é omitida/indisponível.
- Estado de sessão expirada encaminha ao login seguro M13 sem perder composição local.

## Responsividade e acessibilidade

- Em viewport estreito, informações empilham e ações permanecem em ordem lógica; listas têm área de toque de 44×44 px.
- Avatar tem alt de perfil fornecido pela pessoa ou vazio se decorativo; estado de foco e nomes de ação explícitos.

## Aceite

- **FE-M16-AC01:** a tela não apresenta contadores, preferências ou identidade sem fonte de dados aprovada.
- **FE-M16-AC02:** ações de conta só aparecem ativas com sessão e handlers reais; erro de sessão preserva estado local.
- **FE-M16-AC03:** layout responsivo e navegação por teclado cobrem todas as opções existentes.

## Dúvidas / limites

FRONTEND_SPEC não define rota nem contrato de perfil; confirmar esses itens antes de abrir navegação permanente.
