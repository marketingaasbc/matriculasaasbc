import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = readFileSync(new URL('../script.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

test('Consent Mode v2 antes de GTM; GTM noscript logo após body', () => {
  const consentPos = html.indexOf("gtag('consent', 'default'");
  const gtmPos = html.indexOf("'https://www.googletagmanager.com/gtm.js?id='");
  const bodyPos = html.indexOf('<body>');
  const noscriptPos = html.indexOf('<!-- Google Tag Manager (noscript) -->');
  assert.ok(consentPos >= 0 && consentPos < gtmPos);
  assert.ok(bodyPos >= 0 && noscriptPos > bodyPos);
  assert.ok(noscriptPos - bodyPos < 50);
  assert.match(html, /GTM-MT7NPS3W/);
  assert.match(html, /_vercel\/insights\/script\.js/);
});

test('Pixel direto removido; consentimento e RD respeitam aceite', () => {
  assert.doesNotMatch(script, /fbq\s*\(|fbevents\.js|META_PIXEL_ID/);
  assert.match(script, /event: 'consent_granted'/);
  assert.match(script, /if \(choice === 'all'\)/);
  assert.match(script, /loadRdTracking\(\)/);
  assert.match(html, /data-cookie-settings/);
  assert.match(css, /V3\.3: banner compacto/);
});

test('As conversões só são geradas após a confirmação do Google', () => {
  const functionLead = script.indexOf('function trackConfirmedLead(');
  const successAck = script.indexOf('if (event.data.ok === true)');
  const trackCall = script.indexOf('trackConfirmedLead(prev.which, prev.requestId)');
  assert.ok(functionLead > 0);
  assert.ok(successAck > 0 && successAck < trackCall);
  assert.match(script, /event: 'lead_form'/);
  assert.match(script, /event: 'whatsapp_click'/);
  assert.match(script, /setTimeout\(\(\) => window\.location\.assign\(prev\.dest\), 800\)/);
  assert.doesNotMatch(script.slice(functionLead,script.indexOf('window.addEventListener(\'message\'',functionLead)), /telefone:|email:|nome:/);
});
