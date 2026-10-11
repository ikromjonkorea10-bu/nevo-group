# NEVO GROUP — Chuqur Tadqiqot va Tizimli Audit Hisoboti (Deep Research Report)

> **Hujjat turi:** To'liq Arxitektura, Vizual Dizayn, Katalog va Biznes-Pozitsiyalash Auditi  
> **Loyixa:** `nevogroup.uz` / `ikromjonkorea10-bu/nevo-group`  
> **Sana:** Oktyabr 2026  
> **Tekshiruv usuli:** Jonli Headless Chrome (Desktop 1440px / Mobile 390px), CDP Telemetriyasi, Kod bazasi tahlili, Vizual skrinshotlar va Benchmark (vero.uz) qiyosiy tahlili.

---

## 1. Umumiy Xulosa (Executive Summary)

NEVO GROUP sayti so'nggi iteratsiyalarda juda jiddiy texnik va me'moriy sakrashni amalga oshirdi. Oldingi bosqichlarda mavjud bo'lgan eng katta xatolar — **Vero.uz'dan so'zma-so'z ko'chirilgan matnlar, soxta da'volar ("1000+ mahsulot", "10+ yil", "Nest One" kabi begona loyihalar), buzilgan modal oynalar va ruscha transliteratsiyadagi URL sluglar** to'liq tozalandi va avtomatlashtirilgan gvardiya skriptlari (`check-originality.mjs`, `check-i18n.mjs`, `check-media-manifest.mjs`) bilan mustahkamlandi.

Saytning hozirgi texnik asosi (Vanilla JS + Vite + Supabase) ancha kuchli:
- **Yuklanish tezligi:** Asosiy mijoz sahifasi gziplangan holda bor-yo'g'i **~135 KB** (277 KB JS, 144 KB CSS). Hech qanday og'ir freymvork (React/Next.js) yo'q.
- **Konsol xatoliklari:** Barcha 10 ta asosiy marshrutda (UZ/RU/EN) **0 ta konsol xatosi**.
- **Rasmlar:** Katalogdagi 100 ta mahsulot va bosh sahifa bloklarida **0 ta buzilgan rasm**.
- **Admin izolyatsiyasi:** Og'ir AI/ML kutubxonalari (Transformers, ONNX WASM 26MB, HEIC) faqat `/admin/` paneliga yuklangan, umumiy do'konga ta'sir qilmaydi.

Biroq, chuqur vizual va interaktiv audit (Deep Research) davomida **foydalanuvchi tajribasiga (UX) va dizayn tizimiga (Design Tokens) to'sqinlik qiluvchi bir nechta kritik kamchiliklar** aniqlandi.

---

## 2. Aniqlangan Kritik Muammolar (Critical Findings)

### 🔴 1. Kontrast va Ko'rinmas Matnlar (Critical Contrast / Invisible Text Bugs)
Sayt dastlab yorug' (light) mavzuda boshlanib, keyinchalik quyuq kinostilga (cinematic dark mode) o'tkazilganda ba'zi interaktiv komponentlarning orqa foni (background) ochiq rangda qolib ketgan, matn rangi esa umumiy `--ink: #FFFFFF` ga ulangan:
1. **Katta buyurtma sahifasi (`/katta-buyurtma`):**
   - `.project-chip` ("Loyiha turi" tugmalari): Orqa fon `background: #f1f5f9` (och kulrang), matn esa `color: var(--ink)` (`#FFFFFF`).
   - **Natija:** Tanlanmagan tugmalar oq fonda oq yozuv bo'lib, **umuman o'qib bo'lmaydi** (kontrast 1.05:1).
2. **Aloqa sahifasi (`/aloqa`):**
   - `.ready-message-box` ("Tayyor xabar" bloki): `background: #f8fafc`, matn esa `.ready-msg-text { color: var(--ink); }`.
   - **Natija:** `Assalomu alaykum! Mahsulot bo'yicha savolim bor edi` matni **butunlay ko'rinmaydi** (oq ustida oq).
