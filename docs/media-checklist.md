# NEVO GROUP — Media Checklist & Client Asset Priority Guide

> **Hujjat maqsadi:** NEVO GROUP brendining o'ziga xosligi, halolligi va yuqori darajadagi ko'rinishini ta'minlash uchun do'kon egasi va ta'minotchilardan olinishi kerak bo'lgan original foto/video/fayllar ro'yxati.
> **Status:** Phase 7 yakunlandi. Barcha mavjud media fayllar `src/config/media-manifest.json` da ro'yxatga olingan va avtomatlashtirilgan `check:media` guardi orqali tekshiriladi.

---

## 1. Birinchi darajali vazifalar (Priority 1 — Brand & Identity)

| Aktiv nomi | Tavsiya etilgan format | O'lcham | Joylashuvi | Izoh / Talab |
| :--- | :--- | :--- | :--- | :--- |
| **NEVO GROUP Asosiy Logo** | SVG yoki yuqori sifatli PNG (shaffof fon) | 1200×400 px | `/brand/nevo-logo.png` | Oltin/bronza va to'q ko'k rangdagi rasmiy vektor logo. |
| **Kompakt Emblema / Favicon** | SVG / PNG | 512×512 px | `/brand/nevo-logo-sm.png`, `/favicon.ico` | Brauzer tablari, mobil ilova belgisi va xatcho'plar uchun. |
| **Kompaniya blankasi / Pechat** | PNG / PDF | - | Admin hujjatlari uchun | Rasmiy hisob-faktura va tijoriy takliflar uchun. |

---

## 2. Ikkinchi darajali vazifalar (Priority 2 — Hero & Bo'lim Muqovalari)

| Aktiv nomi | Tavsiya etilgan format | O'lcham & Hajm | Joylashuvi | Izoh |
| :--- | :--- | :--- | :--- | :--- |
| **Ombor & Yuklash Video (Hero)** | WebM / MP4 (H.264, ovozsiz) | 1920×1080 px, ≤ 6 MB | `/videos/warehouse-showcase.webm` | Toshkentdagi markaziy ombor, mahsulotlarni yuklash jarayoni aks etgan 10–15 soniyalik sifatli B-roll video. |
| **Quvurlar va Fitinglar Muqovasi** | WebP / JPEG | 1600×900 px, ≤ 120 KB | `/images/catalog-slides/pipes-1600.webp` | Polimer, kompozit va polietilen quvurlar ombori. |
| **Zapor Armatura Muqovasi** | WebP / JPEG | 1600×900 px, ≤ 120 KB | `/images/catalog-slides/valves-1600.webp` | Sanoat zadvijkalari, sharli kranlar va filtrlar zaxirasi. |
| **Yong'in Xavfsizligi Muqovasi** | WebP / JPEG | 1600×900 px, ≤ 120 KB | `/images/catalog-slides/factory-1600.webp` | Yong'in gidrantlari, shlanglar va o't o'chirish jihozlari. |
| **Isitish Tizimlari Muqovasi** | WebP / JPEG | 1600×900 px, ≤ 120 KB | `/images/catalog-slides/plant-1600.webp` | Suv isitgichlar, qozonlar va harorat nazorati tizimlari. |
| **Elektr Jihozlari Muqovasi** | WebP / JPEG | 1600×900 px, ≤ 120 KB | `/images/catalog-slides/sewer-1600.webp` | Sanoat transformatorlari, montaj qismlari va avtomatika. |

---

## 3. Uchinchi darajali vazifalar (Priority 3 — Mahsulotlar Suratlarini Yangilash)

Hozirgi vaqtda katalogda bir nechta turli o'lchamdagi tovarlar bitta umumiy suratdan foydalanmoqda. Quyidagi tovarlarni alohida suratga olish tavsiya etiladi:

1. **Vrezka xomutlari (Saddle Clamps):**
   - NV-0001 (20/15 mm)
   - NV-0002 (25/15 mm)
   - NV-0003 (32/20 mm)
   - NV-0004 (40/20 mm)
   *(Har bir diametr uchun xomutning o'z qutisi yoki o'lcham tamg'asi ko'ringan alohida surat).*

2. **Polietilen o'tish muftalari va tirsaklar (PE Fittings):**
   - Diametrlari 20 mm dan 110 mm gacha bo'lgan tirsak, troynik va zaglushkalar.

3. **Cho'yan zadvijkalar (30ch6br va 30ch41nj):**
   - Dn 50, Dn 80, Dn 100, Dn 150, Dn 200 zadvijkalarining zavod pasporti va tamg'asi bilan suratlari.

**Suratga olish talablari (Studio Standard):**
- Oq yoki och kulrang neytral fon (`#F8FAFC`).
- 1:1 kvadrat nisbat (1200×1200 px).
- Yumshoq tabiiy soya (soft contact shadow).
- WebP format, hajmi ≤ 150 KB.

---

## 4. To'rtinchi darajali vazifalar (Priority 4 — Rasmiy PDF Kataloglar)

Saytda yolg'on ma'lumot berilmasligi uchun, 50 KB dan kichik bo'lgan sinov fayllari katalog sahifasida ko'rsatilmaydi. Quyidagi rasmiy broshyuralar tayyor bo'lishi bilan ularni yuklash lozim:

1. `nevo-polimer-quvurlar.pdf` — Polimer quvurlar va fitinglar to'liq assortiment katalogi (texnik jadvallar bilan).
2. `nevo-zapor-armatura.pdf` — Sanoat zapor armaturasi katalogi (bosim, harorat va o'lcham chizmalari).
3. `nevo-kanalizatsiya.pdf` — Kanalizatsiya tizimlari broshyurasi.
4. `nevo-yongin.pdf` — Yong'in xavfsizligi jihozlari pasportlari.
5. `nevo-isitish.pdf` — Isitish va suv isitish qozonlari qo'llanmasi.

*(Fayllar `public/catalogs/` papkasiga joylanishi bilan saytda avtomatik ravishda faollashadi).*

---

## 5. Beshinchi darajali vazifalar (Priority 5 — Real Obyektlar va Hamkorlar)

Saytdagi "Loyihalar" va "Fikrlar" bo'limlari qat'iy ma'lumotlar asosida boshqariladi:
- **Haqiqiy yetkazib berish suratlari:** NEVO GROUP yuk mashinalari, qurilish maydonlariga quvur va armatura tushirish jarayoni.
- **Tasdiqlangan hamkorlar logotiplari:** Bosh pudratchilar, montaj brigadalari va do'konlarning haqiqiy vektor logotiplari.
- **Mijozlar fikrlari:** Haqiqiy xaridorlarning kompaniya nomi va imzosi qo'yilgan minnatdorchilik xatlari.
