# AA SBC — RD Station Marketing + Google Sheets | Matrículas 2027

Esta versão **não exige trocar o formulário** nem expor tokens no navegador. O visitante envia o formulário para `/api/lead` na Vercel e o backend encaminha o mesmo lead para **Google Sheets** (Apps Script) e **RD Station Marketing** (evento de conversão via API Key). A planilha é o arquivo separado `AA_SBC_LEADS_2027_MODELO_GOOGLE_SHEETS.xlsx`.

## 1. Criar a planilha no Google Drive

1. Baixe e faça **upload** do arquivo `AA_SBC_LEADS_2027_MODELO_GOOGLE_SHEETS.xlsx` no Google Drive.
2. Abra com **Planilhas Google** e, se ainda estiver em modo de edição do Excel, escolha **Arquivo > Salvar como Planilhas Google**. Use essa **nova versão nativa** do Planilhas.
3. Mantenha as abas `Leads`, `Painel`, `Como configurar`. Não mude a primeira linha da aba `Leads`: são 20 colunas na mesma ordem que o código espera.
4. Na URL da planilha, copie a parte entre `/d/` e `/edit`: é o **SHEET_ID**.
5. Restrinja o compartilhamento da planilha aos responsáveis pela captação. Não a publique na web.

## 2. Preparar o Apps Script

1. Com a planilha aberta: **Extensões > Apps Script**.
2. Apague o código de exemplo e cole **todo** o conteúdo de `apps-script/Code.gs` que está neste ZIP.
3. Salve o projeto, por exemplo **Recebimento Leads AA SBC 2027**.
4. Abra **Configurações do projeto > Propriedades do script** e adicione:
   - `SHEET_ID`: ID que copiou no passo anterior.
   - `INTEGRATION_SECRET`: uma senha aleatória longa (recomendamos 32 bytes aleatórios ou mais). Anote-a num gerenciador de senhas. Não compartilhe aqui no chat e não inclua no HTML, JavaScript do navegador ou na planilha.
5. Volte ao editor, selecione `prepararPlanilha` na lista de funções e clique em **Executar**. Autorize as permissões de acesso à planilha. Confirme no log que a aba foi validada.
6. Clique em **Implantar > Nova implantação > Aplicativo da Web**:
   - Executar como: **Eu**.
   - Quem pode acessar: **Qualquer pessoa**. O código exige o segredo no corpo do POST, portanto **não use a URL diretamente como formulário aberto**.
   - Autorize e copie a URL terminada em **`/exec`**.
7. Se você alterar o `Code.gs` depois, edite a implantação criando **nova versão** antes de testar novamente.

**Importante:** não é necessário publicar a planilha em si. A permissão `Qualquer pessoa` é **somente** para o aplicativo da Web, autenticado com `INTEGRATION_SECRET`.

## 3. RD Station Marketing

O código de monitoramento informado pelo cliente foi incluído no site:

```html
<script type="text/javascript" async src="https://d335luupugsy2.cloudfront.net/js/loader-scripts/a5d223f7-2629-4480-9bfb-a446339fede4-loader.js"></script>
```

**Privacidade:** o site carrega esse script quando a pessoa seleciona **Aceitar cookies**. Se escolher **Somente essenciais**, não carrega o monitoramento nem o Pixel da Meta. Isso mantém consistente a escolha de cookies.

O monitoramento registra navegação, mas o formulário atual usa `fetch('/api/lead')` com `preventDefault()`, portanto **não é seguro presumir que o RD capturará o cadastro automaticamente**. Para garantir a conversão:

