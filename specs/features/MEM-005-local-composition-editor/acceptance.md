# MEM-005 — Critérios de aceite

## MEM-005-AC01 — Criar composição a partir de template

**Given** uma pessoa no catálogo e um template válido  
**When** aciona “Usar template”  
**Then** um draft UUID e `CompositionDocument` v1 são criados no armazenamento local  
**And** a navegação abre `/editor/{draftId}` sem chamar API de mural/composição.

## MEM-005-AC02 — Criar slots segundo o template

**Given** template com N slots e versão V  
**When** cria uma composição  
**Then** documento guarda `templateId`, `templateVersion: V` e exatamente N slots  
**And** slots começam vazios, com transform padrão e `cropMode: cover`.

## MEM-005-AC03 — Mostrar biblioteca READY

**Given** biblioteca carregada  
**When** abre seletor de foto para um slot  
**Then** aparecem apenas as fotos READY devolvidas pelo gateway, com prévias temporárias recentes.

## MEM-005-AC04 — Atribuir uma foto

**Given** slot vazio e foto READY disponível  
**When** escolhe a foto  
**Then** o slot exibe a prévia correta  
**And** o asset ID é salvo no documento local.

## MEM-005-AC05 — Substituir ou remover

**Given** um slot já associado a foto  
**When** escolhe outra foto ou remove a atual  
**Then** somente aquele slot muda e o estado novo é persistido.

## MEM-005-AC06 — Reusar foto

**Given** foto READY já usada em outro slot  
**When** atribui a mesma foto a um segundo slot  
**Then** ambas as referências são mantidas sem cópia de bytes.

## MEM-005-AC07 — Restaurar sem URLs expiradas

**Given** draft salvo e URLs de preview anteriores expiradas  
**When** abre novamente `/editor/{draftId}`  
**Then** documento e asset IDs são restaurados do IndexedDB  
**And** o gateway busca URLs atuais  
**And** nenhum URL ou token assinado é lido do draft local.

## MEM-005-AC08 — Recuperar asset excluído

**Given** draft referencia asset que não aparece mais na lista READY  
**When** restaura o editor  
**Then** slot fica marcado como foto indisponível e oferece substituição ou remoção  
**And** demais slots permanecem intactos.

## MEM-005-AC09 — Falha de IndexedDB

**Given** IndexedDB falha ao criar um draft  
**When** a pessoa tenta usar um template  
**Then** permanece no catálogo com o template selecionado, recebe orientação e pode tentar novamente  
**And** nenhum ID ou draft incompleto é apresentado como salvo.

## MEM-005-AC10 — Falha ao salvar mudança de draft

**Given** IndexedDB falha ao salvar uma mudança de draft já aberto  
**When** o estado de edição é atualizado  
**Then** a edição permanece em memória, a tela informa que não foi salva localmente e oferece retry  
**And** navegação interna fica bloqueada até salvar ou confirmar descarte  
**And** descarregar a página aciona aviso nativo do navegador.

## MEM-005-AC11 — Falha ao carregar fotos

**Given** o gateway de fotos falha  
**When** o editor busca a biblioteca  
**Then** o documento e previews já resolvidos continuam intactos  
**And** aparece ação de tentar novamente sem criar fixtures visuais.

## MEM-005-AC12 — Rejeitar documento incompatível sem apagá-lo

**Given** draft no IndexedDB com schema, template, slot inválido ou transform diferente de `{x:0,y:0,scale:1,rotation:0}`  
**When** abre sua rota  
**Then** a tela apresenta recuperação segura  
**And** o registro não é sobrescrito nem removido automaticamente.

## MEM-005-AC13 — Acessibilidade e privacidade

**Given** catálogo, editor e seletor de fotos em viewport móvel  
**When** navega por teclado/leitor de tela  
**Then** ações têm rótulos, foco visível, tamanho mínimo definido e estado anunciado  
**And** nenhum arquivo, URL assinada, token ou credencial é salvo no documento local.

## MEM-005-AC14 — Encontrar e retomar rascunho local

**Given** um ou mais drafts locais salvos no navegador atual  
**When** abre `/templates`  
**Then** vê os drafts por atualização mais recente, com template e ação “Continuar”  
**And** continuar abre o mesmo documento em `/editor/{draftId}`.

## MEM-005-AC15 — Renovar prévia expirada durante a edição

**Given** uma imagem cujo URL temporário expirou enquanto a rota editor permanece aberta  
**When** a pessoa pede para atualizar fotografias  
**Then** o gateway busca URLs novos  
**And** a prévia é atualizada sem trocar o asset ID nem modificar outros slots.

## MEM-005-AC16 — Biblioteca vazia no seletor

**Given** nenhuma foto READY na biblioteca  
**When** abre o seletor de um slot  
**Then** vê mensagem de estado vazio com caminho para a galeria guardar fotografias  
**And** não vê fixture, estado de erro ou foto inventada.
