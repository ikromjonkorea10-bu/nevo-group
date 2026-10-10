# NEVO GROUP — Internationalization (i18n) Audit (Phase 0)

> **Target:** Trilingual Localization System (Uzbek Latin / Russian / English)  
> **Source Language:** Uzbek Latin (`uz`)  
> **Target Languages:** Russian (`ru`), English (`en`)  
> **Auditor:** Senior Front-End Architect  
> **Status:** Full String Inventory Completed  

---

## 1. Executive Summary & Defect Statistics

Currently, while `src/lib/i18n.js` maintains a baseline dictionary with ~126 keys per language, significant portions of the application bypass the localization system entirely. Russian mode (`ru`) and English mode (`en`) currently suffer from:
1. **Hardcoded Uzbek strings in templates** (over 35 distinct UI elements).
2. **Category & Subcategory names in Russian** even when Uzbek Latin is selected.
3. **Product catalog attributes in Russian** (`group_name`, `specs`, `subcategory_ru` in `nevo-katalog.csv`).
4. **Static metadata (`<title>`, `<meta description>`)** remaining in Uzbek regardless of language toggle.
5. **Form validations, ARIA accessibility labels, and toast notifications** hardcoded in single languages.

---

## 2. Inventory of Hardcoded UI Strings

### A. Navigation & Shell Components

| Component | File & Line | Hardcoded String (Current) | Intended uz Key | Intended ru Key | Intended en Key |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Header** | `src/components/Header.js:40` | `${cat.count} ta mahsulot` | `${count} ta mahsulot` | `${count} товаров` | `${count} products` |
| **Header** | `src/components/Header.js:103` | `Mahsulot qidirish` (aria-label) | `Mahsulot qidirish` | `Поиск товаров` | `Search products` |
| **Header** | `src/components/Header.js:113` | `Qidirish` (aria-label) | `Qidirish` | `Поиск` | `Search` |
| **Header** | `src/components/Header.js:126` | `Savat` (aria-label) | `Savat` | `Корзина` | `Cart` |
| **Header** | `src/components/Header.js:168` | `Katalog yuklanmadi, qayta urinib ko'ring.` | `Katalog yuklanmadi` | `Ошибка загрузки каталога` | `Failed to load catalog` |
| **Header** | `src/components/Header.js:181` | `"${query}" bo'yicha mahsulot topilmadi.` | `Mahsulot topilmadi` | `Товары не найдены` | `No products found` |
| **Footer** | `src/components/Footer.js:21` | `O'zbekiston bo'ylab yetkazib berish` | `Yetkazib berish` | `Доставка по всему Узбекистану` | `Nationwide delivery across Uzbekistan` |
| **Footer** | `src/components/Footer.js:54` | `Butun katalog` | `Barcha mahsulotlar` | `Весь каталог` | `Full catalog` |
| **Footer** | `src/components/Footer.js:56` | `Katta qurilish buyurtmasi` | `Katta buyurtma` | `Оптовый заказ` | `Wholesale / Bulk order` |
| **Footer** | `src/components/Footer.js:58` | `Qanday buyurtma beriladi` | `Qanday buyurtma beriladi` | `Как заказать` | `How to order` |
| **Floating FAB** | `src/main.js:228-230` | `Mutaxassisdan so'rash` | `Mutaxassisdan so'rash` | `Консультация специалиста` | `Consult an expert` |

### B. Home Page (`src/pages/HomePage.js`)

| Line | Hardcoded String (Current) | Issue / Root Cause | Required Action |
| :--- | :--- | :--- | :--- |
| **L203** | `O'zbekiston bo'ylab suv ta'minoti, isitish, kanalizatsiya va sanoat muhandislik tizimlari...` | Hardcoded Uzbek corporate statement | Move to `i18n.aboutCorporateText` |
| **L218** | `YIL TAJRIBA` | Hardcoded label | Move to `i18n.statExperienceLabel` |
| **L230** | `MAHSULOT TURI` | Hardcoded label | Move to `i18n.statProductsLabel` |
| **L241** | `SIFAT KAFOLATI` | Hardcoded label | Move to `i18n.statQualityLabel` |
| **L254** | `MAMNUN HAMKORLAR` | Hardcoded label | Move to `i18n.statPartnersLabel` |
| **L304** | `Mahsulotlar va Katalog` | Section title bypasses `t('catalogTitle')` | Replace with `t('catalogTitle')` |
| **L315** | `KATALOGDAN QIDIRISH` | Search input label bypasses `t()` | Replace with `t('searchInCatalog')` |
| **L318** | `Mahsulot qidirish — masalan: PN20, fiting, kran...` | Hardcoded placeholder | Replace with `t('searchPlaceholderExtended')` |
| **L412-423** | `1-slayd: Sanoat Muhandisligi`, `Sanoat Korxonasi`, etc. | Slayd tooltips hardcoded | Move to `i18n.heroSlideLabels` |

