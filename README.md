# NEVO GROUP — onlayn do'kon

Santexnika va qurilish mahsulotlari katalogi. Mijoz mahsulotni topadi, savatga
qo'shadi va buyurtma beradi. Buyurtmalar va mahsulotlar `/admin` panelida
boshqariladi.

## Stack

| Qism | Texnologiya |
| --- | --- |
| Frontend | Vanilla JavaScript (framework'siz), Vite 6 |
| Backend | [Supabase](https://supabase.com): Postgres, Row Level Security, Auth |
| Hosting | Vercel (statik sayt) |
| Testlar | PGlite (WASM Postgres) — Supabase rollari bilan RLS testlari |

## Loyiha tuzilmasi

```
index.html                 asosiy sayt
admin/index.html           admin panel (/admin/)
src/
  main.js                  sayt router'i
  lib/supabase.js          Supabase client (faqat anon key)
  lib/catalog.js           katalogni yuklash va keshlash
  lib/orders.js            buyurtma yuborish (place_order RPC)
  pages/, components/      sahifalar va komponentlar
  admin/                   admin panel: login, buyurtmalar, mahsulotlar
supabase/migrations/       baza sxemasi, RLS, place_order() funksiyasi
scripts/
  import-catalog.js        katalogni CSV'dan bazaga import qilish (yagona manba)
  lib/catalog-csv.mjs      CSV'ni o'qish va tekshirish
  optimize-images.mjs      mahsulot rasmlarini WebP'ga o'girish
  seed-data/               nevo-katalog.csv (485 mahsulot), rasm-biriktirish.csv, categories.json
public/images/products/    mahsulot rasmlari (WebP, 600×600)
  test-db.mjs              sxema / RLS / RPC testlari
  local-supabase.mjs       lokal Supabase emulyatori (akkauntsiz sinash uchun)
```

## Lokalda ishga tushirish

Node.js 22 yoki undan yangisi kerak.

```bash
npm install
```

### A) Supabase akkauntisiz — lokal emulyator bilan

Tez ko'rib chiqish va sinash uchun. Ma'lumotlar xotirada saqlanadi, server
to'xtasa o'chib ketadi.

1-terminal:

```bash
npm run supabase:local
```

Terminalda admin email va vaqtinchalik parol chiqadi. Parolni o'zingiz
bermoqchi bo'lsangiz: `npm run supabase:local -- --admin-password "parolingiz"`.

2-terminal:

```bash
npm run dev:local
```

- Sayt: http://localhost:5173
- Admin panel: http://localhost:5173/admin/

### B) Haqiqiy Supabase bilan

Quyidagi bo'limlarni bajaring, keyin:

```bash
npm run dev
```

## 1. Supabase loyihasini yaratish

1. https://supabase.com/dashboard → **New project**.
2. Region sifatida yaqinroq birini tanlang (masalan, Frankfurt). Database parolini xavfsiz joyda saqlang.
3. Loyiha tayyor bo'lgach **Project Settings → API** bo'limidan quyidagilarni oling:
   - **Project URL**
   - **anon public** kaliti

   `service_role` kalitini hech qayerga ko'chirmang — bu loyihada u umuman kerak emas.

## 2. Migratsiyalarni qo'llash

`supabase/migrations/` papkasida 3 ta fayl bor. Ular **aynan shu tartibda** qo'llanishi kerak:

1. `20260913000001_init_schema.sql` — jadvallar va indekslar
2. `20260913000002_security_rls.sql` — huquqlar va RLS siyosatlari
3. `20260913000003_place_order.sql` — buyurtma berish funksiyasi

**Variant 1 — SQL Editor (eng oson):** Supabase panelida **SQL Editor → New query**.
Har bir fayl mazmunini navbat bilan joylab, **Run** tugmasini bosing.

**Variant 2 — Supabase CLI:**

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

## 3. Auth sozlamalari

**Authentication → Sign In / Providers** bo'limida:

- **Email** provayderi yoqilgan bo'lsin.
- **Allow new users to sign up** — **O'CHIRING**. Ro'yxatdan o'tish sayt
  tomonida ham yo'q, lekin buni server tomonidan ham yopish kerak.

Admin huquqi `admin_users` jadvali orqali tekshiriladi. Shuning uchun kimdir
ro'yxatdan o'tib olsa ham buyurtmalarni ko'ra olmaydi. Baribir ro'yxatdan
o'tishni o'chirib qo'ying.

## 4. Admin foydalanuvchi qo'shish

1. **Authentication → Users → Add user → Create new user**.
   Email va parol kiriting, **Auto Confirm User** belgisini qo'ying.
2. **SQL Editor**'da shu foydalanuvchini admin qiling (emailni o'zingiznikiga almashtiring):

   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where email = 'admin@example.com';
   ```

Adminni olib tashlash:

```sql
delete from public.admin_users
where user_id = (select id from auth.users where email = 'admin@example.com');
```

## 5. `.env` faylini to'ldirish

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public kalit>

# faqat katalog importi uchun (brauzerga tushmaydi)
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=<admin paroli>
```

`.env` fayli `.gitignore`'da, git'ga tushmaydi. `VITE_` bilan boshlanadigan
o'zgaruvchilar brauzerga ochiq bo'ladi, shuning uchun u yerga faqat anon key yoziladi.

## 6. Katalogni import qilish

Oldin 4-bosqichdagi admin yaratilgan bo'lishi kerak. Katalogning yagona
manbasi — `scripts/seed-data/nevo-katalog.csv` (NEVO GROUP prays-listlaridan
485 ta mahsulot, narxlar so'mda).

Skript admin sifatida kiradi, kategoriyalarni `category_uz` bo'yicha bog'laydi
(bazada bo'lmasa `categories.json`dan qo'shadi), CSV'da yo'q mahsulotlarni
**o'chiradi** va qolganlarini slug bo'yicha upsert qiladi — qayta ishga
tushirish xavfsiz, dublikat bo'lmaydi. Buyurtma tarixi saqlanadi.
Mahsuloti yo'q kategoriyalar saytda ko'rinmaydi.

```bash
node scripts/import-catalog.js --dry-run   # faqat CSV'ni tekshiradi
node scripts/import-catalog.js             # .env dagi bazaga yozadi
```

### Mahsulot rasmlari

Rasmlar `public/images/products/` da, biriktirish jadvali —
`scripts/seed-data/rasm-biriktirish.csv` (`slug,image_url`). To'liq import
`image_url` ni ham shu jadvaldan yozadi. Faqat rasmlarni yangilash uchun
(katalogni qayta import qilmasdan, o'zgargan qatorlarni):

```bash
node scripts/optimize-images.mjs            # yangi PNG/JPG → WebP (sifat 85), aslini o'chiradi
node scripts/import-catalog.js --images     # image_url ni bazaga yozadi
```

Jadvaldagi har bir `/images/...` fayli `public/` da borligi tekshiriladi —
yo'q fayl bo'lsa, bazaga hech narsa yozilmaydi. Rasmlar Vercel'da deploy
bilan chiqadi, shuning uchun production'da `--images` ni deploy tugagach ishga tushiring.

> `--dry-run` ni `npm run` orqali bermang: npm bu bayroqni o'zi yutib oladi.
> Skript `npm_config_dry_run` ni ham tekshiradi, lekin `node` bilan ishlatish ishonchliroq.

Lokal emulyatorga import qilish uchun muhitda `VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` ni
emulyator qiymatlariga o'rnating (muhitdagi qiymat `.env` dagidan ustun).

## 7. Vercel'ga deploy

1. https://vercel.com/new → GitHub reponi import qiling.
2. Framework avtomatik **Vite** deb aniqlanadi. Build buyrug'i `npm run build`, papka `dist` (bu `vercel.json`da ham yozilgan).
3. **Environment Variables** bo'limiga ikkala o'zgaruvchini kiriting (Production va Preview uchun):

   | Nomi | Qiymati |
   | --- | --- |
   | `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | anon public kalit |

   `SEED_ADMIN_*` va `service_role` kalitlarini Vercel'ga **kiritmang**.
4. **Deploy**. O'zgaruvchilarni keyinroq o'zgartirsangiz, **Redeploy** qiling — Vite ularni build vaqtida joylaydi.
5. Admin panel manzili: `https://<domen>/admin/`

## Xavfsizlik qanday tuzilgan

| Jadval | anon (mijoz) | admin (`admin_users`dagi foydalanuvchi) |
| --- | --- | --- |
| `categories`, `products` | faqat o'qish | o'qish, qo'shish, tahrirlash, o'chirish |
| `orders`, `order_items` | o'qish natijasi **doim bo'sh**, yozish taqiqlangan | o'qish, tahrirlash, o'chirish |
| `admin_users` | taqiqlangan | taqiqlangan (faqat `is_admin()` orqali) |

- **Buyurtma faqat `place_order()` orqali yaratiladi.** Bu funksiya `orders`
  va `order_items`ni bitta tranzaksiyada yozadi: xatolik bo'lsa, hech narsa saqlanmaydi.
- **Narx serverda olinadi.** Frontend faqat mahsulot id va miqdorni yuboradi;
  narx va nom `products` jadvalidan olinib, buyurtmaga nusxa qilib yoziladi.
- **Tekshiruvlar serverda ham takrorlanadi:** ism, telefon (`+998` + 9 raqam),
  bo'sh savat, miqdor (1–100 000), omborda borligi.
- Anon to'g'ridan-to'g'ri `orders`ga INSERT qila olmaydi. Aks holda istalgan
  `total_amount` yoki boshqa buyurtmaga mahsulot qo'shib yuborish mumkin bo'lardi.
- Bazadan kelgan barcha matnlar HTML'ga xavfsiz (escape qilingan holda) chiqariladi.

## Testlar

```bash
npm run test:db   # sxema, RLS va place_order() testlari (22 ta)
npm run build     # production build
```

`test:db` migratsiyalarni Supabase rollari (`anon`, `authenticated`) bilan PGlite'da ishga tushiradi. U quyidagilarni tekshiradi:

- anon buyurtmalarni ko'ra olmasligi;
- admin bo'lmagan foydalanuvchi mahsulot yoza olmasligi;
- narxni frontend'dan o'zgartirib bo'lmasligi;
- xatolikda yarim buyurtma qolmasligi.

## Buyurtma raqami

Mijozga `NG-000042` ko'rinishida ko'rsatiladi (`orders.id` asosida). Admin
panelda ham buyurtmalar shu raqam bilan ko'rinadi, tafsilot manzili — `/admin/#orders/42`.
