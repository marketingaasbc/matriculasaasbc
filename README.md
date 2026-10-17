# American Academy SBC | One Page — Matrículas 2027

Site de uma página em **HTML, CSS e JavaScript**, com endpoint serverless Node.js para recebimento **no mesmo envio** em Google Sheets (via Google Apps Script) e RD Station Marketing (conversão via API Key).

## Abrir e publicar

- Para visualizar o design: abra `index.html` no navegador. A exibição local é funcional, mas o envio real **não** ocorre com `file://`.
- Para receber leads, publique **a pasta inteira** como um projeto na **Vercel** (preserva `api/lead.js`). É possível conectar um domínio personalizado depois.
- Configure as variáveis de ambiente no projeto Vercel e faça um novo deploy. Não há banco de dados local, build obrigatório nem dependências NPM.
- Também pode executar `npx vercel dev` no diretório do projeto, depois de instalar/configurar a Vercel CLI.
- Hospedar **somente** `index.html` em serviço estático sem funções serverless não ativa `/api/lead`. Neste caso, use uma hospedagem com backend compatível ou adapte o endpoint.

### 1. Integrar planilha do Google

1. Crie uma planilha Google, nomeie de forma identificável, por exemplo `Leads AA SBC 2027`.
2. Copie o **ID da planilha** (trecho entre `/d/` e `/edit` na URL).
3. Abra **Extensões > Apps Script** e cole o conteúdo de `apps-script/Code.gs`.
4. Em **Configurações do projeto > Propriedades do script**, cadastre:
   - `SHEET_ID`: o ID da planilha.
   - `INTEGRATION_SECRET`: segredo aleatório forte, com pelo menos 32 caracteres. Guarde-o em local seguro.
5. Em **Implantar > Nova implantação > Aplicativo da Web**, selecione `Executar como eu` e acesso `Qualquer pessoa`, autorize as permissões solicitadas. O acesso ao endpoint é protegido por um segredo validado no corpo da requisição, por isso **não exponha esse segredo** no HTML nem em scripts públicos.
6. Copie o endereço da implantação terminado em `/exec`.
7. No projeto Vercel, configure `GOOGLE_APPS_SCRIPT_URL` com esse endereço e `GOOGLE_SHEETS_SECRET` com **o mesmo segredo** usado no Apps Script.
8. Faça um envio de teste no site publicado e valide a linha na aba **Leads**. O script cria cabeçalhos automaticamente e detecta envios repetidos pelo ID único.

**Atenção:** a URL do tipo `/dev` só serve para desenvolvedores com permissão. Use a implantação publicada `/exec`. Uma alteração no código do Apps Script exige nova versão da implantação.

### 2. Integrar RD Station Marketing