1. No RD Station Marketing, tenha acesso de **Gestor/Dono**.
2. Acesse a geração de **API Key** pela Appstore/App Publisher conforme [documentação da RD](https://developers.rdstation.com/reference/autenticacao-api-key?lng=pt-BR).
3. Gere a chave, escolha nome identificável, por exemplo **Formulário AA SBC 2027**, e mantenha ativa.
4. Configure essa chave no ambiente privado da Vercel em `RD_API_KEY`.
5. No RD Station, após publicar o domínio definitivo, consulte **Conta > Código de monitoramento** e clique para verificar a instalação. Caso o teste automatizado não detecte um carregamento condicionado a cookies, aceite os cookies no navegador, confira o carregamento do script em **F12 > Rede** e confirme com o suporte RD o procedimento de verificação para sites que dependem de consentimento.
6. Faça um cadastro fictício e procure o contato, a conversão `AA SBC | Matrículas 2027 | [etapa]` e as tags da etapa.

**Atenção a duplicidade:** não ative simultaneamente outro capturador automático do **mesmo formulário** na RD antes de testar, pois ele poderá registrar outro evento de conversão além da API.

## 4. Vercel — configurar o backend (sem colocar segredos em arquivos públicos)

1. Entre no projeto **do site da AA SBC** na Vercel: **Settings > Environment Variables**.
2. Cadastre estas variáveis no ambiente **Production** (inclua Preview se for testar em URL de prévia):

| Variável | Valor |
|---|---|
| `GOOGLE_APPS_SCRIPT_URL` | URL `/exec` do Apps Script |
| `GOOGLE_SHEETS_SECRET` | Mesmo valor de `INTEGRATION_SECRET` das Propriedades do script |
| `RD_API_KEY` | Chave da integração RD Station Marketing, gerada na conta |
| `SITE_ORIGIN` | **Opcional:** origem exata do domínio, p. ex. `https://www.aasbc.com.br` (sem `/` ao final) |

3. Publique o ZIP do site como projeto que contenha **`api/lead.js`**. Se estiver conectando pelo Git, envie os arquivos desse ZIP para o repositório, mantendo a pasta `/api` na raiz.
4. Faça **novo deployment** depois de salvar as variáveis. Não basta configurar variáveis de ambiente sem fazer o redeploy.
5. Se `SITE_ORIGIN` estiver definido, use no navegador exatamente o domínio correspondente; uma URL de preview com origem diferente será bloqueada (HTTP 403).

**Não cole nenhuma chave no arquivo `script.js`, `index.html`, na planilha ou no chat.**

## 5. Teste completo (antes de divulgar)

1. Abra o site publicado com UTMs, por exemplo `https://www.aasbc.com.br/?utm_source=instagram&utm_medium=paid_social&utm_campaign=matriculas_2027` (troque o domínio se necessário).
2. Clique **Aceitar cookies** e confirme o carregamento da URL do RD Station em **F12 > Rede**.
3. Preencha um **cadastro de teste** de Educação Infantil, Fundamental I ou Fundamental II, marque o consentimento de contato e envie.
4. Confirme a mensagem de sucesso do site.
5. Na aba **Leads**, confira a linha criada com WhatsApp, etapa, série, consentimentos, UTMs e ID único. Em **Painel**, confira a contagem atualizada.
6. No RD Station, confirme contato, evento de conversão e tags. O monitoramento não substitui essa checagem.
7. Se aparecer sucesso no site mas somente um dos destinos recebeu o lead, abra **Vercel > Logs**, procure `[AA LEAD]` e veja qual integração falhou. A API aceita sucesso **parcial** para não perder o contato que entrou em um destino.
8. Verifique se houve captura automática **duplicada** na RD. Se houver, mantenha apenas o envio por API para esse formulário.
9. Repita com mobile e etapa diferente. Remova os contatos de teste de ambos os sistemas antes de divulgar.

## 6. Observações de segurança e privacidade

- O `Google Apps Script` valida o segredo e evita linhas duplicadas com o `request_id` na coluna B. A versão nova também verifica o cabeçalho importado e traz a função `prepararPlanilha()`.
- O frontend conserva um ID de envio em retentativas após erro ou timeout para reduzir registros repetidos no Sheets.
- Não deixe a planilha compartilhada por link público; os leads contêm dados pessoais.
- Confirme com a escola a política de privacidade e os dados oficiais do controlador antes de publicar definitivamente.
- Os testes locais do backend verificam o comportamento, mas **não substituem** o teste real da RD, da Vercel e do Apps Script com as suas contas e credenciais.

**Documentações oficiais:** [RD Station — Conversão API Key](https://developers.rdstation.com/reference/conversao), [RD Station — Criar API Key](https://developers.rdstation.com/reference/autenticacao-api-key?lng=pt-BR), [RD Station — Código de monitoramento](https://ajuda.rdstation.com/s/topic/0TO3l000001ICMLGA4/c%C3%B3digo-de-monitoramento?language=pt_BR).


## Novo botão WhatsApp da LP (V3.0)

O botão circular fixo aparece no canto inferior direito (acima da CTA fixa em celulares). Clicando nele, o visitante informa nome, e-mail, telefone e concorda com o tratamento dos dados para atendimento.

O botão de envio registra o lead por `/api/lead` no **mesmo Google Sheets e RD Station** configurados acima. A planilha recebe na coluna Mensagem `Origem do lead: botão flutuante de WhatsApp da LP Matrículas 2027.`; a RD recebe uma conversão `AA SBC | Matrículas 2027 | WhatsApp` com a tag `via-whatsapp-flutuante`. Após confirmação de pelo menos um destino, o navegador abre o WhatsApp com uma mensagem inicial personalizada. Se o registro falhar, aparece um link de contato direto com a escola.

O número inicial é **55 11 4121-6355**, o WhatsApp/Tel divulgado pela escola em `aasbc.com.br`. Se a campanha tiver um número comercial diferente, altere `WHATSAPP_DESTINATION` em `script.js` e publique novamente. **Não é necessário mudar o Apps Script, a planilha ou as variáveis Vercel.**

Recomendação: faça um cadastro de teste pelo WhatsApp flutuante, valide linha no Sheets e evento/tag no RD e confira a conversa encaminhada no número correto.
