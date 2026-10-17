(() => {
  'use strict';
  // Confirme o Pixel com a equipe antes de publicar. Somente carregamos após consentimento.
  const META_PIXEL_ID = '4024453747862467';
  const CAMPAIGN = 'Matriculas 2027 - AA SBC';
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

  function cookieChoice(choice) {
    try { localStorage.setItem('aa_sbc_cookie_choice', choice); } catch { /* navegação privada */ }
    $('#cookie-banner').hidden = true;
    if (choice === 'all') loadMetaPixel();
  }
  function loadMetaPixel() {
    if (!META_PIXEL_ID || window.fbq) return;
    /* Código Meta Pixel padrão, carregado somente após consentimento. */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);
      t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
      (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', META_PIXEL_ID);
    window.fbq('track','PageView');
  }
  let preference = null;
  try { preference = localStorage.getItem('aa_sbc_cookie_choice'); } catch { /* ignore */ }
  if (preference === 'all') loadMetaPixel();
  else if (preference !== 'essential') $('#cookie-banner').hidden = false;
  $('#cookies-accept').addEventListener('click', () => cookieChoice('all'));
  $('#cookies-essential').addEventListener('click', () => cookieChoice('essential'));

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
  const setFeedback = (message, isSuccess = false) => {
    feedback.hidden = false;
    feedback.textContent = message;
    feedback.className = `form-feedback ${isSuccess ? 'is-success' : 'is-error'}`;
  };
  leadForm.addEventListener('submit', async e => {
    e.preventDefault();
    feedback.hidden = true;
    if (!leadForm.reportValidity()) return;
    const data = new FormData(leadForm);
    const phone = String(data.get('phone') || '').replace(/\D/g,'');
    if (phone.length < 10 || phone.length > 11) {
      setFeedback('Informe um número de WhatsApp válido, com DDD.');
      phoneInput.focus(); return;
    }
    if (location.protocol === 'file:') {
      setFeedback('Esta é a visualização local do site. Para receber cadastros reais, publique o projeto na Vercel e configure as integrações descritas no README.');
      return;
    }
    let requestId;
    try { requestId = crypto.randomUUID(); } catch { requestId = `aa-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
    const payload = {
      request_id: requestId,
      name: String(data.get('name') || '').trim(),
      phone, email: String(data.get('email') || '').trim().toLowerCase(),
      stage: String(data.get('stage') || ''), grade: String(data.get('grade') || ''),
      message: String(data.get('message') || '').trim(),
      privacy_accepted: data.get('privacy') === 'on', marketing_accepted: data.get('marketing') === 'on',
      honeypot: String(data.get('website') || ''),
      campaign: CAMPAIGN, landing_page: location.href.slice(0,1800),
      referrer: document.referrer.slice(0,1000), attribution: firstAttribution,
      submitted_at: new Date().toISOString()
    };
    submitButton.disabled = true;
    submitButton.querySelector('span:first-child').textContent = 'Enviando seus dados...';
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 19000);
      let response;
      try {
        response = await fetch('/api/lead', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
      } finally {clearTimeout(timer);}
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.message || 'Não foi possível registrar seu interesse. Tente novamente em alguns instantes.');
      setFeedback('Recebemos seu interesse! Obrigado por querer conhecer a American Academy. Nossa equipe de matrículas poderá entrar em contato pelos dados informados.', true);
      leadForm.reset();
      setGrades('');
      if (window.fbq) window.fbq('track', 'Lead', {content_name:'Matrículas 2027 - AA SBC'});
    } catch (error) {
      setFeedback(error.name === 'AbortError' ? 'A resposta demorou mais que o esperado. Confira com a equipe se seu cadastro chegou antes de reenviar.' : error.message);
    } finally {
      submitButton.disabled = false;
      submitButton.querySelector('span:first-child').textContent = 'Quero agendar uma visita';
    }
  });
})();
