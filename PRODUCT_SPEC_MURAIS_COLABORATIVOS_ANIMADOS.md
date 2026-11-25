# Memora — Especificação de Produto: Murais Colaborativos e Templates Animados

**Data:** 24/10/2026  
**Status:** especificação consolidada das decisões e propostas discutidas a partir da pergunta “O que nosso sistema vai entregar pro usuário?”  
**Processo de implementação:** SDD (Spec-Driven Development) → TDD (RED → GREEN → REFACTOR) → Clean Architecture.  
**Documentos associados:** `MIGRACAO_BRAND_GENZ_V2.md`, `FRONTEND_SPEC.md`, `BACKEND_SPEC.md`, `BRAND_SYSTEM.md`, `SDD_TDD_PROTOCOL.md`.

> **Atenção ao status:** este arquivo descreve o produto **planejado**. O incremento I-02 (link de colaboração, foto pendente, aprovação e o mesmo link) está especificado em MEM-009 e implementado no código. QR Code, rate limit, motores de animação e exportação de vídeo continuam nos incrementos seguintes. Um raster de referência não é catálogo e não entra na interface.

## 1. Visão do produto

### Nome e posicionamento

- **Produto:** Memora.
- **Categoria:** criação, organização, personalização e compartilhamento de murais fotográficos.
- **Foco de comunicação inicial:** geração Z, grupos de amigos e pessoas que compartilham experiências.
- **Públicos adicionais:** famílias, casais, formandos, aniversariantes, participantes de viagens e outros eventos. Não limitar tecnicamente o produto a uma idade.
- **Posicionamento proposto:** um lugar para reunir perspectivas diferentes de um mesmo acontecimento, transformando fotos espalhadas em memórias compartilháveis.
- **Frase de campanha proposta:** **“O rolê acaba. As memórias ficam.”**
- **Diferencial escolhido:** murais colaborativos, não apenas um editor individual de fotos.

### Problema

Após uma viagem, festa, aniversário ou show, as fotos ficam espalhadas pelos celulares das pessoas presentes. Reunir os registros exige pedir arquivos individualmente, e compartilhá-los como experiência visual exige ainda mais trabalho.

### Promessa para o usuário

**Uma pessoa cria o mural, outras contribuem com fotos e o grupo revisita uma história coletiva pelo mesmo link.**

Não posicionar o Memora como substituto direto de Instagram ou TikTok. Redes sociais distribuem posts para audiência; Memora organiza e apresenta as lembranças de quem participou da experiência.

## 2. Capacidades entregues ao usuário

| Código | Capacidade | Comportamento esperado |
|---|---|---|
| `MEM-P01` | Criar mural | Criar coleção com título, capa, fotos e estado inicial de rascunho |
| `MEM-P02` | Importar fotos | Usar seletor do dispositivo; câmera quando permitida; Google Fotos em fase posterior |
| `MEM-P03` | Escolher template | Ver modelos e requisitos de quantidade/proporção antes de selecionar |
| `MEM-P04` | Personalizar | Ajustar posição de fotos, textos, cores e elementos decorativos sem destruir o original |
| `MEM-P05` | Publicar | Conferir título, capa, visibilidade, contribuições e prévia |
| `MEM-P06` | Compartilhar | Obter link seguro que pode ser copiado e enviado por qualquer app |
| `MEM-P07` | Colaborar | Convidado abre link autorizado e envia fotos sem conta, se a política do mural permitir |
| `MEM-P08` | Moderar | Proprietário aprova ou recusa fotos antes de elas aparecerem publicamente |
| `MEM-P09` | Revisitar | Mural compartilhado mostra novas fotos aprovadas sem trocar o endereço do link |
| `MEM-P10` | Organizar | Proprietário acessa rascunhos, murais publicados e estados de contribuição |
| `MEM-P11` | Exportar | Baixar composições estáticas; vídeo/GIF animado requer fluxo próprio a definir |
| `MEM-P12` | Experiência animada | Abrir um mural com template em movimento e controlar interações compatíveis com dispositivo |

### Exemplo de jornada — viagem

1. Ana cria o mural **Summer 26**.
2. Seleciona fotos da galeria, escolhe um template e publica.
3. Gera um link de colaboração e o compartilha no grupo.
4. Os amigos abrem o link e enviam imagens próprias.
5. Cada contribuição entra como **pendente**, invisível para visitantes.
6. Ana aprova ou recusa as fotos.
7. Fotos aprovadas passam a aparecer no mural já compartilhado.
8. O grupo revisita o mesmo link no futuro.

### Exemplo de jornada — aniversário

