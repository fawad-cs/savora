// Shared, accessible form validation. Errors appear under each field, are announced,
// and the first invalid field receives focus on submit.

export const validators = {
  name: v => (!v.trim() ? 'Please enter your name.' : v.trim().length < 2 ? 'Please enter your full name.' : ''),
  email: v => (!v.trim() ? 'Please enter your email address.' : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Please enter a valid email, like name@example.com.'),
  phone: v => {
    if (!v.trim()) return 'Please enter a phone number.';
    if (!/^[+()\-.\s\d]+$/.test(v)) return 'Use digits, spaces and + ( ) - only.';
    const digits = v.replace(/\D/g, '').length;
    return digits < 7 || digits > 15 ? 'Please enter a valid phone number (7–15 digits).' : '';
  },
};

export function bindValidation(form, rules, onValid) {
  const fieldOf = el => el.closest('.field');
  const check = name => {
    const el = form.elements[name]; if (!el) return '';
    const msg = rules[name](el.value, form);
    const field = fieldOf(el);
    const err = field?.querySelector('.field-error');
    field?.classList.toggle('has-error', !!msg);
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) err.textContent = msg;
    return msg;
  };
  Object.keys(rules).forEach(name => {
    const el = form.elements[name]; if (!el) return;
    el.addEventListener('blur', () => { if (el.value || el.dataset.touched) check(name); el.dataset.touched = '1'; });
    el.addEventListener('input', () => { if (fieldOf(el)?.classList.contains('has-error')) check(name); });
    el.addEventListener('change', () => { if (el.dataset.touched) check(name); });
  });
  form.addEventListener('submit', ev => {
    ev.preventDefault();
    const bad = Object.keys(rules).filter(n => check(n));
    if (bad.length) {
      const first = form.elements[bad[0]];
      first.focus({ preventScroll: true });
      (window.lenis ? window.lenis.scrollTo(first, { offset: -160 }) : first.scrollIntoView({ block: 'center' }));
      return;
    }
    onValid(Object.fromEntries(new FormData(form)));
  });
}

export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* fall through */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy'); ta.remove(); return ok;
  } catch { return false; }
}
