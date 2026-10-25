# FE-M05/M06 — Critérios de aceite

| ID | Given / When / Then |
|---|---|
| FE-PS-AC01 | Dado `/criar` aberto, quando M05 aparece, então exibe as três origens, Galeria selecionada inicialmente, botão Continuar e nota da próxima etapa. |
| FE-PS-AC02 | Dado Google Fotos escolhido, quando a pessoa tentar continuar, então nenhuma conexão/OAuth inicia e a indisponibilidade é anunciada de modo acessível. |
| FE-PS-AC03 | Dada origem Galeria, quando Continuar é ativado, então o seletor nativo abre sem criar upload intent; cancelar o seletor mantém a tela e a seleção anteriores. |
| FE-PS-AC04 | Dado arquivo JPEG/PNG válido, quando é escolhido, então uma prévia local aparece em M06 e nenhum request de rede envia arquivo antes da confirmação. |
| FE-PS-AC05 | Dado arquivo vazio, acima de 20 MiB ou tipo não suportado, quando é escolhido, então ele não entra na seleção e a interface informa a causa sem descartar os arquivos válidos do mesmo lote. |
| FE-PS-AC06 | Dada origem Câmera, quando Continuar é ativado, então `getUserMedia` é chamado após o gesto; negar/indisponibilizar câmera oferece retorno à Galeria. |
| FE-PS-AC07 | Dada câmera aberta, quando captura, cancela, muda de tela ou desmonta o fluxo, então todos os tracks são encerrados. |
| FE-PS-AC08 | Dada seleção local em M06, quando remove um item ou sai do fluxo, então object URLs correspondentes são revogadas; a contagem e as prévias restantes permanecem corretas. |
| FE-PS-AC09 | Dada uma seleção válida, quando a pessoa confirma “usar essas fotos”, então cada arquivo percorre intent → PUT assinado → complete e só depois do sucesso o fluxo abre `/templates`. |
| FE-PS-AC10 | Dado erro parcial de upload, quando a tela retorna, então os arquivos que falharam continuam selecionados para retry; nenhum erro ou mensagem revela URL assinada. |
| FE-PS-AC11 | Dadas larguras 320, 375, 390, 414, 768, 1024 e 1440 px, quando M05/M06 são capturadas, então não há overflow horizontal nem CTA encoberto pela safe area. |
| FE-PS-AC12 | Dada uma seleção em M06, quando a grade aparece, então o tray inferior mostra contagem, ação para limpar tudo, miniaturas somente dos arquivos selecionados e CTA de confirmação. |

## Evidência de navegador

Comparar M05/M06 com os dois primeiros painéis da board oficial. Capturar pelo menos M05 em 390 px e M06 em 390 px com seleção real pelo file chooser; conferir também os breakpoints de aceite. Não alegar compatibilidade em aparelhos físicos sem teste nesses aparelhos.