1. Uma pessoa cria **Meu Niver** e personaliza fotos, cores e título.
2. Escolhe um template estático ou o futuro **Meu Niver 3D**.
3. Coloca o QR Code de colaboração na festa.
4. Convidados escaneiam, enviam fotos e recebem confirmação.
5. O criador modera os envios; o mural incorpora o conteúdo aprovado.

## 3. Links, convites e QR Code

### Dois propósitos de acesso

| Tipo de link | Acesso concedido | Restrição |
|---|---|---|
| **Visualização** | Ver fotos e composições aprovadas | Não concede upload nem edição |
| **Colaboração** | Visualizar e enviar fotos, se habilitado | Não concede publicação imediata nem administração |

Os dois propósitos não devem compartilhar privilégios implicitamente. O backend verifica o token, seu tipo, estado, expiração, mural e permissões a cada ação protegida. Não aceitar apenas um booleano vindo do frontend como prova de autorização.

### Experiência de quem recebe o link

1. Abre uma página web responsiva, sem exigir instalar aplicativo.
2. Visualiza mural, autor e fotos aprovadas, conforme permissão.
3. Se puder colaborar, encontra o CTA **Adicionar minhas fotos**.
4. Seleciona fotos do dispositivo (não acessar toda a galeria sem consentimento).
5. Pode informar nome, conforme decisão de produto e privacidade.
6. Confirma o envio e vê o estado **Aguardando aprovação**.
7. Se o upload falhar parcialmente, fotos válidas não devem ser perdidas sem aviso.

### QR Code

- Representa o **link de colaboração**, não uma permissão adicional independente.
- Pode ser baixado/imprimido para mesas, convites, festas, formaturas e eventos.
- Ao revogar o convite, o QR Code correspondente deixa de autorizar novos acessos.
- O QR Code deve oferecer alternativa textual para quem não pode escanear.

### Configurações do proprietário

- Ativar/desativar novas contribuições.
- Aprovação **obrigatória** antes da publicação de contribuições no MVP.
- Revogar/regenerar links de colaboração.
- Encerrar período de envio sem apagar automaticamente fotos aprovadas.
- Aprovar, recusar e remover fotos conforme regras de acesso.
- Ver status e falhas de processamento, sem mostrar dados privados indevidamente.
- Limites de arquivos/tamanho/quantidade e expiração **a definir antes do desenvolvimento**.

### Segurança e privacidade

- Tokens de alta entropia, armazenamento por hash quando adequado, revogação e escopos mínimos.
- Evitar token em logs, ferramentas de analytics, cabeçalhos de referência, previews externos e mensagens de erro.
- `Referrer-Policy: no-referrer` em páginas com links privados; considerar `noindex`.
- Validar arquivos pelo conteúdo efetivo e regras de formato/tamanho, não somente pela extensão.
- Prevenir abuso com limites de taxa e volume; proteger armazenamento e URL de upload.
- Considerar remoção de metadados de localização EXIF nas imagens públicas.
- Estabelecer política de retenção e exclusão; manter separação entre fotos pendentes e públicas.
- Visitante anônimo não vira membro autenticado do tenant/proprietário por enviar foto.

## 4. Estratégia de produto e MVP

A colaboração deixa de ser uma ideia remota: foi **priorizada como diferencial central do MVP** após a discussão. Isto atualiza a priorização anterior que a colocava genericamente na segunda etapa.

### MVP essencial

1. Criar mural, adicionar fotos do dispositivo e organizar rascunhos.
2. Selecionar e personalizar ao menos um template funcional.
3. Publicar com política de visibilidade explícita.
4. Compartilhar link de visualização.
5. Compartilhar link de colaboração.
6. Enviar fotos por link no navegador sem conta, quando permitido.
7. Moderar fotos: pendente → aprovada/recusada.
8. Exibir fotos aprovadas no mesmo mural sem gerar novo link.
9. Fluxos mobile e desktop responsivos, com tratamento de erros.

### Etapa seguinte

- QR Code pronto para impressão, limites e administração avançados.
- Google Fotos Picker API autorizado (não scraping).
- Catálogo completo de templates estáticos/animados.
- Exportações sofisticadas, compartilhamento nativo quando disponível e recursos de edição adicionais.

### Trilha de evolução dos templates animados

- **Primeiro protótipo:** `Meu Niver 3D`, comprovando renderização, inserção de fotos, loop, interação, responsividade, desempenho e fallback.
- **Expansão:** dez motores de animação e três variações de estilo em cada um, totalizando 30 opções de catálogo **planejadas**.
- A disponibilidade de 10/30 opções é uma meta de produto, **não um compromisso de entrega do primeiro MVP** sem validação técnica e estimativa.

