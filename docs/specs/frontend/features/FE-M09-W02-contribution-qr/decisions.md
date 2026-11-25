# FE-M09/W02 — Decisões

## FE-CQR-ADR01 — Gerar QR localmente

Usar `qrcode` no navegador para codificar a `shareUrl` fornecida pelo backend. Não chamar geradores remotos nem compor URL a partir de host, muralId ou token. O QR só existe após uma criação não reproduzida que retornou o segredo.

## FE-CQR-ADR02 — Câmera pelo seletor nativo

Usar um file input separado com `capture="environment"` e uma imagem por seleção. Isso mantém upload e validação no fluxo já integrado ao Memora e deixa galeria múltipla disponível. O atributo é apenas uma preferência do navegador, não garantia de abertura de câmera em todos os dispositivos.

## FE-CQR-ADR03 — O convidado escolhe o que compartilhar

Foto de convidado validada fica `READY` no álbum pessoal privado. Só o mesmo convidado pode selecionar e publicar suas fotos no álbum universal; o anfitrião não aprova nem visualiza fotos privadas.

## FE-CQR-ADR04 — Modo Niver como entrada de contribuição

Nesta entrega, `CONTRIBUTE` é a permissão que ativa o Modo Niver. O QR abre uma tela de boas-vindas do mural publicado autorizado pelo backend. O botão **Começar** inicia o álbum privado desse convidado; as fotos só entram no álbum universal após seleção.

## FE-CQR-ADR05 — Nome opcional em memória

O campo respeita o contrato de até 40 caracteres e permanece somente no estado transitório da página. O nome é associado às contribuições do álbum pessoal e não aparece na leitura pública nem dá ao anfitrião acesso às fotos privadas.

## FE-CQR-ADR06 — Modo Aniversário como único fluxo de criação

As entradas atuais de criação e templates levam à criação de uma festa Memora. O QR é criado pelo anfitrião após publicar; a festa pode começar sem fotos para reduzir o atrito. Os convidados iniciam o álbum pelo link de contribuição, e fotos do dono são opcionais.

## FE-CQR-ADR07 — Upload inicial no contexto da festa

Permitir selecionar JPEG/PNG e usar os adapters existentes de upload e associação diretamente na configuração. Isso remove a ida e volta à biblioteca sem criar outro storage nem publicar uma foto automaticamente. “Publicar e gerar QR” é uma confirmação explícita; publicação e grant continuam operações separadas do backend, e a falha do grant não desfaz uma publicação confirmada.

## FE-CQR-ADR08 — Criação restrita ao anfitrião

Todas as entradas de criação chegam a `/criar`, protegido por `AdminGate`. A rota legada `/criar-mural` redireciona para o mesmo acesso. No link de convidado, a câmera é a ação principal; galeria e nome permanecem opcionais.

## FE-CQR-ADR09 — Entrada pública para convidados

A página inicial pública orienta convidados a abrir o QR Code da festa e não oferece ações de criação ou gestão. O link do QR já aponta diretamente para o mural associado e não precisa passar pela página inicial.

## FE-CQR-ADR10 — QR personalizado gerado no aparelho

Desenhar o mesmo `shareUrl` oficial com estilos escolhidos pelo anfitrião no navegador, para permitir cores, formas, margem, logo e legenda. Salvar preferências visuais em `localStorage`, persistir o logo reduzido no MinIO para exibi-lo aos convidados e nunca persistir URL ou QR. Gerar PNG em até 4096 px, SVG e cartão A4 após ação explícita.
