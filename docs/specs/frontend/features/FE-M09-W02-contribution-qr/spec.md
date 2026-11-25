# FE-M09/W02 — QR e captura de contribuição

**Status:** especificação funcional frontend. Acrescenta rotas privadas de gestão do logo do QR e campos opcionais de logo à leitura compartilhada.
**Referências:** MEM-009, `MuralAccessGateway`, `MEM-009-BE-API-01` a `MEM-009-BE-API-05`.

## Objetivo

Permitir que o proprietário ative o **Modo Niver** de um mural publicado e compartilhe um link de colaboração em formato de texto ou QR Code. O QR abre uma tela de boas-vindas da festa com o botão **Começar**. Cada convidado, sem conta, envia fotos pela câmera ou galeria para seu álbum privado no MinIO e escolhe quais compartilhar no álbum universal. O anfitrião não revisa nem aprova as fotos.

## Requisitos

- **FE-CQR-R01:** o proprietário escolhe entre link `VIEW` e **Modo Niver** (`CONTRIBUTE`); ambos usam o endpoint existente de criação de grants e uma chave de idempotência própria da intenção.
- **FE-CQR-R02:** somente a primeira resposta confirmada com `tokenReturned: true` e `shareUrl` pode revelar o segredo. Replay/listagem não pode reconstruir link ou QR.
- **FE-CQR-R03:** o QR de colaboração é codificado no navegador a partir dos bytes exatos de `shareUrl` retornados pelo backend. Não usa serviço remoto, analytics, logs ou armazenamento persistente.
- **FE-CQR-R04:** o proprietário pode baixar a imagem do QR por ação explícita. Fechar o painel remove URL e imagem QR do estado em memória.
- **FE-CQR-R05:** links `VIEW` não habilitam envio. A galeria e a captura pela câmera aparecem apenas com `permissions.canContribute` verdadeiro.
- **FE-CQR-R06:** a captura pela câmera solicita uma única imagem JPEG/PNG usando o seletor nativo do navegador com preferência pela câmera traseira. A galeria continua permitindo seleção múltipla.
- **FE-CQR-R07:** ambos os meios usam o mesmo contrato MEM-009 de upload, são processados arquivo a arquivo e mostram a foto em estado privado `READY`; uma falha não apaga envios confirmados.
- **FE-CQR-R08:** cada foto só entra na galeria compartilhada quando o mesmo convidado a seleciona no álbum pessoal e confirma **Compartilhar fotos**.
- **FE-CQR-R09:** Modo Niver aceita nome opcional de até 40 caracteres. O nome fica associado às fotos do álbum pessoal e não aparece na leitura pública do mural.
- **FE-CQR-R10:** abertura do link não pede instalação nem autenticação. O QR reutiliza a URL oficial do grant; o título e as fotos publicadas vêm do mesmo Mural do Memora.
- **FE-CQR-R11:** durante seleção múltipla, a página anuncia o avanço arquivo a arquivo e, ao final, informa quais fotos foram salvas no álbum pessoal e quais falharam.
- **FE-CQR-R12:** o único fluxo de criação oferecido pelo Memora é o Modo Aniversário. `/criar` abre a criação de uma festa e `/templates` encaminha para esse mesmo fluxo.
- **FE-CQR-R13:** cada festa usa o Mural existente. O mural publicado apresenta uma ação direta para gerar o QR do Modo Niver; a tela de compartilhamento prioriza `CONTRIBUTE` e não exige que o anfitrião descubra um seletor de escopo.
- **FE-CQR-R14:** enquanto o mural for rascunho, a interface pede publicação antes de gerar o QR. A festa pode ser publicada sem foto inicial; adicionar foto do anfitrião é opcional.
- **FE-CQR-R15:** o anfitrião escolhe a foto inicial dentro da configuração da festa; o Memora a envia pelo fluxo existente de upload para o storage privado, associa ao mural e evita exigir navegação até a biblioteca.
- **FE-CQR-R16:** a ação explícita “Publicar e gerar QR” publica a festa e tenta criar um grant `CONTRIBUTE`; se o grant for criado, o anfitrião chega ao QR. Se essa etapa falhar depois da publicação, a festa continua publicada e o QR pode ser criado novamente pela ação direta.
- **FE-CQR-R17:** somente o administrador autenticado cria aniversários. A rota antiga `/criar-mural` encaminha para `/criar`; não há criação pública de evento ou QR.
- **FE-CQR-R18:** ao abrir o QR `CONTRIBUTE`, o convidado vê a página de boas-vindas do aniversário correto e toca em **Começar** para entrar no álbum pessoal. Sem login ou cadastro, pode tirar uma foto ou escolher da galeria; enviar não publica automaticamente.
- **FE-CQR-R19:** a página inicial pública não oferece ação para criar aniversário nem escolher fotos sem vínculo com uma festa; ela orienta o convidado a escanear o QR Code da festa. Páginas públicas de mural também não oferecem criação de aniversário.
- **FE-CQR-R20:** o anfitrião pode personalizar as cores, o fundo transparente, formas dos pontos/cantos, margem, logo central e legenda do QR. Preferências visuais ficam no aparelho; o logo é enviado ao MinIO do Memora e também aparece na página de boas-vindas. Nenhuma configuração salva a URL do convite.
- **FE-CQR-R21:** o anfitrião pode exportar QR em PNG (512, 1024, 2048 ou 4096 px), SVG vetorial e cartão A4 pronto para imprimir. O payload segue sendo exatamente o `shareUrl` oficial retornado pelo backend.

## Privacidade

`shareUrl` é capability bearer. Ela e o QR gerado existem somente em estado transitório enquanto o painel recém-criado estiver aberto; fechar remove URL/QR da árvore da interface. Uma cópia/compartilhamento/download/ impressão só ocorre após ação explícita da pessoa. O QR é gerado localmente e não inclui título, muralId nem dados além da URL recebida. Preferências visuais podem ser guardadas localmente. Somente o logo reduzido é enviado ao storage privado do Memora para exibição na página do evento; a URL do convite nunca é salva junto dele.

## Fora de escopo

API nova fora dos contratos guest-album de MEM-009, login de convidados, edição de mural, armazenamento offline durável, fila persistente de retry, captura contínua de vídeo e alteração do pipeline de imagem. O anfitrião não tem ações de aprovação; o convidado controla o compartilhamento das próprias fotos. A câmera pode não ser oferecida por todos os navegadores; a galeria permanece disponível como alternativa.
