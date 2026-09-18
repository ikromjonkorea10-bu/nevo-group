import { getSupabase, isNetworkError } from './supabase.js';
import { normalizePhone } from './format.js';
import { MAIN_PHONE } from '../data/content.js';

export const PHONE_ERROR = "Telefon raqami +998 XX XXX XX XX formatida bo'lishi kerak (9 raqam)";

// place_order() xatolik hint'lari -> forma maydonlari
const HINT_FIELDS = new Set(['customer_name', 'phone', 'address', 'comment', 'company_name', 'items', 'out_of_stock']);

/**
 * Mijoz tomonidagi tekshiruv (server ham xuddi shu qoidalarni tekshiradi).
 * @returns {Record<string, string>} maydon -> xato matni
 */
export function validateOrder({ customerName, phone, hasItems, itemsError }) {
  const errors = {};
  if (!String(customerName || '').trim()) errors.customer_name = 'Ismingizni kiriting';
  if (!String(phone || '').trim()) errors.phone = 'Telefon raqamingizni kiriting';
  else if (!normalizePhone(phone)) errors.phone = PHONE_ERROR;
  if (!hasItems) errors.items = itemsError;
  return errors;
}

/**
 * Buyurtmani yuboradi. Narxlar serverda products jadvalidan olinadi —
 * bu yerdan faqat mahsulot id va miqdor yuboriladi.
 *
 * @returns {Promise<{ ok: true, order: { id: number, total_amount: number } }
 *                 | { ok: false, field: string|null, message: string }>}
 */
export async function submitOrder({ customerName, phone, address, comment, orderType, companyName, items }) {
  const payload = {
    p_customer_name: String(customerName || '').trim(),
    p_phone: normalizePhone(phone) || String(phone || ''),
    p_address: address?.trim() || null,
    p_comment: comment?.trim() || null,
    p_order_type: orderType,
    p_company_name: companyName?.trim() || null,
    p_items: items.map((i) => ({ product_id: Number(i.productId), quantity: Number(i.quantity) })),
  };

  let result;
  try {
    result = await getSupabase().rpc('place_order', payload);
  } catch (error) {
    return { ok: false, field: null, message: networkMessage(error) };
  }

  const { data, error } = result;
  if (error) {
    if (isNetworkError(error)) return { ok: false, field: null, message: networkMessage(error) };
    if (error.code === 'P0001' && error.message) {
      return { ok: false, field: HINT_FIELDS.has(error.hint) ? error.hint : null, message: error.message };
    }
    console.warn('Buyurtma yuborilmadi:', error);
    return {
      ok: false,
      field: null,
      message: `Buyurtmani yuborib bo'lmadi. Birozdan so'ng qayta urinib ko'ring yoki ${MAIN_PHONE.label} raqamiga qo'ng'iroq qiling.`,
    };
  }

  return { ok: true, order: { id: Number(data.id), total_amount: Number(data.total_amount) } };
}

function networkMessage(error) {
  console.warn('Tarmoq xatosi:', error);
  return "Internet aloqasi yo'q yoki server javob bermadi. Ma'lumotlaringiz saqlandi — aloqani tekshirib, qayta urinib ko'ring.";
}
