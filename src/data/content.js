// Saytning statik marketing matnlari (bazada saqlanmaydi).

// Aloqa ma'lumotlari — saytning hamma joyi shu yerdan oladi.
// telegram bo'sh bo'lsa, Telegram tugmalari ko'rinmaydi.
export const CONTACTS = {
  phones: [
    { tel: '+998952601100', label: '+998 95 260 11 00' },
    { tel: '+998998631100', label: '+998 99 863 11 00' },
  ],
  instagram: 'nevo_group_uzbekistan',
  // Mijoz tasdiqlagach to'ldiriladi (masalan: 'nevo_group_uz')
  telegram: '',
};

export const MAIN_PHONE = CONTACTS.phones[0];
export const INSTAGRAM_URL = `https://instagram.com/${CONTACTS.instagram}`;
export const INSTAGRAM_DM_URL = `https://ig.me/m/${CONTACTS.instagram}`;
export const TELEGRAM_URL = CONTACTS.telegram ? `https://t.me/${CONTACTS.telegram}` : '';

export const BENEFITS = [
  {
    "icon": "boxes",
    "title": "Keng assortiment",
    "desc": "Kerakli santexnika buyumlari bir joyda"
  },
  {
    "icon": "layout-grid",
    "title": "Asosiy bo'limlar",
    "desc": "Trubadan tortib elektr jihozlarigacha keng tanlov"
  },
  {
    "icon": "tag",
    "title": "Narx ko'rinib turadi",
    "desc": "Yashirin toʻlovlarsiz, praydagi aniq narxlar"
  },
  {
    "icon": "truck",
    "title": "Yetkazib berish",
    "desc": "O'zbekiston viloyatlariga yetkazib beramiz"
  },
  {
    "icon": "wrench",
    "title": "Tanlashda yordam",
    "desc": "Mutaxassislarimiz mos variantni topib beradi"
  },
  {
    "icon": "message-circle",
    "title": "Instagram va telefon",
    "desc": "Qulay aloqa kanallari orqali to'g'ridan-to'g'ri bog'laning"
  },
  {
    "icon": "zap",
    "title": "Tezkor javob",
    "desc": "Ish vaqtida har bir murojaatga tezda javob beramiz"
  },
  {
    "icon": "shield-check",
    "title": "Aniq pozitsiyalar",
    "desc": "Har bir mahsulot kodi va oʻlchami bilan"
  }
];
