# American Academy SBC — Integrações simples RD + Google Sheets

## O que mudou nesta versão

- A landing é um site **estático**. Não usa `/api/lead`, RD API, nem variáveis de ambiente na Vercel.
- Cadastro da visita e popup WhatsApp: envio HTML nativo ao Apps Script da **American Academy**, com resposta via iframe oculto.
- Um lead confirmado no Google Sheets abre o popup de sucesso, ou encaminha ao WhatsApp se veio do botão flutuante.
- RD Station: **somente o código de monitoramento** já informado, com a integração de formulários existentes feita pelo painel RD. Isso é independente do Sheets.

## 1 — Google Planilhas e Apps Script

1. Abra a planilha `AA_SBC_LEADS_2027_MODELO_GOOGLE_SHEETS.xlsx` enviada anteriormente no Google Sheets; converta para formato Google Planilhas se necessário. Use a aba `Leads` exatamente como está.
2. Na planilha, clique **Extensões > Apps Script**.
3. Substitua o conteúdo de `Code.gs` pelo arquivo **`apps-script/Code.gs`** deste ZIP e salve.
4. No seletor de funções, escolha **`prepararPlanilha` > Executar** (autorize na primeira vez). O ID da planilha é automático se o projeto Apps Script foi criado dentro dela. Se você já havia configurado `SHEET_ID`, mantenha; não é preciso alterar.
5. Em **Implantar > Gerenciar implantações**, edite a implantação existente (ou Nova implantação). Tipo **Aplicativo da Web**. `Executar como: Eu`; `Quem tem acesso: Qualquer pessoa`. **Selecione Nova versão** se estiver atualizando uma implantação. Clique em **Implantar**.
6. Copie a URL terminada em `/exec` da implantação **desta planilha**. Não use o Apps Script do Praça Figueiras.

## 2 — Configurar a landing page

1. Abra `config.js` na raiz do site.
2. Substitua `COLE_AQUI_A_URL_EXEC_DO_APPS_SCRIPT_DA_AMERICAN` pela URL `/exec` obtida no passo 1 (mantendo as aspas).
3. Envie o conteúdo completo da pasta `AA_SBC_SITE_2027` para a Vercel e publique. Não precisa configurar nada em Environment Variables. Variáveis antigas `GOOGLE_SHEETS_SECRET`, `GOOGLE_APPS_SCRIPT_URL` e `RD_API_KEY` não são mais usadas pelo site; você pode removê-las quando terminar a migração.

## 3 — RD Station Marketing

- O código de monitoramento fornecido já está em `script.js` e é carregado com aceite de cookies opcionais, conforme a preferência escolhida pelo visitante.
- No RD Station Marketing, **verifique a instalação** no domínio público e configure a **Integração de Formulários via Código de Monitoramento** com os formulários já existentes na LP. Identifique o formulário `#lead-form` (Agende sua visita) e, se desejado, `#wa-lead-form` (WhatsApp). Os campos `name`, `email` e `phone` estão nomeados.
- **Testar no painel RD**: como é um formulário personalizado, o script de monitoramento sozinho não permite afirmar que toda conversão foi mapeada. É preciso validar a captura na conta RD. O Google Sheets não depende disso.
- Não utilizar RD API nem gerar chave RD no projeto.

## 4 — Testar

1. Acesse a landing publicada por **HTTPS**, aceite os cookies opcionais no banner para carregar o RD, e abra o formulário principal.
2. Envie um cadastro de teste, com e-mail que você possa consultar e WhatsApp com DDD.
3. Aguarde até aparecer o popup **“Tudo certo! Recebemos seu interesse.”** (somente após confirmação de gravação no Sheets).
4. Confira a linha na aba `Leads`. Abra o RD e confirme se o lead foi registrado como conversão do formulário (caso a integração de formulário esteja configurada).
5. Teste também o botão flutuante: preencher os três campos deve registrar na planilha e depois abrir a conversa no WhatsApp.
6. Se não houver confirmação, confira **Implantar > Gerenciar implantações > versão atual** no Apps Script, acesso `Qualquer pessoa`, código atualizado e os registros em **Execuções** do Apps Script. Uma mensagem de erro ou timeout não deve ser tratada como confirmação de gravação.

## Observações

A URL `/exec` de um Apps Script com acesso público não é um segredo. O formulário usa consentimento, validação, campo anti-spam e ID de deduplicação, mas endpoints públicos podem receber spam; se o volume crescer, considere proteção adicional. Nunca cole senhas ou chave de API no frontend.

O monitoramento da RD Station e o Pixel Meta respeitam a escolha de cookies no banner. Não desative essa escolha apenas para forçar captação sem revisar o aviso de privacidade.
