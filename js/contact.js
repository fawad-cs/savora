import { boot } from './main.js';
import { pageHeroIn, prefersReduced } from './animations.js';
import { HOURS } from './navigation.js';
import { validators, bindValidation, copyText } from './forms.js';

boot(async () => {
  document.getElementById('c-hours').innerHTML = HOURS.map(([d, h]) => `<div class="hours-row"><span>${d}</span><span>${h}</span></div>`).join('');
  const form = document.getElementById('c-form');
  const msg = form.elements.message;
  msg.addEventListener('input', () => { document.getElementById('c-msg-count').textContent = `${msg.value.length} / 1000`; });

  const done = document.getElementById('c-done');
  bindValidation(form, {
    name: validators.name,
    email: validators.email,
    subject: v => (v ? '' : 'Please choose a subject.'),
    message: v => (!v.trim() ? 'Please write a message.' : v.trim().length < 10 ? 'Please add a little more detail (at least 10 characters).' : ''),
  }, data => {
    const rows = [['Name', data.name], ['Email', data.email], ['Subject', data.subject], ['Message', data.message.trim()]];
    const dl = document.getElementById('c-summary'); dl.innerHTML = '';
    rows.forEach(([k, v]) => { const dt = document.createElement('dt'); dt.textContent = k; const dd = document.createElement('dd'); dd.textContent = v; dd.style.whiteSpace = 'pre-wrap'; dl.append(dt, dd); });
    done.dataset.copy = `To: table@savora.example\nSubject: ${data.subject}\n\n${data.message.trim()}\n\n— ${data.name} (${data.email})`;
    form.hidden = true; done.hidden = false; done.focus();
    if (window.gsap && !prefersReduced()) window.gsap.from(done, { opacity: 0, y: 30, duration: 0.9, ease: 'expo.out' });
  });
  document.getElementById('c-copy').addEventListener('click', async () => {
    const ok = await copyText(done.dataset.copy);
    document.getElementById('c-copy-msg').textContent = ok ? 'Message copied — paste it into your email app.' : 'Copying is blocked here — please select the text above and copy it manually.';
  });
  document.getElementById('c-edit').addEventListener('click', () => { done.hidden = true; form.hidden = false; form.elements.message.focus(); });
  document.getElementById('c-new').addEventListener('click', () => { form.reset(); document.getElementById('c-msg-count').textContent = '0 / 1000'; done.hidden = true; form.hidden = false; form.elements.name.focus(); });

  // Map pin drops in when the map is reached.
  const g = window.gsap;
  if (g && !prefersReduced()) g.from('.map-pin', { y: -80, opacity: 0, duration: 1.2, ease: 'bounce.out', scrollTrigger: { trigger: '.map', start: 'top 75%', once: true } });
  return { intro: () => pageHeroIn() };
});
