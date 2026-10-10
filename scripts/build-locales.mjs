import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCALES_DIR = path.join(ROOT, 'src', 'locales');

if (!fs.existsSync(LOCALES_DIR)) {
  fs.mkdirSync(LOCALES_DIR, { recursive: true });
}

// Read current DICT from src/lib/i18n.js
const i18nContent = fs.readFileSync(path.join(ROOT, 'src', 'lib', 'i18n.js'), 'utf-8');

// Additional keys covering all hardcoded strings identified in i18n audit
const EXTRA_KEYS = {
  navHome: { uz: "Bosh sahifa", ru: "Главная", en: "Home" },
  navCatalog: { uz: "Katalog", ru: "Каталог", en: "Catalog" },
  navCart: { uz: "Savat", ru: "Корзина", en: "Cart" },
  navContact: { uz: "Aloqa", ru: "Контакты", en: "Contact" },
  searchAction: { uz: "Qidirish", ru: "Поиск", en: "Search" },
  searchInCatalog: { uz: "KATALOGDAN QIDIRISH", ru: "ПОИСК ПО КАТАЛОГУ", en: "SEARCH IN CATALOG" },
  searchPlaceholderExtended: {
    uz: "Mahsulot qidirish — masalan: PN20, fiting, kran...",
    ru: "Поиск товаров — например: PN20, фитинг, кран...",
    en: "Search products — e.g. PN20, fittings, valves..."
  },
  catalogStackTitle: {
    uz: "Muhandislik Tizimlari Katalogi",
    ru: "Каталог инженерных систем",
    en: "Engineering Systems Catalog"
  },
  catalogStackSub: {
    uz: "Har bir bo'lim bo'yicha to'liq tovar assortimenti va texnik xarakteristikalari",
    ru: "Полный ассортимент и технические характеристики по каждому разделу",
    en: "Complete product assortment and technical specifications for each section"
  },
  emptyCategoryNotice: {
    uz: "Ushbu bo'lim uchun yangi tovarlar omborga qabul qilinmoqda. Narx va buyurtma uchun biz bilan bog'laning.",
    ru: "Новые товары для этого раздела поступают на склад. Свяжитесь с нами для уточнения цен и заказа.",
    en: "New products for this section are arriving at our warehouse. Contact us for pricing and orders."
  },
  categoryNotFound: { uz: "Bo'lim topilmadi", ru: "Категория не найдена", en: "Category not found" },
  categoryNotFoundDesc: {
    uz: "Ushbu kategoriya mavjud emas yoki nomi o'zgartirilgan.",
    ru: "Данная категория не существует или была переименована.",
    en: "This category does not exist or has been renamed."
  },
  specsTableHeading: {
    uz: "O'lchamlar va Parametrlar",
    ru: "Размеры и параметры",
    en: "Dimensions & Specifications"
  },
  packQuantity: { uz: "Paketda / Qutida", ru: "В упаковке", en: "Package quantity" },
  formPhoneRequired: {
    uz: "Telefon raqamingizni kiriting",
    ru: "Укажите номер телефона",
    en: "Please enter your phone number"
  },
  formInvalidPhone: {
    uz: "Raqam formati noto'g'ri (+998...)",
    ru: "Неверный формат номера (+998...)",
    en: "Invalid phone format (+998...)"
  },
  formNameRequired: { uz: "Ismingizni kiriting", ru: "Укажите ваше имя", en: "Please enter your name" },
  orderSuccessToast: {
    uz: "Buyurtmangiz qabul qilindi! Operatorimiz tez orada bog'lanadi.",
    ru: "Заказ принят! Наш менеджер скоро свяжется с вами.",
    en: "Order received! Our manager will contact you shortly."
  },
  cartAddedFeedback: { uz: "Qo'shildi!", ru: "Добавлено!", en: "Added!" },
  cartItemRemoved: { uz: "Mahsulot savatdan o'chirildi", ru: "Товар удален из корзины", en: "Item removed from cart" },
  quantityMin: { uz: "Eng kam miqdor — 1", ru: "Минимальное количество — 1", en: "Minimum quantity is 1" },
  copyLinkSuccess: { uz: "Havola nusxalandi", ru: "Ссылка скопирована", en: "Link copied to clipboard" },
  modalCloseAria: { uz: "Oynani yopish", ru: "Закрыть окно", en: "Close window" },
  continueShopping: { uz: "Yana mahsulot qo'shish", ru: "Продолжить покупки", en: "Continue shopping" },
  orderSuccessTitle: { uz: "Buyurtmangiz qabul qilindi!", ru: "Ваш заказ успешно принят!", en: "Your order has been received!" },
  orderNumberLabel: { uz: "Buyurtma raqami", ru: "Номер заказа", en: "Order number" },
  orderTotalSum: { uz: "Summa", ru: "Сумма", en: "Total" },
  orderSuccessDesc: {
    uz: "Tez orada operatorimiz siz bilan bog'lanib, tovarlar mavjudligi va yetkazib berish vaqtini tasdiqlaydi. Murojaat qilganda buyurtma raqamini ayting.",
    ru: "В ближайшее время наш оператор свяжется с вами для подтверждения наличия и времени доставки. При обращении назовите номер заказа.",
    en: "Our representative will contact you shortly to confirm stock availability and delivery schedule. Please mention your order number when contacting us."
  },
  emptyCartTitle: { uz: "Savatingiz bo'sh", ru: "Ваша корзина пуста", en: "Your shopping cart is empty" },
  emptyCartDesc: {
    uz: "Katalogdan kerakli santexnika va qurilish mahsulotlarini tanlab qo'shing.",
    ru: "Выберите необходимые сантехнические и строительные товары из каталога.",
    en: "Explore our catalog to add plumbing and construction supplies."
  },
  goToCatalog: { uz: "Katalogga o'tish", ru: "Перейти в каталог", en: "Go to Catalog" },
  checkoutAction: { uz: "Buyurtmani rasmiylashtirish", ru: "Оформить заказ", en: "Proceed to checkout" },
  readyMessageTitle: { uz: "Tayyor xabar", ru: "Готовое сообщение", en: "Prepared message" },
  readyMessageText: {
    uz: "Assalomu alaykum! Mahsulot bo'yicha savolim bor edi.",
    ru: "Здравствуйте! У меня есть вопрос по продукции.",
    en: "Hello! I have an inquiry regarding your products."
  },
  copyAction: { uz: "Nusxa olish", ru: "Скопировать", en: "Copy message" },
  copiedAction: { uz: "Nusxalandi! ✓", ru: "Скопировано! ✓", en: "Copied! ✓" },
  contactWriteInstagram: { uz: "Instagramda yozish", ru: "Написать в Instagram", en: "Message on Instagram" },
  contactWriteTelegram: { uz: "Telegramda yozish", ru: "Написать в Telegram", en: "Message on Telegram" },
  quickOverview: { uz: "Qisqacha ma'lumot", ru: "Краткая информация", en: "Quick overview" },
  warrantyTitle: { uz: "Kafolat va qaytarish", ru: "Гарантия и возврат", en: "Warranty & Returns" },
  howItWorks: { uz: "Qanday ishlaydi", ru: "Как это работает", en: "How it works" },
  browseCatalogFirst: { uz: "Avval katalogni ko'ring", ru: "Сначала посмотрите каталог", en: "Explore our catalog first" },
  browseCatalogFirstSub: {
    uz: "Kerakli mahsulotni topsangiz, so'rov matni avtomatik tayyorlanadi.",
    ru: "При выборе товара текст запроса формируется автоматически.",
    en: "When you select a product, the inquiry is generated automatically."
  },
  findForMe: { uz: "Menga mos mahsulotni toping", ru: "Подобрать продукцию", en: "Find products for me" },
  bulkOrderMenu: { uz: "Katta qurilish buyurtmasi", ru: "Оптовый заказ для строительства", en: "Wholesale / Commercial order" },
  howToOrder: { uz: "Qanday buyurtma beriladi", ru: "Как сделать заказ", en: "How to order" },
  fullCatalog: { uz: "Butun katalog", ru: "Весь каталог", en: "Full catalog" },
  allRightsReserved: { uz: "Barcha huquqlar himoyalangan.", ru: "Все права защищены.", en: "All rights reserved." },
  footerDisclaimer: {
    uz: "Narxlar va rasmlar NEVO GROUP praysidan olingan. Prays vaqti-vaqti bilan yangilanadi — aniq narx va mavjudlikni operatorimiz tasdiqlaydi.",
    ru: "Цены и изображения взяты из прайс-листа NEVO GROUP. Каталог периодически обновляется — точные цены и наличие подтверждает оператор.",
    en: "Prices and visuals are derived from the NEVO GROUP price list. Stock and prices are periodically updated — our representative will confirm exact availability."
  },
  brandName: { uz: "NEVO GROUP", ru: "NEVO GROUP", en: "NEVO GROUP" },
  brandSub: {
    uz: "Santexnika va qurilish mahsulotlari",
    ru: "Сантехника и строительные товары",
    en: "Plumbing & construction supplies"
  },
  seeAllResults: { uz: "Barcha natijalarni ko'rish", ru: "Смотреть все результаты", en: "See all results" },
  goToSection: { uz: "Bo'limga o'tish", ru: "Перейти в раздел", en: "Go to section" },
  sectionsWord: { uz: "bo'limlari", ru: "разделы", en: "subcategories" },
  viewAction: { uz: "Ko'rish", ru: "Смотреть", en: "View" },
  scrollDownAria: { uz: "Pastga tushish", ru: "Прокрутить вниз", en: "Scroll down" },
  aboutCorpBrand: { uz: "nevo® GROUP", ru: "nevo® GROUP", en: "nevo® GROUP" },
  aboutCorpText: {
    uz: "O'zbekiston bo'ylab suv ta'minoti, isitish, kanalizatsiya va sanoat muhandislik tizimlari uchun polimer quvurlar, zapor armatura va komplektatsiyalarning keng assortimenti to'g'ridan-to'g'ri ombordan.",
    ru: "Широкий ассортимент полимерных труб, запорной арматуры и комплектующих для водоснабжения, отопления, канализации и инженерных систем со склада по всему Узбекистану.",
    en: "Wide assortment of polymer pipes, industrial valves and fittings for water supply, heating, sewer and engineering systems directly from warehouse across Uzbekistan."
  },
  badgeFirstHand: {
    uz: "Birinchi qo'l kafolati",
    ru: "Гарантия первых рук",
    en: "First-hand guarantee"
  },
  materialCol: {
    uz: "Materiali",
    ru: "Материал",
    en: "Material"
  },
  decreaseQty: {
    uz: "Kamaytirish",
    ru: "Уменьшить",
    en: "Decrease"
  },
  increaseQty: {
    uz: "Ko'paytirish",
    ru: "Увеличить",
    en: "Increase"
  },
  unitDona: {
    uz: "dona",
    ru: "шт.",
    en: "pcs"
  },
  unitMetr: {
    uz: "metr",
    ru: "м",
    en: "m"
  },
  unitKomplekt: {
    uz: "komplekt",
    ru: "компл.",
    en: "set"
  }
};