1. Utilize uma conta RD Station Marketing com o recurso de **API Key para eventos de conversão**.
2. Gere uma API Key conforme a [documentação oficial](https://developers.rdstation.com/reference/evento-de-conversao-via-api-key?lng=pt-BR).
3. Na Vercel, configure `RD_API_KEY` com a chave. **Não coloque a chave no JavaScript do navegador.**
4. O endpoint envia `CONVERSION` para `https://api.rd.services/platform/conversions?api_key=...` com o nome, e-mail, telefone, marcação de campanha e tags da etapa. O identificador será `AA SBC | Matrículas 2027 | [etapa]`.
5. Confirme no painel da RD Station Marketing que um contato e um evento de conversão foram criados.
6. Campos personalizados de série, observações e consentimento de marketing **não são enviados como campos personalizados à RD**, pois dependem dos identificadores dos campos na conta. Esses dados são preservados integralmente na planilha Google. Se desejar, mapeie os campos customizados na API da RD posteriormente.

**Verificação de sucesso:** o backend aceita o lead quando **pelo menos um destino** confirma o registro; o retorno informa internamente se houve sucesso parcial. Se os dois falharem, o navegador apresenta uma mensagem de erro. Em caso de sucesso parcial, verifique os logs da Vercel para reparar a integração que falhou.

### 3. Variáveis de ambiente Vercel

| Variável | Onde | Obrigatória? |
|---|---|---|
| `GOOGLE_APPS_SCRIPT_URL` | Backend | Sim, para salvar na planilha |
| `GOOGLE_SHEETS_SECRET` | Backend | Sim, junto da URL Google |
| `RD_API_KEY` | Backend | Sim, para registrar na RD |
| `SITE_ORIGIN` | Backend | Recomendável; URL exata do site publicado (`https://dominio.com`) |

Se apenas uma integração estiver configurada, o formulário pode registrar nesse destino, mas a sincronização dupla não estará ativa. Para cumprir a captação simultânea, **configure ambas**.

### 4. Meta Pixel e campanhas

No arquivo `script.js`, o Pixel informado anteriormente está preparado com o ID **`4024453747862467`**. Ele é carregado **somente após o visitante consentir com cookies de publicidade**. O evento `Lead` é disparado apenas quando um destino confirma que recebeu o cadastro. Confirme se este é realmente o Pixel a usar no site final antes da publicação.

O formulário registra: campanha, etapa, ano/série, origem, UTMs (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`), `gclid`, `fbclid`, página, referência, data/hora, consentimento e ID do envio. São parâmetros úteis para anúncios de captação e segmentação de leads.

**Sugestão de teste com UTM:** publique a página e abra `https://SEU-DOMINIO/?utm_source=instagram&utm_medium=paid_social&utm_campaign=matriculas_2027` antes de enviar um lead de teste.

### 5. Checklist editorial antes de publicar

- [ ] Validar **etapas efetivamente ofertadas em 2027**, em especial as séries de Fundamental I e Fundamental II, com a direção da **unidade SBC**. O documento institucional de referência contém informações da rede que podem não coincidir com a oferta específica do campus. O histórico mais recente de campanha descreveu Preschool, Elementary e Middle School, mas a disponibilidade de cada série precisa de confirmação.
- [ ] Confirmar o texto de BNCC, Common Core Standards e a aplicação integralmente em inglês do currículo americano com a coordenação pedagógica.
- [ ] Confirmar o uso do **Sistema Bernoulli** na unidade e a menção aos **4.100 m²**, extraídos do material institucional.
- [ ] Confirmar endereço **Rua Atibaia, 150, São Bernardo do Campo** e eventual canal oficial de contato.
- [x] Logotipos oficiais fornecidos incorporados ao cabeçalho, à seção de matrículas e ao rodapé.
- [ ] Confirmar autorização de uso das fotos de crianças e equipe, além dos direitos de imagem do material fornecido.
- [ ] Validar juridicamente o **aviso de privacidade**: controlador, contato do DPO/responsável, retenção, base legal, direitos, política/cookies e comunicação mercadológica. O texto do modal é provisório, não substitui a política oficial da escola.
- [ ] Rever se 2027, ofertas e campanhas estão atuais antes de republicar.
- [ ] Atualizar a meta `og:image` para uma URL HTTPS absoluta após configurar o domínio para o compartilhamento em redes sociais.
- [ ] Testar cadastros de Educação Infantil, Fundamental I e Fundamental II em **celular** e computador e conferir **os dois destinos**.
- [ ] Revisar segurança anti-spam e limites operacionais. Há honeypot e validação no backend; para escala comercial, recomenda-se proteção anti-bot, monitoramento, controles de taxa e alertas para falhas parciais.

### Estrutura

```
index.html               Site completo
styles.css               Identidade visual e responsividade
script.js                Navegação, formulário, tracking e interações
api/lead.js              API serverless: validação, RD e Google
apps-script/Code.gs      Receptor para planilha Google
assets/                  Fotos enviadas e otimizadas + Pandinha
.env.example             Variáveis de ambiente sem segredos
vercel.json              Configuração básica de deploy
```

### Referências editoriais

Conteúdo baseado nos materiais fornecidos e no histórico do projeto American Academy SBC. Evitamos afirmar exclusividade regional, rankings do ENEM ou resultados garantidos, já que tais declarações exigiriam validação específica da unidade.

Integração RD: [Conversão via API Key — documentação](https://developers.rdstation.com/reference/conversao) e [guia API Key](https://developers.rdstation.com/reference/evento-de-conversao-via-api-key?lng=pt-BR).


## V2 · Atualização de identidade e galeria (outubro/2026)

- Substituído o monograma provisório pelos **logotipos oficiais fornecidos** (dourado no cabeçalho e branco no rodapé e na seção de matrículas). Os arquivos originais não foram redesenhados; as versões WebP mantêm o desenho e a transparência.
- Criadas bandeiras em SVG da República Federativa do Brasil e dos Estados Unidos. O selo da primeira seção combina ambos os países, separados por uma linha curva, e uma moldura com a bandeira dos EUA aparece atrás da foto principal.
- Os cards do duplo currículo recebem contornos bicolores correspondentes a cada país e bandeiras hasteadas acima.
- Galeria reconstruída em um **mosaico completo com 8 fotografias reais**, com a fachada em destaque. Imagens otimizadas para WebP e layouts próprios para desktop e mobile.
- **Preservados:** HTML do formulário, script do formulário, endpoint `/api/lead`, integração Google Apps Script, configurações da Vercel, consentimento LGPD e Pixel Meta. É indispensável testar os envios reais com as credenciais do ambiente antes de publicar.
- Validar com a escola os direitos de imagem das fotos e uso oficial dos símbolos.

**Prévias anteriores:** os PNGs da versão V1 foram retirados para evitar a apresentação de um layout desatualizado. Abra o `index.html` em um navegador local ou faça um deploy de prévia da pasta para avaliar o novo visual.

## Atualização Bernoulli – V2.5 (16/10/2026)

- Adicionado bloco institucional do **Sistema Bernoulli** dentro da seção "Dois percursos, uma formação", após o esclarecimento sobre os currículos brasileiro e americano.
- Incluído o logotipo enviado pelo cliente (`assets/logo-bernoulli-educacao.png`).
- Destaques: 11 vezes 1º lugar no ENEM (histórico Bernoulli, com critérios e ressalva), mais de 1.000 escolas parceiras, mais de 300 mil estudantes.
- Incluída fonte oficial do Bernoulli no próprio site e `FONTES-BERNOULLI.md` para rastreabilidade.
- Formulário, RD Station, Google Apps Script, roteamento e configurações existentes foram preservados.
- Verificar periodicamente os números na fonte oficial e manter a ressalva de que não são resultados próprios da American Academy SBC.
