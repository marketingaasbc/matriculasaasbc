/**
 * Google Apps Script — recebe leads do endpoint da Vercel e salva em Planilhas.
 * Propriedades do script, configuradas em Configurações > Propriedades do script:
 *   SHEET_ID = ID da planilha Google
 *   INTEGRATION_SECRET = segredo compartilhado com GOOGLE_SHEETS_SECRET na Vercel
 * PUBLICAÇÃO: Implantar > Nova implantação > Aplicativo da Web > Executar como eu;
 * Acesso: Qualquer pessoa (a autenticação é pelo segredo validado no body).
 * ATENÇÃO: teste com um lead fictício e confira a aba Leads antes de publicar.
 */
const TAB_NAME = 'Leads';
const HEADERS = [
  'Recebido em','ID único','Nome','WhatsApp','E-mail','Etapa','Ano / Série',
  'Mensagem','Campanha','Consentimento contato','Aceita novidades',
  'UTM Source','UTM Medium','UTM Campaign','UTM Content','UTM Term',
  'GCLID','FBCLID','Página de origem','Referência'
];

function output_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
function safeCell_(value) {
  var str = String(value == null ? '' : value).slice(0, 1800);
  // Evita execução de fórmulas maliciosas em células da planilha.
  return /^[\s]*[=+\-@]/.test(str) ? "'" + str : str;
}
function doPost(e) {
  var lock;
  try {
    var props = PropertiesService.getScriptProperties();
    var secret = props.getProperty('INTEGRATION_SECRET');
    var sheetId = props.getProperty('SHEET_ID');
    if (!secret || !sheetId) throw new Error('Configuração ausente');
    var data = JSON.parse(e.postData.contents);
    if (!data || data.integration_secret !== secret) return output_({ok:false,error:'Não autorizado'});
    if (!data.request_id || !data.name || !data.email || !data.privacy_accepted) return output_({ok:false,error:'Campos obrigatórios ausentes'});
    lock = LockService.getScriptLock();
    lock.waitLock(20000);
    var book = SpreadsheetApp.openById(sheetId);
    var sheet = book.getSheetByName(TAB_NAME) || book.insertSheet(TAB_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.setFrozenRows(1);
      sheet.getRange(1,1,1,HEADERS.length).setFontWeight('bold').setBackground('#54182c').setFontColor('#ffffff');
    }
    // Coluna B é a chave de idempotência.
    if (sheet.getLastRow() > 1) {
      var found = sheet.getRange(2,2,sheet.getLastRow()-1,1).createTextFinder(String(data.request_id)).matchEntireCell(true).findNext();
      if (found) return output_({ok:true,duplicate:true,id:data.request_id});
    }
    var a = data.attribution || {};
    var row = [data.submitted_at || new Date().toISOString(),data.request_id,data.name,data.phone,data.email,
      data.stage,data.grade,data.message,data.campaign,data.privacy_accepted ? 'Sim' : 'Não',
      data.marketing_accepted ? 'Sim' : 'Não',a.utm_source,a.utm_medium,a.utm_campaign,a.utm_content,
      a.utm_term,a.gclid,a.fbclid,data.landing_page,data.referrer];
    sheet.appendRow(row.map(safeCell_));
    SpreadsheetApp.flush();
    return output_({ok:true,id:data.request_id});
  } catch (err) {
    console.error('Erro no cadastro: '+String(err));
    return output_({ok:false,error:'Falha no registro'});
  } finally { if (lock && lock.hasLock()) lock.releaseLock(); }
}
