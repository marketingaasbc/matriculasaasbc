# American Academy SBC — LP Matrículas 2027 V3.3

## Mudanças aplicadas

- `index.html`: Consent Mode v2 **antes** de carregar o GTM; código padrão do contêiner `GTM-MT7NPS3W`; `noscript` imediatamente após `<body>`; Vercel Web Analytics; aviso de cookies revisado e acesso para revisar preferências no rodapé.
- `script.js`: remoção do carregamento direto do Pixel `2124688594797605`. Ao aceitar, o site atualiza consentimento do Google e envia `consent_granted` no `dataLayer`; RD Station continua carregando apenas após aceite.
- `script.js`: no ACK válido do Google Apps Script, emite `lead_form` com `pagina`, `etapa` e `event_id`, tanto no agendamento quanto no pré-cadastro WhatsApp. Este último emite também `whatsapp_click` e aguarda 800 ms antes da navegação. Falhas de cadastro não são contadas como conversão.
- `styles.css`: banner de consentimento menor para telas móveis.

**Ajuste de segurança em relação ao documento de origem:** `telefone` foi propositalmente excluído do `dataLayer`: nome, e-mail e telefone não podem ser inadvertidamente enviados ao GA4 e Google Ads como informações de identificação pessoal. O telefone continua indo para a planilha pelo formulário, sem mudança no fluxo de atendimento.

## IDs de integração

- GTM: `GTM-MT7NPS3W` — carregado no site.
- GA4: `G-FETYGWSXQF` — configurar/conferir no GTM.
- Google Ads: `AW-17931253086` — configurar/conferir no GTM.
- Meta Pixel: `2124688594797605` — configurar/conferir no GTM, **não inserir novamente no HTML/JS da LP**.
- RD: loader já existente e preservado, carregado só com consentimento.
- Apps Script: URL já existente em `config.js`, preservada.

## O que ainda precisa ser feito nos painéis externos

1. **GTM:** garantir que Meta não seja acionada em `All Pages` sem condição; disparar Meta `PageView` somente no evento personalizado `consent_granted`, e a conversão Meta `Lead` no evento `lead_form` **somente quando houver consentimento de anúncios**. Marcar requisitos de consentimento adequados na tag/trigger Meta; consentimento padrão do Google por si só **não bloqueia automaticamente tags HTML personalizadas**. Verificar se o evento `lead_form` está conectado às tags do GA4 e Google Ads. Publicar contêiner revisado.
2. **Google Ads/GA4:** conferir se a conversão Ads da campanha Search está configurada, se o GA4 recebe o evento `lead_form`, se as tags respeitam Consent Mode v2, se não há marcação duplicada e se `event_id`/`etapa` não enviam dados pessoais.
3. **Vercel:** ativar **Web Analytics → Enable** no projeto da LP para o script `/_vercel/insights/script.js` registrar visitas.
4. **LGPD:** os dados do controlador, contato dos titulares, retenção e aviso jurídico ainda dependem da aprovação da escola. Esta mudança técnica **não** equivale a certificação de conformidade jurídica.

## Passo a passo para publicar

1. Salvar uma cópia do site atual ou uma implantação anterior.
2. Descompactar `AMERICAN_ACADEMY_LP_MATRICULAS_2027_AJUSTADA.zip`. O ZIP contém o projeto inteiro para substituir a versão anterior; preservar a estrutura da pasta e os caminhos `assets/`, `config.js`, `index.html`, `script.js`, `styles.css`.
3. Publicar o projeto na Vercel, pelo repositório conectado ou pelo mesmo processo que utiliza atualmente. Não precisa copiar `AJUSTES_GTM_E_TESTES.md` para o site público.
4. Habilitar Web Analytics na Vercel e conferir o GTM conforme o bloco anterior.
5. Abrir `matriculas.aasbc.com.br` em janela anônima. Antes de aceitar, o contêiner GTM pode carregar, mas `connect.facebook.net/en_US/fbevents.js` **não** deve ser solicitado; RD também não deve carregar.
6. Clicar em **Somente essenciais**: o Pixel continua sem disparar. Pelo rodapé, abrir **Preferências de cookies** e clicar em **Aceitar cookies**: `consent_granted` aparece no `dataLayer`, e o Pixel PageView deverá disparar somente após o aceite (se o GTM estiver configurado corretamente).
7. Enviar um cadastro de teste no formulário principal com anuência e conferir a linha no Google Sheets. Na aba Console do DevTools, digitar `window.dataLayer.filter(x => x && x.event === 'lead_form')`: deve aparecer o evento uma vez **depois** da confirmação do Apps Script; confira também na prévia do GTM e DebugView do GA4.
8. Repetir no formulário WhatsApp, verificando `lead_form`, `whatsapp_click`, Sheets e redirecionamento; testar cadastro inválido/erro de gravação: não pode gerar conversão.
9. Acessar **Preferências de cookies** novamente e escolher **Somente essenciais**. A página recarrega para parar as tags já iniciadas; checar que não há novas requisições Meta/RD.
10. Solicitar ao responsável pela mídia/analytics que confira Tag Assistant, Meta Pixel Helper, conversão do Google Ads Search e GA4. Testes locais não substituem verificação em produção.

**Observação:** o sinal de consentimento do Google não desabilita necessariamente requisições sem cookies de GA4/Ads; a configuração prevista é Google Consent Mode v2 avançado. Caso a escola requeira bloqueio total dos requests do Google antes do aceite, essa política exige uma implementação/configuração diferente e validação jurídica.
