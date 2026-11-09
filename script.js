(() => {
  'use strict';
  // GA4, Google Ads e Meta são medidos via GTM-MT7NPS3W.
  // A tag da Meta no GTM deve depender do evento consent_granted
  // e exigir consentimento para anúncios. Nunca carregar o Pixel aqui diretamente.
  // Código de monitoramento fornecido pela escola em 17/10/2026.
  // É carregado após o aceite dos cookies opcionais. Mapeie os formulários existentes no painel do RD.
  const RD_TRACKING_SRC = 'https://d335luupugsy2.cloudfront.net/js/loader-scripts/a5d223f7-2629-4480-9bfb-a446339fede4-loader.js';
  // Envio como formulário HTML nativo, exatamente como na LP do Praça Figueiras.
  // Sem /api/lead, sem RD API e sem variáveis de ambiente na Vercel.
  const GAS_URL = String(window.AA_CONFIG?.appsScriptUrl || '').trim();
  const GAS_READY = /^https:\/\/script\.google\.com\/macros\/s\/[^/\s]+\/exec(?:\?.*)?$/.test(GAS_URL);
  const GAS_TIMEOUT_MS = 25000;
  const CAMPAIGN = 'Matriculas 2027 - AA SBC';
  // WhatsApp divulgado no site oficial da AA SBC (11) 4121-6355.
  // Para trocar o destino comercial, altere APENAS esta constante.
  const WHATSAPP_DESTINATION = '551141216355';
  const gradesByStage = {
    'Educação Infantil': ['Mini Maternal / Nursery (2 anos)', 'Maternal / Toddlers (3 anos)', 'Nível 1 / Pre-Kinder (4 anos)', 'Nível 2 / Kindergarten (5 anos)'],
    'Fundamental I': ['1º ano', '2º ano', '3º ano', '4º ano', '5º ano'],
    'Fundamental II': ['6º ano', '7º ano', '8º ano', '9º ano'],
    'Ainda não sei': ['Preciso de orientação']
  };

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));
  $('#current-year').textContent = String(new Date().getFullYear());

  const menu = $('#primary-nav');
  const menuToggle = $('.menu-toggle');
  menuToggle?.addEventListener('click', () => {
    const open = !menu.classList.contains('is-open');
    menu.classList.toggle('is-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  });
  $$('#primary-nav a').forEach(link => link.addEventListener('click', () => {
    menu.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menu');
  }));

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: .09, rootMargin: '0px 0px -20px 0px' });
    $$('.reveal').forEach(element => io.observe(element));
  } else $$('.reveal').forEach(element => element.classList.add('is-visible'));

  const leadForm = $('#lead-form');
  const stageSelect = $('[name="stage"]', leadForm);
  const gradeSelect = $('[name="grade"]', leadForm);
  function setGrades(stage, selected = '') {
    const entries = gradesByStage[stage] || [];
    gradeSelect.replaceChildren(new Option(entries.length ? 'Selecione o ano / série' : 'Escolha a etapa primeiro', ''));
    entries.forEach(value => gradeSelect.add(new Option(value, value)));
    if (selected && entries.includes(selected)) gradeSelect.value = selected;
  }
  stageSelect.addEventListener('change', () => setGrades(stageSelect.value));
  $$('[data-stage]').forEach(button => button.addEventListener('click', () => {
    const stage = button.dataset.stage;
    stageSelect.value = stage;
    setGrades(stage);
    $('#matriculas').scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'start'});
    history.replaceState(null, '', '#matriculas');
  }));

  // Máscara de celular/telefone BR, sem plugin e mantendo apenas os dígitos no payload.
  const phoneInput = $('[name="phone"]', leadForm);
  phoneInput.addEventListener('input', () => {
    let digits = phoneInput.value.replace(/\D/g, '').slice(0, 11);
    if (!digits) { phoneInput.value = ''; return; }
    if (digits.length <= 2) phoneInput.value = `(${digits}`;
    else if (digits.length <= 6) phoneInput.value = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    else if (digits.length <= 10) phoneInput.value = `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    else phoneInput.value = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  });

  const privacyDialog = $('#privacy-modal');
  $$('[data-privacy-open]').forEach(b => b.addEventListener('click', () => privacyDialog.showModal()));
  $$('[data-privacy-close]').forEach(b => b.addEventListener('click', () => privacyDialog.close()));
  privacyDialog.addEventListener('click', ev => { if (ev.target === privacyDialog) privacyDialog.close(); });

  function updateGoogleConsent(granted) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('consent', 'update', {
      ad_storage: granted ? 'granted' : 'denied',
      ad_user_data: granted ? 'granted' : 'denied',
      ad_personalization: granted ? 'granted' : 'denied',
      analytics_storage: granted ? 'granted' : 'denied'
    });
  }
  function loadMetaPixel() {
    // O Pixel está no GTM, não neste arquivo. Esta função só libera o consentimento.
    updateGoogleConsent(true);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({event: 'consent_granted'});
  }
  function cookieChoice(choice) {
    let previous = null;
    try {
      previous = localStorage.getItem('aa_sbc_cookie_choice');
      localStorage.setItem('aa_sbc_cookie_choice', choice);
    } catch { /* Navegação privada: a escolha vale para esta página. */ }
    $('#cookie-banner').hidden = true;
    if (choice === 'all') {
      loadMetaPixel();
      loadRdTracking();
    } else {
      updateGoogleConsent(false);
      // Uma tag já carregada não pode ser descarregada sem recarregar a página.
      // Se revogar consentimento, recarregar com padrão negado.
      if (previous === 'all') window.location.reload();
    }
  }
  function loadRdTracking() {
    if (!RD_TRACKING_SRC || document.getElementById('rd-station-tracking-loader')) return;
    const script = document.createElement('script');
    script.id = 'rd-station-tracking-loader';
    script.type = 'text/javascript';
    script.async = true;
    script.src = RD_TRACKING_SRC;
    document.body.appendChild(script);
  }
  let preference = null;
  try { preference = localStorage.getItem('aa_sbc_cookie_choice'); } catch { /* ignore */ }
  if (preference === 'all') { loadMetaPixel(); loadRdTracking(); }
  else if (preference !== 'essential') $('#cookie-banner').hidden = false;
  $('#cookies-accept').addEventListener('click', () => cookieChoice('all'));
  $('#cookies-essential').addEventListener('click', () => cookieChoice('essential'));
  $$('[data-cookie-settings]').forEach(button => button.addEventListener('click', () => {
    $('#cookie-banner').hidden = false;
    $('#cookie-banner').querySelector('button')?.focus();
  }));

  function getAttribution() {
    const params = new URLSearchParams(location.search);
    const keys = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','fbclid'];
    const current = {};
    keys.forEach(key => { if (params.has(key)) current[key] = params.get(key).slice(0, 250); });
    try {
      if (Object.keys(current).length) sessionStorage.setItem('aa_sbc_attribution', JSON.stringify(current));
      return {...JSON.parse(sessionStorage.getItem('aa_sbc_attribution') || '{}'), ...current};
    } catch { return current; }
  }
  const firstAttribution = getAttribution();
  const feedback = $('.form-feedback', leadForm);
  const submitButton = $('.submit-btn', leadForm);
  const leadSuccessDialog = $('#lead-success-dialog');
  const gasTransport = $('#aaGasTransport');

  $$('[data-success-close]').forEach(button => button.addEventListener('click', () => leadSuccessDialog?.close()));
  leadSuccessDialog?.addEventListener('click', event => { if (event.target === leadSuccessDialog) leadSuccessDialog.close(); });
  function showLeadSuccess() {
    if (leadSuccessDialog?.showModal) leadSuccessDialog.showModal();
    else setFeedback('Tudo certo! Recebemos seu interesse. Nossa equipe entrará em contato em breve.', true);
  }
  function setFeedback(message, isSuccess = false) {
    feedback.hidden = false;
    feedback.textContent = message;
    feedback.className = `form-feedback ${isSuccess ? 'is-success' : 'is-error'}`;
  }
  function id() {
    try { return crypto.randomUUID(); }
    catch { return `aa-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
  }
  function setHidden(form, name, value) {
    let field = Array.from(form.querySelectorAll('input[type="hidden"]')).find(input => input.name === name);
    if (!field) {
      field = document.createElement('input');
      field.type = 'hidden'; field.name = name; form.appendChild(field);
    }
    field.value = String(value ?? '');
  }
  function prepareSubmission(form, requestId, source, extra = {}) {
    setHidden(form, 'request_id', requestId);
    setHidden(form, 'source', source);
    setHidden(form, 'campaign', CAMPAIGN);
    setHidden(form, 'submitted_at', new Date().toISOString());
    setHidden(form, 'landing_page', location.href.slice(0, 1800));
    setHidden(form, 'referrer', document.referrer.slice(0, 1000));
    setHidden(form, 'callback_origin', location.origin);
    for (const [key,value] of Object.entries(firstAttribution)) setHidden(form,key,value);
    for (const [key,value] of Object.entries(extra)) setHidden(form,key,value);
    form.action = GAS_URL;
    form.method = 'POST';
    form.target = 'aaGasTransport';
  }

  const waTrigger = $('#wa-floating-trigger');
  const waDialog = $('#wa-contact-dialog');
  const waClose = $('#wa-close');
  const waForm = $('#wa-lead-form');
  const waPhone = $('[name="phone"]', waForm);
  const waSubmit = $('.wa-start', waForm);
  const waFeedback = $('.wa-feedback', waForm);
  const waFallback = $('#wa-fallback');
  let mainRequestId = null;
  let waRequestId = null;
  let pending = null;
  let pendingTimer = null;

  function waMessage(name) {
    const firstName = name.trim().split(/\s+/)[0] || '';
    return `Olá! Meu nome é ${firstName}. Vim pelo site da American Academy SBC e gostaria de saber mais sobre as matrículas de 2027.`;
  }
  function waUrl(name) {
    return `https://wa.me/${WHATSAPP_DESTINATION}?text=${encodeURIComponent(waMessage(name))}`;
  }
  function showWaFeedback(message) {
    waFeedback.hidden = false;
    waFeedback.textContent = message;
  }
  function busy(which, busyNow) {
    if (which === 'main') {
      submitButton.disabled = busyNow;
      submitButton.querySelector('span:first-child').textContent = busyNow ? 'Registrando seu interesse...' : 'Quero agendar uma visita';
    } else {
      waSubmit.disabled = busyNow;
      waSubmit.querySelector('span:first-child').textContent = busyNow ? 'Registrando seus dados...' : 'Iniciar conversa no WhatsApp';
    }
  }
  function clearPending() {
    if (pendingTimer) clearTimeout(pendingTimer);
    const prev = pending;
    pending = null;
    pendingTimer = null;
    if (prev) busy(prev.which, false);
    return prev;
  }
  function errorFor(which, message, dest = '') {
    if (which === 'main') setFeedback(message);
    else {
      showWaFeedback(message);
      if (dest) { waFallback.href = dest; waFallback.hidden = false; }
    }
  }
  function startPending(which, requestId, dest = '') {
    pending = {which, requestId, dest};
    busy(which, true);
    pendingTimer = setTimeout(() => {
      const prev = clearPending();
      if (prev) errorFor(prev.which, 'O Google não confirmou o registro. Confira se o cadastro chegou à planilha antes de tentar novamente.', prev.dest);
    }, GAS_TIMEOUT_MS);
  }
  function checkTransport(which, dest = '') {
    if (pending) { errorFor(which, 'Aguarde a confirmação do cadastro anterior antes de enviar novamente.', dest); return false; }
    if (!GAS_READY) { errorFor(which, 'Ainda falta colocar a URL /exec do Google Apps Script no arquivo config.js.', dest); return false; }
    if (location.protocol === 'file:') { errorFor(which, 'Abra o site por um endereço HTTPS para fazer o teste de cadastro.', dest); return false; }
    return true;
  }
  // Só registra conversões depois do ACK válido do Apps Script.
  // Evento lead_form vai para o GTM: GA4, Google Ads e Meta (conforme consentimento).
  // Nunca incluir telefone, e-mail ou nome no dataLayer para evitar envio de PII ao GA4/Ads.
  const leadInfo = {};
  function trackConfirmedLead(which, requestId) {
    const info = leadInfo[which] || {};
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'lead_form',
      pagina: which === 'main' ? 'agendamento-visita' : 'whatsapp-flutuante',
      etapa: info.etapa || '',
      event_id: requestId
    });
    delete leadInfo[which];
  }

  window.addEventListener('message', event => {
    if (!pending || !event.data || event.data.type !== 'AA_LEAD_RESULT') return;
    if (!/^https:\/\/(?:script\.google\.com|(?:[a-z0-9-]+\.)*googleusercontent\.com)$/.test(event.origin)) return;
    if (event.data.requestId !== pending.requestId) return;
    const prev = clearPending();
    if (event.data.ok === true) {
      // Confirmar a conversão antes de trocar a tela ou sair para o WhatsApp.
      trackConfirmedLead(prev.which, prev.requestId);
      if (prev.which === 'main') {
        leadForm.reset(); mainRequestId = null; setGrades(''); feedback.hidden = true;
        showLeadSuccess();
      } else {
        waRequestId = null;
        waForm.reset();
        window.dataLayer.push({event: 'whatsapp_click'});
        // Folga para o navegador encaminhar os eventos do GTM antes da navegação.
        setTimeout(() => window.location.assign(prev.dest), 800);
      }
    } else {
      errorFor(prev.which, 'A planilha não confirmou o cadastro. Confira a implantação e as permissões do Apps Script.', prev.dest);
    }
  });

  // No envio válido NÃO usamos preventDefault: o submit nativo da página
  // alcança o código de integração de formulários do RD Station.
  // A navegação é direcionada ao iframe oculto, como no Praça Figueiras.
  leadForm.addEventListener('submit', e => {
    feedback.hidden = true;
    if (!leadForm.reportValidity()) { e.preventDefault(); return; }
    const data = new FormData(leadForm);
    const phone = String(data.get('phone') || '').replace(/\D/g,'');
    if (phone.length < 10 || phone.length > 11) {
      e.preventDefault(); setFeedback('Informe um número de WhatsApp válido, com DDD.');
      phoneInput.focus(); return;
    }
    if (String(data.get('website') || '').trim()) { e.preventDefault(); return; }
    if (!checkTransport('main')) { e.preventDefault(); return; }
    if (!mainRequestId) mainRequestId = id();
    prepareSubmission(leadForm, mainRequestId, 'formulario_visita', {
      privacy_accepted:'true', marketing_accepted:data.get('marketing') === 'on' ? 'true' : 'false'
    });
    leadInfo.main = {etapa: String(data.get('stage') || '')};
    startPending('main',mainRequestId);
    // Default submit → Google Apps Script (iframe, sem API Vercel, sem CORS).
  });

  waTrigger?.addEventListener('click', () => {
    waFeedback.hidden = true;
    waFallback.hidden = true;
    waDialog.showModal();
  });
  waClose?.addEventListener('click', () => waDialog.close());
  waDialog?.addEventListener('click', (e) => { if (e.target === waDialog) waDialog.close(); });
  waPhone?.addEventListener('input', () => {
    const digits = waPhone.value.replace(/\D/g, '').slice(0, 11);
    if (!digits) waPhone.value = '';
    else if (digits.length <= 2) waPhone.value = `(${digits}`;
    else if (digits.length <= 6) waPhone.value = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    else if (digits.length <= 10) waPhone.value = `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    else waPhone.value = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  });
  waForm?.addEventListener('submit', e => {
    waFeedback.hidden = true;
    waFallback.hidden = true;
    if (!waForm.reportValidity()) {e.preventDefault();return;}
    const data = new FormData(waForm);
    const name = String(data.get('name') || '').trim();
    const phone = String(data.get('phone') || '').replace(/\D/g,'');
    const email = String(data.get('email') || '').trim().toLowerCase();
    const dest = waUrl(name);
    if (phone.length < 10 || phone.length > 11) {
      e.preventDefault(); showWaFeedback('Informe um número válido com DDD.'); waPhone.focus(); return;
    }
    if (String(data.get('website') || '').trim()) { e.preventDefault();return; }
    if (!checkTransport('wa',dest)) {e.preventDefault();return;}
    if (!waRequestId) waRequestId = id();
    prepareSubmission(waForm, waRequestId, 'whatsapp_floating', {
      stage:'Ainda não sei',grade:'Preciso de orientação',
      message:'Origem do lead: botão flutuante de WhatsApp da LP Matrículas 2027.',
      privacy_accepted:'true', marketing_accepted:'false'
    });
    leadInfo.wa = {etapa: 'Ainda não sei'};
    startPending('wa',waRequestId,dest);
    // O retorno confirmado abre a conversa de WhatsApp na mesma aba.
  });
})();
