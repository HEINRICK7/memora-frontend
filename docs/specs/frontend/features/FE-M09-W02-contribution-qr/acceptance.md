# FE-M09/W02 — Critérios de aceite

| ID | Given / When / Then |
|---|---|
| FE-CQR-AC01 | Dado proprietário de mural publicado, quando seleciona `VIEW` ou `CONTRIBUTE`, então o frontend envia o escopo escolhido ao endpoint de criação de grants existente. |
| FE-CQR-AC02 | Dada a primeira resposta com `tokenReturned: true` e `shareUrl`, quando o escopo for `CONTRIBUTE`, então o QR local decodifica para a mesma URL, sem reconstrução nem chamada a serviço remoto. |
| FE-CQR-AC03 | Dado replay ou listagem sem segredo, quando o painel atualiza, então não mostra URL ou QR recuperados e orienta revogar/criar novo grant. |
| FE-CQR-AC04 | Dado QR visível, quando o proprietário aciona baixar, então o navegador baixa a imagem sem persistência silenciosa pelo Memora. |
| FE-CQR-AC05 | Dado link `VIEW`, quando o convidado abre o mural, então controles de galeria/câmera e envio não aparecem. |
| FE-CQR-AC06 | Dado link `CONTRIBUTE`, quando o convidado escolhe a galeria, então pode selecionar vários JPEG/PNG e cada arquivo passa pelo fluxo MEM-009. |
| FE-CQR-AC07 | Dado link `CONTRIBUTE`, quando o convidado escolhe tirar uma foto, então o seletor nativo solicita uma imagem pela câmera traseira quando suportada; cancelar não inicia upload. |
| FE-CQR-AC08 | Dada lista de envios com sucesso e falha, quando o processamento termina, então os sucessos aparecem no álbum privado do convidado e as falhas são identificadas sem apagar os sucessos. |
| FE-CQR-AC09 | Dada contribuição concluída, quando o mesmo convidado reabre seu álbum, então vê a foto privada, que ainda não aparece na galeria universal. |
| FE-CQR-AC10 | Dado painel recém-criado fechado, quando outro grant é listado ou o proprietário volta à rota, então URL/QR anteriores não podem ser recuperados pelo frontend. |
| FE-CQR-AC11 | Dado Modo Niver aberto sem login, quando o convidado informa um nome de até 40 caracteres e envia fotos, então o mesmo nome segue em cada intenção de upload e fica disponível somente na tela privada do proprietário. |
| FE-CQR-AC12 | Dado convidado que não informa nome, quando envia foto, então o frontend envia `displayName: null` e o upload segue normalmente. |
| FE-CQR-AC13 | Dado link de contribuição, quando a galeria compartilhada carrega, então título e fotos escolhidas pelos convidados vêm do mural Memora; fotos pessoais ainda não selecionadas ficam ocultas. |
| FE-CQR-AC14 | Dada seleção com vários arquivos, quando o envio ocorre, então cada passo é anunciado no estado acessível e o resultado final lista as fotos adicionadas e os arquivos que falharam. |
| FE-CQR-AC15 | Dado que alguém escolhe “criar” ou “templates” na navegação existente, quando abre a rota, então chega ao único fluxo disponível: criar uma festa do Modo Aniversário. |
| FE-CQR-AC16 | Dado mural publicado, quando o anfitrião abre a configuração ou a lista de festas, então encontra uma ação direta “Gerar QR do Modo Niver”. |
| FE-CQR-AC17 | Dado que o anfitrião abre o compartilhamento do Modo Niver, quando cria o convite, então o escopo `CONTRIBUTE` já está selecionado e o QR é mostrado após a resposta confirmada do backend. |
| FE-CQR-AC18 | Dado mural em rascunho, quando o anfitrião procura gerar o QR, então a interface pede para publicar a festa; a ausência de foto não bloqueia a publicação. |
| FE-CQR-AC19 | Dado anfitrião em festa rascunho, quando escolhe fotos JPEG/PNG válidas na configuração, então cada arquivo é enviado pelo fluxo de upload existente, associado à festa e armazenado no storage privado sem abrir outra rota. |
| FE-CQR-AC20 | Dado mural sem foto ou com fotos, quando o anfitrião confirma “Publicar festa e gerar QR”, então o mural é publicado e a criação do grant `CONTRIBUTE` começa em seguida; a tela mostra o QR somente após a resposta com a URL oficial. |
| FE-CQR-AC21 | Dado mural publicado mas falha ao criar o grant, quando o anfitrião volta à configuração, então a ação direta de gerar QR continua disponível e não repete a publicação. |
| FE-CQR-AC22 | Dada qualquer entrada de criação de evento, quando uma pessoa não autenticada a abre, então chega à tela de acesso administrativo e não consegue criar evento nem QR; `/criar-mural` encaminha para `/criar`. |
| FE-CQR-AC23 | Dado convidado que escaneou o QR de uma festa, quando a página abre, então vê uma tela de boas-vindas com **Começar**; após tocar, pode enviar sem conta e escolhe quais fotos publicar no álbum universal. |
| FE-CQR-AC24 | Dado convidado que abre a página inicial pública, quando a página carrega, então não vê ação para criar aniversário ou escolher fotos sem vínculo com uma festa; vê a orientação para escanear o QR Code da festa. Ao abrir o mural pelo QR, também não encontra ação de criação de aniversário. |
| FE-CQR-AC25 | Dado o QR recém-criado, quando o anfitrião muda cores, transparência, formas, margem, logo ou legenda, então a prévia local atualiza sem alterar a URL codificada nem fazer uma chamada remota. |
| FE-CQR-AC26 | Dado um design personalizado, quando o anfitrião aciona salvar, então as opções visuais ficam guardadas neste aparelho e o logo enviado fica disponível no mural para convidados, sem armazenar o link secreto ou o QR. |
| FE-CQR-AC27 | Dado QR pronto, quando o anfitrião baixa PNG ou SVG ou escolhe cartão A4, então o navegador exporta a URL oficial do convite no formato escolhido, com a dimensão selecionada até 4096 px para PNG. |
| FE-CQR-AC28 | Dado que o convidado envia fotos, quando o envio termina, então só seu álbum pessoal pode listá-las; o álbum universal muda apenas após sua escolha explícita. |
| FE-CQR-AC29 | Dado foto privada de convidado, quando o anfitrião abre o histórico de contribuições, então não recebe essa foto nem uma URL de prévia. |