## 5. Templates animados — conceito geral

O usuário escolhe um template, fornece fotos e personaliza textos/cores. O mural abre como uma experiência animada e interativa, mantendo sempre meios simples de visualizar fotografias.

**Importante:** nem toda animação precisa ser 3D. Usar Three.js onde profundidade, câmera, texturas e interação espacial agreguem valor; usar CSS ou animação DOM quando forem mais simples, acessíveis e eficientes.

### Catálogo: 10 motores e 30 variações

| ID | Template | Movimento/interação | Variações propostas |
|---|---|---|---|
| `AT-01` | **Meu Niver 3D** | Fotos entram com rotação e profundidade; título elástico; confetes; toque aproxima foto | Coral Party, Lime Birthday, Dark Celebration |
| `AT-02` | **Photo Dump Alive** | Fotos caem sobre o canvas; arrastar, ampliar e girar | Chaos, Clean, Sticker |
| `AT-03` | **Memory Orbit** | Fotos orbitam título; gesto controla rotação; seleção vem à frente | Circle, Spiral, Floating |
| `AT-04` | **Film Roll** | Tira de fotografias atravessa a tela; scroll avança/pausa | Vertical, Horizontal, Cinematic |
| `AT-05` | **Festival Pulse** | Pôster fotográfico responde a pulsos visuais e toque, sem exigir áudio | Electric, Night, Sunset |
| `AT-06` | **Road Trip Passport** | Páginas viram em 3D; cada página traz fotos, local e legenda | Beach, City, Adventure |
| `AT-07` | **Mosaic Motion** | Blocos se reorganizam e revelam fotos grandes ao toque | Grid, Asymmetric, Reveal |
| `AT-08` | **Floating Memories** | Fotos suspensas em profundidades; movimento suave de câmera | Light, Dark, Dreamy |
| `AT-09` | **Kinetic Poster** | Tipografia cinética, fotos sob máscaras e transições | Bold, Minimal, Editorial |
| `AT-10` | **Memory Tunnel** | Galeria espacial em sequência, avanço por scroll/toque | Timeline, Depth, Gallery |

### Template-piloto: Meu Niver 3D

**Referência visual:** composição `Meu Niver` enviada pelo usuário — recortes fotográficos inclinados, letras grandes pretas sobre coral, estrela lima, detalhes azul-cobalto e cena de aniversário. A imagem original é referência de layout, não código nem template editável.

**Roteiro conceitual de animação (valores de demonstração):**

1. Fundo coral surge.
2. Camadas de fotos entram em profundidades diferentes.
3. Título `Meu Niver` cresce com amortecimento elástico.
4. Estrela e confetes ganham movimento leve.
5. Usuário toca em uma foto e ela se aproxima; toque fora retorna.
6. A animação volta ao início, se `loop` estiver ativo.

**Configurações propostas:** fotos, título, cor/tema, velocidade moderada, loop on/off, habilitar/desabilitar elementos. Uma demonstração pode começar com ~6 fotos e ~8 segundos, mas esses números **não estão aprovados como invariantes de domínio**.

### Critérios de qualidade dos templates

- Legibilidade da foto e do texto supera efeitos.
- Nunca depender apenas de gesto complexo para visualizar imagens.
- Evitar movimentos contínuos excessivos; pausar ao perder visibilidade/foco.
- Disponibilizar **reduzir movimento** e fallback estático.
- Preview é representação do template real, sem divergência visual sistemática.
- O template é **versionado**: mudanças posteriores não quebram murais antigos.
- Distinguir assets de exemplo gerados por IA de fotos privadas do usuário.

## 6. Experiência de edição e publicação

### Mobile

- Catálogo com miniaturas estáticas ou previews curtas sob demanda.
- Editar foto/camada, texto e variação visual por controles simples.
- Toolbar inferior de edição, CTA visível e respeito às safe areas.
- Preview animada em área dedicada; não renderizar dez cenas WebGL simultaneamente na lista.

### Desktop

- Biblioteca de fotos à esquerda, canvas no centro, propriedades à direita.
- Timeline/controle de velocidade pode surgir apenas para templates que realmente precisem dele.
- Controles de mouse e teclado; equivalente de toque/gestos documentado.

### Para o convidado

- Link abre a composição publicada com animação opcional.
- Botão para pausar/reduzir movimento.
- Acesso direto à galeria de fotos aprovadas.
- Colaboração apenas se o convite der permissão específica.

