# American Academy School SBC — Matrículas 2027 V3.3 (integrações simples)

Projeto estático para deploy na Vercel, com formulário de agendamento, popup de sucesso e botão flutuante WhatsApp.

**Integrações:** Google Sheets por Google Apps Script diretamente do navegador (iframe oculto, sem API Vercel); RD Station Marketing pelo código de monitoramento e identificação de formulário no painel. Nenhuma variável de ambiente é necessária.

Para configurar, **abra `COMO_CONFIGURAR_INTEGRACOES.md`** e edite somente a URL de implantação do Google Apps Script em `config.js`.

O formulário de agendamento e o formulário de WhatsApp usam o mesmo Apps Script e os mesmos cabeçalhos de planilha já entregues anteriormente. A confirmação visual ocorre só quando o Apps Script responde com registro efetuado.

O script não garante que RD captará automaticamente qualquer envio de formulário AJAX: configure e teste o formulário existente no RD Station. Não utilize a URL do Apps Script do Praça Figueiras neste site.

## GTM, consentimento e conversões (V3.3)

Aplicados os ajustes de `AJUSTES_GTM_E_TESTES.md`: Consent Mode v2 antes do GTM, snippet padrão (incluindo noscript), Meta somente pelo GTM e evento `lead_form` após confirmação de gravação no Apps Script. Não é necessário editar o Apps Script ou a URL já configurada em `config.js` para essa mudança.

**Dependência externa:** a configuração real do contêiner `GTM-MT7NPS3W` precisa ser conferida no GTM. A presença do código no site **não garante** que o Pixel só dispare após consentimento; configure a tag Meta para `consent_granted` e consentimento publicitário, e confirme os gatilhos e as conversões GA4/Ads.
