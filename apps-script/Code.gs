/**
 * AMERICAN ACADEMY SBC — GOOGLE APPS SCRIPT SIMPLES
 * 1. Abra SUA planilha no Google Sheets > Extensões > Apps Script.
 * 2. Cole este arquivo Code.gs; execute prepararPlanilha() uma vez.
 * 3. Implantar > Nova implantação (ou Gerenciar implantações > editar) > Aplicativo da web.
 *    Executar como: Eu | Quem tem acesso: Qualquer pessoa.
 * 4. Copie a URL /exec para o arquivo config.js da landing page.
 * Não precisa de qualquer variável na Vercel, nem de chave de API do RD.
 * O código de monitoramento RD integra os formulários pelo próprio painel RD.
 *
 * Se o projeto foi criado de dentro da planilha, o ID é encontrado automaticamente.
 * Se já existia uma propriedade SHEET_ID, ela continua funcionando.
 */
const TAB_NAME = 'Leads';
const HEADERS = [
  'Recebido em','ID único','Nome','WhatsApp','E-mail','Etapa','Ano / Série',
  'Mensagem','Campanha','Consentimento contato','Aceita novidades',
  'UTM Source','UTM Medium','UTM Campaign','UTM Content','UTM Term',
  'GCLID','FBCLID','Página de origem','Referência'
];

function planilha_() {
  var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  var ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Abra o Apps Script a partir da planilha ou configure SHEET_ID.');
  return ss;
}
function verificarCabecalhos_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1,1,1,HEADERS.length).setValues([HEADERS]);
    return;
  }
  var current = sheet.getRange(1,1,1,HEADERS.length).getDisplayValues()[0];
  if (current.join('|') !== HEADERS.join('|')) {
    throw new Error('Cabeçalhos incompatíveis. Use a aba Leads do modelo entregue, sem modificar a linha 1.');
  }
}
function prepararPlanilha() {
  var sheet = planilha_().getSheetByName(TAB_NAME) || planilha_().insertSheet(TAB_NAME);
  verificarCabecalhos_(sheet);
  sheet.setFrozenRows(1);
  sheet.getRange(1,1,1,HEADERS.length).setFontWeight('bold').setBackground('#54182c').setFontColor('#ffffff');
  sheet.getRange('B:B').setNumberFormat('@');
  sheet.getRange('D:D').setNumberFormat('@');
  Logger.log('Planilha pronta: '+planilha_().getUrl());
}
function celulaSegura_(v) {
  var value = String(v == null ? '' : v).slice(0,1800);
  return /^\s*[=+\-@]/.test(value) ? "'"+value : value;
}
function valido_(v) { return String(v || '').trim(); }
function resposta_(requestId, ok, codigo, callbackOrigin) {
  // Confirmação enviada para o navegador pelo iframe oculto (sem bloqueio CORS).
  var m = JSON.stringify({type:'AA_LEAD_RESULT',requestId:String(requestId || ''),ok:!!ok,code:String(codigo || '')}).replace(/</g,'\\u003c');
  var origin = /^https?:\/\/[^\s/]+$/.test(String(callbackOrigin || '')) ? String(callbackOrigin) : '*';
  var o = JSON.stringify(origin);
  var html = '<!doctype html><html><head><meta charset="utf-8"></head><body>'+
    '<script>(function(){var m='+m+';var o='+o+';window.parent.postMessage(m,o);'+
    'if(window.top!==window.parent)window.top.postMessage(m,o);})();<\/script>'+
    '</body></html>';
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function doPost(e) {
  var p = e && e.parameter ? e.parameter : {};
  var id = valido_(p.request_id);
  var lock;
  try {
    if (valido_(p.website)) return resposta_(id,false,'SPAM',p.callback_origin);
    var name = valido_(p.name);
    var email = valido_(p.email).toLowerCase();
    var phone = valido_(p.phone).replace(/\D/g,'');
    if (!id || name.length<3 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{10,11}$/.test(phone)
      || valido_(p.privacy_accepted)!=='true') {
      return resposta_(id,false,'CAMPOS_INVALIDOS',p.callback_origin);
    }
    lock = LockService.getScriptLock();
    lock.waitLock(20000);
    var sheet = planilha_().getSheetByName(TAB_NAME) || planilha_().insertSheet(TAB_NAME);
    verificarCabecalhos_(sheet);
    if (sheet.getLastRow()>1) {
      var found=sheet.getRange(2,2,sheet.getLastRow()-1,1)
        .createTextFinder(id).matchEntireCell(true).findNext();
      if (found) return resposta_(id,true,'JA_EXISTIA',p.callback_origin);
    }
    var row = [new Date().toISOString(),id,name,phone,email,valido_(p.stage),valido_(p.grade),
      valido_(p.message),valido_(p.campaign),'Sim',
      valido_(p.marketing_accepted)==='true'?'Sim':'Não',
      valido_(p.utm_source),valido_(p.utm_medium),valido_(p.utm_campaign),
      valido_(p.utm_content),valido_(p.utm_term),valido_(p.gclid),
      valido_(p.fbclid),valido_(p.landing_page),valido_(p.referrer)];
    sheet.appendRow(row.map(celulaSegura_));
    SpreadsheetApp.flush();
    return resposta_(id,true,'SALVO',p.callback_origin);
  } catch(err) {
    console.error('ERRO AA Google Sheets: '+String(err));
    return resposta_(id,false,'ERRO_SHEETS',p.callback_origin);
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}
