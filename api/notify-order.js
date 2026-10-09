// Vercel Serverless Function: Yangi buyurtma tushganda Telegram bot orqali xabarnoma yuborish

function escapeHtml(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function formatSum(n) {
  return `${Math.round(Number(n) || 0).toLocaleString('ru-RU').replace(/\s/g, ' ')} so'm`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN || '8410942564:AAGrclVIqWSHCRXogbf4kFRCZS4GgHiDWw0';
  const chatIdsEnv = process.env.TELEGRAM_CHAT_ID || '1767758378';

  if (!token || !chatIdsEnv) {
    console.warn('TELEGRAM_BOT_TOKEN yoki TELEGRAM_CHAT_ID topilmadi');
    return res.status(200).json({ skipped: true });
  }

  const chatIds = chatIdsEnv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const {
    orderId,
    totalAmount,
    customerName,
    phone,
    address,
    comment,
    orderType,
    companyName,
    items = [],
  } = req.body || {};

  const orderNumStr = orderId ? `#${String(orderId).padStart(4, '0')}` : 'Yangi';
  const typeLabel = orderType === 'bulk' ? '🏢 Katta qurilish buyurtmasi (Optom)' : '🛒 Chakana xarid';

  let itemsHtml = '';
  if (Array.isArray(items) && items.length > 0) {
    itemsHtml = items
      .map((it, idx) => {
        const name = escapeHtml(it.name || `Mahsulot #${it.productId}`);
        const qty = it.quantity || 1;
        const unit = escapeHtml(it.unit || 'dona');
        const price = it.price ? ` (${formatSum(it.price * qty)})` : '';
        return `  ${idx + 1}. <b>${name}</b> — ${qty} ${unit}${price}`;
      })
      .join('\n');
  }

  let text = `📦 <b>YANGI BUYURTMA ${orderNumStr}</b>\n`;
  text += `━━━━━━━━━━━━━━━━━\n`;
  text += `👤 <b>Mijoz:</b> ${escapeHtml(customerName || 'Noma\'lum')}\n`;
  text += `📞 <b>Telefon:</b> <a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a>\n`;

  if (companyName) {
    text += `🏢 <b>Tashkilot:</b> ${escapeHtml(companyName)}\n`;
  }
  if (address) {
    text += `📍 <b>Yetkazish manzili:</b> ${escapeHtml(address)}\n`;
  }

  text += `🏷 <b>Turi:</b> ${typeLabel}\n`;

  if (itemsHtml) {
    text += `\n🛍 <b>Savatdagi mahsulotlar:</b>\n${itemsHtml}\n`;
  }

  if (totalAmount && Number(totalAmount) > 0) {
    text += `\n💰 <b>Jami summa:</b> <b>${formatSum(totalAmount)}</b>\n`;
  }

  if (comment) {
    text += `\n📝 <b>Mijoz izohi:</b>\n<i>${escapeHtml(comment)}</i>\n`;
  }

  text += `━━━━━━━━━━━━━━━━━\n`;
  text += `⏰ <b>Vaqt:</b> ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}\n`;
  text += `🌐 <a href="https://nevogroup.uz/admin/#orders/${orderId || ''}">Admin panelda ko'rish</a>`;

  // Har bir chat_id ga xabar yuborish
  const results = await Promise.allSettled(
    chatIds.map(async (chatId) => {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      });
      return response.json();
    })
  );

  return res.status(200).json({ ok: true, sent: results.length });
}