### C. Catalog & Product Components (`src/pages/CatalogPage.js`, `ProductModal.js`)

| File & Line | Hardcoded String | Context | Remediation Key |
| :--- | :--- | :--- | :--- |
| `CatalogPage.js:148` | `Qidirish` | Search trigger chip text | `t('searchAction')` |
| `CatalogPage.js:237` | `Muhandislik Tizimlari Katalogi` | Category stack title | `t('catalogStackTitle')` |
| `CatalogPage.js:298` | `Texnik pasportlar, mahsulot parametrlari...` | PDF catalog sub-caption | `t('downloadsSub')` |
| `CatalogPage.js:473` | `Ushbu bo'lim uchun yangi tovarlar omborga qabul qilinmoqda...` | Empty subcategory state | `t('emptyCategoryNotice')` |
| `ProductCard.js:53` | `Mahsulot kodi: ${sku}` | Tooltip text on SKU badge | `t('skuTooltip', { sku })` |
| `ProductModal.js:107`| `Katalog` | Fallback category breadcrumb | `t('catalog')` |
| `ProductModal.js:165`| `O'lchamlar va Parametrlar` | Specification table header | `t('specsTableHeading')` |
| `ProductModal.js:189`| `Paketda / Qutida` | Package count column header | `t('packQuantity')` |
| `ProductModal.js:215`| `Narx so'rash` | Alternate inquiry CTA | `t('requestPrice')` |

---

## 3. Taxonomy & Category i18n Inventory

Current database categories and subcategories exist with mixed language representations:

### Main Categories

| Category Slug | Current Uzbek (`name_uz`) | Required Russian (`name_ru`) | Required English (`name_en`) |
| :--- | :--- | :--- | :--- |
| `truba-va-fitinglar` | Truba va fitinglar | Трубы и фитинги | Pipes & Fittings |
| `zapor-armatura` | Zapor armatura | Запорная арматура | Industrial Valves & Controls |
| `yongin-jihozlari` | Yong'in jihozlari | Противопожарное оборудование | Fire Safety Equipment |
| `isitish-tizimi` | Isitish tizimi | Отопительные системы | Heating Systems & Boilers |
| `elektr-jihozlari` | Elektr jihozlari | Электрооборудование | Electrical Equipment |

### Subcategories & Product Groups (Currently in Russian in DB/CSV)

| Current Group Name (Russian in CSV) | Clean Uzbek Translation | Clean Russian Translation | Clean English Translation |
| :--- | :--- | :--- | :--- |
| `Врезной хомут` | Vrezka xomuti | Врезной хомут | Saddle Clamp |
| `Втулка под фланец (Адаптер)` | Flanets osti vtulka (Adapter) | Втулка под фланец (Адаптер) | Flange Adaptor Bushing |
| `Задвижка из литейного чугуна 30ч6бр` | Cho'yan zadvijka 30ch6br | Задвижка чугунная 30ч6бр | Cast Iron Gate Valve 30ch6br |
| `Задвижка стальная 30ч41нж` | Po'lat zadvijka 30ch41nj | Задвижка стальная 30ч41нж | Steel Gate Valve 30ch41nj |
| `Задвижка чугунная 30ч39р` | Cho'yan zadvijka 30ch39r (rezina ponali) | Задвижка чугунная 30ч39р | Resilient Seated Gate Valve 30ch39r |
| `Отвод полиэтиленовый` | Polietilen tirsak (burilish) | Отвод полиэтиленовый | HDPE Elbow / Bend |
| `Переходник полиэтиленовый` | Polietilen perexodnik | Переходник полиэтиленовый | HDPE Reducer |
| `Тройник полиэтиленовый` | Polietilen troynik | Тройник полиэтиленовый | HDPE Tee |
| `Фланец стальной плоский` | Po'lat yassi flanets | Фланец стальной плоский | Flat Steel Flange |
| `Демонтажная вставка` | Demontaj ulamasi (kompensator) | Демонтажная вставка | Dismantling Joint |
| `Вантуз чугунный фланцевый` | Cho'yan flanetsli vantuz (havo chiqaruvchi) | Вантуз чугунный фланцевый | Air Release Valve (Flanged) |