// Extract uz, ru, en blocks from DICT
const uzMatch = i18nContent.match(/uz:\s*\{([\s\S]*?)\n\s*\},/);
const ruMatch = i18nContent.match(/ru:\s*\{([\s\S]*?)\n\s*\},/);
const enMatch = i18nContent.match(/en:\s*\{([\s\S]*?)\n\s*\}\n\};/);

function parseBlock(blockStr) {
  const dict = {};
  const lines = blockStr.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//')) continue;
    const match = trimmed.match(/^([a-zA-Z0-9_]+)\s*:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')\s*,?$/);
    if (match) {
      const key = match[1];
      let val = match[2];
      // strip quotes
      val = val.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
      dict[key] = val;
    }
  }
  return dict;
}

const uzDict = uzMatch ? parseBlock(uzMatch[1]) : {};
const ruDict = ruMatch ? parseBlock(ruMatch[1]) : {};
const enDict = enMatch ? parseBlock(enMatch[1]) : {};

// Merge EXTRA_KEYS
for (const [key, trans] of Object.entries(EXTRA_KEYS)) {
  uzDict[key] = trans.uz;
  ruDict[key] = trans.ru;
  enDict[key] = trans.en;
}

// Write out JSON files
fs.writeFileSync(path.join(LOCALES_DIR, 'uz.json'), JSON.stringify(uzDict, null, 2), 'utf-8');
fs.writeFileSync(path.join(LOCALES_DIR, 'ru.json'), JSON.stringify(ruDict, null, 2), 'utf-8');
fs.writeFileSync(path.join(LOCALES_DIR, 'en.json'), JSON.stringify(enDict, null, 2), 'utf-8');

console.log(`✅ Locales generated:`);
console.log(`   UZ: ${Object.keys(uzDict).length} keys`);
console.log(`   RU: ${Object.keys(ruDict).length} keys`);
console.log(`   EN: ${Object.keys(enDict).length} keys`);
