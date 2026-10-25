# Instruções para agentes — Memora

Leia `BRAND_SYSTEM.md`, `MIGRACAO_BRAND_GENZ_V2.md`, `FRONTEND_SPEC.md`, `../memora-backend/BACKEND_SPEC.md` e `SDD_TDD_PROTOCOL.md` por completo antes de iniciar qualquer feature. A direção visual vigente é a v2. Comportamento e segurança continuam nas specs funcionais.

## Modo de trabalho obrigatório

1. Descreva o comportamento e aceite da feature.
2. Modele invariantes em `domain` e crie testes de comportamento primeiro.
3. Implemente use cases em `application` dependentes de contratos específicos.
4. Integre `infrastructure` com bancos, OAuth, storage, câmera, MediaPipe, Three.js.
5. Conecte `presentation` sem regra de negócio em componentes.
6. Valide UX mobile, responsividade, contraste, privacidade e fluxo E2E.

## Restrições

- A v2 usa Space Grotesk nos títulos e DM Sans na interface. Não trocar Engagement por outra fonte manuscrita. Os arquivos da v1 ficam como histórico até existir um wordmark vetorial contornado e aprovado.
- Não tratar imagem gerada como master vetorial da marca. Fotos de `public/brand/v2/` são exemplos sintéticos.
- Não usar a expressão “Lume”; o nome é Memora.
- Não usar Ant Design, glassmorphism, gradientes neon e cards genéricos de dashboard.
- Não misturar conceitos `Mural` e `Composition`: mural recebe contribuições; composição é o arranjo visual exportável.
- Nunca publicar contribuição sem aprovação quando o link é colaborativo.
- Tokens de compartilhamento e OAuth não vão para logs e analytics.
- Não criar integração fake com Google Fotos; somente API oficial, podendo adiar a fase.
- Testes reais; não inventar métricas, status de produção ou compatibilidade.

## Critérios de revisão de PR

- O domínio roda sem Next.js, React, banco ou APIs externas?
- O componente apresenta estado sem incorporar política de negócio?
- As dependências concretas entram por adaptadores quando necessário?
- A UI respeita tokens, hierarquia e a identidade aprovada?
- O fluxo foi testado no iPhone e no Android, quando depende de APIs do navegador?
- O recurso respeita consentimento e privacidade das fotografias?
- A mudança diminui ou apenas aumenta a complexidade?

