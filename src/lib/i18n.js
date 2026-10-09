// NEVO GROUP — Ko'p tillilik tizimi (UZ / RU)
// VERO.uz kabi foydalanuvchi tilni oson o'zgartirishi mumkin.

const STORAGE_KEY = 'nevo_lang';

let currentLang = (() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'ru' || saved === 'uz') return saved;
  } catch (e) {}
  return 'uz';
})();

const listeners = new Set();

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  if (lang !== 'uz' && lang !== 'ru') return;
  currentLang = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch (e) {}
  document.documentElement.lang = lang;
  listeners.forEach(fn => fn(currentLang));
}

export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const DICT = {
  uz: {
    // Header
    deliveryTop: "O'zbekiston bo'ylab yetkazib berish",
    contactUs: "Biz bilan bog'lanish",
    catalogBtn: "Katalog",
    searchPlaceholder: "Mahsulot qidirish...",
    expertConsult: "Mutaxassisdan so'rash",

    // Intro Splash
    splashSubtitle: "MUHANDISLIK VA SANTEXNIKA TIZIMLARI",
    splashSlide1: "Sanoat quvurlari va fitinglar",
    splashSlide2: "Kafolatlangan sifat va sinovlar",
    splashSlide3: "O'zbekiston bo'ylab yetkazib berish",

    // Hero
    heroBadge: "NEVO GROUP · SANOAT VA MUHANDISLIK TIZIMLARI",
    heroTitlePrefix: "Zamonaviy muhandislik va ",
    heroTitleAccent: "santexnika tizimlari",
    heroDesc: "O'zbekiston bo'ylab yirik obyektlar, sanoat korxonalari va xonadonlar uchun quvurlar, fitinglar hamda zapor armaturalar to'g'ridan-to'g'ri birinchi qo'ldan.",
    heroCtaCatalog: "Mahsulotlar katalogi",
    heroCtaFind: "Loyiha bo'yicha maslahat",
    heroConsultBadge: "Mutaxassislarimiz yordam beradi",
    heroConsultSub: "Loyiha yoki smetangiz bo'yicha bepul maslahat",
    heroTrust1: "Narxlar praysdan, ochiq",
    heroTrust2: "Kodi va o'lchami bilan",
    heroTrust3: "O'zbekiston bo'ylab yetkazish",
    heroFloat1: "Narxlar praysdan",
    heroFloat2: "🔧 Mutaxassislar tanlovi",
    heroScrollDown: "Pastga suring",

    // Stats
    statYears: "Yil",
    statYearsLabel: "O'zbekiston bozorida tajriba",
    statProducts: "Mahsulotlar",
    statProductsLabel: "Katalogdagi tovar nomenklaturasi",
    statDelivery: "Yetkazib berish",
    statDeliveryLabel: "Respublika bo'ylab to'liq qamrov",
    statPartners: "Hamkorlar",
    statPartnersLabel: "Ishonchli montajchi va quruvchilar",

    // Projects
    projectsTag: "AMALIY TAJRIBA VA ISHONCH",
    projectsTitle: "O'zbekistonning Yirik Loyihalarida",
    projectsSub: "Nufuzli obyektlar, osmono'par binolar va sanoat majmualarida NEVO GROUP mahsulotlari qo'llanilgan",
    project1Title: "Nest One (Tashkent City)",
    project1Type: "266.5m Osmono'par Majmua",
    project1Desc: "Yuqori bosimli quvur magistrallari, po'lat zadvijkalar va tebranishga chidamli fitinglar.",
    project2Title: "Humo Arena Muz Saroyi",
    project2Type: "12,500 o'rinli ko'p tarmoqli arena",
    project2Desc: "Sovutish va suv ta'minoti tarmog'i uchun maxsus chidamli zapor klapanlar hamda flaneslar.",
    project3Title: "Islom Sivilizatsiyasi Markazi",
    project3Type: "Mahobatli me'moriy majmua",
    project3Desc: "Yong'in xavfsizligi va isitish tizimlari, gidrantlar hamda maxsus quyma armaturalar.",
    project4Title: "Tashkent City Congress Hall",
    project4Type: "Xalqaro biznes va kongress markazi",
    project4Desc: "Sanoat ventilyatsiyasi, suv uzatish liniyalari va sertifikatlangan montaj detallari.",
    project5Title: "Yangi O'zbekiston Massivlari",
    project5Type: "Turar-joy va ijtimoiy obyektlar",
    project5Desc: "Ichki va tashqi muhandislik tarmoqlari, PE bosimli quvurlar va suv hisoblagich uzellari.",
    project6Title: "Magistral Muhandislik Tarmoqlari",
    project6Type: "Sanoat va shahar kommunikatsiyalari",
    project6Desc: "Katta diametrli magistral quvurlar, germetik fitinglar va demontaj vstavkalari.",

    // Sections
    workersTag: "MUTAXASSISLAR VA ISH JARAYONI",
    workersTitle: "Bizning Jamoa va Amaliyotdagi Sifat",
    workersSub: "Obyektlarda montaj, ombor nazorati va muhandislik xizmatlari",
    workersContactBtn: "Mutaxassislar bilan bog'lanish",

    videoTag: "VIDEO SHARHLAR",
    videoTitle: "Mahsulotlarimiz Ish Jarayonida",
    videoSub: "Haqiqiy montaj, payvandlash va ombor operatsiyalari",

    catsTitle: "Mashhur bo'limlar",
    catsSub: "Asosiy yo'nalishlar bo'yicha mahsulotlar",

    featuredTitle: "Tanlangan mahsulotlar",
    featuredSub: "Ko'p so'raladigan va eng sifatli pozitsiyalar",
    viewAll: "Hammasi",

    budgetTitle: "Arzon narxlar",
    budgetSub: "Kichik diametrdagi ommabop fitinglar",

    whyUsTitle: "Nega NEVO GROUP?",
    whyUsSub: "Biz bilan ishlashning asosiy afzalliklari",

    // CTA
    teaserTitle: "Qurilish uchun mahsulot qidiryapsizmi?",
    teaserDesc: "Tovar nomi, tavsif va sonini yozing — katalogdan mos tovarlarni ajratib, 3 xil eng yaxshi taklif beramiz.",
    teaserBtn: "3 xil taklif olish",

    ctaLightTitle: "Uy uchunmi yoki qurilish uchunmi?",
    ctaLightDesc: "Kerakli mahsulotni topishda professional mutaxassislarimiz yordam beradi.",
    ctaLightBtn1: "Mahsulotlarni ko'rish",
    ctaLightBtn2: "Mutaxassis bilan bog'lanish",

    ctaDarkTitle: "Kerakli mahsulotni topdingizmi?",
    ctaDarkDesc: "Narx va mavjudligini bilish uchun biz bilan hoziroq bog'laning.",
    ctaDarkBtn: "Bog'lanish",
  },

  ru: {
    // Header
    deliveryTop: "Доставка по всему Узбекистану",
    contactUs: "Связаться с нами",
    catalogBtn: "Каталог",
    searchPlaceholder: "Поиск товаров...",
    expertConsult: "Консультация эксперта",

    // Intro Splash
    splashSubtitle: "ИНЖЕНЕРНЫЕ И САНТЕХНИЧЕСКИЕ СИСТЕМЫ",
    splashSlide1: "Промышленные трубы и фитинги",
    splashSlide2: "Гарантированное качество и испытания",
    splashSlide3: "Быстрая доставка по всему Узбекистану",

    // Hero
    heroBadge: "NEVO GROUP · ПРОМЫШЛЕННЫЕ И ИНЖЕНЕРНЫЕ СИСТЕМЫ",
    heroTitlePrefix: "Комплексные инженерные и ",
    heroTitleAccent: "сантехнические решения",
    heroDesc: "Трубы, фитинги, запорная арматура и оборудование для крупных объектов, производств и частного сектора напрямую со склада в Ташкенте.",
    heroCtaCatalog: "Каталог продукции",
    heroCtaFind: "Консультация по проекту",
    heroConsultBadge: "Наши специалисты помогут",
    heroConsultSub: "Бесплатная консультация по вашему проекту или смете",
    heroTrust1: "Прозрачные цены по прайсу",
    heroTrust2: "С артикулами и размерами",
    heroTrust3: "Доставка по Узбекистану",
    heroFloat1: "Цены из прайса",
    heroFloat2: "🔧 Выбор специалистов",
    heroScrollDown: "Листайте вниз",

    // Stats
    statYears: "Лет",
    statYearsLabel: "Успешного опыта на рынке Узбекистана",
    statProducts: "Товаров",
    statProductsLabel: "Наименований продукции на складе",
    statDelivery: "Доставка",
    statDeliveryLabel: "Полный охват всех регионов республики",
    statPartners: "Партнеров",
    statPartnersLabel: "Надежных монтажников и строительных компаний",

    // Projects
    projectsTag: "ПРАКТИЧЕСКИЙ ОПЫТ И ДОВЕРИЕ",
    projectsTitle: "На крупных проектах Узбекистана",
    projectsSub: "Продукция NEVO GROUP успешно применена на престижных высотных зданиях и промышленных комплексах",
    project1Title: "Nest One (Tashkent City)",
    project1Type: "Небоскреб 266.5 м",
    project1Desc: "Высоконапорные магистральные трубы, стальные задвижки и вибростойкие фитинги.",
    project2Title: "Humo Arena (Ледовый дворец)",
    project2Type: "Многофункциональная арена на 12 500 мест",
    project2Desc: "Специальная запорная арматура и фланцы для систем хладоснабжения и водоотведения.",
    project3Title: "Центр Исламской Цивилизации",
    project3Type: "Грандиозный архитектурный ансамбль",
    project3Desc: "Системы пожаротушения, отопления, гидранты и чугунная запорная арматура.",
    project4Title: "Tashkent City Congress Hall",
    project4Type: "Международный конгресс-холл и бизнес-центр",
    project4Desc: "Промышленная вентиляция, магистрали водоснабжения и сертифицированные монтажные узлы.",
    project5Title: "Жилые массивы Янги Узбекистон",
    project5Type: "Жилые комплексы и социальные объекты",
    project5Desc: "Внутренние и наружные инженерные сети, напорные ПЭ трубы и узлы учета воды.",
    project6Title: "Магистральные Инженерные Сети",
    project6Type: "Промышленные и городские коммуникации",
    project6Desc: "Трубы больших диаметров, герметичные фитинги и демонтажные компенсационные вставки.",

    // Sections
    workersTag: "СПЕЦИАЛИСТЫ И РАБОЧИЙ ПРОЦЕСС",
    workersTitle: "Наша Команда и Качество на Практике",
    workersSub: "Монтаж на объектах, складской контроль и инженерные услуги",
    workersContactBtn: "Связаться со специалистами",

    videoTag: "ВИДЕООБЗОРЫ",
    videoTitle: "Наша Продукция в Работе",
    videoSub: "Реальный монтаж, сварка и складские операции",

    catsTitle: "Популярные категории",
    catsSub: "Продукция по ключевым направлениям",

    featuredTitle: "Рекомендуемые товары",
    featuredSub: "Наиболее востребованные и надежные позиции",
    viewAll: "Смотреть все",

    budgetTitle: "Доступные цены",
    budgetSub: "Популярные фитинги малых диаметров",

    whyUsTitle: "Почему NEVO GROUP?",
    whyUsSub: "Ключевые преимущества работы с нами",

    // CTA
    teaserTitle: "Ищете материалы для строительства?",
    teaserDesc: "Укажите наименование и количество — подберем из каталога 3 оптимальных варианта под ваш бюджет.",
    teaserBtn: "Получить 3 варианта",

    ctaLightTitle: "Для дома или крупной стройки?",
    ctaLightDesc: "Наши профессиональные инженеры помогут подобрать точные спецификации.",
    ctaLightBtn1: "Смотреть каталог",
    ctaLightBtn2: "Консультация специалиста",

    ctaDarkTitle: "Нашли нужную продукцию?",
    ctaDarkDesc: "Свяжитесь с нами прямо сейчас, чтобы уточнить актуальное наличие и оптовые цены.",
    ctaDarkBtn: "Связаться",
  }
};

export function t(key) {
  const lang = getLang();
  return (DICT[lang] && DICT[lang][key]) || (DICT.uz && DICT.uz[key]) || key;
}