3. **Mahsulot tanlash sahifasi (`/tanlash`):**
   - `.quiz-option-btn` (Variantlar ro'yxati): `background: #f8fafc`, matn esa `color: var(--ink)`.
   - **Natija:** Tanlanmagan variantlar (masalan: Zapor armatura, Yong'in jihozlari, Elektr) oppoq quti bo'lib ko'rinadi, ichidagi yozuv ko'rinmaydi.
4. **Savat sahifasi (`/savat`):**
   - Yetkazib berish usulini tanlash tugmalari ham `.quiz-option-btn` dan foydalanadi va xuddi shu muammoga ega.
5. **Mahsulot kartasidagi brend nishoni (`.badge-brand`):**
   - `background: #f1f5f9`, `color: var(--muted)` (`#94A3B8`). Kontrast ~2.1:1 (WCAG talabi 4.5:1).

---

### 🟡 2. Mobilda Takroriy Til Almashtirgich (Double Language Switcher)
Mobilda bosh qismda (`Header.js`):
- Eng yuqori e'lonlar qatorida (`.top-bar`): `UZ / RU / EN` tugmalari bor.
- Logo ostidagi mobil qatorda (`.header-mobile-lang`): yana `UZ | RU | EN` tugmalari joylashgan.
- **Natija:** Kichik ekranda bir-birining tagida ikkita bir xil til tugmasi ko'rinib, joyni noo'rin egallaydi.

---

### 🟡 3. Mobilda Kichik Bosiladigan Elementlar (Touch Targets < 32px)
WCAG 2.1 va Google Mobile auditida minimal bosish maydoni 44x44px (kamida 32x32px) bo'lishi lozim.
- Skript telemetriyasi mobilda har bir sahifada 26 tadan 31 tagacha element 32px dan kichik ekanligini qayd etdi.
- Asosan: miqdor oshirish/kamaytirish tugmalari (`.cart-qty-btn`), loyiha teglari va kichik filtr piktogrammalari.

---

### 🟡 4. Assortiment va Bo'limlar Muvozanatsizligi (Catalog Asymmetry)
- **Haqiqiy faol mahsulotlar:** 100 ta SKU.
  - *Truba va fitinglar:* 78 ta (To'liq, ko'p qirrali).
  - *Zapor armatura:* 19 ta (Yaxshi texnik assortiment).
  - *Yong'in xavfsizligi:* 1 ta mahsulot.
  - *Elektr jihozlari:* 2 ta mahsulot.
- Hozirda 5 tadan kam bo'lgan bo'limlar "Tez orada" belgisi bilan to'g'ri himoyalangan, ammo tijoriy jihatdan omborda mavjud boshqa tovarlar bilan boyitish zarur.

---

### 🟡 5. PDF Kataloglar Holati
- `public/catalogs/` ichida 5 ta fayl mavjud, ammo ularning har biri bor-yo'g'i 317 bayt (bo'sh qobiq).
- Kod darajasida `CatalogPage.js` 50 KB dan kichik soxta fayllarni foydalanuvchiga ko'rsatmaydi (Halol kontent qoidasi ishlayapti).
- Mijozdan haqiqiy PDF prays-listlar va texnik kataloglar talab qilinadi.

---

## 3. Benchmark Tahlili: NEVO GROUP vs VERO.UZ

| Mezon | Vero.uz (Benchmark) | NEVO GROUP (Hozirgi holat) | Xulosa & Tavsiya |
| :--- | :--- | :--- | :--- |
| **Rol & Pozitsiyalash** | Ishlab chiqaruvchi zavod | Ombordan yetkazib beruvchi birinchi qo'l diler | Nevo'ning hozirgi pozitsiyasi 100% to'g'ri va halol. |
| **Vizual Stilistika** | Oq/och sanoat korporativ dizayni | Qorong'i, kinostil, blueprint setkali, neon aksentli | Nevo vizual jihatdan zamonaviyroq va texnologik ko'rinadi. |
| **Yuklanish Tezligi** | O'rtacha (og'ir CMS/rasmlar) | Juda tez (~135 KB gzip, 0 freymvork) | Nevo tezlik bo'yicha Vero'dan ancha ustun. |
| **Katalog Ko'lami** | Minglab SKU, 5 ta yirik zavod liniyasi | 100 ta SKU (78 ta quvur, 19 ta armatura) | Nevo'da yong'in va elektr toifalarini kengaytirish kerak. |
| **Media & Hujjatlar** | Haqiqiy zavod videolari, 40-60 betlik PDFlar | Tanlangan sifatli stock va ombor kadrlari | Mijozdan real foto va rasmiy PDFlar olinishi kerak. |
| **Halollik & Ishonch** | O'z sertifikatlari va obyektlari | Faqat tasdiqlangan ko'rsatkichlar (`site-claims.json`) | Soxta loyihalar yo'q qilingan, ishonch darajasi yuqori. |

---

## 4. Prioritetli Harakatlar Rejasi (Actionable Roadmap)

### 1-Bosqich: Zudlik bilan tuzatish kerak bo'lgan UI/UX defektlari (1-2 soat)
1. `.project-chip`, `.ready-message-box`, `.quiz-option-btn`, `.badge-brand` uchun to'liq to'q/yarim-shaffof fon (`var(--surface)`, `rgba(255,255,255,0.06)`) va aniq oq/kulrang matn kontrastini joriy qilish.
2. Mobildagi takroriy til tugmasini olib tashlash (faqat bittasini qoldirish).
3. Mobildagi interaktiv elementlar o'lchamini kamida 44px ga kengaytirish.

### 2-Bosqich: Tijoriy va Kontent boyitish (Buyurtmachi bilan)
1. **Ombor manzili va ish vaqti:** Footer va Aloqa sahifasidagi bo'sh joylarni to'ldirish uchun aniq ma'lumot olish.
2. **Haqiqiy PDF kataloglar:** 5 ta bo'sh PDF o'rniga haqiqiy prays-list yoki texnik broshyuralarni yuklash.
3. **Yong'in va Elektr tovarlari:** 1 va 2 ta tovar o'rniga ombordagi qo'shimcha pozitsiyalarni bazaga kiritish.

### 3-Bosqich: Ishga tushirish (Launch) tayyorgarligi
1. `VITE_SITE_LIVE=true` qilish orqali Google indeksatsiyasini ochish.
2. Private Preview (`?preview=1`) eshigini ochish.
