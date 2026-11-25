import { boot } from './main.js';
import { pageHeroIn, prefersReduced } from './animations.js';
import { renderArt } from './art.js';
import { HOURS } from './navigation.js';
import { validators, bindValidation, copyText } from './forms.js';

// Service windows per weekday (0 = Sunday). Last seating is 90 min before close.
const SERVICE = {
  0: ['12:00', '14:30'], 1: null, 2: ['18:00', '21:30'], 3: ['18:00', '21:30'], 4: ['18:00', '21:30'], 5: ['17:30', '22:00'], 6: ['17:30', '22:00'],
};
const MAX_DAYS = 30;

const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const fmt = m => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

boot(async () => {
  renderArt();
  document.getElementById('res-hours').innerHTML = HOURS.map(([d, h]) => `<div class="hours-row"><span>${d}</span><span>${h}</span></div>`).join('');

  const form = document.getElementById('res-form');
  const date = form.elements.date, time = form.elements.time, guests = form.elements.guests;
  const notes = form.elements.notes, occasion = form.elements.occasion;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const max = new Date(today); max.setDate(max.getDate() + MAX_DAYS);
  date.min = iso(today); date.max = iso(max);

  guests.innerHTML = '<option value="">Select</option>' + Array.from({ length: 8 }, (_, i) => `<option value="${i + 1}">${i + 1} ${i ? 'guests' : 'guest'}</option>`).join('') + '<option value="9+">9+ guests (Oak Room)</option>';
  const gHint = document.getElementById('r-guests-hint');
  guests.addEventListener('change', () => { gHint.textContent = guests.value === '9+' ? 'We will contact you to plan the Oak Room.' : ''; if (guests.value === '9+' && !occasion.value) occasion.value = 'Private dining enquiry'; });

  if (location.hash === '#private') { occasion.value = 'Private dining enquiry'; guests.value = '9+'; gHint.textContent = 'We will contact you to plan the Oak Room.'; }
  if (location.hash === '#chefs-table') occasion.value = "Chef's table";

  function fillTimes() {
    time.innerHTML = '';
    const v = date.value;
    if (!v) { time.disabled = true; time.innerHTML = '<option value="">Choose a date first</option>'; return; }
    const d = parseISO(v);
    const win = SERVICE[d.getDay()];
    if (!win) { time.disabled = true; time.innerHTML = '<option value="">Closed on Mondays</option>'; return; }
    let start = toMin(win[0]); const end = toMin(win[1]);
    if (iso(d) === iso(new Date())) { const now = new Date(); start = Math.max(start, Math.ceil((now.getHours() * 60 + now.getMinutes() + 60) / 30) * 30); }
    const slots = []; for (let m = start; m <= end; m += 30) slots.push(fmt(m));
    time.disabled = !slots.length;
    time.innerHTML = slots.length ? '<option value="">Select a time</option>' + slots.map(s => `<option>${s}</option>`).join('') : '<option value="">No times left today</option>';
  }
  date.addEventListener('change', fillTimes);
  notes.addEventListener('input', () => { document.getElementById('r-notes-count').textContent = `${notes.value.length} / 500`; });

  const rules = {
    name: validators.name,
    email: validators.email,
    phone: validators.phone,
    guests: v => (v ? '' : 'Please choose how many guests.'),
    date: v => {
      if (!v) return 'Please choose a date.';
      const d = parseISO(v);
      if (Number.isNaN(d.getTime())) return 'Please enter a valid date.';
      if (d < today) return 'That date has passed — please choose today or later.';
      if (d > max) return `We take bookings up to ${MAX_DAYS} days ahead.`;
      if (!SERVICE[d.getDay()]) return 'We are closed on Mondays. Please choose another day.';
      return '';
    },
    time: v => (date.value && !time.disabled ? (v ? '' : 'Please choose a time.') : (date.value ? 'No times are available on that date.' : 'Choose a date first.')),
  };

  const done = document.getElementById('res-done');
  bindValidation(form, rules, data => {
    const d = parseISO(data.date);
    const rows = [
      ['Name', data.name], ['Email', data.email], ['Phone', data.phone],
      ['Date', d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })],
      ['Time', data.time], ['Guests', data.guests], ['Occasion', data.occasion || '—'], ['Requests', data.notes?.trim() || '—'],
    ];
    const dl = document.getElementById('res-summary');
    dl.innerHTML = '';
    rows.forEach(([k, v]) => { const dt = document.createElement('dt'); dt.textContent = k; const dd = document.createElement('dd'); dd.textContent = v; dl.append(dt, dd); });
    done.dataset.copy = 'Savora reservation request\n' + rows.map(([k, v]) => `${k}: ${v}`).join('\n');
    form.hidden = true; done.hidden = false; done.focus();
    if (window.gsap && !prefersReduced()) window.gsap.from(done, { opacity: 0, y: 30, duration: 0.9, ease: 'expo.out' });
    window.lenis ? window.lenis.scrollTo(done, { offset: -120 }) : done.scrollIntoView({ block: 'start' });
  });

  document.getElementById('res-copy').addEventListener('click', async () => {
    const ok = await copyText(done.dataset.copy);
    document.getElementById('res-copy-msg').textContent = ok ? 'Details copied to your clipboard.' : 'Copying is blocked here — please select the details above and copy them manually.';
  });
  document.getElementById('res-edit').addEventListener('click', () => { done.hidden = true; form.hidden = false; form.elements.name.focus(); });
  document.getElementById('res-new').addEventListener('click', () => { form.reset(); fillTimes(); document.getElementById('r-notes-count').textContent = '0 / 500'; gHint.textContent = ''; done.hidden = true; form.hidden = false; form.querySelectorAll('.has-error').forEach(f => f.classList.remove('has-error')); form.querySelectorAll('.field-error').forEach(p => { p.textContent = ''; }); form.elements.name.focus(); });

  return { intro: () => pageHeroIn() };
});
