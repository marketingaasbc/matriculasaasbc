/**
 * POST /api/lead — endpoint seguro Vercel Node.js.
 * Persiste na planilha via Apps Script e registra conversão na RD Station Marketing.
 * Sem credenciais no browser. Não marca conversão como sucesso se nenhum destino gravou.
 * Configurar GOOGLE_APPS_SCRIPT_URL, GOOGLE_SHEETS_SECRET e RD_API_KEY no painel Vercel.
 */
const MAX_REQUEST_BYTES = 25_000;
const CLEAN = (value, max = 250) => String(value ?? '').trim().slice(0, max);
const SAFE_STAGES = new Set(['Educação Infantil','Fundamental I','Fundamental II','Ainda não sei']);
const SAFE_GRADES = new Set([
  'Mini Maternal / Nursery (2 anos)','Maternal / Toddlers (3 anos)',
  'Nível 1 / Pre-Kinder (4 anos)','Nível 2 / Kindergarten (5 anos)',
  ...Array.from({length:9}, (_,i) => `${i+1}º ano`), 'Preciso de orientação'
]);
function asBoolean(x) { return x === true; }
function respond(res, status, data) {
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  return res.status(status).json(data);
}
async function postJson(url, payload, timeout = 9000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, {
      method:'POST', headers:{'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify(payload), signal:controller.signal, redirect:'follow'
    });
  } finally { clearTimeout(timer); }
}
async function sendToSheets(lead) {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!url) return { configured:false, ok:false, error:'URL ausente' };
  const secret = process.env.GOOGLE_SHEETS_SECRET;
  if (!secret) return { configured:false, ok:false, error:'Secret ausente' };
  try {
    const response = await postJson(url, {...lead, integration_secret: secret}, 10000);
    const data = await response.json().catch(() => null);
    if (!response.ok || !data || data.ok !== true) throw new Error(`Apps Script retornou HTTP ${response.status} ou resposta inválida`);
    return {configured:true, ok:true};
  } catch (e) {
    console.error('[AA LEAD] Falha Google Sheets', lead.request_id, e.message);
    return {configured:true, ok:false, error:'Falha no registro Sheets'};
  }
}
async function sendToRD(lead) {
  const apiKey = process.env.RD_API_KEY;
  if (!apiKey) return {configured:false, ok:false, error:'API key ausente'};
  const stageTag = lead.stage === 'Educação Infantil' ? 'educacao-infantil' : lead.stage === 'Fundamental I' ? 'fundamental-i' : lead.stage === 'Fundamental II' ? 'fundamental-ii' : 'etapa-indefinida';
  const tags = ['aa-sbc', 'matriculas-2027', stageTag];
  if (lead.source === 'whatsapp_floating') tags.push('via-whatsapp-flutuante');
  if (lead.marketing_accepted) tags.push('optin-novidades-site');
  const payload = {
    event_type: 'CONVERSION', event_family:'CDP', payload: {
      conversion_identifier:lead.source === 'whatsapp_floating' ? 'AA SBC | Matrículas 2027 | WhatsApp' : 'AA SBC | Matrículas 2027 | '+lead.stage,
      name:lead.name, email:lead.email,
      mobile_phone: lead.phone.startsWith('55') ? '+'+lead.phone : '+55'+lead.phone,
      tags,
      traffic_source:lead.attribution.utm_source || undefined,
    }
  };
  try {
    const endpoint = 'https://api.rd.services/platform/conversions?api_key='+encodeURIComponent(apiKey);
    const response = await postJson(endpoint, payload, 10000);
    if (!response.ok) throw new Error(`RD retornou HTTP ${response.status}`);
    return {configured:true, ok:true};
  } catch(e) {
    console.error('[AA LEAD] Falha RD Station',lead.request_id,e.message);
    return {configured:true, ok:false,error:'Falha no registro RD'};
  }
}
export default async function handler(req,res) {
  if (req.method !== 'POST') { res.setHeader('Allow','POST'); return respond(res,405,{ok:false,message:'Método não permitido.'}); }
  if (Number(req.headers['content-length'] || 0) > MAX_REQUEST_BYTES) return respond(res,413,{ok:false,message:'Dados acima do tamanho permitido.'});
  const allowedOrigin = process.env.SITE_ORIGIN;
  if (allowedOrigin && req.headers.origin && req.headers.origin !== allowedOrigin)
    return respond(res,403,{ok:false,message:'Origem não permitida.'});
  let body;
  try {body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;} catch {return respond(res,400,{ok:false,message:'Dados inválidos.'});}
  if (!body || typeof body !== 'object' || Array.isArray(body)) return respond(res,400,{ok:false,message:'Dados inválidos.'});
  if (body.honeypot) return respond(res,200,{ok:true}); // silêncio para bots
  const lead = {
    request_id:CLEAN(body.request_id,100), name:CLEAN(body.name,120), email:CLEAN(body.email,180).toLowerCase(),
    phone:CLEAN(body.phone,25).replace(/\D/g,''),stage:CLEAN(body.stage,50),grade:CLEAN(body.grade,90),
    message:CLEAN(body.message,1000), campaign:'Matriculas 2027 - AA SBC', source:body.source === 'whatsapp_floating' ? 'whatsapp_floating' : 'landing_form',
    privacy_accepted:asBoolean(body.privacy_accepted), marketing_accepted:asBoolean(body.marketing_accepted),
    landing_page:CLEAN(body.landing_page,1800), referrer:CLEAN(body.referrer,1000),
    submitted_at:new Date().toISOString(),
    attribution:Object.fromEntries(['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','fbclid']
      .map(k=>[k,CLEAN(body.attribution?.[k],250)]))
  };
  if (lead.name.length < 3 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email) || !/^\d{10,11}$/.test(lead.phone) || !SAFE_STAGES.has(lead.stage) || !SAFE_GRADES.has(lead.grade) || !lead.privacy_accepted || !lead.request_id)
    return respond(res,422,{ok:false,message:'Revise os dados obrigatórios e tente novamente.'});
  if (!(process.env.RD_API_KEY || process.env.GOOGLE_APPS_SCRIPT_URL))
    return respond(res,503,{ok:false,message:'Formulário ainda não está conectado. Configure a RD Station e/ou o Google Sheets antes de publicar.'});
  const [sheets,rd] = await Promise.all([sendToSheets(lead),sendToRD(lead)]);
  console.log('[AA LEAD] Resultado', JSON.stringify({request_id:lead.request_id,sheets:sheets.ok,rd:rd.ok}));
  if (!sheets.ok && !rd.ok) return respond(res,502,{ok:false,message:'Não foi possível registrar seu interesse no momento. Tente novamente ou contate a escola.'});
  // Sucesso parcial é aceito: o contato está salvo em pelo menos um destino.
  // Verifique os logs da Vercel e reprocesse o destino faltante em caso de falha parcial.
  return respond(res,200,{ok:true,partial:!(sheets.ok && rd.ok),request_id:lead.request_id});
}