### Exportação

- Captura estática e exportação de composição podem compartilhar a mesma fonte de layout.
- **MP4/GIF não surgem automaticamente por usar Three.js.** Planejar captura, codificação, dimensões, fila/processamento ou alternativa client-side apropriada.
- Definir depois limites de duração/resolução, áudio, compatibilidade e custo. Não prometer download de vídeo no primeiro MVP sem implementação/testes.

## 7. Arquitetura recomendada

### Camadas

```text
domain/
  mural/                  # regras de estado e publicação
  contributions/          # estados pendente/aprovada/recusada
  sharing/                # políticas de acesso
  templates/              # definição, limites, versão, slots e variantes

application/
  use-cases/              # criar mural, adicionar fotos, publicar,
                          # emitir/revogar links, submeter/moderar,
                          # escolher/validar template
  ports/                  # repository, storage, token/clock quando necessários

infrastructure/
  persistence/            # repositories concretos
  storage/                # upload/objetos, miniaturas
  security/               # assinatura, tokens e rate-limiting concretos

presentation/
  web/                    # Next.js, React, formulários, rotas, estados
  editor/                 # UI de composição e previews
  animated-templates/     # Three.js / React Three Fiber / animação DOM
```

Domínio e aplicação **não importam** React, Three.js, Spring Boot, banco ou serviços externos. Não criar abstrações sem variação real ou isolamento útil.

### Stack direcionada

- **Web:** Next.js + React + TypeScript, mobile-first.
- **3D:** Three.js + React Three Fiber, carregados sob demanda para templates que precisam de WebGL.
- **Timeline:** GSAP ou alternativa equivalente **apenas após avaliação de dependência/licença e necessidade**.
- **Backend proposto nas specs anteriores:** Java 21, Spring Boot, PostgreSQL e armazenamento de objetos (ex.: S3); manter proposta sem reescrever por causa dos efeitos visuais.
- **Fallback:** CSS/DOM ou thumbnail estática sem WebGL.

React Three Fiber oferece modo de renderização sob demanda, especialmente útil para cenas não contínuas. Gerenciar texturas, materiais, geometrias e contexto da GPU é obrigatório ao trocar templates ou desmontar componentes.

### Contrato conceitual do template

```typescript
type AnimatedTemplateDefinition = {
  id: string;
  version: number;
  name: string;
  minPhotos: number;
  maxPhotos: number;
  variants: ReadonlyArray<string>;
  supportedAspectRatios: ReadonlyArray<string>;
  supportsReducedMotion: true;
  // Parâmetros específicos validados por schema versionado.
};

type PublishedComposition = {
  muralId: string;
  templateId: string;
  templateVersion: number;
  variantId: string;
  photoAssetIds: ReadonlyArray<string>;
  title: string;
  // Posicionamentos, cortes, camadas e configurações persistidos por versão.
};
```

Não gravar estados internos de Three.js como modelo do domínio. Posições, transformações, cortes, camadas e seleções devem ser **dados serializáveis**, independentes do renderer.

## 8. Estados e transições relevantes

### Mural

```text
DRAFT --publicar--> PUBLISHED
PUBLISHED --arquivar--> ARCHIVED
```

Transições reversas, exclusão e recuperação exigem definição explícita de regras e autorização; não presumir.

### Contribuição

```text
UPLOADING --upload válido--> PENDING
PENDING --aprovação do proprietário--> APPROVED
PENDING --recusa do proprietário--> REJECTED
UPLOADING --falha--> FAILED (reenvio controlado)
```

- Fotos `PENDING`/`REJECTED` não aparecem no mural público.
- Bloquear aprovação sem permissão de proprietário/administrador autorizado.
- Tratar repetição de requests para evitar duplicidade de mídia ou transições inválidas.
- Revogação do link impede novos envios; efeitos em uploads em andamento precisam de regra explícita.

## 9. SDD e TDD — comportamento antes do framework

### Casos de aceitação prioritários

