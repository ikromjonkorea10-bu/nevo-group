import { icon } from '../icons.js';
import { esc, formatPhone, normalizePhone } from './format.js';

/** Maydon ostidagi xato matni. */
export function fieldError(errors, field) {
  const message = errors[field];
  return message
    ? `<div class="field-error" id="err-${field}" role="alert">${esc(message)}</div>`
    : '';
}

/** Input uchun xato holati atributlari. */
export function errorAttrs(errors, field) {
  return errors[field] ? `aria-invalid="true" aria-describedby="err-${field}"` : '';
}

export function errorClass(errors, field) {
  return errors[field] ? 'has-error' : '';
}

export function renderFormAlert(message) {
  if (!message) return '';
  return `
    <div class="form-alert" role="alert">
      ${icon('zap', '', 18)}
      <span>${esc(message)}</span>
    </div>
  `;
}

export function renderSubmitButton({ submitting, label, busyLabel, onclick = '', type = 'button' }) {
  return `
    <button
      type="${type}"
      class="btn-primary"
      style="width: 100%; justify-content: center; padding: 15px;"
      ${onclick ? `onclick="${onclick}"` : ''}
      ${submitting ? 'disabled aria-busy="true"' : ''}
    >
      ${submitting ? `<span class="btn-spinner" aria-hidden="true"></span><span>${esc(busyLabel)}</span>` : `<span>${esc(label)}</span>${icon('arrow-right', '', 18)}`}
    </button>
  `;
}

/**
 * Forma maydonlarini holat obyektiga bog'laydi: har bir o'zgarish darhol
 * saqlanadi, shuning uchun qayta render'da yoki xatolikda ma'lumot yo'qolmaydi.
 * @param {Record<string, string | [string, string]>} bindings
 *   element id -> holat kaliti, yoki [holat kaliti, xato kaliti] (farq qilsa)
 */
export function bindFormState(form, bindings, errors) {
  for (const [elementId, binding] of Object.entries(bindings)) {
    const [key, errorKey] = Array.isArray(binding) ? binding : [binding, binding];
    const el = document.getElementById(elementId);
    if (!el) continue;
    el.addEventListener('input', () => {
      form[key] = el.value;
      if (errors[errorKey]) {
        delete errors[errorKey];
        el.classList.remove('has-error');
        el.removeAttribute('aria-invalid');
        document.getElementById(`err-${errorKey}`)?.remove();
      }
    });
    if (key === 'phone') {
      el.addEventListener('blur', () => {
        if (normalizePhone(el.value)) {
          el.value = formatPhone(el.value);
          form[key] = el.value;
        }
      });
    }
  }
}

/** Birinchi xatoli maydonga fokus. */
export function focusFirstError(fieldToElementId) {
  for (const [field, elementId] of Object.entries(fieldToElementId)) {
    const el = document.getElementById(elementId);
    if (el && el.classList.contains('has-error')) {
      el.focus();
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    if (!el && document.getElementById(`err-${field}`)) {
      document.getElementById(`err-${field}`).scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
  }
}
