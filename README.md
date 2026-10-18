# American Academy School SBC — Matrículas 2027 V3.2 (integrações simples)

Projeto estático para deploy na Vercel, com formulário de agendamento, popup de sucesso e botão flutuante WhatsApp.

**Integrações:** Google Sheets por Google Apps Script diretamente do navegador (iframe oculto, sem API Vercel); RD Station Marketing pelo código de monitoramento e identificação de formulário no painel. Nenhuma variável de ambiente é necessária.

Para configurar, **abra `COMO_CONFIGURAR_INTEGRACOES.md`** e edite somente a URL de implantação do Google Apps Script em `config.js`.

O formulário de agendamento e o formulário de WhatsApp usam o mesmo Apps Script e os mesmos cabeçalhos de planilha já entregues anteriormente. A confirmação visual ocorre só quando o Apps Script responde com registro efetuado.

O script não garante que RD captará automaticamente qualquer envio de formulário AJAX: configure e teste o formulário existente no RD Station. Não utilize a URL do Apps Script do Praça Figueiras neste site.