---

## 4. Metadata & SEO Localization Matrix

Currently, `<title>` and `<meta name="description">` remain in static Uzbek (`index.html` and `src/lib/pageMeta.js`).

### Dynamic Title & Description Rules

| Route / State | Uzbek (`uz`) | Russian (`ru`) | English (`en`) |
| :--- | :--- | :--- | :--- |
| **Home (`/`)** | NEVO GROUP — Sanoat va Santexnika Jihozlari Ombordan | NEVO GROUP — Промышленная сантехника и трубопроводная арматура со склада | NEVO GROUP — Industrial Plumbing, Valves & Piping from Warehouse |
| **Catalog (`/katalog`)** | Mahsulotlar Katalogi — NEVO GROUP | Каталог продукции — NEVO GROUP | Product Catalog — NEVO GROUP |
| **Category (`/katalog/:cat`)** | `{CatName}` — Rasmiy Narxlar va Turlar \| NEVO GROUP | `{CatName}` — Цены и характеристики \| NEVO GROUP | `{CatName}` — Specifications & Pricing \| NEVO GROUP |
| **Cart (`/savat`)** | Xarid Savati — NEVO GROUP | Корзина покупок — NEVO GROUP | Shopping Cart — NEVO GROUP |
| **Contacts (`/aloqa`)** | Aloqa va Manzil — NEVO GROUP | Контакты и адрес — NEVO GROUP | Contact & Warehouse Location — NEVO GROUP |

---

## 5. Forms, Validation, ARIA & Feedback Messages

| Event / Notification | Uzbek (`uz`) | Russian (`ru`) | English (`en`) |
| :--- | :--- | :--- | :--- |
| **Form Phone Required** | Telefon raqamingizni kiriting | Укажите номер телефона | Please enter your phone number |
| **Form Invalid Phone** | Raqam formati noto'g'ri (+998...) | Неверный формат номера (+998...) | Invalid phone format (+998...) |
| **Form Name Required** | Ismingizni kiriting | Укажите ваше имя | Please enter your name |
| **Order Success Toast** | Buyurtmangiz qabul qilindi! Operatorimiz tez orada bog'lanadi. | Заказ принят! Наш менеджер скоро свяжется с вами. | Order received! Our manager will contact you shortly. |
| **Cart Added Feedback** | Savatga qo'shildi | Добавлено в корзину | Added to cart |
| **Cart Item Removed** | Mahsulot savatdan o'chirildi | Товар удален из корзины | Item removed from cart |
| **Quantity Minimum** | Eng kam miqdor — 1 | Минимальное количество — 1 | Minimum quantity is 1 |
| **Search No Results** | Mos keladigan mahsulot topilmadi | Товары не найдены | No matching products found |
| **Copy Link Success** | Havola nusxalandi | Ссылка скопирована | Link copied to clipboard |
| **Modal Close ARIA** | Oynani yopish | Закрыть окно | Close window |

---

## 6. Execution Roadmap (Phase 4)

1. **Centralize All Keys:** Expand `src/lib/i18n.js` to 100% cover the above matrix.
2. **Synchronize Catalog Model:** Add multi-language accessor methods in `src/lib/catalog.js` (`getProductName(p, lang)`, `getGroupName(p, lang)`).
3. **Reactive Meta Hook:** Connect `updatePageMeta()` to `onLangChange` in `src/main.js` to immediately update document title, meta description, and `lang` attribute on language switch.
4. **Automated Guard:** Create `scripts/check-i18n.mjs` to ensure no template file contains unmapped raw strings and all languages possess parity in key counts.
