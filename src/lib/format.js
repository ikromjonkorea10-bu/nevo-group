const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Bazadan yoki foydalanuvchidan kelgan matnni HTML'ga xavfsiz joylash uchun. */
export function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

/** 6000 -> "6 000 so'm" (minglik ajratgich — bo'linmaydigan bo'shliq, raqam qatorga bo'linmasin) */
export function formatPrice(amount) {
  const n = Math.round(Number(amount) || 0);
  const grouped = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${n < 0 ? '-' : ''}${grouped} so'm`;
}

/**
 * Telefonni +998XXXXXXXXX ko'rinishiga keltiradi.
 * Qabul qilinadi: "+998 90 123 45 67", "998901234567", "90 123 45 67".
 * Noto'g'ri bo'lsa null qaytaradi.
 */
export function normalizePhone(input) {
  let digits = String(input || '').replace(/\D/g, '');
  if (digits.length === 9) digits = `998${digits}`;
  return /^998\d{9}$/.test(digits) ? `+${digits}` : null;
}

/** +998901234567 -> "+998 90 123 45 67" */
export function formatPhone(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) return String(phone || '');
  const d = normalized.slice(4);
  return `+998 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
}

/** Buyurtma raqami: 42 -> "NG-000042" */
export function formatOrderNumber(id) {
  return `NG-${String(id).padStart(6, '0')}`;
}

export function formatDateTime(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Lotin/kirill nomdan URL uchun slug yasaydi. */
export function slugify(text) {
  const map = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'y', к: 'k',
    л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ц: 'ts',
    ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya', ў: 'o', қ: 'q', ғ: 'g', ҳ: 'h',
  };
  return String(text || '')
    .toLowerCase()
    .replace(/[а-яёўқғҳ]/g, (ch) => map[ch] ?? '')
    .replace(/['`ʻʼ‘’]/g, '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}