| ID | Dado | Quando | Então |
|---|---|---|---|
| `MEM-COL-001` | Mural aceita contribuições; token válido | Convidado envia fotos válidas | Entram como `PENDING` |
| `MEM-COL-002` | Fotos pendentes | Visitante abre mural | Não vê conteúdo pendente |
| `MEM-COL-003` | Proprietário autorizado | Aprova contribuição | Fotos aparecem no mural |
| `MEM-COL-004` | Contribuição pendente | Pessoa não autorizada tenta aprovar | Sistema rejeita sem alteração |
| `MEM-COL-005` | Link revogado ou expirado | Alguém tenta novo upload | Upload é negado |
| `MEM-COL-006` | Link de visualização | Convidado tenta contribuir | Upload é negado |
| `MEM-COL-007` | Contribuição aprovada | Amigo reabre o mesmo link | Visualiza a nova foto, sem URL nova |
| `MEM-ANI-001` | Template válido e fotos suficientes | Seleciona modelo | Preview renderiza sem alterar originals |
| `MEM-ANI-002` | Poucas fotos para a composição | Tenta publicar | Regra impede publicação incompleta |
| `MEM-ANI-003` | Mural antigo com template versionado | Renderer é atualizado | Composição publicada permanece compatível |
| `MEM-ANI-004` | Dispositivo sem WebGL | Abre mural animado | Vê alternativa estática utilizável |
| `MEM-ANI-005` | Preferência por movimento reduzido | Abre mural | Efeitos são reduzidos/pausados |
| `MEM-ANI-006` | Usuário troca de template | Cena anterior desmonta | Recursos anteriores são liberados |

### Ordem de implementação

1. Criar especificação/critério de aceite da feature.
2. RED: testes do domínio (invariantes, publicação e permissões).
3. GREEN + REFACTOR: entidades/políticas independentes.
4. RED/GREEN para casos de uso de upload, convite, moderação, publicação.
5. Integrar adapters reais de banco, armazenamento e autenticação.
6. Criar testes de endpoints e conectar controllers finos.
7. Implementar UI responsiva e renderer de templates.
8. Testar E2E real: criar → compartilhar → contribuir → moderar → revisitar.
9. Testes de fallback, memória, mobile e acessibilidade.

Não usar mocks para fingir que upload, persistência ou compartilhamento reais foram validados. Stubs de dependência podem ser usados em **testes unitários isolados**, mas evidências de integração exigem infraestrutura efetiva.

## 10. Critérios de aceite de UX e performance

- [ ] Fotos mantêm proporção correta e corte controlável.
- [ ] Todos os controles têm descrição acessível; ações funcionam por teclado quando aplicável.
- [ ] Conteúdo compartilhado é utilizável sem animação ou sem WebGL.
- [ ] `prefers-reduced-motion` funciona.
- [ ] Ao trocar de template, não há crescimento contínuo de memória GPU.
- [ ] Galeria e lista de templates não mantêm vários canvases pesados rodando fora da tela.
- [ ] Ao alternar de aba, animações não consomem recursos sem necessidade.
- [ ] Em celular real, o editor e a reprodução mantêm usabilidade aceitável, aferida por testes; não inventar FPS.
- [ ] Fotos reais de convidados não são expostas antes da aprovação.
- [ ] QR Code e links revogados perdem efetividade conforme política.
- [ ] Um mural com novas fotos aprovadas permanece acessível pelo mesmo endereço enquanto o token estiver válido.

## 11. Dependências e decisões abertas

1. **Autenticação do proprietário:** provedor e fluxo final a definir em ADR.
2. **Política de colaboração:** expiração padrão de convite, máximo de fotos, limites de tamanho, rate limit, retenção de pendentes/recusadas.
3. **Privacidade do nome do colaborador:** opcional/obrigatório e visibilidade pública.
4. **QR Code:** impressão/download e layout final de cartão/cartaz.
5. **Templates:** quantidade inicial implementável, formatos, requisitos de fotos e parâmetros por motor.
6. **Vídeo/GIF:** necessidade, custo, codificação, navegador, exportação e resolução.
7. **Google Fotos:** OAuth, Picker e suporte de importação conforme fase aprovada.
8. **Aprovação em lote:** eventual recurso futuro; não presumir.
9. **Brand v2:** SVGs finais e exportação dos assets fotográficos ainda pendentes.
10. **Analytics:** métricas agregadas e tratamento de dados privados, somente se justificadas e consentidas.

## 12. Entregas recomendadas por incremento

| Incremento | Entrega verificável |
|---|---|
| `I-01` | Mural básico com upload real e link de visualização |
| `I-02` | Link de colaboração; fotos pendentes; aprovação; visualização das aprovadas |
| `I-03` | QR Code, revogação e controles de segurança completos |
| `I-04` | `Meu Niver 3D` interativo com fallback e testes de performance |
| `I-05` | Catálogo ampliado de templates e primeiras variações |
| `I-06` | Dez motores/30 variações, condicionado à validação do protótipo |
| `I-07` | Exportação animada, se tecnicamente e economicamente aprovada |

**Princípio final:** o editor e as animações atraem o usuário; a colaboração e a preservação das histórias justificam continuar usando o Memora.
